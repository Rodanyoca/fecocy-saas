export type Matrix = unknown[][]
export type Read = (book: 'territoire' | 'referentiel', ranges: string[]) => Promise<Record<string, Matrix>>
export type Kind = 'ligues' | 'ententes' | 'clubs'
export type Row = Record<string, string>
export const schemas = {
  LIGUES: ['id_ligue', 'nom_ligue', 'pseudo_ligue', 'email_ligue', 'id_province', 'statut', 'observations'],
  ENTENTES: ['id_entente', 'code_entente', 'nom_entente', 'pseudo_entente', 'id_ligue', 'id_ville', 'email_entente', 'statut', 'observations'],
  CLUBS: ['id_club', 'nom_club', 'id_categorie_club', 'id_sexe', 'date_affiliation', 'id_ville', 'id_entente', 'id_ligue', 'statut', 'observations', 'code_club'],
} as const
const refSchema = { PROVINCES: ['id_province', 'nom_province'], VILLES: ['id_ville', 'id_province', 'nom_ville'], CATEGORIES_CLUB: ['id_categorie_club', 'nom_categorie_club'], SEXES: ['id_sexe', 'nom_sexe'] }
export class TerritoryError extends Error {
  code: 'configuration' | 'connection' | 'schema' | 'not_found'
  constructor(code: TerritoryError['code'], message: string) { super(message); this.code = code }
}
export function columnName(index: number) {
  let result = ''
  for (let value = index + 1; value; value = Math.floor((value - 1) / 26)) result = String.fromCharCode(65 + (value - 1) % 26) + result
  return result
}
export function planColumns(sheet: string, matrix: Matrix, required: readonly string[]) {
  const headers = (matrix[0] ?? []).map(value => String(value ?? '').trim())
  return required.map(field => {
    const index = headers.indexOf(field)
    if (index < 0 || headers.lastIndexOf(field) !== index) throw new TerritoryError('schema', `Schéma ${sheet} incompatible : ${field} absent ou dupliqué.`)
    const column = columnName(index)
    return { field, range: `'${sheet}'!${column}2:${column}` }
  })
}
async function projected(book: 'territoire' | 'referentiel', schema: Record<string, readonly string[]>, read: Read) {
  const names = Object.keys(schema), headers = await read(book, names.map(name => `'${name}'!1:1`))
  const plans = names.map(name => ({ name, fields: planColumns(name, headers[`'${name}'!1:1`] ?? [], schema[name]) }))
  const cells = await read(book, plans.flatMap(plan => plan.fields.map(field => field.range)))
  return Object.fromEntries(plans.map(({ name, fields }) => {
    if (fields.some(field => !cells[field.range])) throw new TerritoryError('connection', `Réponse ${name} incomplète.`)
    const count = Math.max(0, ...fields.map(field => cells[field.range].length))
    const rows = Array.from({ length: count }, (_, index) => Object.fromEntries(fields.map(field => [field.field, String(cells[field.range][index]?.[0] ?? '').trim()]))).filter(row => Object.values(row).some(Boolean))
    const seen = new Set<string>()
    for (const row of rows) {
      const id = row[schema[name][0]]
      if (!id || seen.has(id)) throw new TerritoryError('schema', `${name} contient un identifiant absent ou dupliqué.`)
      seen.add(id)
    }
    return [name, rows]
  }))
}
export type TerritoryRecord = {
  id: string; nom: string; code: string; pseudo: string; email: string; statut: string; observations: string
  idLigue: string; nomLigue: string; idEntente: string; nomEntente: string; idProvince: string; nomProvince: string
  idVille: string; ville: string; idCategorieClub: string; categorie: string; idSexe: string; sexe: string; dateAffiliation: string; idLigueStockee: string
}
export function mapTerritory(tables: Record<string, Row[]>, refs: Record<string, Row[]>) {
  const index = (sheet: string, key: string, label: string) => new Map(refs[sheet].map(row => [row[key], row[label]]))
  const provinces = index('PROVINCES', 'id_province', 'nom_province'), cities = index('VILLES', 'id_ville', 'nom_ville'), categories = index('CATEGORIES_CLUB', 'id_categorie_club', 'nom_categorie_club'), sexes = index('SEXES', 'id_sexe', 'nom_sexe')
  const diagnostics: string[] = []
  const base = (row: Row): TerritoryRecord => ({ id: '', nom: '', code: '', pseudo: '', email: '', statut: row.statut || '', observations: row.observations || '', idLigue: '', nomLigue: '', idEntente: '', nomEntente: '', idProvince: '', nomProvince: '', idVille: row.id_ville || '', ville: cities.get(row.id_ville) || row.id_ville || '', idCategorieClub: '', categorie: '', idSexe: '', sexe: '', dateAffiliation: '', idLigueStockee: '' })
  const ligues = tables.LIGUES.map(row => ({ ...base(row), id: row.id_ligue, nom: row.nom_ligue, pseudo: row.pseudo_ligue, email: row.email_ligue, idProvince: row.id_province, nomProvince: provinces.get(row.id_province) || row.id_province }))
  const leagueById = new Map(ligues.map(row => [row.id, row]))
  const ententes = tables.ENTENTES.map(row => {
    const parent = leagueById.get(row.id_ligue)
    if (!parent) diagnostics.push(`Entente ${row.id_entente} : ligue ${row.id_ligue || 'non renseignée'} introuvable.`)
    return { ...base(row), id: row.id_entente, nom: row.nom_entente, code: row.code_entente, pseudo: row.pseudo_entente, email: row.email_entente, idLigue: row.id_ligue, nomLigue: parent?.nom || row.id_ligue, idProvince: parent?.idProvince || '', nomProvince: parent?.nomProvince || '' }
  })
  const ententeById = new Map(ententes.map(row => [row.id, row]))
  const clubs = tables.CLUBS.map(row => {
    const parent = ententeById.get(row.id_entente)
    if (!parent) diagnostics.push(`Club ${row.id_club} : entente ${row.id_entente || 'non renseignée'} introuvable. Aucun rattachement direct à une ligue n'est déduit.`)
    else if (row.id_ligue && row.id_ligue !== parent.idLigue) diagnostics.push(`Club ${row.id_club} : id_ligue ${row.id_ligue} incohérent avec l'entente ${row.id_entente} (${parent.idLigue}).`)
    return { ...base(row), id: row.id_club, nom: row.nom_club, code: row.code_club, idEntente: row.id_entente, nomEntente: parent?.nom || row.id_entente, idLigue: parent?.idLigue || '', nomLigue: parent?.nomLigue || '', idProvince: parent?.idProvince || '', nomProvince: parent?.nomProvince || '', idLigueStockee: row.id_ligue, idCategorieClub: row.id_categorie_club, categorie: categories.get(row.id_categorie_club) || row.id_categorie_club, idSexe: row.id_sexe, sexe: sexes.get(row.id_sexe) || row.id_sexe, dateAffiliation: row.date_affiliation }
  })
  return { ligues, ententes, clubs, diagnostics }
}
export type TerritoryData = ReturnType<typeof mapTerritory>
export async function loadTerritory(read: Read): Promise<TerritoryData> {
  try {
    const [tables, refs] = await Promise.all([projected('territoire', schemas, read), projected('referentiel', refSchema, read)])
    return mapTerritory(tables, refs)
  } catch (error) {
    if (error instanceof TerritoryError) throw error
    throw new TerritoryError('connection', 'Lecture Google Sheets FECOCY impossible. Vérifiez le réseau et les droits du compte de service.')
  }
}
export function territoryDetail(data: TerritoryData, kind: Kind, id: string) {
  const record = data[kind].find(row => row.id === id)
  if (!record) throw new TerritoryError('not_found', 'Structure FECOCY introuvable.')
  return { record, ententes: kind === 'ligues' ? data.ententes.filter(row => row.idLigue === id) : [], clubs: kind === 'ligues' ? data.clubs.filter(row => row.idLigue === id) : kind === 'ententes' ? data.clubs.filter(row => row.idEntente === id) : [] }
}
