/**
 * Ollama Model Setup
 * Ensures the required AI model is downloaded and ready.
 */

import { isOllamaAvailable, listModels } from './ollama-client'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral:7b-instruct-q5_K_M'

/**
 * Check if the configured model is available locally.
 * If not, attempt to pull it (this can take several minutes on first run).
 */
export async function ensureModelReady(): Promise<{
  ready: boolean
  model: string
  error?: string
}> {
  // 1. Check if Ollama is running
  const available = await isOllamaAvailable()
  if (!available) {
    return {
      ready: false,
      model: OLLAMA_MODEL,
      error: 'Ollama is not running or not reachable',
    }
  }

  // 2. Check if model is already downloaded
  const models = await listModels()
  const modelBase = OLLAMA_MODEL.split(':')[0]
  const hasModel = models.some(
    (m) => m === OLLAMA_MODEL || m.startsWith(modelBase)
  )

  if (hasModel) {
    return { ready: true, model: OLLAMA_MODEL }
  }

  // 3. Attempt to pull the model
  console.log(`[ModelSetup] Pulling model ${OLLAMA_MODEL}...`)
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: OLLAMA_MODEL, stream: false }),
    })

    if (!response.ok) {
      return {
        ready: false,
        model: OLLAMA_MODEL,
        error: `Pull failed: HTTP ${response.status}`,
      }
    }

    console.log(`[ModelSetup] Model ${OLLAMA_MODEL} ready.`)
    return { ready: true, model: OLLAMA_MODEL }
  } catch (error: unknown) {
    return {
      ready: false,
      model: OLLAMA_MODEL,
      error: error instanceof Error ? error.message : 'Unknown pull error',
    }
  }
}
