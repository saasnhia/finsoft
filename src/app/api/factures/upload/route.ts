import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { convert } from 'pdf-poppler';
import sharp from 'sharp';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createClient } from '@/lib/supabase/server';
import { queryOllama } from '@/lib/ai/ollama-client';
import { logMetrics, startTimer } from '@/lib/metrics';
import type { ExtractedInvoiceData } from '@/types';

// Helper: Convert PDF to image
async function pdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'finpilote-'));
  const pdfPath = path.join(tmpDir, 'invoice.pdf');
  const imgPath = path.join(tmpDir, 'invoice-1.png');

  try {
    await fs.writeFile(pdfPath, pdfBuffer);

    // Convert first page only to PNG
    await convert(pdfPath, {
      format: 'png',
      out_dir: tmpDir,
      out_prefix: 'invoice',
      page: 1, // First page only
    });

    const imageBuffer = await fs.readFile(imgPath);
    return imageBuffer;
  } finally {
    // Cleanup temp files
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

// Helper: Run Tesseract OCR with worker + 30s timeout
const OCR_TIMEOUT_MS = 30_000;

async function extractTextFromImage(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  // Optimize image for OCR (grayscale, resize if too large)
  const optimizedImage = await sharp(imageBuffer)
    .grayscale()
    .resize({ width: 2000, withoutEnlargement: true })
    .toBuffer();

  // Run OCR with explicit timeout
  const ocrPromise = async () => {
    const worker = await createWorker('fra', 1, {
      logger: (m) => console.log('[Tesseract]', m),
    });
    try {
      const { data } = await worker.recognize(optimizedImage);
      return {
        text: data.text,
        confidence: data.confidence / 100,
      };
    } finally {
      await worker.terminate();
    }
  };

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('OCR timeout : extraction abandonnée après 30 secondes.')), OCR_TIMEOUT_MS);
  });

  return Promise.race([ocrPromise(), timeoutPromise]);
}

// Helper: Parse a French number string (e.g. "1 234,56" or "1234.56") to float
function parseFrenchNumber(raw: string): number | null {
  // Remove spaces (thousand separators) and currency symbols
  let cleaned = raw.replace(/[\s€]/g, '');
  // French comma → dot
  cleaned = cleaned.replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : Math.round(val * 100) / 100;
}

