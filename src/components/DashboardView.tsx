"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Play,
  Plus,
  Search,
  Send,
  Sparkles,
  AlertCircle,
  Instagram,
  Facebook,
  Music2,
  Trash2,
  Edit3,
} from "lucide-react";
import { CanvasPreview } from "@/components/CanvasPreview";
import type { ClientWorkspace, Platform, PostStatus, ScheduledPost } from "@/types";

interface DashboardViewProps {
  client: ClientWorkspace;
  posts: ScheduledPost[];
  onCreateNew: () => void;
  onOpenAiLab: () => void;
  onEditPost: (post: ScheduledPost) => void;
  onDuplicatePost: (post: ScheduledPost) => void;
  onPublishNow: (postId: string) => Promise<void>;
  onRunDuePublisher: () => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  publishingId: string | null;
  runningQueue: boolean;
}

function PlatformBadge({ platform }: { platform: Platform }) {
  if (platform === "instagram") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/15 px-2 py-0.5 text-xs font-medium text-pink-300 border border-pink-500/20">
        <Instagram className="h-3 w-3" /> IG
      </span>
    );
  }
  if (platform === "tiktok") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-medium text-cyan-300 border border-cyan-500/20">
        <Music2 className="h-3 w-3" /> TikTok
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-300 border border-blue-500/20">
      <Facebook className="h-3 w-3" /> FB
    </span>
  );
}

