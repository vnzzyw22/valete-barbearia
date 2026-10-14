// Login do painel DESATIVADO para teste (pedido do cliente em 2026-10-14). A tela de login e as
// duas camadas de proteção (src/proxy.ts e o layout do painel) continuam no código; com a chave
// ligada, o servidor entra sozinho com o admin de teste, e o painel abre direto.
//
// Trava de segurança: só vale contra o banco LOCAL de teste (scripts/local-db). Com um Supabase
// real na URL, a chave é ignorada e o login volta a ser exigido. A sessão é necessária mesmo no
// teste porque o RLS só libera leitura/escrita do painel para `authenticated`.
//
// .env.local:
//   ADMIN_LOGIN_DISABLED=true
//   ADMIN_TEST_EMAIL=admin@teste.local
//   ADMIN_TEST_PASSWORD=senha-local-de-teste
export function getAdminLoginBypass(): { email: string; password: string } | null {
  if (process.env.ADMIN_LOGIN_DISABLED !== "true") return null;

  let host = "";
  try {
    host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
  if (host !== "127.0.0.1" && host !== "localhost") return null;

  const email = process.env.ADMIN_TEST_EMAIL;
  const password = process.env.ADMIN_TEST_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}
