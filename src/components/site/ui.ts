// Estilos compartilhados do site público. Ver DESIGN.md > Componentes.

// Botão primário: pill branco sólido. Padrão em qualquer fundo que não seja mídia.
export const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-white px-7 py-3 text-[15px] font-semibold text-carvao transition-[background-color,transform] duration-200 hover:bg-white/85 active:scale-[0.96]";

// Primário sobre fundo branco (Serviços): mesmo pill, invertido.
export const buttonDark =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-carvao px-7 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-carvao/85 active:scale-[0.96]";

// Só sobre vídeo ou foto: translúcido com blur, para continuar legível sem tampar a imagem.
export const buttonOverMedia =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-white/30 bg-white/12 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-colors duration-200 hover:bg-white/20";

export const textLink =
  "inline-flex min-h-11 items-center text-[15px] font-semibold text-white underline decoration-1 underline-offset-[5px] transition-[text-decoration-color,transform] duration-200 hover:decoration-white/40 active:scale-[0.97]";

// Container e margens laterais da página.
export const container = "mx-auto w-full max-w-[1440px] px-[clamp(20px,5vw,80px)]";

// Título de seção: Archivo expandida, sentence case, sem eyebrow.
export const sectionTitle =
  "font-display text-[clamp(2.25rem,4.6vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.02em] text-white";

// Mesmo título sobre fundo branco.
export const sectionTitleDark =
  "font-display text-[clamp(2.25rem,4.6vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.02em] text-carvao";
