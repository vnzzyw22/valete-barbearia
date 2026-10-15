import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminLoginBypass } from "@/lib/admin-login-bypass";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Vitrine sem banco (prévia): não há sessão para renovar e o painel abre sem senha, com dados
  // fictícios. A tela de login leva direto ao painel.
  if (!isSupabaseConfigured) {
    if (request.nextUrl.pathname === "/admin/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalida o token com o servidor Supabase — não trocar por
  // getSession(), que só lê o cookie local e pode estar desatualizado.
  let {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  // Login desativado para teste local (ver src/lib/admin-login-bypass.ts): entra sozinho com o
  // admin de teste. Os cookies da sessão vão no request (para o layout) e na resposta.
  const bypass = isAdminRoute && !user ? getAdminLoginBypass() : null;
  if (bypass) {
    const { data } = await supabase.auth.signInWithPassword(bypass);
    user = data.user;
  }

  if (isAdminRoute && !isLoginRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