// Helper: Extract structured invoice data using local regex parser (no external API)
function extractInvoiceFieldsLocal(text: string): ExtractedInvoiceData {
  const result: ExtractedInvoiceData = {
    montant_ht: null,
    tva: null,
    montant_ttc: null,
    date_facture: null,
    numero_facture: null,
    nom_fournisseur: null,
    confidence_score: 0,
    extraction_notes: '',
  };

  const notes: string[] = [];

  // --- Numéro de facture ---
  const invoicePatterns = [
    /(?:facture|invoice|fact)\s*(?:n[°o.]?|num[eé]ro|ref\.?|#)\s*[:\s]*([A-Z0-9][A-Z0-9\-\/\.]+)/i,
    /(?:n[°o.]|num[eé]ro|ref\.?|#)\s*(?:de\s+)?(?:facture|fact\.?)\s*[:\s]*([A-Z0-9][A-Z0-9\-\/\.]+)/i,
    /(?:n[°o.])\s*[:\s]*([A-Z0-9][A-Z0-9\-\/\.]+)/i,
  ];
  for (const pattern of invoicePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.numero_facture = match[1].trim();
      break;
    }
  }

  // --- Montants (TTC, HT, TVA) ---
  // Pattern: amount followed by label, or label followed by amount
  const amountAfterLabel = /(?:total|montant|net|sous.?total)?\s*(HT|TTC|TVA)\s*[:\s]*(\d[\d\s]*[,.]?\d*)\s*€?/gi;
  const amountBeforeLabel = /(\d[\d\s]*[,.]?\d*)\s*€?\s*(HT|TTC|TVA)/gi;

  const amounts: { type: string; value: number }[] = [];

  for (const regex of [amountAfterLabel, amountBeforeLabel]) {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      // Determine which capture group is the label vs value
      const isLabelFirst = /[A-Z]/i.test(m[1]) && !/\d/.test(m[1]);
      const label = isLabelFirst ? m[1] : m[2];
      const rawValue = isLabelFirst ? m[2] : m[1];
      const value = parseFrenchNumber(rawValue);
      if (value !== null && value > 0) {
        amounts.push({ type: label.toUpperCase(), value });
      }
    }
  }

  // Also try standalone "Total : 1234,56 €" pattern (assume TTC)
  if (amounts.length === 0) {
    const totalRegex = /(?:total|net\s+[àa]\s+payer)\s*[:\s]*(\d[\d\s]*[,.]?\d*)\s*€?/gi;
    let m: RegExpExecArray | null;
    while ((m = totalRegex.exec(text)) !== null) {
      const value = parseFrenchNumber(m[1]);
      if (value !== null && value > 0) {
        amounts.push({ type: 'TTC', value });
      }
    }
  }

  // Assign the largest value for each type (in case of duplicates, take the last match)
  for (const { type, value } of amounts) {
    if (type === 'TTC') result.montant_ttc = value;
    else if (type === 'HT') result.montant_ht = value;
    else if (type === 'TVA') result.tva = value;
  }

  // --- Auto-calculate missing amounts ---
  if (result.montant_ht !== null && result.tva !== null && result.montant_ttc === null) {
    result.montant_ttc = Math.round((result.montant_ht + result.tva) * 100) / 100;
    notes.push('TTC calculé automatiquement (HT + TVA).');
  } else if (result.montant_ttc !== null && result.montant_ht === null) {
    result.montant_ht = Math.round((result.montant_ttc / 1.20) * 100) / 100;
    result.tva = Math.round((result.montant_ttc - result.montant_ht) * 100) / 100;
    notes.push('HT/TVA estimés à 20% depuis le TTC.');
  } else if (result.montant_ht !== null && result.montant_ttc === null) {
    result.tva = Math.round((result.montant_ht * 0.20) * 100) / 100;
    result.montant_ttc = Math.round((result.montant_ht + result.tva) * 100) / 100;
    notes.push('TVA/TTC estimés à 20% depuis le HT.');
  }

  // Consistency check
  if (result.montant_ht !== null && result.tva !== null && result.montant_ttc !== null) {
    const expectedTtc = Math.round((result.montant_ht + result.tva) * 100) / 100;
    if (Math.abs(expectedTtc - result.montant_ttc) > 0.02) {
      notes.push(`Incohérence: HT (${result.montant_ht}) + TVA (${result.tva}) = ${expectedTtc} ≠ TTC (${result.montant_ttc}).`);
    }
  }

  // --- Date de facture ---
  const datePatterns = [
    // "Date de facture : 15/01/2024" or "Date : 15-01-2024"
    /(?:date\s+(?:de\s+)?(?:facture|facturation|emission|émission))\s*[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
    // "Date : DD/MM/YYYY"
    /(?:date|le|du|émis(?:e)?)\s*[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
    // Standalone date DD/MM/YYYY
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
    // DD/MM/YY (2-digit year)
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})(?!\d)/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      let year = match[3];
      if (year.length === 2) year = '20' + year;

      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);
      if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
        result.date_facture = `${year}-${month}-${day}`;
        break;
      }
    }
  }

  // --- Nom fournisseur (heuristic: first significant non-empty line) ---
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  // Skip lines that look like dates, amounts, addresses, or common headers
  const skipPatterns = /^(\d|total|montant|tva|ht|ttc|facture|n°|date|page|siret|siren|tel|fax|mail|email|www|http|adresse|bp\s)/i;
  for (const line of lines) {
    if (!skipPatterns.test(line) && line.length <= 80) {
      result.nom_fournisseur = line.substring(0, 100);
      break;
    }
  }

  // --- Confidence score ---
  let foundFields = 0;
  if (result.montant_ttc !== null) foundFields++;
  if (result.montant_ht !== null) foundFields++;
  if (result.tva !== null) foundFields++;
  if (result.date_facture !== null) foundFields++;
  if (result.numero_facture !== null) foundFields++;
  if (result.nom_fournisseur !== null) foundFields++;

  result.confidence_score = Math.round((foundFields / 6) * 100) / 100;

  // Boost/penalize based on text quality
  if (text.length < 50) {
    result.confidence_score = Math.max(0, result.confidence_score - 0.2);
    notes.push('Texte très court, extraction peu fiable.');
  }

  if (result.confidence_score < 0.5) {
    notes.push('Extraction partielle. Vérification manuelle recommandée.');
  }

  result.extraction_notes = notes.join(' ');

  return result;
}

