"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestAccessCode, verifyAccessCode } from "@/app/minha-conta/actions";
import { buttonPrimary } from "@/components/site/ui";

const fieldClass =
  "mt-2 w-full rounded-[10px] border border-ardosia bg-grafite px-4 py-3 text-[17px] text-white tabular-nums outline-none transition-colors duration-200 placeholder:text-white/30 focus:border-white";
const labelClass = "text-[15px] font-semibold text-white";

// Entrada da "Minha conta" em dois passos: WhatsApp → código de 6 dígitos.
export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneLabel, setPhoneLabel] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleRequest(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await requestAccessCode(phone);
      if (!result.ok) return setError(result.error);
      setPhoneLabel(result.phoneLabel);
      setDemoCode(result.demoCode);
      setCode("");
      setStep("code");
    } catch {
      setError("Não foi possível gerar o código. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await verifyAccessCode(phone, code);
      if (!result.ok) return setError(result.error);
      router.refresh();
    } catch {
      setError("Não foi possível conferir o código. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "phone") {
    return (
      <form onSubmit={handleRequest} className="flex flex-col gap-6" noValidate>
        <label className="block">
          <span className={labelClass}>WhatsApp</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(43) 99999-9999"
            className={fieldClass}
            aria-describedby={error ? "login-erro" : undefined}
          />
          <span className="mt-2 block text-[15px] text-cinza">O mesmo número que você usa para agendar.</span>
        </label>
        {error && (
          <p id="login-erro" role="alert" className="text-[15px] text-red-400">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={`${buttonPrimary} disabled:opacity-60`}>
          {busy ? "Gerando código…" : "Receber código"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-6" noValidate>
      {demoCode && (
        <div className="rounded-[12px] border border-dashed border-white/30 px-5 py-4 text-[15px] leading-relaxed text-cinza">
          <p className="font-semibold text-white">Demonstração</p>
          <p className="mt-1">
            O envio do código pelo WhatsApp ainda não está ligado. Nesta prévia, o código é{" "}
            <span className="font-semibold text-white tabular-nums">{demoCode}</span>.
          </p>
        </div>
      )}
      <label className="block">
        <span className={labelClass}>Código enviado para {phoneLabel}</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className={`${fieldClass} tracking-[0.3em]`}
          aria-describedby={error ? "login-erro" : undefined}
        />
      </label>
      {error && (
        <p id="login-erro" role="alert" className="text-[15px] text-red-400">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
        <button type="submit" disabled={busy || code.length !== 6} className={`${buttonPrimary} disabled:opacity-60`}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setError(null);
          }}
          className="min-h-11 text-[15px] font-semibold text-white underline decoration-white/30 underline-offset-[5px] hover:decoration-white"
        >
          Trocar número
        </button>
      </div>
    </form>
  );
}
