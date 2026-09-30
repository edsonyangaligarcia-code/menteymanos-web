// Pages Function: emits only a short-lived, viewables:read token.
export async function onRequestGet({ env }) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (!env.APS_CLIENT_ID || !env.APS_CLIENT_SECRET) return new Response(JSON.stringify({ error: 'APS no configurado' }), { status: 503, headers });
  try {
    const credentials = btoa(`${env.APS_CLIENT_ID}:${env.APS_CLIENT_SECRET}`);
    const upstream = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'viewables:read' })
    });
    if (!upstream.ok) return new Response(JSON.stringify({ error: 'No se pudo generar el token del visor' }), { status: 502, headers });
    const { access_token, expires_in } = await upstream.json();
    if (!access_token || !expires_in) throw new Error('Invalid APS response');
    return new Response(JSON.stringify({ access_token, expires_in }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: 'Visor temporalmente no disponible' }), { status: 502, headers });
  }
}
