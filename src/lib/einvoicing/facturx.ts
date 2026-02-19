/**
 * Factur-X / ZUGFeRD generator & parser
 * Norme EN16931 — obligatoire France 2026 (Portail Public de Facturation PPF)
 *
 * Factur-X = PDF/A-3 avec XML ZUGFeRD embarqué (profil MINIMUM ou EN16931)
 * Librairie utilisée : pdf-lib pour la manipulation PDF
 */

import { PDFDocument, PDFName, PDFStream, PDFRawStream } from 'pdf-lib'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacturXData {
  // Fournisseur (vendeur)
  vendeur: {
    nom: string
    siren: string
    tvaIntracom?: string
    adresse: string
    codePostal: string
    ville: string
    email?: string
  }
  // Client (acheteur)
  acheteur: {
    nom: string
    siren?: string
    tvaIntracom?: string
    adresse: string
    codePostal: string
    ville: string
    email?: string
  }
  // Facture
  facture: {
    numero: string
    dateEmission: string        // ISO date YYYY-MM-DD
    dateEcheance: string        // ISO date YYYY-MM-DD
    devise: string              // 'EUR'
    lignes: LigneFacture[]
    mentionSpeciale?: string    // ex: "Micro-entreprise — TVA non applicable"
  }
}

export interface LigneFacture {
  description: string
  quantite: number
  prixUnitaireHT: number
  tauxTVA: number             // 0, 5.5, 10, 20
}

export interface FacturXTotaux {
  totalHT: number
  totalTVA: number
  totalTTC: number
  lignesTVA: Array<{ taux: number; base: number; montant: number }>
}

// ─── Calculs ──────────────────────────────────────────────────────────────────

export function calculerTotaux(data: FacturXData): FacturXTotaux {
  let totalHT = 0
  const tvaMap = new Map<number, { base: number; montant: number }>()

  for (const ligne of data.facture.lignes) {
    const ht = ligne.quantite * ligne.prixUnitaireHT
    const tva = ht * (ligne.tauxTVA / 100)
    totalHT += ht

    const entry = tvaMap.get(ligne.tauxTVA) ?? { base: 0, montant: 0 }
    entry.base += ht
    entry.montant += tva
    tvaMap.set(ligne.tauxTVA, entry)
  }

  const lignesTVA = Array.from(tvaMap.entries()).map(([taux, v]) => ({
    taux,
    base: Math.round(v.base * 100) / 100,
    montant: Math.round(v.montant * 100) / 100,
  }))

  const totalTVA = lignesTVA.reduce((s, l) => s + l.montant, 0)
  totalHT = Math.round(totalHT * 100) / 100
  const totalTTC = Math.round((totalHT + totalTVA) * 100) / 100

  return { totalHT, totalTVA: Math.round(totalTVA * 100) / 100, totalTTC, lignesTVA }
}

// ─── XML Generator (EN16931 / ZUGFeRD 2.3) ───────────────────────────────────

