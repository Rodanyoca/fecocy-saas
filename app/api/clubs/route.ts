import { territoryResponse } from "@/lib/fecocy/api"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET(request: Request) { return territoryResponse(request, "clubs") }
