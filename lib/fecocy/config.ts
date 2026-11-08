// @ts-expect-error Native Node tests require the explicit extension.
import { TerritoryError } from './territory-domain.ts'
export const books = {
  referentiel: { variable: 'FECOCY_REFERENTIELS_SPREADSHEET_ID', id: '1w6hUKDuak5eKmmgv0hld6qd77clWkQ0CqehXNlvqnU4' },
  territoire: { variable: 'FECOCY_STRUCTURE_TERRITORIALE_SPREADSHEET_ID', id: '1FofWp8rkMMSyVQjnarB58ULjMC6pGx0xCcvO-54HF1k' },
  acteurs: { variable: 'FECOCY_ACTEURS_SPREADSHEET_ID', id: '1HnWrLVJYiXMa549jDkFL-EWqBJKMgdWsZpXDKcsEa6A' },
  affiliations: { variable: 'FECOCY_AFFILIATIONS_SPREADSHEET_ID', id: '1sOc_chHaHFmNM5MJA-crUBtHw0dzyVc4fyLV71K9NmE' },
  licences: { variable: 'FECOCY_LICENCES_SPREADSHEET_ID', id: '1VRX7MJDpQzJL03zkRig3ZnUDo8NtTjFzX6VCCbNV4oI' },
  activites: { variable: 'FECOCY_ACTIVITES_SPREADSHEET_ID', id: '1kpXHyg12jeFrRUHrJiW3C3ew-c8bwe9JoZNxAX-EaxI' },
  documents: { variable: 'FECOCY_DOCUMENTS_SPREADSHEET_ID', id: '18_jmkzJ4aFhcAXD0k7L-JMuXrC9L71tgP44Nmv4HtVY' },
} as const
export function configuration(values: Record<string, string | undefined>, requested: (keyof typeof books)[]) {
  const required = ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY', ...requested.map(book => books[book].variable)]
  const missing = required.filter(name => !values[name]?.trim())
  if (missing.length) throw new TerritoryError('configuration', `Configuration manquante : ${missing.join(', ')}. À renseigner dans .env.local.`)
  for (const book of requested) if (values[books[book].variable]?.trim() !== books[book].id) throw new TerritoryError('configuration', `Cible FECOCY incorrecte : ${books[book].variable}. Aucun classeur FEVOCO ne sera utilisé.`)
  return { email: values.GOOGLE_CLIENT_EMAIL!.trim(), key: values.GOOGLE_PRIVATE_KEY!.trim().replace(/\\n/g, '\n') }
}
