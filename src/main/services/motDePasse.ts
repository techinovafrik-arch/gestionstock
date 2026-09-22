import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function hashMotDePasse(motDePasse: string): string {
  const sel = randomBytes(16).toString('hex')
  const hash = scryptSync(motDePasse, sel, 64).toString('hex')
  return `${sel}:${hash}`
}

export function verifierMotDePasse(motDePasse: string, motDePasseHash: string): boolean {
  const [sel, hashAttendu] = motDePasseHash.split(':')
  if (!sel || !hashAttendu) return false
  const hashCalcule = scryptSync(motDePasse, sel, 64).toString('hex')
  const bufferAttendu = Buffer.from(hashAttendu, 'hex')
  const bufferCalcule = Buffer.from(hashCalcule, 'hex')
  if (bufferAttendu.length !== bufferCalcule.length) return false
  return timingSafeEqual(bufferAttendu, bufferCalcule)
}
