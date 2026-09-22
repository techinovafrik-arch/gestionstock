import type { Prisma } from '@prisma/client'
import { formaterDate, formaterMontant } from '../formatage'

type FacturePourImpression = Prisma.FactureGetPayload<{
  include: { client: true; lignes: { include: { ouvrage: true } } }
}>

export function gabaritFacture(facture: FacturePourImpression): string {
  const lignesHtml = facture.lignes
    .map(
      (ligne) => `
        <tr>
          <td>${ligne.ouvrage.titre}</td>
          <td class="nombre">${ligne.quantite}</td>
          <td class="nombre">${formaterMontant(ligne.prixUnitaire)}</td>
          <td class="nombre">${formaterMontant(ligne.montantLigne)}</td>
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
  .totaux { margin-top: 12px; margin-left: auto; width: 260px; }
  .totaux div { display: flex; justify-content: space-between; padding: 2px 0; }
  .totaux .total { font-weight: bold; border-top: 1px solid #333; margin-top: 4px; padding-top: 4px; }
</style>
</head>
<body>
  <h1>Facture ${facture.numeroFacture}</h1>
  <div class="sous-titre">Distribution Supernova — ${formaterDate(facture.dateFacture)}</div>

  <div><strong>Client</strong><br/>${facture.client.nom}</div>

  <table>
    <thead>
      <tr><th>Ouvrage</th><th class="nombre">Quantité</th><th class="nombre">Prix unitaire</th><th class="nombre">Montant</th></tr>
    </thead>
    <tbody>${lignesHtml}</tbody>
  </table>

  <div class="totaux">
    <div><span>Montant HT</span><span>${formaterMontant(facture.montantHT)}</span></div>
    <div><span>Remise</span><span>${formaterMontant(facture.remise)}</span></div>
    <div class="total"><span>Total</span><span>${formaterMontant(facture.montantTotal)}</span></div>
  </div>
</body>
</html>`
}
