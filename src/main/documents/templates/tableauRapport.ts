export function gabaritTableauRapport(
  titre: string,
  lignes: Record<string, string | number>[]
): string {
  const entetes = lignes.length > 0 ? Object.keys(lignes[0]) : []
  const entetesHtml = entetes.map((e) => `<th>${e}</th>`).join('')
  const lignesHtml = lignes
    .map((ligne) => `<tr>${entetes.map((e) => `<td>${ligne[e]}</td>`).join('')}</tr>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: Arial, sans-serif; color: #111; font-size: 12px; }
  h1 { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f2f2f2; }
</style>
</head>
<body>
  <h1>${titre}</h1>
  <table>
    <thead><tr>${entetesHtml}</tr></thead>
    <tbody>${lignesHtml}</tbody>
  </table>
</body>
</html>`
}
