const formateurMontant = new Intl.NumberFormat('fr-FR')

export function formaterMontant(montant: number): string {
  return `${formateurMontant.format(montant)} FCFA`
}

export function formaterDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date)
}
