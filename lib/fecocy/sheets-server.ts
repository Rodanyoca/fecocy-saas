import 'server-only'
import { books, configuration } from './config'
import { TerritoryError, loadTerritory, type Matrix, type Read, type TerritoryData } from './territory-domain'
const pending = new Map<string, Promise<Record<string, Matrix>>>()
const cached = new Map<string, { data: Record<string, Matrix>; until: number }>()
export const readFecocySheets: Read = async (book, requested) => {
  const config = configuration(process.env, ['territoire', 'referentiel'])
  const ranges = [...new Set(requested)].sort(), key = JSON.stringify([book, ranges])
  if (cached.has(key) && cached.get(key)!.until > Date.now()) return cached.get(key)!.data
  if (pending.has(key)) return pending.get(key)!
  const promise = (async () => {
    try {
      const { sheets, auth: authClient } = await import('googleapis/build/src/apis/sheets')
      const auth = new authClient.JWT({ email: config.email, key: config.key, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] })
      const response = await sheets({ version: 'v4', auth }).spreadsheets.values.batchGet({ spreadsheetId: books[book].id, ranges, valueRenderOption: 'FORMATTED_VALUE', fields: 'valueRanges(values)' }, { timeout: 15000, retry: false })
      if (response.data.valueRanges?.length !== ranges.length) throw new Error('Incomplete source response')
      const data = Object.fromEntries(ranges.map((range, index) => [range, response.data.valueRanges![index].values ?? []]))
      cached.set(key, { data, until: Date.now() + 15000 }); return data
    } catch { throw new TerritoryError('connection', 'Connexion Google Sheets FECOCY indisponible. Vérifiez le réseau et les droits du compte de service.') }
  })().finally(() => pending.delete(key))
  pending.set(key, promise)
  return promise
}
let snapshot: { data: TerritoryData; until: number } | undefined
let inflight: Promise<TerritoryData> | undefined
export async function getTerritory() {
  configuration(process.env, ['territoire', 'referentiel'])
  if (snapshot && snapshot.until > Date.now()) return snapshot.data
  inflight ??= loadTerritory(readFecocySheets).then(data => { snapshot = { data, until: Date.now() + 15000 }; return data }).finally(() => { inflight = undefined })
  return inflight
}