// Helper: Extract invoice fields using local Ollama AI (fallback for low-confidence regex)
async function extractWithLocalAI(text: string): Promise<ExtractedInvoiceData | null> {
  const prompt = `Tu es un expert-comptable français. Extrais les données de cette facture.

Format JSON strict (pas de commentaire, pas de markdown) :
{
  "montant_ht": number | null,
  "tva": number | null,
  "montant_ttc": number | null,
  "date_facture": "YYYY-MM-DD" | null,
  "numero_facture": string | null,
  "nom_fournisseur": string | null,
  "confidence_score": 0.XX,
  "extraction_notes": string
}

Règles :
- Si TVA = 20%, calcule automatiquement HT ou TTC si manquant
- Date au format ISO (YYYY-MM-DD)
- confidence_score entre 0 et 1
- extraction_notes : notes ou avertissements

Texte du document :
${text.substring(0, 4000)}

JSON uniquement :`;

  const response = await queryOllama(prompt, {
    temperature: 0.1,
    maxTokens: 512,
    stop: ['\n\n'],
  });

  if (!response) return null;

  try {
    // Try to extract JSON from the response (handle potential wrapping text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      montant_ht: typeof parsed.montant_ht === 'number' ? parsed.montant_ht : null,
      tva: typeof parsed.tva === 'number' ? parsed.tva : null,
      montant_ttc: typeof parsed.montant_ttc === 'number' ? parsed.montant_ttc : null,
      date_facture: typeof parsed.date_facture === 'string' ? parsed.date_facture : null,
      numero_facture: typeof parsed.numero_facture === 'string' ? parsed.numero_facture : null,
      nom_fournisseur: typeof parsed.nom_fournisseur === 'string' ? parsed.nom_fournisseur : null,
      confidence_score: typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0.7,
      extraction_notes: (parsed.extraction_notes || '') + ' [IA locale]',
    };
  } catch {
    console.error('[API] Failed to parse Ollama response');
    return null;
  }
}

