/**
 * Ollama Local AI Client
 * Provides LLM capabilities without external API dependencies.
 * Falls back gracefully if Ollama is not available.
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral:7b-instruct-q5_K_M'

interface OllamaGenerateResponse {
  model: string
  response: string
  done: boolean
  total_duration?: number
}

/**
 * Send a prompt to the local Ollama instance and return the generated text.
 * Returns null if Ollama is unavailable or the request fails.
 */
export async function queryOllama(
  prompt: string,
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
    stop?: string[]
  }
): Promise<string | null> {
  const model = options?.model || OLLAMA_MODEL

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000) // 30s timeout

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.1,
          num_predict: options?.maxTokens ?? 512,
          stop: options?.stop,
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.error(`[Ollama] HTTP ${response.status}: ${response.statusText}`)
      return null
    }

    const data: OllamaGenerateResponse = await response.json()
    return data.response || null
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Ollama] Request timed out (30s)')
    } else {
      console.error('[Ollama] Unavailable:', error instanceof Error ? error.message : error)
    }
    return null
  }
}

/**
 * Check if Ollama is running and reachable.
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3_000)

    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: controller.signal,
    })

    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

/**
 * List models available on the local Ollama instance.
 */
export async function listModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`)
    if (!response.ok) return []

    const data = await response.json()
    return (data.models || []).map((m: { name: string }) => m.name)
  } catch {
    return []
  }
}
