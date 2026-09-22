function echapperChampCsv(valeur: string | number): string {
  const texte = String(valeur)
  return /[",;\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte
}

export function versCsv(lignes: Record<string, string | number>[]): string {
  if (lignes.length === 0) return ''
  const entetes = Object.keys(lignes[0])
  const corps = lignes.map((ligne) =>
    entetes.map((entete) => echapperChampCsv(ligne[entete])).join(';')
  )
  return [entetes.join(';'), ...corps].join('\r\n')
}