// Main POST handler
export async function POST(req: NextRequest) {
  try {
    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    // Detect file type from extension
    const fileName = file.name.toLowerCase();
    const ext = fileName.split('.').pop() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp'];
    const fileType = ext === 'pdf'
      ? 'pdf'
      : imageExts.includes(ext)
      ? (ext as 'jpg' | 'jpeg' | 'png')
      : ext; // xlsx, xls, doc, docx, csv, txt, etc.

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        error: 'Fichier trop volumineux. Taille maximale : 10 Mo.'
      }, { status: 400 });
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const user_id = user.id;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Step 1 & 2: Extract text based on file type
    const textExts = ['csv', 'txt'];
    const excelExts = ['xlsx', 'xls'];
    const docExts = ['doc', 'docx'];

    let ocrResult: { text: string; confidence: number };

    if (textExts.includes(ext)) {
      // CSV/TXT: read directly as text
      console.log('[API] Reading text file directly...');
      const text = buffer.toString('utf-8');
      ocrResult = { text, confidence: 1.0 };
    } else if (excelExts.includes(ext)) {
      // Excel: extract text via xlsx library
      console.log('[API] Extracting text from Excel...');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheets = workbook.SheetNames.map(name => {
        const sheet = workbook.Sheets[name];
        return `--- ${name} ---\n${XLSX.utils.sheet_to_csv(sheet)}`;
      });
      ocrResult = { text: sheets.join('\n\n'), confidence: 1.0 };
    } else if (docExts.includes(ext)) {
      // Word: extract text via mammoth
      console.log('[API] Extracting text from Word document...');
      const result = await mammoth.extractRawText({ buffer });
      ocrResult = { text: result.value, confidence: 0.95 };
    } else {
      // PDF or Image: OCR pipeline
      let imageBuffer: Buffer;
      if (fileType === 'pdf') {
        console.log('[API] Converting PDF to image...');
        imageBuffer = await pdfToImage(buffer);
      } else {
        imageBuffer = buffer;
      }
      console.log('[API] Running OCR...');
      ocrResult = await extractTextFromImage(imageBuffer);
    }
    console.log('[API] Text extraction confidence:', ocrResult.confidence);

    // Step 3: Extract structured data — hybrid (regex first, Ollama fallback)
    const elapsed = startTimer();
    let extractionMethod: 'regex' | 'ai_local' | 'hybrid' = 'regex';

    console.log('[API] Extracting fields with local parser...');
    let extractedData = extractInvoiceFieldsLocal(ocrResult.text);
    console.log('[API] Regex confidence:', extractedData.confidence_score);

    // If regex confidence is low, try local AI
    if (extractedData.confidence_score < 0.7) {
      console.log('[API] Low confidence — trying local AI...');
      const aiResult = await extractWithLocalAI(ocrResult.text);
      if (aiResult && aiResult.confidence_score > extractedData.confidence_score) {
        console.log('[API] AI confidence:', aiResult.confidence_score, '(using AI result)');
        extractedData = aiResult;
        extractionMethod = 'ai_local';
      } else {
        console.log('[API] AI unavailable or lower confidence — keeping regex result');
        extractionMethod = 'hybrid';
      }
    }

    // Log performance metrics (non-blocking)
    const extractionTime = elapsed();
    logMetrics({
      user_id: user_id,
      extraction_time_ms: extractionTime,
      confidence_score: extractedData.confidence_score,
      method: extractionMethod,
      success: true,
      file_type: fileType,
      file_size_bytes: file.size,
    }).catch(() => {}); // silent

    // Step 4: Store in Supabase
    console.log('[API] Storing in database...');
    const { data: facture, error: dbError } = await supabase
      .from('factures')
      .insert({
        user_id,
        file_name: file.name,
        file_type: fileType,
        file_size_bytes: file.size,
        montant_ht: extractedData.montant_ht,
        tva: extractedData.tva,
        montant_ttc: extractedData.montant_ttc,
        date_facture: extractedData.date_facture,
        numero_facture: extractedData.numero_facture,
        nom_fournisseur: extractedData.nom_fournisseur,
        raw_ocr_text: ocrResult.text,
        ai_confidence_score: extractedData.confidence_score,
        ai_extraction_notes: extractedData.extraction_notes,
        validation_status: extractedData.confidence_score >= 0.7 ? 'validated' : 'manual_review',
        user_edited_fields: [],
      })
      .select()
      .single();

    if (dbError) {
      console.error('[API] Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Step 5: Return response
    return NextResponse.json({
      success: true,
      facture,
      warnings: extractedData.confidence_score < 0.7
        ? ['Confiance faible. Veuillez vérifier les données extraites.']
        : [],
    });

  } catch (error: any) {
    console.error('[API] Error processing invoice:', error);
    return NextResponse.json({
      error: error.message || 'Erreur lors du traitement de la facture.'
    }, { status: 500 });
  }
}
