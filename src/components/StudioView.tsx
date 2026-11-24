"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Calendar,
  Download,
  ExternalLink,
  Facebook,
  Image as ImageIcon,
  Instagram,
  Layers,
  Link2,
  Music2,
  Palette,
  Plus,
  Save,
  Send,
  Shuffle,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Wand2,
} from "lucide-react";
import { CanvasPreview, type CanvasPreviewHandle } from "@/components/CanvasPreview";
import { SocialMockupFrame } from "@/components/SocialMockupFrame";
import type {
  AspectRatio,
  BackgroundPatternId,
  ClientWorkspace,
  LayoutConfig,
  LayoutTemplateId,
  Placement,
  Platform,
  ScheduledPost,
} from "@/types";

interface ScheduleSlot {
  id: string;
  scheduledLocal: string;
  platforms: Platform[];
  placement: Placement;
}

interface StudioViewProps {
  client: ClientWorkspace;
  editingPost: ScheduledPost | null;
  initialLayout?: LayoutConfig;
  initialCaption?: string;
  initialHashtags?: string[];
  initialPlacement?: Placement;
  initialPlatforms?: Platform[];
  initialTitle?: string;
  initialScheduledAt?: string;
  onSavePost: (
    payloads: Array<Omit<ScheduledPost, "id" | "createdAt" | "updatedAt" | "publishLogs">>,
    existingId?: string,
    publishImmediately?: boolean
  ) => Promise<void>;
  onOpenAiLab: () => void;
}

const TEMPLATES: Array<{ id: LayoutTemplateId; label: string }> = [
  { id: "editorial-bold", label: "Editorial Bold" },
  { id: "minimal-clean", label: "Minimalista" },
  { id: "split-card", label: "Cartão Dividido" },
  { id: "gradient-story", label: "Story Gradiente" },
  { id: "promo-offer", label: "Oferta / Promo" },
  { id: "quote-insight", label: "Citação / Autoridade" },
];

const BACKGROUND_PATTERNS: Array<{ id: BackgroundPatternId; label: string }> = [
  { id: "mesh-aurora", label: "Aurora Mesh" },
  { id: "diagonal-split", label: "Corte Diagonal" },
  { id: "concentric-rings", label: "Anéis Concêntricos" },
  { id: "grid-tech", label: "Grade Moderna" },
  { id: "waves-organic", label: "Ondas Orgânicas" },
  { id: "bauhaus-geo", label: "Geometria Bauhaus" },
  { id: "dot-matrix", label: "Matriz de Pontos" },
  { id: "glass-cards", label: "Painéis Glass" },
  { id: "spotlight-beams", label: "Feixes de Luz" },
  { id: "clean-gradient", label: "Gradiente Limpo" },
];

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function defaultLayoutForClient(client: ClientWorkspace, placement: Placement): LayoutConfig {
  const aspectRatio: AspectRatio =
    placement === "story" || placement === "reels" ? "9:16" : "4:5";
  return {
    template: placement === "story" ? "gradient-story" : "editorial-bold",
    aspectRatio,
    backgroundColor: client.brandKit.primaryColor,
    gradientEndColor: client.brandKit.secondaryColor,
    useGradient: true,
    overlayOpacity: 0.35,
    badgeText: "NOVIDADE",
    headline: `Destaque especial ${client.name}`,
    subheadline: "Edite o texto, cores, imagem de fundo ou gere ideias com IA.",
    ctaText: placement === "story" ? "TOQUE NO LINK" : "SAIBA MAIS",
    ctaUrl: client.brandKit.defaultExternalUrl || "",
    handleText: client.brandKit.handle,
    accentColor: client.brandKit.accentColor,
    textColor: client.brandKit.textColor,
    align: "left",
    headlineSize: 62,
    fontFamily: client.brandKit.fontFamily,
  };
}

