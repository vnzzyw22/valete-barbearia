"use server";

import { revalidatePath } from "next/cache";
import {
  CODE_MAX_ATTEMPTS,
  CODE_TTL_MINUTES,
  codesMatch,
  endClientSession,
  formatPhone,
  generateCode,
  getClientLoginMode,
  hashCode,
  normalizePhone,
  startClientSession,
} from "@/lib/client-auth";
import { createServiceClient } from "@/lib/supabase/service";

// Limite de pedidos de código por telefone, para ninguém disparar códigos sem parar.
const MAX_CODES_PER_WINDOW = 3;
const WINDOW_MINUTES = 15;

type RequestResult =
  | { ok: true; phoneLabel: string; demoCode: string | null }
  | { ok: false; error: string };

export async function requestAccessCode(phoneInput: string): Promise<RequestResult> {
  if (getClientLoginMode() === "unavailable") {
    return { ok: false, error: "O acesso à conta ainda não está disponível." };
  }
  const phone = normalizePhone(phoneInput);
  if (!phone) return { ok: false, error: "Informe o WhatsApp com DDD, por exemplo (43) 99999-9999." };

  const supabase = createServiceClient();
  if (!supabase) return { ok: false, error: "O acesso à conta ainda não está disponível." };

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count, error: countError } = await supabase
    .from("client_login_codes")
    .select("id", { count: "exact", head: true })
    .eq("whatsapp", phone)
    .gte("created_at", since);
  if (countError) {
    console.error("Erro ao contar códigos:", countError.message);
    return { ok: false, error: "Não foi possível gerar o código. Tente de novo." };
  }
  if ((count ?? 0) >= MAX_CODES_PER_WINDOW) {
    return { ok: false, error: `Muitos códigos pedidos para este número. Tente de novo em ${WINDOW_MINUTES} minutos.` };
  }

  const code = generateCode();
  const { error } = await supabase.from("client_login_codes").insert({
    whatsapp: phone,
    code_hash: hashCode(phone, code),
    expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString(),
  });
  if (error) {
    console.error("Erro ao gravar código:", error.message);
    return { ok: false, error: "Não foi possível gerar o código. Tente de novo." };
  }

  // Sem API do WhatsApp ainda: só o modo de demonstração (banco local) devolve o código.
  return { ok: true, phoneLabel: formatPhone(phone), demoCode: getClientLoginMode() === "demo" ? code : null };
}

type VerifyResult = { ok: true } | { ok: false; error: string };

export async function verifyAccessCode(phoneInput: string, codeInput: string): Promise<VerifyResult> {
  if (getClientLoginMode() === "unavailable") {
    return { ok: false, error: "O acesso à conta ainda não está disponível." };
  }
  const phone = normalizePhone(phoneInput);
  const code = codeInput.replace(/\D/g, "");
  if (!phone || code.length !== 6) return { ok: false, error: "Digite os 6 números do código." };

  const supabase = createServiceClient();
  if (!supabase) return { ok: false, error: "O acesso à conta ainda não está disponível." };

  const { data: row, error } = await supabase
    .from("client_login_codes")
    .select("id, code_hash, attempts")
    .eq("whatsapp", phone)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("Erro ao conferir código:", error.message);
    return { ok: false, error: "Não foi possível conferir o código. Tente de novo." };
  }
  if (!row) return { ok: false, error: "Código vencido. Peça um novo código." };
  if (row.attempts >= CODE_MAX_ATTEMPTS) {
    return { ok: false, error: "Tentativas esgotadas para este código. Peça um novo código." };
  }

  if (!codesMatch(row.code_hash, hashCode(phone, code))) {
    await supabase.from("client_login_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    const left = CODE_MAX_ATTEMPTS - row.attempts - 1;
    return {
      ok: false,
      error: left > 0 ? `Código incorreto. Restam ${left} tentativas.` : "Código incorreto. Peça um novo código.",
    };
  }

  await supabase.from("client_login_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);
  await startClientSession(phone);
  revalidatePath("/minha-conta");
  return { ok: true };
}

export async function signOutClient() {
  await endClientSession();
  revalidatePath("/minha-conta");
}
