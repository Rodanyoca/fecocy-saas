import { NextRequest, NextResponse } from "next/server"
import { localReadAccess } from "./lib/fecocy/access"
export function proxy(request: NextRequest) {
  if (!localReadAccess(request)) return NextResponse.json({ error: { code: "access", message: "Acces local uniquement." } }, { status: 403 })
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) return NextResponse.json({ error: { code: "readonly", message: "Les mutations FECOCY ne sont pas encore activees." } }, { status: 409 })
  const path = request.nextUrl.pathname
  if (/^\/(transferts|equipe-nationale|suivi-equipe-nationale|parametres)(?:\/|$)/.test(path)) return NextResponse.json({ message: "Module hors perimetre FECOCY." }, { status: 404 })
  if (path.startsWith("/api/") && !/^\/api\/(ligues|ententes|clubs)(?:\/[^/]+)?$/.test(path)) return NextResponse.json({ error: { code: "pending", message: "Ce service FECOCY n'est pas encore raccorde." } }, { status: 503 })
  const response = NextResponse.next(); response.headers.set("Cache-Control", "private, no-store"); return response
}
export const config = { matcher: ["/:path*"] }