function StatusBadge({ status }: { status: ScheduledPost["status"] }) {
  const styles: Record<ScheduledPost["status"], string> = {
    scheduled: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    published: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    draft: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    publishing: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    failed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  const labels: Record<ScheduledPost["status"], string> = {
    scheduled: "Agendado",
    published: "Publicado",
    draft: "Rascunho",
    publishing: "Publicando...",
    failed: "Erro",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function DashboardView({
  client,
  posts,
  onCreateNew,
  onOpenAiLab,
  onEditPost,
  onDuplicatePost,
  onPublishNow,
  onRunDuePublisher,
  onDeletePost,
  publishingId,
  runningQueue,
}: DashboardViewProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | Platform>("all");
  const [query, setQuery] = useState("");

  const scheduled = posts.filter((p) => p.status === "scheduled");
  const published = posts.filter((p) => p.status === "published");
  const drafts = posts.filter((p) => p.status === "draft");
  const connectedCount = client.accounts.filter((a) => a.connected).length;

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (platformFilter !== "all" && !p.platforms.includes(platformFilter)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inCaption = p.caption.toLowerCase().includes(q);
        if (!inTitle && !inCaption) return false;
      }
      return true;
    });
  }, [posts, statusFilter, platformFilter, query]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-900 to-indigo-950/30 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-indigo-400">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: client.avatarColor }}
            />
            Workspace do Cliente
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            {client.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {client.niche} • Tom: {client.toneOfVoice}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRunDuePublisher}
            disabled={runningQueue}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <Play className="h-4 w-4 text-emerald-400" />
            {runningQueue ? "Processando fila..." : "Rodar Publicador Agora"}
          </button>
          <button
            onClick={onOpenAiLab}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-2.5 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/25"
          >
            <Sparkles className="h-4 w-4" />
            Gerar Ideias com IA
          </button>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Nova Postagem
          </button>
        </div>
      </div>

      {/* KPI Cards (Clickable quick filters) */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "scheduled" ? "all" : "scheduled")}
          className={`rounded-2xl border p-5 text-left transition ${
            statusFilter === "scheduled"
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-zinc-800/80 bg-zinc-900/70 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-sm font-medium">Agendados</span>
            <CalendarClock className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{scheduled.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Clique para filtrar</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "published" ? "all" : "published")}
          className={`rounded-2xl border p-5 text-left transition ${
            statusFilter === "published"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-zinc-800/80 bg-zinc-900/70 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-sm font-medium">Publicados</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{published.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Feed, Reels e Stories</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "draft" ? "all" : "draft")}
          className={`rounded-2xl border p-5 text-left transition ${
            statusFilter === "draft"
              ? "border-amber-500 bg-amber-500/10"
              : "border-zinc-800/80 bg-zinc-900/70 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-sm font-medium">Rascunhos</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{drafts.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Aguardando aprovação</p>
        </button>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-sm font-medium">Canais Conectados</span>
            <Send className="h-4 w-4 text-pink-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{connectedCount}/3</p>
          <p className="mt-1 text-xs text-zinc-500">Instagram, TikTok e Facebook</p>
        </div>
      </div>

      {/* Queue List + Search & Filters */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60">
        <div className="flex flex-col gap-3 border-b border-zinc-800 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Fila de Postagens ({filteredPosts.length})
            </h2>
            <p className="text-xs text-zinc-400">
              Clique na miniatura para editar, ou use Duplicar para reaproveitar uma arte.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar postagem..."
                className="w-44 rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Platform Filter */}
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 text-[11px]">
              {(
                [
                  { id: "all", label: "Todas" },
                  { id: "instagram", label: "IG" },
                  { id: "tiktok", label: "TikTok" },
                  { id: "facebook", label: "FB" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlatformFilter(item.id)}
                  className={`rounded-md px-2.5 py-1 font-medium transition ${
                    platformFilter === item.id
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {statusFilter !== "all" && (
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Sparkles className="h-10 w-10 text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-300">
              {posts.length === 0
                ? `Nenhuma postagem criada para ${client.name} ainda.`
                : "Nenhuma postagem encontrada com esse filtro."}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Use o Estúdio de Layout ou a IA Criativa para criar e agendar em segundos.
            </p>
            <button
              onClick={onCreateNew}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Criar nova postagem
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredPosts.map((post) => {
              const dt = new Date(post.scheduledAt);
              const formattedDate = dt.toLocaleString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={post.id}
                  className="flex flex-col gap-4 px-6 py-4 transition hover:bg-zinc-800/30 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-4">
                    {/* Real Post Thumbnail */}
                    {post.mediaUrl ? (
                      <button
                        type="button"
                        onClick={() => onEditPost(post)}
                        className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950 shadow-md transition hover:border-indigo-500"
                        title="Clique para abrir no Estúdio"
                      >
                        <img
                          src={post.mediaUrl}
                          alt={post.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      </button>
                    ) : post.layoutConfig ? (
                      <button
                        type="button"
                        onClick={() => onEditPost(post)}
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950 shadow-md transition hover:border-indigo-500"
                        title="Clique para abrir no Estúdio"
                      >
                        <CanvasPreview
                          config={post.layoutConfig}
                          className="h-full w-full !rounded-none !border-0 object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-900 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {post.placement === "story"
                          ? "9:16"
                          : post.placement === "reels"
                            ? "REEL"
                            : "FEED"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-zinc-100">{post.title}</h3>
                        <StatusBadge status={post.status} />
                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium uppercase text-zinc-300">
                          {post.placement}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-1 text-sm text-zinc-400">
                        {post.caption || "Sem legenda definida"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {post.platforms.map((p) => (
                          <PlatformBadge key={p} platform={p} />
                        ))}
                        <span className="ml-1 inline-flex items-center gap-1 text-xs text-zinc-400">
                          <Clock className="h-3.5 w-3.5" />
                          {formattedDate}
                        </span>
                        {post.externalUrl && (
                          <a
                            href={
                              /^https?:\/\//i.test(post.externalUrl)
                                ? post.externalUrl
                                : `https://${post.externalUrl}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-300 hover:bg-indigo-500/20"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Abrir link
                          </a>
                        )}
                      </div>

                      {post.publishLogs.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {post.publishLogs.map((log, i) => (
                            <p
                              key={i}
                              className={`flex items-center gap-1.5 text-xs ${
                                log.status === "published"
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {log.status === "published" ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              )}
                              <span>{log.message}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {post.status !== "published" && (
                      <button
                        onClick={() => onPublishNow(post.id)}
                        disabled={publishingId === post.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30 transition hover:bg-emerald-600/30 disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {publishingId === post.id ? "Publicando..." : "Publicar agora"}
                      </button>
                    )}
                    <button
                      onClick={() => onEditPost(post)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => onDuplicatePost(post)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800"
                      title="Duplicar postagem como novo rascunho no Estúdio"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicar
                    </button>
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 transition hover:border-rose-500/40 hover:text-rose-400"
                      title="Excluir postagem"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
