"use client"
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Building2, Eye, MapPin, Network, Shield } from 'lucide-react'
import { Header } from '@/components/dashboard/header'
import { DataTable, type Column, type Filter } from '@/components/dashboard/data-table'
import { DetailCard } from '@/components/dashboard/detail-card'
import { StatCard } from '@/components/dashboard/stat-card'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDateForDisplay } from '@/lib/compact-date'
import { territoryDetail, type Kind, type TerritoryData, type TerritoryRecord } from '@/lib/fecocy/territory-domain'
const titles = { ligues: 'Ligues', ententes: 'Ententes', clubs: 'Clubs' }
const singular = { ligues: 'Ligue', ententes: 'Entente', clubs: 'Club' }
export function TerritoryClient({ kind, data }: { kind: Kind; data: TerritoryData }) {
  const [selected, setSelected] = useState<string | null>(null)
  const params = useSearchParams(), requestedId = params.get('id') || ''
  useEffect(() => { if (requestedId && data[kind].some(row => row.id === requestedId)) setSelected(requestedId) }, [requestedId, data, kind])
  useEffect(() => {
    const reset = (event: Event) => { if ((event as CustomEvent<string>).detail === `/${kind}`) setSelected(null) }
    window.addEventListener('fecocy:navigate', reset)
    return () => window.removeEventListener('fecocy:navigate', reset)
  }, [kind])
  const rows = data[kind]
  const columns: Column<TerritoryRecord>[] = [
    { key: 'id', header: 'ID', className: 'font-mono text-sm' },
    ...(kind === 'ligues' ? [] : [{ key: 'code', header: 'Code local' }]),
    { key: 'nom', header: singular[kind], className: 'font-medium' },
    ...(kind === 'ligues' ? [{ key: 'nomProvince', header: 'Province' }] : kind === 'ententes' ? [{ key: 'nomLigue', header: 'Ligue' }, { key: 'ville', header: 'Ville' }] : [{ key: 'categorie', header: 'Catégorie' }, { key: 'sexe', header: 'Sexe' }, { key: 'nomEntente', header: 'Entente' }, { key: 'nomLigue', header: 'Ligue' }]),
    { key: 'statut', header: 'Statut', render: row => <StatusBadge status={row.statut} /> },
  ]
  const filterKeys: { key: 'nomProvince' | 'nomLigue' | 'nomEntente' | 'statut'; label: string }[] = kind === 'ligues' ? [{ key: 'nomProvince', label: 'Province' }, { key: 'statut', label: 'Statut' }] : kind === 'ententes' ? [{ key: 'nomLigue', label: 'Ligue' }, { key: 'statut', label: 'Statut' }] : [{ key: 'nomLigue', label: 'Ligue' }, { key: 'nomEntente', label: 'Entente' }, { key: 'statut', label: 'Statut' }]
  const filters: Filter[] = filterKeys.map(filter => ({ ...filter, options: [...new Set(rows.map(row => row[filter.key]).filter(Boolean))].sort().map(label => ({ value: label, label })) }))
  const detail = selected && rows.some(row => row.id === selected) ? territoryDetail(data, kind, selected) : null
  const record = detail?.record
  const show = (row: TerritoryRecord) => setSelected(row.id)
  const compactColumns: Column<TerritoryRecord>[] = [{ key: 'id', header: 'ID', className: 'font-mono text-sm' }, { key: 'nom', header: 'Nom' }, { key: 'statut', header: 'Statut', render: row => <StatusBadge status={row.statut} /> }]
  return <>
    <Header title={record ? `Fiche ${singular[kind]} : ${record.nom || record.id}` : titles[kind]} subtitle="Structure territoriale FECOCY" />
    <div className="space-y-5 p-4 sm:p-6">
      <p className="text-sm text-muted-foreground">Consultation FECOCY. Formulaires et mutations non activés dans ce point de livraison.</p>
      {!!data.diagnostics.length && <div role="alert" className="rounded-xl border p-4">{data.diagnostics.map(message => <p key={message}>{message}</p>)}</div>}
      <div hidden={!!record}>
        <DataTable data={rows} columns={columns} filters={filters} idKey="id" searchPlaceholder={`Rechercher ${kind === 'ligues' ? 'une ligue' : kind === 'ententes' ? 'une entente' : 'un club'}...`}
          renderActions={row => <Button variant="ghost" size="icon" aria-label={`Voir ${row.nom || row.id}`} onClick={() => show(row)}><Eye className="size-4" /></Button>}
          renderMobileCard={row => <div className="space-y-3 rounded-xl border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-semibold">{row.nom || row.id}</p><p className="font-mono text-xs text-muted-foreground">{row.id}</p></div><StatusBadge status={row.statut} /></div><p className="text-sm text-muted-foreground">{row.nomProvince || row.nomLigue || row.nomEntente}</p><div className="flex justify-end"><Button variant="outline" onClick={() => show(row)}>Voir la fiche</Button></div></div>} />
      </div>
      {record && detail && <div className="space-y-6">
        <Button variant="outline" onClick={() => setSelected(null)}><ArrowLeft className="mr-2 size-4" />Retour à la liste</Button>
        <div className="grid gap-6 lg:grid-cols-2"><DetailCard title="Informations générales" icon={MapPin} fields={[
          { label: `ID ${singular[kind]}`, value: record.id }, { label: 'Nom', value: record.nom },
          ...(kind === 'ligues' ? [{ label: 'Sigle', value: record.pseudo }, { label: 'Province', value: record.nomProvince }, { label: 'E-mail', value: record.email }] : kind === 'ententes' ? [{ label: 'Code local', value: record.code }, { label: 'Ligue', value: record.nomLigue }, { label: 'Ville', value: record.ville }, { label: 'E-mail', value: record.email }] : [{ label: 'Code local', value: record.code }, { label: 'Entente', value: record.nomEntente }, { label: 'Ligue', value: record.nomLigue }, { label: 'Catégorie', value: record.categorie }, { label: 'Sexe', value: record.sexe }, { label: 'Affiliation', value: formatDateForDisplay(record.dateAffiliation) }]),
          { label: 'Statut', value: record.statut || 'Non renseigné' }, { label: 'Observations', value: record.observations },
        ]} /><Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-5 text-brand-gold" />Responsables</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Les responsables et les rattachements des cyclistes ne sont pas encore raccordés. Aucun acteur ou effectif n’est inventé.</p></CardContent></Card></div>
        {kind !== 'clubs' && <div className="grid gap-4 sm:grid-cols-2">{kind === 'ligues' && <StatCard title="Ententes liées" value={detail.ententes.length} icon={Network} />}<StatCard title="Clubs liés" value={detail.clubs.length} icon={Building2} /></div>}
        {kind === 'ligues' && <Card><CardHeader><CardTitle>Ententes liées</CardTitle></CardHeader><CardContent><DataTable data={detail.ententes} columns={compactColumns} idKey="id" searchPlaceholder="Rechercher une entente liée..." /></CardContent></Card>}
        {kind !== 'clubs' && <Card><CardHeader><CardTitle>Clubs liés</CardTitle></CardHeader><CardContent><DataTable data={detail.clubs} columns={compactColumns} idKey="id" searchPlaceholder="Rechercher un club lié..." /></CardContent></Card>}
      </div>}
    </div>
  </>
}