export function StudioView({
  client,
  editingPost,
  initialLayout,
  initialCaption,
  initialHashtags,
  initialPlacement,
  initialPlatforms,
  initialTitle,
  initialScheduledAt,
  onSavePost,
  onOpenAiLab,
}: StudioViewProps) {
  const canvasRef = useRef<CanvasPreviewHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(
    editingPost?.title || initialTitle || `Post ${client.name}`
  );
  const [placement, setPlacement] = useState<Placement>(
    editingPost?.placement || initialPlacement || "feed"
  );
  const [platforms, setPlatforms] = useState<Platform[]>(
    editingPost?.platforms || initialPlatforms || ["instagram", "facebook"]
  );
  const [caption, setCaption] = useState(
    editingPost?.caption || initialCaption || ""
  );
  const [hashtagsText, setHashtagsText] = useState(
    (editingPost?.hashtags || initialHashtags || []).join(" ")
  );
  const [firstComment, setFirstComment] = useState(editingPost?.firstComment || "");
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(() => {
    const base =
      editingPost?.scheduledAt ||
      initialScheduledAt ||
      new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    return [
      {
        id: "slot_1",
        scheduledLocal: toDatetimeLocalValue(base),
        platforms: editingPost?.platforms || initialPlatforms || ["instagram", "facebook"],
        placement: editingPost?.placement || initialPlacement || "feed",
      },
    ];
  });

  const [layout, setLayout] = useState<LayoutConfig>(
    editingPost?.layoutConfig ||
      initialLayout ||
      defaultLayoutForClient(client, editingPost?.placement || initialPlacement || "feed")
  );

  const [editorTab, setEditorTab] = useState<"design" | "content" | "schedule">("design");
  const [previewPlatform, setPreviewPlatform] = useState<Platform>("instagram");
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);

  const handleQuickAiCaption = async () => {
    setGeneratingCaption(true);
    try {
      const topic = layout.headline || title || `Novidade ${client.name}`;
      const res = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          topic,
          goal: "Engajamento e cliques no link",
          placement,
          platforms,
        }),
      });
      const data = (await res.json()) as {
        ideas?: Array<{
          captionInstagram: string;
          captionTikTok: string;
          captionFacebook: string;
          hashtags: string[];
        }>;
      };
      const first = data.ideas?.[0];
      if (first) {
        const picked =
          previewPlatform === "tiktok"
            ? first.captionTikTok
            : previewPlatform === "facebook"
              ? first.captionFacebook
              : first.captionInstagram;
        setCaption(picked);
        if (first.hashtags?.length) {
          setHashtagsText(first.hashtags.join(" "));
        }
      }
    } finally {
      setGeneratingCaption(false);
    }
  };

  const selectPreviewPreset = (nextPlatform: Platform, nextPlacement: Placement) => {
    setPreviewPlatform(nextPlatform);
    handlePlacementChange(nextPlacement);
  };

  // Sync when user selects a different post or applies an AI layout
  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setPlacement(editingPost.placement);
      setPlatforms(editingPost.platforms);
      setCaption(editingPost.caption);
      setHashtagsText(editingPost.hashtags.join(" "));
      setFirstComment(editingPost.firstComment || "");
      setScheduleSlots([
        {
          id: "slot_1",
          scheduledLocal: toDatetimeLocalValue(editingPost.scheduledAt),
          platforms: editingPost.platforms,
          placement: editingPost.placement,
        },
      ]);
      if (editingPost.layoutConfig) setLayout(editingPost.layoutConfig);
    } else if (initialLayout || initialScheduledAt) {
      if (initialLayout) setLayout(initialLayout);
      if (initialTitle) setTitle(initialTitle);
      if (initialCaption !== undefined) setCaption(initialCaption);
      if (initialHashtags) setHashtagsText(initialHashtags.join(" "));
      if (initialPlacement) setPlacement(initialPlacement);
      if (initialPlatforms) setPlatforms(initialPlatforms);
      if (initialScheduledAt) {
        setScheduleSlots([
          {
            id: "slot_1",
            scheduledLocal: toDatetimeLocalValue(initialScheduledAt),
            platforms: initialPlatforms || ["instagram", "facebook"],
            placement: initialPlacement || "feed",
          },
        ]);
      }
    }
  }, [
    editingPost,
    initialLayout,
    initialTitle,
    initialCaption,
    initialHashtags,
    initialPlacement,
    initialPlatforms,
    initialScheduledAt,
  ]);

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => {
      const next = prev.includes(p)
        ? prev.length > 1
          ? prev.filter((x) => x !== p)
          : prev
        : [...prev, p];
      setScheduleSlots((slots) =>
        slots.map((s, idx) => (idx === 0 ? { ...s, platforms: next } : s))
      );
      return next;
    });
  };

  const handlePlacementChange = (next: Placement) => {
    setPlacement(next);
    setScheduleSlots((slots) =>
      slots.map((s, idx) => (idx === 0 ? { ...s, placement: next } : s))
    );
    setLayout((prev) => ({
      ...prev,
      aspectRatio:
        next === "story" || next === "reels"
          ? "9:16"
          : prev.aspectRatio === "9:16"
            ? "4:5"
            : prev.aspectRatio,
    }));
  };

  const addSlotSameDay = (hour?: number, minute?: number, customPlacement?: Placement) => {
    const baseSlot = scheduleSlots[scheduleSlots.length - 1];
    const baseDate = baseSlot ? new Date(baseSlot.scheduledLocal) : new Date();
    const nextDate = new Date(baseDate.getTime());
    if (hour !== undefined) {
      nextDate.setHours(hour, minute ?? 0, 0, 0);
    } else {
      nextDate.setHours(Math.min(23, baseDate.getHours() + 3));
    }
    setScheduleSlots((prev) => [
      ...prev,
      {
        id: `slot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        scheduledLocal: toDatetimeLocalValue(nextDate.toISOString()),
        platforms: [...platforms],
        placement: customPlacement || placement,
      },
    ]);
  };

  const updateSlot = (id: string, patch: Partial<ScheduleSlot>) => {
    setScheduleSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const toggleSlotPlatform = (id: string, p: Platform) => {
    setScheduleSlots((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = s.platforms.includes(p)
          ? s.platforms.length > 1
            ? s.platforms.filter((x) => x !== p)
            : s.platforms
          : [...s.platforms, p];
        return { ...s, platforms: next };
      })
    );
  };

  const removeSlot = (id: string) => {
    setScheduleSlots((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  };

  const applyBrandKit = () => {
    setLayout((prev) => ({
      ...prev,
      backgroundColor: client.brandKit.primaryColor,
      gradientEndColor: client.brandKit.secondaryColor,
      accentColor: client.brandKit.accentColor,
      textColor: client.brandKit.textColor,
      fontFamily: client.brandKit.fontFamily,
      handleText: client.brandKit.handle,
    }));
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        setLayout((prev) => ({ ...prev, backgroundImageUrl: data.url }));
      }
    } finally {
      setUploadingBg(false);
      e.target.value = "";
    }
  };

  const handleDownloadPng = () => {
    const dataUrl = canvasRef.current?.exportPngDataUrl();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "post"}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleSubmit = async (status: "draft" | "scheduled", publishImmediately = false) => {
    setSaving(true);
    try {
      let mediaUrl = editingPost?.mediaUrl;
      const pngDataUrl = canvasRef.current?.exportPngDataUrl();
      if (pngDataUrl) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl: pngDataUrl,
            filename: `${client.id}-${Date.now()}.png`,
          }),
        });
        if (uploadRes.ok) {
          const uploaded = (await uploadRes.json()) as { url?: string };
          if (uploaded.url) mediaUrl = uploaded.url;
        }
      }

      const hashtags = hashtagsText
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : `#${t}`));

      const baseTitle = title.trim() || "Post sem título";
      const payloads = scheduleSlots.map((slot, idx) => ({
        clientId: client.id,
        title:
          scheduleSlots.length > 1
            ? `${baseTitle} (${idx + 1}/${scheduleSlots.length})`
            : baseTitle,
        platforms: slot.platforms,
        placement: slot.placement,
        caption,
        hashtags,
        firstComment: firstComment.trim() || undefined,
        externalUrl: layout.ctaUrl?.trim() || undefined,
        mediaUrl,
        mediaType: "image" as const,
        layoutConfig: layout,
        scheduledAt: new Date(slot.scheduledLocal).toISOString(),
        status,
      }));

      await onSavePost(payloads, editingPost?.id, publishImmediately);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Left Column: Editor Controls */}
      <div className="space-y-4 xl:col-span-7">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título interno da postagem..."
              className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-zinc-500"
            />
            <p className="text-xs text-zinc-400">
              {editingPost ? "Editando postagem existente" : "Nova postagem"} • {client.name}
            </p>
          </div>
          <button
            onClick={onOpenAiLab}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/25"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Gerar Layout com IA
          </button>
        </div>

        {/* Format & Destination Selector */}
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Redes de Destino
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  { id: "instagram", label: "Instagram", icon: Instagram, color: "pink" },
                  { id: "tiktok", label: "TikTok", icon: Music2, color: "cyan" },
                  { id: "facebook", label: "Facebook", icon: Facebook, color: "blue" },
                ] as const
              ).map((item) => {
                const active = platforms.includes(item.id);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => togglePlatform(item.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-indigo-500 bg-indigo-500/20 text-white"
                        : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Posicionamento
            </label>
            <div className="mt-2 flex gap-2">
              {(
                [
                  { id: "feed", label: "Feed" },
                  { id: "story", label: "Stories" },
                  { id: "reels", label: "Reels / TikTok" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePlacementChange(item.id)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    placement === item.id
                      ? "border-indigo-500 bg-indigo-500/20 text-white"
                      : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Guided 3-Step Tabs: 1. Arte | 2. Legenda | 3. Agendamento */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <div className="flex border-b border-zinc-800 bg-zinc-950/50">
            {[
              { id: "design", step: "1", label: "Arte & Link", icon: Palette },
              { id: "content", step: "2", label: "Legenda & Tags", icon: Type },
              { id: "schedule", step: "3", label: "Horários & Redes", icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = editorTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditorTab(tab.id as "design" | "content" | "schedule")}
                  className={`flex flex-1 items-center justify-center gap-2 px-3 py-3 text-xs font-semibold transition ${
                    active
                      ? "border-b-2 border-indigo-500 bg-zinc-900 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      active ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {tab.step}
                  </span>
                  <Icon className="hidden h-3.5 w-3.5 sm:inline" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {editorTab === "design" && (
              <div className="space-y-5">
                {/* Templates & Aspect Ratio */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Modelo de Layout</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setLayout((prev) => ({ ...prev, template: tpl.id }))}
                          className={`rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition ${
                            layout.template === tpl.id
                              ? "border-indigo-500 bg-indigo-500/20 text-white"
                              : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-400">Proporção da Arte</label>
                      <div className="mt-2 flex gap-2">
                        {(["1:1", "4:5", "9:16"] as AspectRatio[]).map((ratio) => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => setLayout((prev) => ({ ...prev, aspectRatio: ratio }))}
                            className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                              layout.aspectRatio === ratio
                                ? "border-indigo-500 bg-indigo-500/20 text-white"
                                : "border-zinc-800 bg-zinc-950/60 text-zinc-400"
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-zinc-400">
                        Foto de Fundo (Opcional)
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBackgroundUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingBg}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {uploadingBg ? "Enviando..." : "Subir imagem"}
                        </button>
                        {layout.backgroundImageUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setLayout((prev) => ({ ...prev, backgroundImageUrl: undefined }))
                            }
                            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                      {layout.backgroundImageUrl && (
                        <div className="mt-2">
                          <label className="text-[11px] text-zinc-400">
                            Escurecimento sobre a foto ({Math.round(layout.overlayOpacity * 100)}%)
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={85}
                            value={Math.round(layout.overlayOpacity * 100)}
                            onChange={(e) =>
                              setLayout((p) => ({
                                ...p,
                                overlayOpacity: Number(e.target.value) / 100,
                              }))
                            }
                            className="mt-1 w-full accent-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Background Geometry & Pattern */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-zinc-300">
                      Design & Geometria de Fundo
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomPattern =
                          BACKGROUND_PATTERNS[
                            Math.floor(Math.random() * BACKGROUND_PATTERNS.length)
                          ].id;
                        const randomTpl =
                          TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)].id;
                        setLayout((prev) => ({
                          ...prev,
                          backgroundPattern: randomPattern,
                          template: randomTpl,
                        }));
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/15 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25"
                    >
                      <Shuffle className="h-3 w-3" />
                      Sortear Geometria
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                    {BACKGROUND_PATTERNS.map((pat) => {
                      const active = (layout.backgroundPattern || "mesh-aurora") === pat.id;
                      return (
                        <button
                          key={pat.id}
                          type="button"
                          onClick={() =>
                            setLayout((prev) => ({ ...prev, backgroundPattern: pat.id }))
                          }
                          className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition ${
                            active
                              ? "border-indigo-500 bg-indigo-500/20 text-white"
                              : "border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          {pat.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-400 whitespace-nowrap">
                      Intensidade ({Math.round((layout.patternIntensity ?? 0.65) * 100)}%)
                    </span>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={Math.round((layout.patternIntensity ?? 0.65) * 100)}
                      onChange={(e) =>
                        setLayout((p) => ({
                          ...p,
                          patternIntensity: Number(e.target.value) / 100,
                        }))
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Text Fields */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Selo / Tag Superior</label>
                    <input
                      type="text"
                      value={layout.badgeText}
                      onChange={(e) => setLayout((p) => ({ ...p, badgeText: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Botão CTA</label>
                    <input
                      type="text"
                      value={layout.ctaText}
                      onChange={(e) => setLayout((p) => ({ ...p, ctaText: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* External Link for CTA Button */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                      <Link2 className="h-3.5 w-3.5 text-indigo-400" />
                      Link Externo do Botão (Loja Online / Site / WhatsApp)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {client.brandKit.defaultExternalUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setLayout((p) => ({
                              ...p,
                              ctaUrl: client.brandKit.defaultExternalUrl,
                            }))
                          }
                          className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-indigo-300 hover:bg-zinc-700"
                        >
                          Usar link padrão da marca
                        </button>
                      )}
                      {layout.ctaUrl?.trim() && (
                        <a
                          href={
                            /^https?:\/\//i.test(layout.ctaUrl.trim())
                              ? layout.ctaUrl.trim()
                              : `https://${layout.ctaUrl.trim()}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 hover:bg-indigo-500/25"
                        >
                          Testar link
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <input
                    type="url"
                    value={layout.ctaUrl || ""}
                    onChange={(e) => setLayout((p) => ({ ...p, ctaUrl: e.target.value }))}
                    placeholder="https://sualoja.com.br/produto-em-destaque"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-indigo-300 outline-none focus:border-indigo-500 placeholder:text-zinc-500"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Ao clicar no botão <strong className="text-zinc-300">{layout.ctaText || "CTA"}</strong> na pré-visualização, o navegador abrirá este link diretamente.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400">Título Principal (Headline)</label>
                  <input
                    type="text"
                    value={layout.headline}
                    onChange={(e) => setLayout((p) => ({ ...p, headline: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400">Subtítulo / Apoio</label>
                  <textarea
                    rows={2}
                    value={layout.subheadline}
                    onChange={(e) => setLayout((p) => ({ ...p, subheadline: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Colors & Typography */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-medium text-zinc-400">Cores & Tipografia</span>
                  <button
                    type="button"
                    onClick={applyBrandKit}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-zinc-700"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Aplicar Paleta da Marca
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { key: "backgroundColor", label: "Fundo 1" },
                    { key: "gradientEndColor", label: "Fundo 2" },
                    { key: "accentColor", label: "Destaque" },
                    { key: "textColor", label: "Texto" },
                  ].map((c) => (
                    <label
                      key={c.key}
                      className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs text-zinc-300"
                    >
                      <input
                        type="color"
                        value={layout[c.key as keyof LayoutConfig] as string}
                        onChange={(e) =>
                          setLayout((p) => ({ ...p, [c.key]: e.target.value }))
                        }
                        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Alinhamento</label>
                    <div className="mt-1.5 flex gap-1.5">
                      {(
                        [
                          { id: "left", icon: AlignLeft },
                          { id: "center", icon: AlignCenter },
                          { id: "right", icon: AlignRight },
                        ] as const
                      ).map((a) => {
                        const Icon = a.icon;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setLayout((p) => ({ ...p, align: a.id }))}
                            className={`flex flex-1 items-center justify-center rounded-lg border py-2 ${
                              layout.align === a.id
                                ? "border-indigo-500 bg-indigo-500/20 text-white"
                                : "border-zinc-800 bg-zinc-950 text-zinc-400"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-400">Fonte</label>
                    <select
                      value={layout.fontFamily}
                      onChange={(e) =>
                        setLayout((p) => ({
                          ...p,
                          fontFamily: e.target.value as LayoutConfig["fontFamily"],
                        }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="sans">Moderna (Sans)</option>
                      <option value="serif">Editorial (Serif)</option>
                      <option value="display">Geométrica (Display)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-400">
                      Tamanho Título ({layout.headlineSize}px)
                    </label>
                    <input
                      type="range"
                      min={40}
                      max={84}
                      value={layout.headlineSize}
                      onChange={(e) =>
                        setLayout((p) => ({ ...p, headlineSize: Number(e.target.value) }))
                      }
                      className="mt-3 w-full accent-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-zinc-800/80 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditorTab("content")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
                  >
                    Próximo: Legenda & Tags
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {editorTab === "content" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-2.5">
                  <span className="text-xs text-indigo-200">
                    Quer ajuda para escrever? Gere uma legenda pronta baseada no seu título.
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickAiCaption}
                    disabled={generatingCaption}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    {generatingCaption ? "Gerando..." : "Gerar Legenda com IA"}
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-400">
                      Legenda da Postagem
                    </label>
                    <span className="text-xs text-zinc-500">{caption.length} / 2200</span>
                  </div>
                  <textarea
                    rows={6}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Escreva uma legenda envolvente com gancho + chamada para ação..."
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="text-zinc-500 mr-1">Inserir CTA rápido:</span>
                    {[
                      "👇 Clique no link da bio para garantir o seu!",
                      "💬 Comente 'EU QUERO' que envio o link no direct!",
                      "📌 Salve este post para consultar depois!",
                    ].map((snippet) => (
                      <button
                        key={snippet}
                        type="button"
                        onClick={() =>
                          setCaption((prev) =>
                            prev.trim() ? `${prev.trim()}\n\n${snippet}` : snippet
                          )
                        }
                        className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-zinc-300 hover:border-indigo-500/40 hover:text-white"
                      >
                        + {snippet.slice(0, 26)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400">
                    Hashtags (separadas por espaço)
                  </label>
                  <input
                    type="text"
                    value={hashtagsText}
                    onChange={(e) => setHashtagsText(e.target.value)}
                    placeholder="#marketing #socialmedia #marca"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-indigo-300 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400">
                    Primeiro Comentário Automático (Instagram)
                  </label>
                  <input
                    type="text"
                    value={firstComment}
                    onChange={(e) => setFirstComment(e.target.value)}
                    placeholder="Ex: Comente 'EU QUERO' para receber o link no direct!"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end border-t border-zinc-800/80 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditorTab("schedule")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    Próximo: Escolher Horários
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {editorTab === "schedule" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-zinc-200">
                      Horários & Modalidades de Publicação ({scheduleSlots.length})
                    </label>
                    <p className="text-[11px] text-zinc-400">
                      Agende quantas postagens quiser no mesmo dia, em qualquer rede ou formato.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addSlotSameDay()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    + Outro horário no dia
                  </button>
                </div>

                {/* Quick same-day presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-zinc-500 mr-1">Atalhos no mesmo dia:</span>
                  <button
                    type="button"
                    onClick={() => addSlotSameDay(9, 0, "story")}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-zinc-300 hover:border-indigo-500/50 hover:text-white"
                  >
                    + 09:00 Stories
                  </button>
                  <button
                    type="button"
                    onClick={() => addSlotSameDay(12, 30, "feed")}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-zinc-300 hover:border-indigo-500/50 hover:text-white"
                  >
                    + 12:30 Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => addSlotSameDay(19, 0, "reels")}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-zinc-300 hover:border-indigo-500/50 hover:text-white"
                  >
                    + 19:00 Reels/TikTok
                  </button>
                </div>

                {/* Slots List */}
                <div className="space-y-3">
                  {scheduleSlots.map((slot, idx) => (
                    <div
                      key={slot.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-indigo-300">
                          Disparo #{idx + 1}
                        </span>
                        {scheduleSlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlot(slot.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remover
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-[11px] text-zinc-400">Data e Horário</label>
                          <input
                            type="datetime-local"
                            value={slot.scheduledLocal}
                            onChange={(e) =>
                              updateSlot(slot.id, { scheduledLocal: e.target.value })
                            }
                            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-zinc-400">Modalidade</label>
                          <div className="mt-1 flex gap-1.5">
                            {(
                              [
                                { id: "feed", label: "Feed" },
                                { id: "story", label: "Stories" },
                                { id: "reels", label: "Reels" },
                              ] as const
                            ).map((pl) => (
                              <button
                                key={pl.id}
                                type="button"
                                onClick={() => updateSlot(slot.id, { placement: pl.id })}
                                className={`flex-1 rounded-lg border py-2 text-[11px] font-semibold transition ${
                                  slot.placement === pl.id
                                    ? "border-indigo-500 bg-indigo-500/20 text-white"
                                    : "border-zinc-800 bg-zinc-900 text-zinc-400"
                                }`}
                              >
                                {pl.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-zinc-400 mr-1">Redes:</span>
                        {(
                          [
                            { id: "instagram", label: "Instagram", icon: Instagram },
                            { id: "tiktok", label: "TikTok", icon: Music2 },
                            { id: "facebook", label: "Facebook", icon: Facebook },
                          ] as const
                        ).map((net) => {
                          const Icon = net.icon;
                          const active = slot.platforms.includes(net.id);
                          return (
                            <button
                              key={net.id}
                              type="button"
                              onClick={() => toggleSlotPlatform(slot.id, net.id)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                                active
                                  ? "border-indigo-500 bg-indigo-500/20 text-white"
                                  : "border-zinc-800 bg-zinc-900 text-zinc-400"
                              }`}
                            >
                              <Icon className="h-3 w-3" />
                              {net.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-zinc-500">
                  Fuso horário padrão da Vercel Schedule: America/Sao_Paulo (Brasília). A arte em
                  alta resolução (PNG 1080px) é anexada automaticamente a todos os disparos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Submit Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            Baixar PNG
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit("draft", false)}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Salvar Rascunho
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit("scheduled", false)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 disabled:opacity-50"
          >
            <Calendar className="h-4 w-4" />
            {saving
              ? "Salvando..."
              : scheduleSlots.length > 1
                ? `Agendar ${scheduleSlots.length} Postagens`
                : "Agendar Postagem"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit("scheduled", true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Publicar Agora
          </button>
        </div>
      </div>

      {/* Right Column: Live High-Res Canvas & Platform Mockup */}
      <div className="space-y-4 xl:col-span-5">
        <div className="sticky top-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="mb-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Pré-visualização ao Vivo</h2>
              </div>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                {layout.aspectRatio}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-1 text-[11px]">
              {(
                [
                  { label: "IG Feed", platform: "instagram", placement: "feed" },
                  { label: "IG Stories", platform: "instagram", placement: "story" },
                  { label: "IG Reels", platform: "instagram", placement: "reels" },
                  { label: "TikTok", platform: "tiktok", placement: "reels" },
                  { label: "FB Feed", platform: "facebook", placement: "feed" },
                  { label: "FB Stories", platform: "facebook", placement: "story" },
                ] as const
              ).map((preset) => {
                const isActive =
                  previewPlatform === preset.platform &&
                  (preset.platform === "tiktok" ? true : placement === preset.placement);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => selectPreviewPreset(preset.platform, preset.placement)}
                    className={`flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 font-semibold transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Authentic Social Network Mockup Frame */}
          <SocialMockupFrame
            platform={previewPlatform}
            placement={placement}
            client={client}
            caption={caption}
            hashtagsText={hashtagsText}
          >
            <CanvasPreview
              ref={canvasRef}
              config={layout}
              interactive
              onChangePositions={(positions) =>
                setLayout((prev) => ({ ...prev, elementPositions: positions }))
              }
            />
          </SocialMockupFrame>

          <div className="mx-auto mt-3 flex max-w-[360px] items-center justify-between gap-2 px-1 text-[11px] text-zinc-400">
            <span>Arraste qualquer texto, selo ou botão direto na imagem</span>
            {layout.elementPositions &&
              Object.keys(layout.elementPositions).length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setLayout((prev) => ({ ...prev, elementPositions: undefined }))
                  }
                  className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 hover:bg-zinc-700"
                >
                  Resetar posições
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