export function generateFacturXML(data: FacturXData): string {
  const totaux = calculerTotaux(data)

  const lignesXML = data.facture.lignes.map((l, i) => {
    const ht = l.quantite * l.prixUnitaireHT
    return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(l.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${l.prixUnitaireHT.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${l.quantite}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${l.tauxTVA === 0 ? 'Z' : 'S'}</ram:CategoryCode>
          <ram:RateApplicablePercent>${l.tauxTVA.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${ht.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`
  }).join('\n')

  const tvaLignesXML = totaux.lignesTVA.map(t => `
    <ram:ApplicableTradeTax>
      <ram:CalculatedAmount>${t.montant.toFixed(2)}</ram:CalculatedAmount>
      <ram:TypeCode>VAT</ram:TypeCode>
      <ram:BasisAmount>${t.base.toFixed(2)}</ram:BasisAmount>
      <ram:CategoryCode>${t.taux === 0 ? 'Z' : 'S'}</ram:CategoryCode>
      <ram:RateApplicablePercent>${t.taux.toFixed(2)}</ram:RateApplicablePercent>
    </ram:ApplicableTradeTax>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(data.facture.numero)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${data.facture.dateEmission.replace(/-/g, '')}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${data.facture.mentionSpeciale ? `<ram:IncludedNote><ram:Content>${escapeXml(data.facture.mentionSpeciale)}</ram:Content></ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>
    ${lignesXML}

    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(data.vendeur.nom)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXml(data.vendeur.siren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(data.vendeur.adresse)}</ram:LineOne>
          <ram:PostcodeCode>${escapeXml(data.vendeur.codePostal)}</ram:PostcodeCode>
          <ram:CityName>${escapeXml(data.vendeur.ville)}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        ${data.vendeur.tvaIntracom ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${escapeXml(data.vendeur.tvaIntracom)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(data.acheteur.nom)}</ram:Name>
        ${data.acheteur.siren ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${escapeXml(data.acheteur.siren)}</ram:ID></ram:SpecifiedLegalOrganization>` : ''}
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(data.acheteur.adresse)}</ram:LineOne>
          <ram:PostcodeCode>${escapeXml(data.acheteur.codePostal)}</ram:PostcodeCode>
          <ram:CityName>${escapeXml(data.acheteur.ville)}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery/>

    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${escapeXml(data.facture.numero)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>${escapeXml(data.facture.devise)}</ram:InvoiceCurrencyCode>
      ${tvaLignesXML}
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${data.facture.dateEcheance.replace(/-/g, '')}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${totaux.totalHT.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${totaux.totalHT.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${data.facture.devise}">${totaux.totalTVA.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${totaux.totalTTC.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${totaux.totalTTC.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`
}

// ─── PDF Factur-X Embedder ────────────────────────────────────────────────────

/**
 * Prend un PDF existant en bytes et y embarque le XML Factur-X.
 * Retourne le nouveau PDF avec le fichier XML attaché.
 */
export async function embedFacturXInPDF(
  pdfBytes: Uint8Array,
  xmlContent: string,
  factureNumero: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes)

  const xmlBytes = new TextEncoder().encode(xmlContent)
  const xmlStream = pdfDoc.context.stream(xmlBytes, {
    Type: 'EmbeddedFile',
    Subtype: 'text/xml',
    Length: xmlBytes.length,
  })
  const xmlStreamRef = pdfDoc.context.register(xmlStream)

  // File spec dictionary
  const fileSpec = pdfDoc.context.obj({
    Type: PDFName.of('Filespec'),
    F: PDFName.of('factur-x.xml'),
    UF: PDFName.of('factur-x.xml'),
    Desc: PDFName.of('Factur-X XML EN16931'),
    AFRelationship: PDFName.of('Data'),
    EF: pdfDoc.context.obj({ F: xmlStreamRef, UF: xmlStreamRef }),
  })
  const fileSpecRef = pdfDoc.context.register(fileSpec)

  // Names tree for embedded files
  const catalog = pdfDoc.catalog
  const namesDict = pdfDoc.context.obj({
    Names: pdfDoc.context.obj(['factur-x.xml', fileSpecRef]),
  })
  catalog.set(PDFName.of('Names'), pdfDoc.context.obj({
    EmbeddedFiles: namesDict,
  }))

  // AF array on catalog
  catalog.set(PDFName.of('AF'), pdfDoc.context.obj([fileSpecRef]))

  // Metadata XMP (minimal, marks as PDF/A-3)
  const xmpContent = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
      xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`

  const xmpBytes = new TextEncoder().encode(xmpContent)
  const xmpStream = pdfDoc.context.stream(xmpBytes, {
    Type: 'Metadata',
    Subtype: 'XML',
    Length: xmpBytes.length,
  })
  catalog.set(PDFName.of('Metadata'), pdfDoc.context.register(xmpStream))

  return pdfDoc.save()
}

// ─── Factur-X Detector ───────────────────────────────────────────────────────

/**
 * Détecte si un PDF est un Factur-X (cherche la signature XML ZUGFeRD/EN16931).
 * Retourne l'XML embarqué si trouvé.
 */
export async function detectAndExtractFacturX(
  pdfBytes: Uint8Array
): Promise<{ isFacturX: boolean; xml?: string; profil?: string }> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
    const catalog = pdfDoc.catalog

    const namesEntry = catalog.lookup(PDFName.of('Names'))
    if (!namesEntry) return { isFacturX: false }

    // Walk the embedded files tree looking for factur-x.xml or zugferd.xml
    const xmlContent = extractEmbeddedXML(pdfDoc, pdfBytes)
    if (!xmlContent) return { isFacturX: false }

    const isFacturX = xmlContent.includes('CrossIndustryInvoice') ||
                      xmlContent.includes('ZUGFeRD') ||
                      xmlContent.includes('factur-x')

    if (!isFacturX) return { isFacturX: false }

    const profil = xmlContent.includes('en16931') ? 'EN16931'
      : xmlContent.includes('minimum') ? 'MINIMUM'
      : xmlContent.includes('extended') ? 'EXTENDED'
      : 'BASIC'

    return { isFacturX: true, xml: xmlContent, profil }
  } catch {
    return { isFacturX: false }
  }
}

function extractEmbeddedXML(pdfDoc: PDFDocument, rawBytes: Uint8Array): string | null {
  // Lightweight text search for XML markers in the raw PDF bytes
  const rawText = new TextDecoder('latin1').decode(rawBytes)
  const xmlStart = rawText.indexOf('<?xml version="1.0"')
  if (xmlStart === -1) return null
  const xmlEnd = rawText.indexOf('</rsm:CrossIndustryInvoice>', xmlStart)
  if (xmlEnd === -1) return null
  return rawText.slice(xmlStart, xmlEnd + '</rsm:CrossIndustryInvoice>'.length)
}

/**
 * Parse le XML Factur-X extrait et retourne les données de la facture
 */
export function parseFacturXML(xml: string): Partial<FacturXData> {
  const get = (tag: string) => {
    const m = xml.match(new RegExp(`<ram:${tag}[^>]*>([^<]+)</ram:${tag}>`))
    return m?.[1]?.trim() ?? ''
  }

  return {
    facture: {
      numero: get('ID'),
      dateEmission: formatDateFromXML(get('IssueDateTime') || ''),
      dateEcheance: formatDateFromXML(get('DueDateDateTime') || ''),
      devise: get('InvoiceCurrencyCode') || 'EUR',
      lignes: [],
    },
    vendeur: {
      nom: get('Name'),
      siren: get('SpecifiedLegalOrganization'),
      adresse: get('LineOne'),
      codePostal: get('PostcodeCode'),
      ville: get('CityName'),
    },
    acheteur: { nom: '', adresse: '', codePostal: '', ville: '' },
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDateFromXML(yyyymmdd: string): string {
  if (yyyymmdd.length === 8) {
    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
  }
  return yyyymmdd
}

/** Validate EN16931 required fields */
export function validateEN16931(data: FacturXData): string[] {
  const errors: string[] = []
  if (!data.vendeur.nom) errors.push('Nom du vendeur requis')
  if (!data.vendeur.siren) errors.push('SIREN vendeur requis')
  if (!data.vendeur.adresse) errors.push('Adresse vendeur requise')
  if (!data.acheteur.nom) errors.push('Nom acheteur requis')
  if (!data.facture.numero) errors.push('Numéro de facture requis')
  if (!data.facture.dateEmission) errors.push('Date d\'émission requise')
  if (!data.facture.dateEcheance) errors.push('Date d\'échéance requise')
  if (!data.facture.lignes.length) errors.push('Au moins une ligne de facturation requise')
  return errors
}
