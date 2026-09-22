import { describe, expect, it } from 'vitest'
import { versCsv } from '../../src/main/documents/csv'

describe('documents/csv', () => {
  it('génère une ligne d’en-tête à partir des clés du premier objet', () => {
    const csv = versCsv([{ nom: 'Ouvrage A', montant: 1000 }])
    expect(csv).toBe('nom;montant\r\nOuvrage A;1000')
  })

  it('échappe les champs contenant un point-virgule ou un guillemet', () => {
    const csv = versCsv([{ nom: 'Manuel "spécial"; édition' }])
    expect(csv).toBe('nom\r\n"Manuel ""spécial""; édition"')
  })

  it('retourne une chaîne vide pour un tableau vide', () => {
    expect(versCsv([])).toBe('')
  })
})
