import { describe, it, expect, beforeAll } from 'vitest'
import crypto from 'crypto'
import { encrypt, decrypt } from '../crypto'

beforeAll(() => {
  // Set a test encryption key (32 bytes = 64 hex chars)
  process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex')
})

describe('encrypt / decrypt', () => {
  it('round-trips: decrypt(encrypt(text)) === text', () => {
    const original = 'my-secret-access-token-12345'
    const { encrypted, iv } = encrypt(original)
    const decrypted = decrypt(encrypted, iv)
    expect(decrypted).toBe(original)
  })

  it('handles empty string', () => {
    const { encrypted, iv } = encrypt('')
    expect(decrypt(encrypted, iv)).toBe('')
  })

  it('handles unicode', () => {
    const original = 'tökën-with-ünïcödë-🔐'
    const { encrypted, iv } = encrypt(original)
    expect(decrypt(encrypted, iv)).toBe(original)
  })

  it('produces different ciphertexts for different plaintexts', () => {
    const { encrypted: e1 } = encrypt('token-a')
    const { encrypted: e2 } = encrypt('token-b')
    expect(e1).not.toBe(e2)
  })

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    const { encrypted: e1 } = encrypt('same-token')
    const { encrypted: e2 } = encrypt('same-token')
    // Extremely unlikely to be equal due to random IV
    expect(e1).not.toBe(e2)
  })

  it('fails decryption when ciphertext is tampered', () => {
    const { encrypted, iv } = encrypt('sensitive-data')
    const tampered = 'AAAA' + encrypted.slice(4)
    expect(() => decrypt(tampered, iv)).toThrow()
  })

  it('fails decryption when IV is wrong', () => {
    const { encrypted } = encrypt('sensitive-data')
    const wrongIv = crypto.randomBytes(16).toString('base64')
    expect(() => decrypt(encrypted, wrongIv)).toThrow()
  })
})
