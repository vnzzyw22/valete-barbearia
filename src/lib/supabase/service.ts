import { createClient } from "@supabase/supabase-js";

// Cliente com a chave service_role: IGNORA o RLS. Usado só no servidor pela "Minha conta"
// (src/lib/client-auth.ts e client-portal.ts), sempre filtrando pelo telefone de uma sessão já
// validada. Nunca importar em componente "use client" — a chave não tem NEXT_PUBLIC_.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
