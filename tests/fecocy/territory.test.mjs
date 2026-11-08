import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadTerritory, territoryDetail, planColumns, TerritoryError } from '../../lib/fecocy/territory-domain.ts'
import { configuration, books } from '../../lib/fecocy/config.ts'
import { localReadAccess } from '../../lib/fecocy/access.ts'
const snapshot = JSON.parse(readFileSync(new URL('./source-territory.json', import.meta.url), 'utf8'))
function fixture(reversed = false) {
  const data = structuredClone(snapshot), calls = []
  if (reversed) for (const group of [data.tables, data.refs]) for (const sheet in group) {
    const width = group[sheet][0].length
    group[sheet] = group[sheet].map(row => Array.from({ length: width }, (_, i) => row[i] ?? '').reverse())
  }
  const index = column => [...column].reduce((value, char) => value * 26 + char.charCodeAt(0) - 64, 0) - 1
  const read = async (book, ranges) => {
    calls.push({ book, ranges })
    return Object.fromEntries(ranges.map(range => {
      const [sheet, address] = range.replaceAll("'", '').split('!'), matrix = (book === 'territoire' ? data.tables : data.refs)[sheet]
      if (address === '1:1') return [range, [matrix[0]]]
      const match = address.match(/^([A-Z]+)2:([A-Z]+)$/)
      assert.ok(match, range)
      const values = matrix.slice(1).map(row => row.slice(index(match[1]), index(match[2]) + 1))
      while (values.length && values.at(-1).every(cell => !cell)) values.pop()
      return [range, values]
    }))
  }
  function add(sheet, row) { data.tables[sheet].push(data.tables[sheet][0].map(field => row[field] || '')) }
  return { data, calls, read, add }
}
test('actual FECOCY capture: 26 textual IDs, blank statuses and empty ententes/clubs', async () => {
  const source = fixture(), data = await loadTerritory(source.read)
  assert.equal(data.ligues.length, 26)
  assert.deepEqual(data.ligues.map(row => row.id), Array.from({ length: 26 }, (_, i) => String(i + 1).padStart(2, '0')))
  assert.ok(data.ligues.every(row => row.statut === ''))
  assert.equal(data.ententes.length, 0); assert.equal(data.clubs.length, 0)
  assert.equal(source.calls.length, 4) // Header and data batches for each of two workbooks.
})
test('real captured league 01 opens with Kinshasa and real zero child relations, no invented actors', async () => {
  const data = await loadTerritory(fixture().read), detail = territoryDetail(data, 'ligues', '01')
  assert.equal(detail.record.id, '01'); assert.equal(detail.record.nom, snapshot.tables.LIGUES[1][1])
  assert.equal(detail.record.nomProvince, 'KINSHASA')
  assert.deepEqual(detail.ententes, []); assert.deepEqual(detail.clubs, [])
  assert.equal(Object.hasOwn(detail, 'athletes'), false)
})
test('headers may be reordered in all seven sheets without changing the result', async () => {
  assert.deepEqual(await loadTerritory(fixture(true).read), await loadTerritory(fixture().read))
})
test('club league is resolved through its entente; stored inconsistency remains a diagnostic', async () => {
  const source = fixture(), category = snapshot.refs.CATEGORIES_CLUB[1]
  source.add('ENTENTES', { id_entente: '0102', code_entente: '02', nom_entente: 'Entente test', id_ligue: '01' })
  source.add('CLUBS', { id_club: '0102001', code_club: '001', nom_club: 'Club test', id_entente: '0102', id_ligue: '02', id_categorie_club: category[0] })
  const data = await loadTerritory(source.read), club = data.clubs[0]
  assert.equal(club.id, '0102001'); assert.equal(club.code, '001'); assert.equal(club.idLigue, '01'); assert.equal(club.idLigueStockee, '02')
  assert.equal(club.categorie, category[1]); assert.equal(data.diagnostics.length, 1)
})
test('unknown parent keeps the club row visible, without inventing a direct league relation', async () => {
  const source = fixture()
  source.add('CLUBS', { id_club: '0102001', nom_club: 'Club test', id_entente: '0102', id_ligue: '01' })
  const data = await loadTerritory(source.read)
  assert.equal(data.clubs.length, 1); assert.equal(data.clubs[0].nomEntente, '0102'); assert.equal(data.clubs[0].idLigue, '')
  assert.equal(data.diagnostics.length, 1)
})
test('missing/duplicate headers and duplicate IDs are schema errors, not empty lists', async () => {
  assert.throws(() => planColumns('LIGUES', [['nom_ligue']], ['id_ligue']), error => error.code === 'schema')
  assert.throws(() => planColumns('LIGUES', [['id_ligue', 'id_ligue']], ['id_ligue']), error => error.code === 'schema')
  const source = fixture(); source.data.tables.LIGUES.push(source.data.tables.LIGUES[1])
  await assert.rejects(loadTerritory(source.read), error => error.code === 'schema')
})
test('source error is sanitized and never becomes an empty list', async () => {
  await assert.rejects(loadTerritory(async () => { throw new Error('PRIVATE-CREDENTIAL') }), error => error instanceof TerritoryError && error.code === 'connection' && !error.message.includes('PRIVATE'))
})
test('unknown territory ID gives an explicit not_found error', async () => {
  const data = await loadTerritory(fixture().read)
  assert.throws(() => territoryDetail(data, 'ligues', '99'), error => error.code === 'not_found')
})
test('four territorial env vars are required; FEVOCО and other target IDs never act as fallback', () => {
  const values = { GOOGLE_CLIENT_EMAIL: 'test@example.test', GOOGLE_PRIVATE_KEY: 'test-key', FECOCY_STRUCTURE_TERRITORIALE_SPREADSHEET_ID: books.territoire.id, FECOCY_REFERENTIELS_SPREADSHEET_ID: books.referentiel.id }
  assert.equal(configuration(values, ['territoire', 'referentiel']).email, 'test@example.test')
  assert.throws(() => configuration({}, ['territoire', 'referentiel']), error => error.code === 'configuration')
  assert.throws(() => configuration({ ...values, FECOCY_STRUCTURE_TERRITORIALE_SPREADSHEET_ID: 'FEVOCO' }, ['territoire', 'referentiel']), error => error.code === 'configuration')
})
test('local read boundary rejects foreign or conflicting forwarded authorities', () => {
  assert.equal(localReadAccess(new Request('http://127.0.0.1:3050/ligues')), true)
  assert.equal(localReadAccess(new Request('https://example.com/ligues')), false)
  assert.equal(localReadAccess(new Request('http://127.0.0.1:3050/ligues', { headers: { host: '127.0.0.1:3050', 'x-forwarded-host': 'example.com' } })), false)
})
