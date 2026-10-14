import crypto from "node:crypto";
import { cookies } from "next/headers";
import { normalizePhone } from "@/lib/phone";

export { formatPhone, normalizePhone } from "@/lib/phone";

// Acesso do cliente à "Minha conta": WhatsApp + código de 6 dígitos, sem senha.
//
// - O código é gerado no servidor, guardado só como HMAC em client_login_codes (10 min,
//   5 tentativas) e trocado por um cookie de sessão assinado (httpOnly, 30 dias).
// - O cookie guarda só o telefone nacional (DDD + número) e a validade; não há tabela de sessões.
// - ENVIO DO CÓDIGO: ainda não existe integração com a API do WhatsApp. Com CLIENT_LOGIN_DEMO=true
//   e o banco LOCAL de teste, o código aparece na tela (demonstração). Fora disso o acesso fica
//   indisponível — nunca mostrar o código na tela com dados reais: qualquer pessoa entraria na
//   conta de qualquer telefone.

export const SESSION_COOKIE = "valete_cliente";
const SESSION_DAYS = 30;
export const CODE_TTL_MINUTES = 10;
export const CODE_MAX_ATTEMPTS = 5;

export type ClientLoginMode = "demo" | "unavailable";

function secret() {
  const value = process.env.CLIENT_SESSION_SECRET ?? "";
  return value.length >= 32 ? value : null;
}

function isLocalDatabase() {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    return host === "127.0.0.1" || host === "localhost";
  } catch {
    return false;
  }
}

export function getClientLoginMode(): ClientLoginMode {
  if (!secret() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return "unavailable";
  if (process.env.CLIENT_LOGIN_DEMO === "true" && isLocalDatabase()) return "demo";
  return "unavailable";
}

export function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(phone: string, code: string) {
  const key = secret();
  if (!key) throw new Error("CLIENT_SESSION_SECRET ausente");
  return crypto.createHmac("sha256", key).update(`code:${phone}:${code}`).digest("hex");
}

export function codesMatch(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()!).update(`session:${payload}`).digest("base64url");
}

export async function startClientSession(phone: string) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ p: phone, exp })).toString("base64url");
  const store = await cookies();
  store.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endClientSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// Telefone da sessão válida, ou null (sem cookie, assinatura errada, vencida ou acesso desligado).
export async function getClientSessionPhone(): Promise<string | null> {
  if (getClientLoginMode() === "unavailable") return null;
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature || !codesMatch(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { p?: string; exp?: number };
    if (!data.p || !data.exp || data.exp < Date.now()) return null;
    return normalizePhone(data.p);
  } catch {
    return null;
  }
}
