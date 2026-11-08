import 'server-only'
import { NextResponse } from 'next/server'
import { localReadAccess } from './access'
import { TerritoryError, territoryDetail, type Kind } from './territory-domain'
import { getTerritory } from './sheets-server'
export async function territoryResponse(request: Request, kind: Kind, id?: string) {
  if (!localReadAccess(request)) return NextResponse.json({ error: { code: 'access', message: 'Accès local uniquement.' } }, { status: 403 })
  try {
    const data = await getTerritory()
    const body = id === undefined ? { [kind]: data[kind], diagnostics: data.diagnostics } : territoryDetail(data, kind, id)
    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const failure = error instanceof TerritoryError ? error : new TerritoryError('connection', 'Lecture FECOCY indisponible.')
    return NextResponse.json({ error: { code: failure.code, message: failure.message } }, { status: failure.code === 'not_found' ? 404 : failure.code === 'schema' ? 502 : 503, headers: { 'Cache-Control': 'private, no-store' } })
  }
}
