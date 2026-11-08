import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Header } from '@/components/dashboard/header'
import { TerritoryClient } from './territory-client'
import { getTerritory } from '@/lib/fecocy/sheets-server'
import { TerritoryError, type Kind } from '@/lib/fecocy/territory-domain'
export async function TerritoryPage({ kind }: { kind: Kind }) {
  let content
  try { content = <TerritoryClient kind={kind} data={await getTerritory()} /> }
  catch (error) {
    const failure = error instanceof TerritoryError ? error : new TerritoryError('connection', 'Lecture FECOCY indisponible.')
    const title = failure.code === 'configuration' ? 'Configuration FECOCY incomplète' : failure.code === 'schema' ? 'Schéma FECOCY incompatible' : 'Connexion FECOCY indisponible'
    content = <><Header title={{ ligues: 'Ligues', ententes: 'Ententes', clubs: 'Clubs' }[kind]} /><div role="alert" className="m-6 space-y-3 rounded-xl border border-destructive/40 p-6"><h2 className="font-semibold">{title}</h2><p>{failure.message}</p><a className="underline" href={`/${kind}`}>Réessayer</a></div></>
  }
  return <DashboardLayout>{content}</DashboardLayout>
}
