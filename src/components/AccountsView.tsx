"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Facebook,
  Instagram,
  KeyRound,
  Link2,
  Music2,
  Palette,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
  Unlink,
  X,
} from "lucide-react";
import type { ClientWorkspace, Platform, SocialAccount } from "@/types";

interface AccountsViewProps {
  client: ClientWorkspace;
  onUpdateClient: (
    id: string,
    patch: Partial<Omit<ClientWorkspace, "id" | "createdAt">>
  ) => Promise<boolean>;
}

type AdminTab = "instagram" | "meta" | "tiktok" | "gemini" | "advanced";

export function AccountsView({ client, onUpdateClient }: AccountsViewProps) {
  const [name, setName] = useState(client.name);
  const [niche, setNiche] = useState(client.niche);
  const [toneOfVoice, setToneOfVoice] = useState(client.toneOfVoice);
  const [targetAudience, setTargetAudience] = useState(client.targetAudience);
  const [brandKit, setBrandKit] = useState(client.brandKit);
  const [accounts, setAccounts] = useState<SocialAccount[]>(client.accounts);
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Platform Admin credentials state (configured once by the AuraStudio owner)
  const [credStatus, setCredStatus] = useState({
    hasInstagram: false,
    hasMeta: false,
    hasTikTok: false,
    hasGemini: false,
    instagramAppId: "",
    instagramConfigId: "",
    metaAppId: "",
    tiktokClientKey: "",
  });

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>("instagram");
  const [instagramAppIdInput, setInstagramAppIdInput] = useState("");
  const [instagramSecretInput, setInstagramSecretInput] = useState("");
  const [instagramConfigIdInput, setInstagramConfigIdInput] = useState("");
  const [metaAppIdInput, setMetaAppIdInput] = useState("");
  const [metaSecretInput, setMetaSecretInput] = useState("");
  const [tiktokKeyInput, setTiktokKeyInput] = useState("");
  const [tiktokSecretInput, setTiktokSecretInput] = useState("");
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [credMsg, setCredMsg] = useState<string | null>(null);
  const [copiedUri, setCopiedUri] = useState(false);

  // Advanced manual test state (inside Admin modal)
  const [testingIdx, setTestingIdx] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { ok: boolean; message: string }>
  >({});

  useEffect(() => {
    fetch("/api/settings/credentials")
      .then((r) => r.json())
      .then(
        (d: {
          hasInstagram?: boolean;
          hasMeta?: boolean;
          hasTikTok?: boolean;
          hasGemini?: boolean;
          instagramAppId?: string;
          instagramConfigId?: string;
          metaAppId?: string;
          tiktokClientKey?: string;
        }) => {
          setCredStatus({
            hasInstagram: Boolean(d.hasInstagram),
            hasMeta: Boolean(d.hasMeta),
            hasTikTok: Boolean(d.hasTikTok),
            hasGemini: Boolean(d.hasGemini),
            instagramAppId: d.instagramAppId || "",
            instagramConfigId: d.instagramConfigId || "",
            metaAppId: d.metaAppId || "",
            tiktokClientKey: d.tiktokClientKey || "",
          });
          setInstagramAppIdInput(d.instagramAppId || "");
          setInstagramConfigIdInput(d.instagramConfigId || "");
          setMetaAppIdInput(d.metaAppId || "");
          setTiktokKeyInput(d.tiktokClientKey || "");
        }
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSaveFeedback(null);
  }, [client.id]);

  useEffect(() => {
    setName(client.name);
    setNiche(client.niche);
    setToneOfVoice(client.toneOfVoice);
    setTargetAudience(client.targetAudience);
    setBrandKit(client.brandKit);
    setAccounts(client.accounts);
  }, [client]);

  const updateAccount = (index: number, patch: Partial<SocialAccount>) => {
    setAccounts((prev) =>
      prev.map((acc, i) => (i === index ? { ...acc, ...patch } : acc))
    );
  };

  const handleOneClickConnect = (platform: Platform) => {
    if (platform === "instagram") {
      if (credStatus.hasInstagram) {
        window.location.href = `/api/oauth/instagram/start?clientId=${encodeURIComponent(client.id)}`;
        return;
      }
      if (credStatus.hasMeta) {
        window.location.href = `/api/oauth/meta/start?clientId=${encodeURIComponent(client.id)}`;
        return;
      }
      setAdminTab("instagram");
      setCredMsg(null);
      setShowAdminModal(true);
      return;
    }

    if (platform === "facebook") {
      if (credStatus.hasMeta) {
        window.location.href = `/api/oauth/meta/start?clientId=${encodeURIComponent(client.id)}`;
        return;
      }
      setAdminTab("meta");
      setCredMsg(null);
      setShowAdminModal(true);
      return;
    }

    if (platform === "tiktok") {
      if (credStatus.hasTikTok) {
        window.location.href = `/api/oauth/tiktok/start?clientId=${encodeURIComponent(client.id)}`;
        return;
      }
      setAdminTab("tiktok");
      setCredMsg(null);
      setShowAdminModal(true);
    }
  };

  const handleDisconnect = async (index: number) => {
    const nextAccounts = accounts.map((acc, i) =>
      i === index
        ? {
            ...acc,
            connected: false,
            mode: "simulation" as const,
            accessToken: undefined,
            externalAccountId: undefined,
          }
        : acc
    );
    setAccounts(nextAccounts);
    const ok = await onUpdateClient(client.id, { accounts: nextAccounts });
    if (ok) {
      setSaveFeedback({
        type: "success",
        text: "Conta desconectada com sucesso.",
      });
    }
  };

  const handleToggleDemoConnect = async (index: number) => {
    const nextAccounts = accounts.map((acc, i) =>
      i === index
        ? {
            ...acc,
            connected: true,
            mode: "simulation" as const,
            lastSyncedAt: new Date().toISOString(),
          }
        : acc
    );
    setAccounts(nextAccounts);
    const ok = await onUpdateClient(client.id, { accounts: nextAccounts });
    if (ok) {
      setSaveFeedback({
        type: "success",
        text: "Conta ativada em modo demonstração para testes locais.",
      });
    }
  };

  const handleSaveCreds = async (connectAfter: boolean) => {
    setSavingCreds(true);
    setCredMsg(null);
    try {
      const payload =
        adminTab === "instagram"
          ? {
              instagramAppId: instagramAppIdInput,
              instagramAppSecret: instagramSecretInput,
              instagramConfigId: instagramConfigIdInput,
            }
          : adminTab === "meta"
            ? { metaAppId: metaAppIdInput, metaAppSecret: metaSecretInput }
            : adminTab === "tiktok"
              ? { tiktokClientKey: tiktokKeyInput, tiktokClientSecret: tiktokSecretInput }
              : { geminiApiKey: geminiKeyInput };

      const res = await fetch("/api/settings/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        hasInstagram?: boolean;
        hasMeta?: boolean;
        hasTikTok?: boolean;
        hasGemini?: boolean;
        instagramAppId?: string;
        instagramConfigId?: string;
        metaAppId?: string;
        tiktokClientKey?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Erro ao salvar chaves.");

      setCredStatus({
        hasInstagram: Boolean(data.hasInstagram),
        hasMeta: Boolean(data.hasMeta),
        hasTikTok: Boolean(data.hasTikTok),
        hasGemini: Boolean(data.hasGemini),
        instagramAppId: data.instagramAppId || "",
        instagramConfigId: data.instagramConfigId || "",
        metaAppId: data.metaAppId || "",
        tiktokClientKey: data.tiktokClientKey || "",
      });

      if (connectAfter && adminTab === "instagram" && data.hasInstagram) {
        window.location.href = `/api/oauth/instagram/start?clientId=${encodeURIComponent(client.id)}`;
        return;
      }
      if (connectAfter && adminTab === "meta" && data.hasMeta) {
        window.location.href = `/api/oauth/meta/start?clientId=${encodeURIComponent(client.id)}`;
        return;
      }
      if (connectAfter && adminTab === "tiktok" && data.hasTikTok) {
        window.location.href = `/api/oauth/tiktok/start?clientId=${encodeURIComponent(client.id)}`;
        return;
      }

      setCredMsg("Chaves salvas com sucesso! Agora todos os clientes podem conectar em 1 clique.");
    } catch (err) {
      setCredMsg(err instanceof Error ? err.message : "Erro ao salvar chaves.");
    } finally {
      setSavingCreds(false);
    }
  };

  const handleTestAccount = async (idx: number) => {
    const acc = accounts[idx];
    if (!acc) return;
    setTestingIdx(idx);
    try {
      const res = await fetch("/api/accounts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: acc.platform,
          externalAccountId: acc.externalAccountId,
          accessToken: acc.accessToken,
          mode: acc.mode,
          authProvider: acc.authProvider,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        externalAccountId?: string;
        username?: string;
        accountName?: string;
      };
      setTestResults((prev) => ({
        ...prev,
        [acc.id]: {
          ok: Boolean(data.ok),
          message: data.message || "Teste concluído.",
        },
      }));
      if (data.ok && (data.username || data.externalAccountId)) {
        updateAccount(idx, {
          username: data.username || acc.username,
          accountName: data.accountName || acc.accountName,
          externalAccountId: data.externalAccountId || acc.externalAccountId,
          lastSyncedAt: new Date().toISOString(),
        });
      }
    } finally {
      setTestingIdx(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveFeedback(null);
    try {
      const ok = await onUpdateClient(client.id, {
        name: name.trim() || client.name,
        niche: niche.trim(),
        toneOfVoice: toneOfVoice.trim(),
        targetAudience: targetAudience.trim(),
        brandKit: {
          ...brandKit,
          backgroundColor: brandKit.primaryColor,
        },
        accounts,
      });
      if (ok) {
        const hora = new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setSaveFeedback({
          type: "success",
          text: `Configurações de "${name.trim() || client.name}" salvas com sucesso às ${hora}.`,
        });
      } else {
        setSaveFeedback({
          type: "error",
          text: "Não foi possível salvar as configurações. Tente novamente.",
        });
      }
    } catch {
      setSaveFeedback({
        type: "error",
        text: "Erro de conexão ao salvar configurações.",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyRedirectUri = (path: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    navigator.clipboard?.writeText(`${origin}${path}`);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 1800);
  };

  const configuredIntegrationsCount = [
    credStatus.hasInstagram,
    credStatus.hasMeta,
    credStatus.hasTikTok,
    credStatus.hasGemini,
  ].filter(Boolean).length;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">
              Redes Sociais & Marca — {client.name}
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Conecte as redes sociais com 1 clique e personalize a identidade visual da marca.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCredMsg(null);
                setShowAdminModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700"
              title="Configuração única feita pelo dono da plataforma"
            >
              <Settings className="h-3.5 w-3.5 text-indigo-400" />
              <span>Admin ({configuredIntegrationsCount}/4)</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
                saveFeedback?.type === "success"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-indigo-600 hover:bg-indigo-500"
              }`}
            >
              {saveFeedback?.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving
                ? "Salvando..."
                : saveFeedback?.type === "success"
                  ? "Salvo!"
                  : "Salvar Alterações"}
            </button>
          </div>
        </div>

        {saveFeedback && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
              saveFeedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            {saveFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{saveFeedback.text}</span>
          </div>
        )}
      </div>

      {/* Simple 1-Click Client Social Connection Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-semibold text-white">Contas Conectadas</h2>
            <p className="text-xs text-zinc-400">
              Clique em conectar para autorizar diretamente na sua conta da rede social.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {accounts.map((acc, idx) => {
            const isIg = acc.platform === "instagram";
            const isTt = acc.platform === "tiktok";
            const Icon = isIg ? Instagram : isTt ? Music2 : Facebook;

            const title = isIg ? "Instagram" : isTt ? "TikTok" : "Facebook";
            const subtitle = isIg
              ? "Feed, Reels e Stories"
              : isTt
                ? "Vídeos e Fotos"
                : "Feed e Stories";

            const isLiveConnected = acc.connected && acc.mode === "live";
            const isDemoConnected = acc.connected && acc.mode === "simulation";
            const oauthReady = isIg
              ? credStatus.hasInstagram || credStatus.hasMeta
              : isTt
                ? credStatus.hasTikTok
                : credStatus.hasMeta;

            const brandGradient = isIg
              ? "from-amber-500 via-pink-600 to-purple-600"
              : isTt
                ? "from-cyan-500 to-rose-500"
                : "from-blue-600 to-indigo-600";

            return (
              <div
                key={acc.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        data-preserve-theme="true"
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${brandGradient} text-white shadow-lg`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{title}</h3>
                        <p className="text-xs text-zinc-400">{subtitle}</p>
                      </div>
                    </div>

                    {isLiveConnected ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Conectado
                      </span>
                    ) : isDemoConnected ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                        Modo Teste
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                        Desconectado
                      </span>
                    )}
                  </div>

                  {/* Connected account info */}
                  <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-3.5 py-2.5">
                    <p className="text-[11px] text-zinc-500">Perfil</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-zinc-100">
                      {acc.connected ? acc.username || acc.accountName : "Nenhuma conta conectada"}
                    </p>
                  </div>
                </div>

                {/* Single clean primary action */}
                <div className="mt-4 space-y-2">
                  {isLiveConnected ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOneClickConnect(acc.platform)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Trocar conta
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDisconnect(idx)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                        title="Desconectar conta"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                        Sair
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOneClickConnect(acc.platform)}
                        data-preserve-theme="true"
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${brandGradient} px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:opacity-95`}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        {oauthReady
                          ? `Conectar ${title}`
                          : `Conectar ${title}`}
                      </button>

                      {isDemoConnected ? (
                        <button
                          type="button"
                          onClick={() => handleDisconnect(idx)}
                          className="w-full rounded-lg py-1 text-[11px] font-medium text-zinc-500 transition hover:text-zinc-300"
                        >
                          Desativar modo teste
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleDemoConnect(idx)}
                          className="w-full rounded-lg py-1 text-[11px] font-medium text-zinc-500 transition hover:text-indigo-300"
                        >
                          Usar em modo teste (sem login)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand Kit & AI Identity (Full width clean card) */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <Palette className="h-4 w-4" />
            <h2 className="text-sm font-semibold text-white">
              Identidade da Marca (Brand Kit & IA)
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Usado automaticamente nas artes e legendas da IA
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-zinc-400">Nome da Marca / Cliente</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400">Perfil (@)</label>
            <input
              type="text"
              value={brandKit.handle}
              onChange={(e) => setBrandKit((b) => ({ ...b, handle: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400">
              Link Padrão (Site / Loja / WhatsApp)
            </label>
            <input
              type="text"
              value={brandKit.defaultExternalUrl || ""}
              onChange={(e) =>
                setBrandKit((b) => ({ ...b, defaultExternalUrl: e.target.value }))
              }
              placeholder="https://sualoja.com.br"
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-indigo-300 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-zinc-400">Nicho / Segmento</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400">Tom de Voz</label>
            <input
              type="text"
              value={toneOfVoice}
              onChange={(e) => setToneOfVoice(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400">Público-Alvo</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400">Paleta de Cores das Artes</label>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: "primaryColor", label: "Primária" },
              { key: "secondaryColor", label: "Secundária" },
              { key: "accentColor", label: "Destaque" },
              { key: "textColor", label: "Texto" },
            ].map((c) => (
              <label
                key={c.key}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-300 transition hover:border-zinc-700"
              >
                <input
                  type="color"
                  value={brandKit[c.key as keyof typeof brandKit] as string}
                  onChange={(e) =>
                    setBrandKit((b) => ({ ...b, [c.key]: e.target.value }))
                  }
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                />
                <span className="font-medium">{c.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Admin Settings Modal (One-time setup by the platform owner) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Configurações da Plataforma (Admin)
                </h3>
                <p className="text-xs text-zinc-400">
                  Configure uma única vez. Depois disso, todos os seus clientes conectam em 1 clique.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Admin Tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-950/60 px-4 py-2 text-xs">
              {(
                [
                  { id: "instagram", label: "Instagram", ok: credStatus.hasInstagram },
                  { id: "meta", label: "Facebook / Meta", ok: credStatus.hasMeta },
                  { id: "tiktok", label: "TikTok", ok: credStatus.hasTikTok },
                  { id: "gemini", label: "IA (Gemini)", ok: credStatus.hasGemini },
                  { id: "advanced", label: "Token Manual", ok: false },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setAdminTab(t.id);
                    setCredMsg(null);
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                    adminTab === t.id
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <span>{t.label}</span>
                  {t.ok && <CheckCircle2 className="h-3 w-3 text-emerald-300" />}
                </button>
              ))}
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
              {adminTab === "instagram" && (
                <div className="space-y-3 text-xs text-zinc-300">
                  <p>
                    Usa o <strong>Login Unificado do Instagram (Meta 2026)</strong> — seus clientes
                    escolhem logar com <strong>Instagram ou Facebook</strong>, sem precisar de
                    Página do Facebook, e o token nunca expira.
                  </p>
                  <div>
                    <label className="text-zinc-400">URI de Redirecionamento (cole em URL de redirecionamento)</label>
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-pink-300">
                      <span className="flex-1 truncate">
                        {typeof window !== "undefined"
                          ? `${window.location.origin}/api/oauth/instagram/callback`
                          : "http://localhost:3000/api/oauth/instagram/callback"}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyRedirectUri("/api/oauth/instagram/callback")}
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-sans font-semibold text-zinc-200 hover:bg-zinc-700"
                      >
                        {copiedUri ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedUri ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-zinc-400">
                        ID do App (Configurações do app → Básico)
                      </label>
                      <input
                        type="text"
                        value={instagramAppIdInput}
                        onChange={(e) => setInstagramAppIdInput(e.target.value)}
                        placeholder="Ex: 1826098581944005"
                        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400">
                        Chave Secreta do App (Básico → Mostrar)
                      </label>
                      <input
                        type="password"
                        value={instagramSecretInput}
                        onChange={(e) => setInstagramSecretInput(e.target.value)}
                        placeholder={credStatus.hasInstagram ? "•••••••• (já salva)" : "Cole a chave secreta"}
                        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-400">
                      ID da Configuração — config_id (gerado em “API setup with Unified login”)
                    </label>
                    <input
                      type="text"
                      value={instagramConfigIdInput}
                      onChange={(e) => setInstagramConfigIdInput(e.target.value)}
                      placeholder="Ex: 1234567890123456"
                      className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              )}

              {adminTab === "meta" && (
                <div className="space-y-3 text-xs text-zinc-300">
                  <p>
                    Para conectar <strong>Páginas do Facebook</strong> (e Instagram vinculado), crie
                    um app em{" "}
                    <a
                      href="https://developers.facebook.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-blue-400 underline"
                    >
                      developers.facebook.com
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    .
                  </p>
                  <div>
                    <label className="text-zinc-400">URI de Redirecionamento</label>
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-blue-300">
                      <span className="flex-1 truncate">
                        {typeof window !== "undefined"
                          ? `${window.location.origin}/api/oauth/meta/callback`
                          : "http://localhost:3000/api/oauth/meta/callback"}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyRedirectUri("/api/oauth/meta/callback")}
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-sans font-semibold text-zinc-200 hover:bg-zinc-700"
                      >
                        {copiedUri ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedUri ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-zinc-400">META_APP_ID</label>
                      <input
                        type="text"
                        value={metaAppIdInput}
                        onChange={(e) => setMetaAppIdInput(e.target.value)}
                        placeholder="Ex: 123456789012345"
                        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400">META_APP_SECRET</label>
                      <input
                        type="password"
                        value={metaSecretInput}
                        onChange={(e) => setMetaSecretInput(e.target.value)}
                        placeholder={credStatus.hasMeta ? "•••••••• (já salva)" : "Cole a chave secreta"}
                        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {adminTab === "tiktok" && (
                <div className="space-y-3 text-xs text-zinc-300">
                  <p>
                    Crie um app em{" "}
                    <a
                      href="https://developers.tiktok.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-cyan-400 underline"
                    >
                      developers.tiktok.com/apps
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    com <strong>Login Kit</strong> + <strong>Content Posting API</strong>.
                  </p>
                  <div>
                    <label className="text-zinc-400">URI de Redirecionamento</label>
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-cyan-300">
                      <span className="flex-1 truncate">
                        {typeof window !== "undefined"
                          ? `${window.location.origin}/api/oauth/tiktok/callback`
                          : "https://seu-dominio.vercel.app/api/oauth/tiktok/callback"}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyRedirectUri("/api/oauth/tiktok/callback")}
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-sans font-semibold text-zinc-200 hover:bg-zinc-700"
                      >
                        {copiedUri ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedUri ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-zinc-400">TIKTOK_CLIENT_KEY</label>
                      <input
                        type="text"
                        value={tiktokKeyInput}
                        onChange={(e) => setTiktokKeyInput(e.target.value)}
                        placeholder="Cole o Client Key"
                        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400">TIKTOK_CLIENT_SECRET</label>
                      <input
                        type="password"
                        value={tiktokSecretInput}
                        onChange={(e) => setTiktokSecretInput(e.target.value)}
                        placeholder={credStatus.hasTikTok ? "•••••••• (já salva)" : "Cole o Client Secret"}
                        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {adminTab === "gemini" && (
                <div className="space-y-3 text-xs text-zinc-300">
                  <p>
                    Pegue sua chave gratuita em{" "}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-amber-400 underline"
                    >
                      aistudio.google.com/apikey
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    para ativar o <strong>Gemini 4</strong> na geração de layouts e legendas.
                  </p>
                  <div>
                    <label className="text-zinc-400">GEMINI_API_KEY</label>
                    <input
                      type="password"
                      value={geminiKeyInput}
                      onChange={(e) => setGeminiKeyInput(e.target.value)}
                      placeholder={credStatus.hasGemini ? "•••••••• (já ativa)" : "AIza..."}
                      className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {adminTab === "advanced" && (
                <div className="space-y-3 text-xs">
                  <p className="text-zinc-400">
                    Para testes técnicos, você pode colar manualmente um Access Token para{" "}
                    <strong className="text-zinc-200">{client.name}</strong> e clicar em{" "}
                    <strong>Salvar Alterações</strong> na tela principal.
                  </p>
                  {accounts.map((acc, idx) => (
                    <div
                      key={acc.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold capitalize text-white">{acc.platform}</span>
                        <select
                          value={acc.mode}
                          onChange={(e) =>
                            updateAccount(idx, {
                              mode: e.target.value as SocialAccount["mode"],
                              connected: true,
                            })
                          }
                          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-white"
                        >
                          <option value="simulation">Modo Teste</option>
                          <option value="live">API Oficial</option>
                        </select>
                      </div>
                      {acc.mode === "live" && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            value={acc.externalAccountId || ""}
                            onChange={(e) =>
                              updateAccount(idx, { externalAccountId: e.target.value })
                            }
                            placeholder="ID da Conta"
                            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                          />
                          <input
                            type="password"
                            value={acc.accessToken || ""}
                            onChange={(e) => updateAccount(idx, { accessToken: e.target.value })}
                            placeholder="Access Token"
                            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleTestAccount(idx)}
                          disabled={testingIdx === idx}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700"
                        >
                          <KeyRound className="h-3 w-3" />
                          {testingIdx === idx ? "Testando..." : "Testar Token"}
                        </button>
                        {testResults[acc.id] && (
                          <span
                            className={`text-[11px] ${
                              testResults[acc.id].ok ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {testResults[acc.id].message}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {credMsg && (
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
                  {credMsg}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-800 bg-zinc-950/50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Fechar
              </button>
              {adminTab !== "advanced" && (
                <>
                  <button
                    type="button"
                    disabled={savingCreds}
                    onClick={() => handleSaveCreds(false)}
                    className="rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/25 disabled:opacity-50"
                  >
                    {savingCreds ? "Salvando..." : "Apenas Salvar"}
                  </button>
                  {adminTab !== "gemini" && (
                    <button
                      type="button"
                      disabled={savingCreds}
                      onClick={() => handleSaveCreds(true)}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {savingCreds ? "Salvando..." : "Salvar e Conectar Agora"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
