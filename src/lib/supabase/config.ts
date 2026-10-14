// Sem as variáveis do Supabase (ex.: deploy na Vercel antes de criar o projeto da Valete), o
// site não pode cair com "Internal Server Error". O proxy pula a sessão e os clientes apontam
// para um endereço que nunca resolve (.invalid, RFC 2606): cada consulta volta com erro, e as
// funções de leitura já tratam erro como "sem dados" — o site abre com os estados vazios.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabaseUrl = url || "https://supabase-nao-configurado.invalid";
export const supabaseAnonKey = anonKey || "supabase-nao-configurado";
