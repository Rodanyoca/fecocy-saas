import { territoryResponse } from "@/lib/fecocy/api"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { return territoryResponse(request, "ententes", (await context.params).id) }
