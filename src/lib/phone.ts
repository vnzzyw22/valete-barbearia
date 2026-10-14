// Telefone nacional: só dígitos, sem o DDI 55 (mesma regra de public.phone_national no banco).
// É a chave que liga o cliente aos agendamentos, à assinatura e ao acesso da "Minha conta".
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
  return digits.length === 10 || digits.length === 11 ? digits : null;
}

export function formatPhone(national: string) {
  if (national.length === 11) return `(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  return `(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
}
