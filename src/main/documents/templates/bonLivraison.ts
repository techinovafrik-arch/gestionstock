import type { Prisma } from '@prisma/client'
import { formaterDate, formaterMontant } from '../formatage'

type BonLivraisonPourImpression = Prisma.BonLivraisonGetPayload<{
  include: { client: true; communeLivraison: true; lignes: { include: { ouvrage: true } } }
}>

export function gabaritBonLivraison(bonLivraison: BonLivraisonPourImpression): string {
  const totalIndicatif = bonLivraison.lignes.reduce(
    (total, ligne) => total + ligne.quantite * ligne.prixVenteUnitaire,
    0
  )

  const lignesHtml = bonLivraison.lignes
    .map(
      (ligne) => `
        <tr>
          <td>${ligne.ouvrage.titre}</td>
          <td class="nombre">${ligne.quantite}</td>
          <td class="nombre">${formaterMontant(ligne.prixVenteUnitaire)}</td>
          <td class="nombre">${formaterMontant(ligne.quantite * ligne.prixVenteUnitaire)}</td>
        </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: Arial, sans-serif; color: #111; font-size: 12px; }
  h1 { font-size: 18px; margin-bottom: 0; }
  .sous-titre { color: #555; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f2f2f2; }
  .nombre { text-align: right; }
  .entete { display: flex; justify-content: space-between; margin-top: 16px; }
  .total { margin-top: 12px; font-weight: bold; text-align: right; }
</style>
</head>
<body>
  <h1>Bon de livraison ${bonLivraison.numeroBL}</h1>
  <div class="sous-titre">Distribution Supernova — ${formaterDate(bonLivraison.dateBL)}</div>

  <div class="entete">
    <div>
      <strong>Client</strong><br/>
      ${bonLivraison.client.nom}
    </div>
    <div>
      <strong>Livraison</strong><br/>
      ${bonLivraison.communeLivraison.nom}${bonLivraison.adresseLivraison ? ` — ${bonLivraison.adresseLivraison}` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Ouvrage</th><th class="nombre">Quantité</th><th class="nombre">Prix unitaire</th><th class="nombre">Montant</th></tr>
    </thead>
    <tbody>${lignesHtml}</tbody>
  </table>

  <div class="total">Total indicatif : ${formaterMontant(totalIndicatif)}</div>
</body>
</html>`
}
