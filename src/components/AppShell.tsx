"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Moon,
  Palette,
  Plus,
  Settings2,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { AuraLogo } from "@/components/AuraLogo";
import { DashboardView } from "@/components/DashboardView";
import { StudioView } from "@/components/StudioView";
import { CalendarView } from "@/components/CalendarView";
import { AiLabView } from "@/components/AiLabView";
import { AccountsView } from "@/components/AccountsView";
import type {
  AiLayoutIdea,
  ClientWorkspace,
  LayoutConfig,
  Placement,
  Platform,
  PublicUser,
  ScheduledPost,
} from "@/types";

type NavTab = "dashboard" | "studio" | "ai" | "calendar" | "accounts";

interface AppShellProps {
  currentUser: PublicUser;
}

export function AppShell({ currentUser }: AppShellProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [clients, setClients] = useState<ClientWorkspace[]>([]);
  const [activeClientId, setActiveClientId] = useState<string>("");
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [loading, setLoading] = useState(true);

  // Studio prefill state
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [studioDraft, setStudioDraft] = useState<{
    layout?: LayoutConfig;
    caption?: string;
    hashtags?: string[];
    placement?: Placement;
    platforms?: Platform[];
    title?: string;
    scheduledAt?: string;
  }>({});

  // Action states
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [runningQueue, setRunningQueue] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
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

  // New client modal
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientNiche, setNewClientNiche] = useState("");
  const [newClientTone, setNewClientTone] = useState("Moderno, próximo e persuasivo");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/posts"),
      ]);
      const cData = (await cRes.json()) as { clients?: ClientWorkspace[] };
      const pData = (await pRes.json()) as { posts?: ScheduledPost[] };
      const fetchedClients = cData.clients || [];
      setClients(fetchedClients);
      setPosts(pData.posts || []);
      setActiveClientId((prev) =>
        prev && fetchedClients.some((c) => c.id === prev)
          ? prev
          : fetchedClients[0]?.id || ""
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get("oauth");
    if (!oauth) return;
    const msg = params.get("msg");
    setActiveTab("accounts");
    if (oauth === "instagram_connected") {
      showToast("Instagram conectado com sucesso via Login do Instagram!");
    } else if (oauth === "meta_connected") {
      showToast("Instagram e Facebook conectados com sucesso!");
    } else if (oauth === "tiktok_connected") {
      showToast("TikTok conectado com sucesso!");
    } else if (oauth === "error") {
      showToast(msg ? `Erro OAuth: ${msg}` : "Erro ao conectar conta social.");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [showToast]);

  const activeClient = clients.find((c) => c.id === activeClientId) || clients[0];
  const clientPosts = posts.filter((p) => p.clientId === activeClient?.id);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const colors = ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#06B6D4", "#8B5CF6"];
    const avatarColor = colors[clients.length % colors.length];
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newClientName.trim(),
        niche: newClientNiche.trim() || "Marca Digital",
        toneOfVoice: newClientTone.trim(),
        avatarColor,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { client: ClientWorkspace };
      setClients((prev) => [...prev, data.client]);
      setActiveClientId(data.client.id);
      setShowNewClient(false);
      setNewClientName("");
      setNewClientNiche("");
      showToast(`Cliente "${data.client.name}" criado com sucesso!`);
    }
  };

  const handleUpdateClient = async (
    id: string,
    patch: Partial<Omit<ClientWorkspace, "id" | "createdAt">>
  ): Promise<boolean> => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = (await res.json()) as { client: ClientWorkspace };
      setClients((prev) => prev.map((c) => (c.id === id ? data.client : c)));
      showToast("Configurações do cliente salvas!");
      return true;
    }
    showToast("Erro ao salvar configurações do cliente.");
    return false;
  };

  const handleSavePost = async (
    payloads: Array<Omit<ScheduledPost, "id" | "createdAt" | "updatedAt" | "publishLogs">>,
    existingId?: string,
    publishImmediately = false
  ) => {
    const savedPosts: ScheduledPost[] = [];

    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      const isEditingFirst = Boolean(existingId && i === 0);
      const url = isEditingFirst ? `/api/posts/${existingId}` : "/api/posts";
      const method = isEditingFirst ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        showToast("Erro ao salvar uma das postagens.");
        return;
      }

      const data = (await res.json()) as { post: ScheduledPost };
      savedPosts.push(data.post);
    }

    if (publishImmediately) {
      for (const saved of savedPosts) {
        await fetch("/api/posts/publish-due", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: saved.id }),
        });
      }
      showToast(
        savedPosts.length > 1
          ? `${savedPosts.length} postagens enviadas para publicação imediata!`
          : "Postagem enviada para publicação imediata!"
      );
    } else {
      const isDraft = payloads[0]?.status === "draft";
      showToast(
        isDraft
          ? "Rascunho salvo!"
          : savedPosts.length > 1
            ? `${savedPosts.length} postagens agendadas com sucesso!`
            : "Postagem agendada com sucesso!"
      );
    }

    setEditingPost(null);
    setStudioDraft({});
    await loadData();
    setActiveTab("dashboard");
  };

  const handlePublishNow = async (postId: string) => {
    setPublishingId(postId);
    try {
      const res = await fetch("/api/posts/publish-due", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        await loadData();
        showToast("Publicação executada! Confira o log na fila.");
      }
    } finally {
      setPublishingId(null);
    }
  };

  const handleRunDuePublisher = async () => {
    setRunningQueue(true);
    try {
      const res = await fetch("/api/posts/publish-due", { method: "POST" });
      const data = (await res.json()) as { processed?: number };
      await loadData();
      showToast(
        data.processed
          ? `${data.processed} postagem(ns) vencida(s) publicada(s)!`
          : "Nenhuma postagem vencida no momento."
      );
    } finally {
      setRunningQueue(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast("Postagem removida.");
    }
  };

  const handleApplyIdeaToStudio = (idea: AiLayoutIdea) => {
    setEditingPost(null);
    setStudioDraft({
      layout: idea.layout,
      title: idea.conceptName,
      caption: idea.captionInstagram,
      hashtags: idea.hashtags,
      placement: idea.recommendedPlacement,
      platforms: idea.recommendedPlatforms,
    });
    setActiveTab("studio");
    showToast(`Layout "${idea.conceptName}" aplicado no Estúdio!`);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading || !activeClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Carregando AuraStudio...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="hidden w-68 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950 p-4 lg:flex">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <AuraLogo size="md" />
          <div>
            <p className="text-sm font-bold tracking-tight text-white">AuraStudio</p>
            <p className="text-[11px] text-zinc-400">Agência & Social IA</p>
          </div>
        </div>

        {/* Quick New Post CTA */}
        <button
          onClick={() => {
            setEditingPost(null);
            setStudioDraft({});
            setActiveTab("studio");
          }}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Nova Postagem
        </button>

        {/* Client Switcher */}
        <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Clientes ({clients.length})
            </span>
            <button
              onClick={() => setShowNewClient(true)}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              title="Adicionar novo cliente"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2 space-y-1">
            {clients.map((c) => {
              const isSelected = c.id === activeClient.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveClientId(c.id);
                    setEditingPost(null);
                    setStudioDraft({});
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium transition ${
                    isSelected
                      ? "bg-indigo-600/20 text-white border border-indigo-500/40"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                    style={{ backgroundColor: c.avatarColor }}
                  >
                    {c.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-[10px] text-zinc-500">{c.brandKit.handle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 space-y-1">
          {(
            [
              { id: "dashboard", label: "Visão Geral & Fila", icon: LayoutDashboard },
              { id: "studio", label: "Estúdio de Layout", icon: Palette },
              { id: "ai", label: "IA de Ideias & Layouts", icon: Sparkles },
              { id: "calendar", label: "Calendário Editorial", icon: CalendarDays },
              { id: "accounts", label: "Redes Sociais & Marca", icon: Settings2 },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-zinc-800/90 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-indigo-400" : "text-zinc-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
          >
            <span className="inline-flex items-center gap-2">
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
              )}
              {theme === "dark" ? "Modo Claro" : "Modo Noturno"}
            </span>
            <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {theme === "dark" ? "Escuro" : "Claro"}
            </span>
          </button>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/25 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                {currentUser.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-zinc-100">
                  {currentUser.name}
                </p>
                <p className="truncate text-[10px] text-zinc-400">
                  {currentUser.agencyName || currentUser.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {loggingOut ? "Saindo..." : "Sair da conta"}
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 text-[11px] text-zinc-400">
            <p className="font-semibold text-zinc-200">Publicação Automática</p>
            <p className="mt-0.5">
              Instagram (Feed/Reels/Stories), TikTok e Facebook via Vercel Schedules.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Top Bar */}
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <AuraLogo size="sm" />
            <span className="font-bold text-white">AuraStudio</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-200"
              title={theme === "dark" ? "Mudar para Modo Claro" : "Mudar para Modo Noturno"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
              )}
            </button>
            <select
              value={activeClient.id}
              onChange={(e) => setActiveClientId(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-300 hover:border-rose-500/40 hover:text-rose-400"
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile Nav Pills */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-zinc-800 bg-zinc-950 px-4 py-2 lg:hidden">
          {(
            [
              { id: "dashboard", label: "Fila" },
              { id: "studio", label: "Estúdio" },
              { id: "ai", label: "IA" },
              { id: "calendar", label: "Calendário" },
              { id: "accounts", label: "Contas" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-900 text-zinc-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === "dashboard" && (
            <DashboardView
              client={activeClient}
              posts={clientPosts}
              onCreateNew={() => {
                setEditingPost(null);
                setStudioDraft({});
                setActiveTab("studio");
              }}
              onOpenAiLab={() => setActiveTab("ai")}
              onEditPost={(post) => {
                setEditingPost(post);
                setStudioDraft({});
                setActiveTab("studio");
              }}
              onDuplicatePost={(post) => {
                setEditingPost(null);
                setStudioDraft({
                  layout: post.layoutConfig,
                  title: `${post.title} (Cópia)`,
                  caption: post.caption,
                  hashtags: post.hashtags,
                  placement: post.placement,
                  platforms: post.platforms,
                });
                setActiveTab("studio");
                showToast("Postagem duplicada no Estúdio! Ajuste o horário e agende.");
              }}
              onPublishNow={handlePublishNow}
              onRunDuePublisher={handleRunDuePublisher}
              onDeletePost={handleDeletePost}
              publishingId={publishingId}
              runningQueue={runningQueue}
            />
          )}

          {activeTab === "studio" && (
            <StudioView
              client={activeClient}
              editingPost={editingPost}
              initialLayout={studioDraft.layout}
              initialCaption={studioDraft.caption}
              initialHashtags={studioDraft.hashtags}
              initialPlacement={studioDraft.placement}
              initialPlatforms={studioDraft.platforms}
              initialTitle={studioDraft.title}
              initialScheduledAt={studioDraft.scheduledAt}
              onSavePost={handleSavePost}
              onOpenAiLab={() => setActiveTab("ai")}
            />
          )}

          {activeTab === "ai" && (
            <AiLabView
              client={activeClient}
              onApplyIdeaToStudio={handleApplyIdeaToStudio}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarView
              posts={clientPosts}
              onEditPost={(post) => {
                setEditingPost(post);
                setStudioDraft({});
                setActiveTab("studio");
              }}
              onCreateForDate={(dateIso) => {
                setEditingPost(null);
                setStudioDraft({ scheduledAt: dateIso });
                setActiveTab("studio");
              }}
            />
          )}

          {activeTab === "accounts" && (
            <AccountsView
              client={activeClient}
              onUpdateClient={handleUpdateClient}
            />
          )}
        </main>
      </div>

      {/* New Client Modal */}
      {showNewClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateClient}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Novo Cliente / Marca</h2>
              <button
                type="button"
                onClick={() => setShowNewClient(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-400">Nome do Cliente</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ex: Clínica Bella Pele"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Nicho</label>
                <input
                  type="text"
                  value={newClientNiche}
                  onChange={(e) => setNewClientNiche(e.target.value)}
                  placeholder="Ex: Estética avançada e skincare"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Tom de Voz</label>
                <input
                  type="text"
                  value={newClientTone}
                  onChange={(e) => setNewClientTone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewClient(false)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Criar Cliente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-zinc-900 px-4 py-3 text-xs font-medium text-emerald-300 shadow-2xl">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
