"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Clock,
  Instagram,
  Facebook,
  Music2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { CanvasPreview } from "@/components/CanvasPreview";
import type { AiLayoutIdea, ClientWorkspace, Placement, Platform } from "@/types";

interface AiLabViewProps {
  client: ClientWorkspace;
  onApplyIdeaToStudio: (idea: AiLayoutIdea) => void;
}

export function AiLabView({ client, onApplyIdeaToStudio }: AiLabViewProps) {
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("Gerar desejo, engajamento e vendas");
  const [placement, setPlacement] = useState<Placement>("feed");
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram", "tiktok", "facebook"]);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<AiLayoutIdea[]>([]);
  const [metaInfo, setMetaInfo] = useState<{ provider: string; model: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          topic: topic.trim(),
          goal: goal.trim(),
          placement,
          platforms,
        }),
      });
      const data = (await res.json()) as {
        ideas?: AiLayoutIdea[];
        provider?: string;
        model?: string;
        error?: string;
      };
      if (!res.ok || !data.ideas) {
        throw new Error(data.error || "Não foi possível gerar ideias.");
      }
      setIdeas(data.ideas);
      setMetaInfo({
        provider: data.provider || "gemini",
        model: data.model || "gemini-4-hydrogen",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao consultar IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Briefing Form */}
      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-indigo-950/40 p-6"
      >
        <div className="flex items-center gap-2 text-indigo-400">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Diretor de Arte IA • Gemini 4
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-white">
          Gerador Inteligente de Layouts & Legendas
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Descreva o assunto da postagem para <strong className="text-zinc-200">{client.name}</strong>.
          A IA cria 3 propostas visuais prontas com paleta, tipografia, CTA e legendas adaptadas para
          Instagram, TikTok e Facebook.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-300">
              Sobre o que é a postagem?
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Promoção relâmpago de sexta-feira com 25% OFF em cafés gelados"
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950/90 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300">Objetivo principal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ex: Aumentar comentários, cliques no link ou reservas"
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950/90 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-zinc-800 bg-zinc-950 p-1 text-xs">
              {(["feed", "story", "reels"] as Placement[]).map((pl) => (
                <button
                  key={pl}
                  type="button"
                  onClick={() => setPlacement(pl)}
                  className={`rounded-lg px-3 py-1.5 font-semibold uppercase transition ${
                    placement === pl
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {pl}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              {(
                [
                  { id: "instagram", icon: Instagram, label: "IG" },
                  { id: "tiktok", icon: Music2, label: "TikTok" },
                  { id: "facebook", icon: Facebook, label: "FB" },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = platforms.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => togglePlatform(item.id)}
                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium ${
                      active
                        ? "border-indigo-500 bg-indigo-500/20 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            {loading ? "Criando 3 layouts..." : "Gerar 3 Ideias de Layout"}
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}
      </form>

      {metaInfo && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs text-zinc-400">
          <span>
            Motor utilizado: <strong className="text-zinc-200">{metaInfo.model}</strong>
          </span>
          <span>Clique em “Aplicar no Estúdio” para editar e agendar</span>
        </div>
      )}

      {/* Results Grid */}
      {ideas.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70"
            >
              <div className="bg-zinc-950/70 p-4">
                <div className="mx-auto max-w-[260px]">
                  <CanvasPreview config={idea.layout} />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-white">{idea.conceptName}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                    <Clock className="h-3 w-3 text-indigo-400" />
                    {idea.bestTimeToPost.split(" ")[0]}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {idea.rationale}
                </p>

                <div className="mt-4 space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs">
                  <p className="font-semibold text-pink-300">Instagram:</p>
                  <p className="line-clamp-3 text-zinc-300">{idea.captionInstagram}</p>
                  <p className="pt-1 font-semibold text-cyan-300">TikTok:</p>
                  <p className="line-clamp-2 text-zinc-300">{idea.captionTikTok}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {idea.hashtags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => onApplyIdeaToStudio(idea)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
                >
                  Aplicar no Estúdio
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
