// Gateway FALSO do Supabase para testes locais da Valete (descartável).
// /rest/v1/* -> PostgREST; /auth/v1 com um único admin de teste; demais rotas: 501.
import http from 'node:http';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

// Segredo gerado por up.sh fora do repositório (nunca versionado).
const SECRET = readFileSync(process.env.JWT_SECRET_FILE, 'utf8').trim();
const ADMIN = { id: '00000000-0000-0000-0000-0000000000ad', email: 'admin@teste.local', password: 'senha-local-de-teste' };
const b64u = (b) => Buffer.from(b).toString('base64url');
export function sign(payload) {
  const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64u(JSON.stringify(payload));
  return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`;
}
function verify(token) {
  const [h, p, s] = String(token || '').split('.');
  if (!s) return null;
  const good = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
  if (good !== s) return null;
  const claims = JSON.parse(Buffer.from(p, 'base64url'));
  if (claims.exp && claims.exp * 1000 < Date.now()) return null;
  return claims;
}
const user = () => ({ id: ADMIN.id, aud: 'authenticated', role: 'authenticated', email: ADMIN.email,
  app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' });
function session() {
  const now = Math.floor(Date.now() / 1000);
  const access = sign({ sub: ADMIN.id, email: ADMIN.email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600 });
  return { access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'refresh-' + crypto.randomUUID(), user: user() };
}
const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((r) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });

const PGRST_PORT = Number(process.env.PGRST_PORT ?? 3001);
const PORT = Number(process.env.GATEWAY_PORT ?? 54321);

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const body = await readBody(req);
  if (url.pathname.startsWith('/rest/v1')) {
    const headers = { ...req.headers };
    delete headers.host;
    if (!headers.authorization && headers.apikey) headers.authorization = `Bearer ${headers.apikey}`;
    const up = http.request({ host: '127.0.0.1', port: PGRST_PORT, method: req.method,
      path: url.pathname.replace(/^\/rest\/v1/, '') + url.search, headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    up.on('error', (e) => json(res, 502, { message: 'postgrest indisponível: ' + e.message }));
    up.end(body);
    return;
  }
  if (url.pathname === '/auth/v1/token') {
    const data = body.length ? JSON.parse(body) : {};
    const grant = url.searchParams.get('grant_type');
    if (grant === 'password' && data.email === ADMIN.email && data.password === ADMIN.password) return json(res, 200, session());
    if (grant === 'refresh_token' && String(data.refresh_token || '').startsWith('refresh-')) return json(res, 200, session());
    return json(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials', code: 'invalid_credentials', msg: 'Invalid login credentials' });
  }
  if (url.pathname === '/auth/v1/user') {
    const claims = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
    return claims && claims.sub === ADMIN.id ? json(res, 200, user()) : json(res, 401, { code: 401, msg: 'invalid JWT', error_code: 'bad_jwt' });
  }
  if (url.pathname === '/auth/v1/logout') { res.writeHead(204); return res.end(); }
  json(res, 501, { message: `rota não implementada no gateway de teste: ${url.pathname}` });
}).listen(PORT, '127.0.0.1', () => console.log(`gateway de teste em http://127.0.0.1:${PORT}`));
