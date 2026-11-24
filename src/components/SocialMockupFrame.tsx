"use client";

import React from "react";
import {
  Bookmark,
  Camera,
  Globe,
  Heart,
  Home,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Plus,
  Search,
  Send,
  Share2,
  ThumbsUp,
  User,
  Users,
  X,
} from "lucide-react";
import type { ClientWorkspace, Placement, Platform } from "@/types";

interface SocialMockupFrameProps {
  platform: Platform;
  placement: Placement;
  client: ClientWorkspace;
  caption: string;
  hashtagsText: string;
  children: React.ReactNode;
}

export function SocialMockupFrame({
  platform,
  placement,
  client,
  caption,
  hashtagsText,
  children,
}: SocialMockupFrameProps) {
  const initial = client.name.slice(0, 1).toUpperCase();
  const handle = client.brandKit.handle || `@${client.name.toLowerCase().replace(/\s+/g, "")}`;
  const cleanCaption = caption.trim() || "Sua legenda aparecerá aqui na pré-visualização...";

  // 1. TIKTOK MOCKUP (Authentic vertical overlay UI)
  if (platform === "tiktok") {
    return (
      <div
        data-preserve-theme="true"
        className="mx-auto max-w-[360px] overflow-hidden rounded-[28px] border border-zinc-800 bg-black shadow-2xl"
      >
        <div className="relative">
          {children}

          {/* Top TikTok Tabs */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 via-black/30 to-transparent px-4 pt-3 pb-6">
            <span className="text-[11px] font-semibold text-white/60">LIVE</span>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-white/65">Seguindo</span>
              <span className="relative text-white">
                Para você
                <span className="absolute -bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white" />
              </span>
            </div>
            <Search className="h-4 w-4 text-white" />
          </div>

          {/* Right TikTok Action Rail */}
          <div className="pointer-events-none absolute right-2.5 bottom-16 flex flex-col items-center gap-3.5 text-white drop-shadow">
            <div className="relative">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-sm font-bold"
                style={{ backgroundColor: client.avatarColor }}
              >
                {initial}
              </div>
              <span className="absolute -bottom-1.5 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-rose-500 text-white">
                <Plus className="h-3 w-3" />
              </span>
            </div>

            <div className="flex flex-col items-center">
              <Heart className="h-6 w-6 fill-white/90 text-white" />
              <span className="mt-0.5 text-[10px] font-semibold">18,4K</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle className="h-6 w-6 fill-white/90 text-white" />
              <span className="mt-0.5 text-[10px] font-semibold">342</span>
            </div>
            <div className="flex flex-col items-center">
              <Bookmark className="h-6 w-6 fill-white/90 text-white" />
              <span className="mt-0.5 text-[10px] font-semibold">1,9K</span>
            </div>
            <div className="flex flex-col items-center">
              <Share2 className="h-6 w-6 text-white" />
              <span className="mt-0.5 text-[10px] font-semibold">890</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-4 border-zinc-800 bg-zinc-900">
              <Music2 className="h-3.5 w-3.5 text-cyan-300" />
            </div>
          </div>

          {/* Bottom-left TikTok Caption & Audio */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3.5 pt-8 pb-3 pr-14 text-white">
            <p className="text-xs font-bold">{handle}</p>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/90">
              {cleanCaption}
            </p>
            {hashtagsText && (
              <p className="mt-0.5 truncate text-[11px] font-semibold text-white">
                {hashtagsText}
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/85">
              <Music2 className="h-3 w-3 shrink-0" />
              <span className="truncate">Som original — {client.name}</span>
            </div>
          </div>
        </div>

        {/* Bottom TikTok Nav Bar */}
        <div className="flex items-center justify-around border-t border-zinc-800 bg-black px-2 py-2 text-[9px] text-zinc-400">
          <div className="flex flex-col items-center gap-0.5 text-white">
            <Home className="h-4 w-4" />
            <span>Início</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Users className="h-4 w-4" />
            <span>Amigos</span>
          </div>
          <div className="flex h-6 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 via-white to-rose-500 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-md bg-white text-black">
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <MessageCircle className="h-4 w-4" />
            <span>Caixa</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <User className="h-4 w-4" />
            <span>Perfil</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. FACEBOOK MOCKUP (Stories or Feed)
  if (platform === "facebook") {
    if (placement === "story") {
      return (
        <div
          data-preserve-theme="true"
          className="mx-auto max-w-[360px] overflow-hidden rounded-[26px] border border-zinc-800 bg-[#18191A] shadow-2xl"
        >
          <div className="relative">
            {children}

            {/* Top Progress + FB Story Header */}
            <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 via-black/30 to-transparent p-3 pb-6">
              <div className="mb-2.5 flex gap-1">
                <div className="h-0.5 flex-1 rounded-full bg-white" />
                <div className="h-0.5 flex-1 rounded-full bg-white/35" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1877F2] text-xs font-bold text-white"
                    style={{ backgroundColor: client.avatarColor }}
                  >
                    {initial}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{client.name}</p>
                    <p className="text-[10px] text-white/75">Agora · Público</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <MoreHorizontal className="h-4 w-4" />
                  <X className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Bottom FB Story Reply */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-3">
              <div className="flex-1 rounded-full border border-white/40 bg-black/35 px-3.5 py-2 text-[11px] text-white/80">
                Responder ao story...
              </div>
              <span className="text-base">👍</span>
              <span className="text-base">❤️</span>
              <span className="text-base">😮</span>
            </div>
          </div>
        </div>
      );
    }

    // Facebook Feed Card (Authentic #242526 dark card, caption ABOVE media)
    return (
      <div
        data-preserve-theme="true"
        className="mx-auto max-w-[360px] overflow-hidden rounded-2xl border border-[#3A3B3C] bg-[#242526] text-[#E4E6EB] shadow-2xl"
      >
        {/* FB Header */}
        <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: client.avatarColor }}
            >
              {initial}
            </div>
            <div>
              <p className="text-xs font-bold text-[#E4E6EB]">{client.name}</p>
              <p className="flex items-center gap-1 text-[10px] text-[#B0B3B8]">
                Agora · <Globe className="h-3 w-3" />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#B0B3B8]">
            <MoreHorizontal className="h-4 w-4" />
            <X className="h-4 w-4" />
          </div>
        </div>

        {/* FB Caption ABOVE image */}
        <div className="px-3.5 pb-2.5">
          <p className="line-clamp-3 text-xs leading-relaxed text-[#E4E6EB]">
            {cleanCaption}
          </p>
          {hashtagsText && (
            <p className="mt-1 truncate text-[11px] font-medium text-[#4599FF]">
              {hashtagsText}
            </p>
          )}
        </div>

        {/* Media */}
        <div className="bg-black">{children}</div>

        {/* FB Reactions & Counts */}
        <div className="flex items-center justify-between border-b border-[#3A3B3C] px-3.5 py-2 text-[11px] text-[#B0B3B8]">
          <div className="flex items-center gap-1">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#1877F2] text-[9px] text-white">
              👍
            </span>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] text-white -ml-1">
              ❤️
            </span>
            <span className="ml-1">248</span>
          </div>
          <span>34 comentários · 12 compartilhamentos</span>
        </div>

        {/* FB Action Bar */}
        <div className="grid grid-cols-3 px-2 py-1.5 text-[11px] font-semibold text-[#B0B3B8]">
          <div className="flex items-center justify-center gap-1.5 rounded-lg py-1.5">
            <ThumbsUp className="h-4 w-4" />
            <span>Curtir</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 rounded-lg py-1.5">
            <MessageCircle className="h-4 w-4" />
            <span>Comentar</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 rounded-lg py-1.5">
            <Share2 className="h-4 w-4" />
            <span>Enviar</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. INSTAGRAM MOCKUP (Stories, Reels, or Feed)
  if (placement === "story") {
    return (
      <div
        data-preserve-theme="true"
        className="mx-auto max-w-[360px] overflow-hidden rounded-[28px] border border-zinc-800 bg-black shadow-2xl"
      >
        <div className="relative">
          {children}

          {/* Top IG Story Progress & Header */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 via-black/30 to-transparent p-3 pb-6">
            <div className="mb-2.5 flex gap-1">
              <div className="h-0.5 flex-1 rounded-full bg-white" />
              <div className="h-0.5 flex-1 rounded-full bg-white/35" />
              <div className="h-0.5 flex-1 rounded-full bg-white/35" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-black text-xs font-bold text-white"
                    style={{ backgroundColor: client.avatarColor }}
                  >
                    {initial}
                  </div>
                </div>
                <span className="text-xs font-semibold text-white">{handle}</span>
                <span className="text-[11px] text-white/70">Agora</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <MoreHorizontal className="h-4 w-4" />
                <X className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Bottom IG Story Reply Bar */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-3 text-white">
            <div className="flex-1 rounded-full border border-white/45 bg-black/30 px-3.5 py-2 text-[11px] text-white/80">
              Enviar mensagem...
            </div>
            <Heart className="h-5 w-5" />
            <Send className="h-5 w-5" />
          </div>
        </div>
      </div>
    );
  }

  if (placement === "reels") {
    return (
      <div
        data-preserve-theme="true"
        className="mx-auto max-w-[360px] overflow-hidden rounded-[28px] border border-zinc-800 bg-black shadow-2xl"
      >
        <div className="relative">
          {children}

          {/* Top IG Reels Header */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/65 to-transparent px-4 pt-3 pb-6 text-white">
            <span className="text-sm font-bold">Reels</span>
            <Camera className="h-5 w-5" />
          </div>

          {/* Right IG Reels Rail */}
          <div className="pointer-events-none absolute right-3 bottom-14 flex flex-col items-center gap-4 text-white drop-shadow">
            <div className="flex flex-col items-center">
              <Heart className="h-6 w-6" />
              <span className="mt-0.5 text-[10px] font-semibold">4,2 mil</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle className="h-6 w-6" />
              <span className="mt-0.5 text-[10px] font-semibold">189</span>
            </div>
            <div className="flex flex-col items-center">
              <Send className="h-6 w-6" />
              <span className="mt-0.5 text-[10px] font-semibold">612</span>
            </div>
            <MoreHorizontal className="h-5 w-5" />
          </div>

          {/* Bottom-left IG Reels Meta */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3.5 pt-8 pb-3 pr-14 text-white">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: client.avatarColor }}
              >
                {initial}
              </div>
              <span className="text-xs font-semibold">{handle}</span>
              <span className="rounded-md border border-white/60 px-2 py-0.5 text-[10px] font-semibold">
                Seguir
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[11px] text-white/90">{cleanCaption}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/80">
              <Music2 className="h-3 w-3" />
              <span className="truncate">Áudio original · {handle}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Instagram Feed (Authentic dark Instagram card)
  return (
    <div
      data-preserve-theme="true"
      className="mx-auto max-w-[360px] overflow-hidden rounded-2xl border border-zinc-800 bg-black text-white shadow-2xl"
    >
      {/* IG Feed Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black text-xs font-bold text-white"
              style={{ backgroundColor: client.avatarColor }}
            >
              {initial}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight text-white">{handle}</p>
            <p className="text-[10px] text-zinc-400">{client.name}</p>
          </div>
        </div>
        <MoreHorizontal className="h-4 w-4 text-zinc-300" />
      </div>

      {/* Media */}
      <div>{children}</div>

      {/* IG Action Bar */}
      <div className="px-3 pt-2.5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Heart className="h-5 w-5 text-white" />
            <MessageCircle className="h-5 w-5 text-white" />
            <Send className="h-5 w-5 text-white" />
          </div>
          <Bookmark className="h-5 w-5 text-white" />
        </div>

        <p className="mt-2 text-xs font-semibold text-white">1.284 curtidas</p>

        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-zinc-200">
          <span className="mr-1.5 font-semibold text-white">{handle}</span>
          {cleanCaption}
        </p>

        {hashtagsText && (
          <p className="mt-1 truncate text-[11px] text-sky-400">{hashtagsText}</p>
        )}

        <p className="mt-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
          Há 1 minuto
        </p>
      </div>
    </div>
  );
}
