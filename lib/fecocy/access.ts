export function localReadAccess(request: Request) {
  try {
    const url = new URL(request.url), host = request.headers.get('host') || url.host
    const authority = new URL(`${url.protocol}//${host}`)
    return ['127.0.0.1', 'localhost', '[::1]'].includes(authority.hostname) && (!request.headers.has('x-forwarded-host') || request.headers.get('x-forwarded-host') === host)
  } catch { return false }
}
