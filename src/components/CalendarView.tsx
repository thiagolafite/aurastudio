"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Instagram, Music2, Facebook } from "lucide-react";
import type { Placement, ScheduledPost } from "@/types";

interface CalendarViewProps {
  posts: ScheduledPost[];
  onEditPost: (post: ScheduledPost) => void;
  onCreateForDate: (dateIso: string) => void;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarView({
  posts,
  onEditPost,
  onCreateForDate,
}: CalendarViewProps) {
  const [placementFilter, setPlacementFilter] = useState<"all" | Placement>("all");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const days = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date | null }> = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ date: null });
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ date: new Date(year, month, d) });
    }
    return cells;
  }, [year, month]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    for (const post of posts) {
      if (placementFilter !== "all" && post.placement !== placementFilter) continue;
      const dt = new Date(post.scheduledAt);
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      const existing = map.get(key) || [];
      existing.push(post);
      map.set(key, existing);
    }
    for (const [k, list] of map.entries()) {
      map.set(
        k,
        list.sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        )
      );
    }
    return map;
  }, [posts, placementFilter]);

  const monthLabel = cursor.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold capitalize text-white">{monthLabel}</h1>
          <p className="text-xs text-zinc-400">
            Clique em qualquer dia para agendar ou em uma postagem para editar layout e horário.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 text-[11px]">
            {(
              [
                { id: "all", label: "Todos" },
                { id: "feed", label: "Feed" },
                { id: "story", label: "Stories" },
                { id: "reels", label: "Reels" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPlacementFilter(f.id)}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  placementFilter === f.id
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-200 hover:bg-zinc-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
            >
              Hoje
            </button>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-200 hover:bg-zinc-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/90">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-zinc-800/70">
          {days.map((cell, idx) => {
            if (!cell.date) {
              return <div key={idx} className="min-h-[124px] bg-zinc-950/40" />;
            }

            const d = cell.date;
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const dayPosts = postsByDay.get(key) || [];
            const isToday =
              d.getDate() === today.getDate() &&
              d.getMonth() === today.getMonth() &&
              d.getFullYear() === today.getFullYear();

            const defaultScheduledDate = new Date(
              d.getFullYear(),
              d.getMonth(),
              d.getDate(),
              18,
              0
            ).toISOString();

            return (
              <div
                key={idx}
                className="group relative min-h-[124px] p-2.5 transition hover:bg-zinc-800/25"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : "text-zinc-400"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {dayPosts.length > 1 && (
                      <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                        {dayPosts.length} posts
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onCreateForDate(defaultScheduledDate)}
                    className="rounded-md p-1 text-zinc-500 opacity-60 transition hover:bg-indigo-600 hover:text-white group-hover:opacity-100"
                    title="Agendar mais uma postagem neste dia"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 space-y-1.5">
                  {dayPosts.map((post) => {
                    const timeStr = new Date(post.scheduledAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <button
                        key={post.id}
                        onClick={() => onEditPost(post)}
                        className={`flex w-full items-center gap-2 rounded-lg border p-1.5 text-left transition hover:scale-[1.01] ${
                          post.status === "published"
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : post.placement === "story"
                              ? "border-pink-500/30 bg-pink-500/10"
                              : "border-indigo-500/30 bg-indigo-500/10"
                        }`}
                      >
                        {post.mediaUrl && (
                          <img
                            src={post.mediaUrl}
                            alt={post.title}
                            className="h-9 w-9 shrink-0 rounded-md border border-zinc-700/70 object-cover bg-zinc-950"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-300">
                              <Clock className="h-2.5 w-2.5" />
                              {timeStr}
                            </span>
                            <span className="text-[9px] font-bold uppercase text-zinc-400">
                              {post.placement}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs font-semibold text-zinc-100">
                            {post.title}
                          </p>
                          <div className="mt-1 flex items-center gap-1 text-zinc-400">
                            {post.platforms.includes("instagram") && (
                              <Instagram className="h-3 w-3 text-pink-400" />
                            )}
                            {post.platforms.includes("tiktok") && (
                              <Music2 className="h-3 w-3 text-cyan-400" />
                            )}
                            {post.platforms.includes("facebook") && (
                              <Facebook className="h-3 w-3 text-blue-400" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
