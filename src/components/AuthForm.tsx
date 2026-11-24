"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Palette,
  Sparkles,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { AuraLogo } from "@/components/AuraLogo";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem("aura_theme");
    const initial: "dark" | "light" = saved === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.classList.toggle("light", initial === "light");
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem("aura_theme", next);
      document.documentElement.classList.toggle("light", next === "light");
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (name.trim().length < 2) {
        setError("Informe seu nome completo.");
        return;
      }
      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? {
            name: name.trim(),
            agencyName: agencyName.trim() || undefined,
            email: email.trim(),
            password,
          }
        : {
            email: email.trim(),
            password,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Não foi possível concluir a solicitação.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top-right theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-20 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-zinc-200 shadow-lg backdrop-blur transition hover:bg-zinc-800"
        title={theme === "dark" ? "Mudar para Modo Claro" : "Mudar para Modo Noturno"}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-500" />
        )}
        <span className="hidden sm:inline">
          {theme === "dark" ? "Modo Claro" : "Modo Noturno"}
        </span>
      </button>

      {/* Left Column: Brand & Highlights (Desktop) */}
      <div
        data-preserve-theme="true"
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-zinc-800/80 bg-gradient-to-br from-zinc-950 via-indigo-950/60 to-violet-950/40 p-12 lg:flex"
      >
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <AuraLogo size="lg" />
          <div>
            <p className="text-lg font-bold tracking-tight text-white">AuraStudio</p>
            <p className="text-xs text-zinc-400">Agência Multi-Cliente & Social IA</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" />
            Estúdio Visual + IA + Publicação Automática
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
            Crie, aprove e agende conteúdo para todas as marcas em um só lugar.
          </h1>

          <p className="text-sm leading-relaxed text-zinc-300">
            Centralize workspaces por cliente, gere layouts e legendas com Gemini 4 e publique
            automaticamente no Instagram, TikTok e Facebook.
          </p>

          <div className="grid grid-cols-1 gap-3 pt-2">
            {[
              {
                icon: Palette,
                title: "Estúdio de Layout 1080px",
                desc: "Templates prontos, padrões geométricos, arraste livre e exportação PNG.",
              },
              {
                icon: Sparkles,
                title: "Diretor de Arte IA",
                desc: "3 propostas completas de layout e legendas por rede a partir de um briefing.",
              },
              {
                icon: CalendarDays,
                title: "Calendário & Fila Automática",
                desc: "Agende Feed, Stories e Reels com publicação programada na nuvem.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative z-10 text-xs text-zinc-500">
          AuraStudio • Plataforma de Gestão de Social Media
        </p>
      </div>

      {/* Right Column: Auth Card */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-2.5 lg:hidden">
            <AuraLogo size="md" />
            <div>
              <p className="text-base font-bold tracking-tight text-white">AuraStudio</p>
              <p className="text-[11px] text-zinc-400">Agência & Social IA</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-1">
            <Link
              href="/login"
              className={`rounded-xl py-2.5 text-center text-xs font-semibold transition ${
                !isRegister
                  ? "bg-indigo-600 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className={`rounded-xl py-2.5 text-center text-xs font-semibold transition ${
                isRegister
                  ? "bg-indigo-600 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Criar Conta
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 shadow-2xl sm:p-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {isRegister ? "Crie sua conta" : "Bem-vindo de volta"}
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                {isRegister
                  ? "Cadastre-se para gerenciar clientes, layouts e agendamentos."
                  : "Acesse sua conta para gerenciar suas marcas e publicações."}
              </p>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Nome completo
                    </label>
                    <div className="relative mt-1.5">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        id="auth-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Ana Paula Silva"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pr-3 pl-10 text-sm text-white outline-none transition focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-agency"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Agência ou empresa{" "}
                      <span className="text-zinc-500">(opcional)</span>
                    </label>
                    <div className="relative mt-1.5">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        id="auth-agency"
                        type="text"
                        autoComplete="organization"
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        placeholder="Ex: Agência Criativa Digital"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pr-3 pl-10 text-sm text-white outline-none transition focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-zinc-300"
                >
                  E-mail
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@agencia.com.br"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pr-3 pl-10 text-sm text-white outline-none transition focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-zinc-300"
                >
                  Senha
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={isRegister ? 6 : 1}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRegister ? "Mínimo 6 caracteres" : "Sua senha"}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pr-10 pl-10 text-sm text-white outline-none transition focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-500 hover:text-zinc-200"
                    tabIndex={-1}
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div>
                  <label
                    htmlFor="auth-confirm-password"
                    className="block text-xs font-medium text-zinc-300"
                  >
                    Confirmar senha
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pr-3 pl-10 text-sm text-white outline-none transition focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-50"
              >
                <span>
                  {loading
                    ? isRegister
                      ? "Criando conta..."
                      : "Entrando..."
                    : isRegister
                      ? "Criar conta e acessar"
                      : "Entrar no AuraStudio"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-800/80 pt-5 text-center text-xs text-zinc-400">
              {isRegister ? (
                <>
                  Já tem uma conta?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Fazer login
                  </Link>
                </>
              ) : (
                <>
                  Ainda não tem conta?{" "}
                  <Link
                    href="/cadastro"
                    className="font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Cadastre-se gratuitamente
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
