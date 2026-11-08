import React from 'react'
import { createRoot } from 'react-dom/client'
import snapshot from './source-territory.json'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { TerritoryClient } from '@/components/fecocy/territory-client'
import { mapTerritory, type Kind } from '@/lib/fecocy/territory-domain'
function rows(matrix: unknown[][]) {
  const headers = matrix[0].map(String)
  return matrix.slice(1).map(row => Object.fromEntries(headers.map((header, i) => [header, String(row[i] ?? '')])))
}
const tables = Object.fromEntries(Object.entries(snapshot.tables).map(([sheet, matrix]) => [sheet, rows(matrix)]))
const refs = Object.fromEntries(Object.entries(snapshot.refs).map(([sheet, matrix]) => [sheet, rows(matrix)]))
const data = mapTerritory(tables, refs)
const root = createRoot(document.getElementById('root')!)
function render(kind: Kind = 'ligues') { root.render(<DashboardLayout><TerritoryClient key={kind} kind={kind} data={data} /></DashboardLayout>) }
Object.assign(window, { fecocyRender: render })
render()
