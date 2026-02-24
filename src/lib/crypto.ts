/**
 * Chiffrement AES-256-GCM pour les tokens OAuth des intégrations ERP
 *
 * Env var requise :
 *   INTEGRATION_ENCRYPTION_KEY=<64 chars hex = 32 bytes>
 *
 * Génération : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.INTEGRATION_ENCRYPTION_KEY ?? ''
  if (!hex || hex.length !== 64) {
    throw new Error(
      'INTEGRATION_ENCRYPTION_KEY manquante ou invalide — doit être 64 caractères hex (32 bytes)'
    )
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Chiffre un token OAuth en AES-256-GCM.
 * Format du résultat (base64) : [16 bytes IV][16 bytes auth tag][ciphertext]
 */
export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

/**
 * Déchiffre un token OAuth chiffré par encryptToken.
 */
export function decryptToken(ciphertext: string): string {
  const key = getKey()
  const buf = Buffer.from(ciphertext, 'base64')
  const iv = buf.subarray(0, 16)
  const tag = buf.subarray(16, 32)
  const encrypted = buf.subarray(32)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

/** Vérifie que la clé est configurée sans tenter de chiffrer */
export function isEncryptionConfigured(): boolean {
  const hex = process.env.INTEGRATION_ENCRYPTION_KEY ?? ''
  return hex.length === 64
}
