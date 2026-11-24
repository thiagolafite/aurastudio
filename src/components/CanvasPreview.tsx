"use client";

import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import type {
  AspectRatio,
  DraggableElementKey,
  ElementOffset,
  LayoutConfig,
} from "@/types";

export interface CanvasPreviewHandle {
  exportPngDataUrl: () => string | null;
}

interface CanvasPreviewProps {
  config: LayoutConfig;
  className?: string;
  interactive?: boolean;
  onChangePositions?: (
    positions: Partial<Record<DraggableElementKey, ElementOffset>>
  ) => void;
}

interface HitBox {
  key: DraggableElementKey;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ELEMENT_LABELS: Record<DraggableElementKey, string> = {
  badge: "Selo",
  headline: "Título",
  subheadline: "Subtítulo",
  cta: "Botão CTA",
  handle: "@Handle",
};

function getDimensions(ratio: AspectRatio): { width: number; height: number } {
  if (ratio === "9:16") return { width: 1080, height: 1920 };
  if (ratio === "4:5") return { width: 1080, height: 1350 };
  return { width: 1080, height: 1080 };
}

function getFontStack(family: LayoutConfig["fontFamily"]): string {
  if (family === "serif") return "Georgia, 'Playfair Display', serif";
  if (family === "display") return "'Space Grotesk', 'Segoe UI', system-ui, sans-serif";
  return "Inter, system-ui, -apple-system, sans-serif";
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const test = `${current} ${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`;
}

function drawBackgroundPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: LayoutConfig
) {
  const pattern = config.backgroundPattern || "mesh-aurora";
  const intensity = config.patternIntensity ?? 0.65;
  const accent = config.accentColor || "#6366F1";
  const secondary = config.gradientEndColor || "#1E1B4B";

  ctx.save();

  if (pattern === "clean-gradient") {
    const glow = ctx.createRadialGradient(
      width * 0.82,
      height * 0.16,
      20,
      width * 0.82,
      height * 0.16,
      width * 0.68
    );
    glow.addColorStop(0, hexToRgba(accent, 0.25 * intensity));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else if (pattern === "mesh-aurora") {
    const spots = [
      { x: width * 0.15, y: height * 0.18, r: width * 0.6, color: accent, a: 0.42 },
      { x: width * 0.88, y: height * 0.35, r: width * 0.55, color: secondary, a: 0.55 },
      { x: width * 0.65, y: height * 0.85, r: width * 0.65, color: accent, a: 0.3 },
    ];
    for (const s of spots) {
      const g = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, s.r);
      g.addColorStop(0, hexToRgba(s.color, s.a * intensity));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }
  } else if (pattern === "diagonal-split") {
    ctx.fillStyle = hexToRgba(accent, 0.22 * intensity);
    ctx.beginPath();
    ctx.moveTo(width * 0.35, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height * 0.68);
    ctx.lineTo(width * 0.08, height * 0.38);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = hexToRgba(accent, 0.75 * intensity);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(width * 0.08, height * 0.38);
    ctx.lineTo(width, height * 0.68);
    ctx.stroke();

    ctx.fillStyle = hexToRgba(secondary, 0.45 * intensity);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.74);
    ctx.lineTo(width * 0.72, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  } else if (pattern === "concentric-rings") {
    const cx = width * 0.84;
    const cy = height * 0.22;
    for (let i = 1; i <= 7; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, i * 115, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(accent, (0.42 - i * 0.04) * intensity);
      ctx.lineWidth = i === 3 ? 6 : 2.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(width * 0.12, height * 0.88, 220, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(accent, 0.16 * intensity);
    ctx.fill();
  } else if (pattern === "grid-tech") {
    const step = 72;
    ctx.strokeStyle = hexToRgba(accent, 0.18 * intensity);
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Glowing focal nodes
    const glow = ctx.createRadialGradient(
      width * 0.75,
      height * 0.25,
      10,
      width * 0.75,
      height * 0.25,
      width * 0.55
    );
    glow.addColorStop(0, hexToRgba(accent, 0.32 * intensity));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else if (pattern === "waves-organic") {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const baseY = height * (0.64 + i * 0.1);
      ctx.moveTo(0, baseY);
      ctx.bezierCurveTo(
        width * 0.3,
        baseY - 120 + i * 25,
        width * 0.65,
        baseY + 130 - i * 20,
        width,
        baseY - 40
      );
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = hexToRgba(accent, (0.14 + i * 0.08) * intensity);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height * 0.18);
    ctx.bezierCurveTo(width * 0.65, height * 0.26, width * 0.35, height * 0.06, 0, height * 0.2);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(accent, 0.16 * intensity);
    ctx.fill();
  } else if (pattern === "bauhaus-geo") {
    // Large semi-circle top right
    ctx.fillStyle = hexToRgba(accent, 0.28 * intensity);
    ctx.beginPath();
    ctx.arc(width * 0.92, height * 0.16, 290, 0, Math.PI * 2);
    ctx.fill();

    // Outlined square bottom left
    ctx.strokeStyle = hexToRgba(accent, 0.55 * intensity);
    ctx.lineWidth = 6;
    ctx.strokeRect(54, height - 310, 220, 220);

    // Solid pill bar right side
    ctx.fillStyle = hexToRgba(config.textColor || "#FFFFFF", 0.12 * intensity);
    drawRoundedRect(ctx, width - 190, height * 0.54, 130, 320, 65);
    ctx.fill();

    // Accent dot
    ctx.fillStyle = hexToRgba(accent, 0.85 * intensity);
    ctx.beginPath();
    ctx.arc(width - 125, height * 0.54 + 65, 28, 0, Math.PI * 2);
    ctx.fill();
  } else if (pattern === "dot-matrix") {
    const gap = 46;
    ctx.fillStyle = hexToRgba(accent, 0.26 * intensity);
    for (let x = 36; x < width; x += gap) {
      for (let y = 36; y < height; y += gap) {
        const dist = Math.hypot(x - width * 0.8, y - height * 0.2);
        const radius = Math.max(2, 7 - dist / 180);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === "glass-cards") {
    const panels = [
      { x: width * 0.56, y: 60, w: 460, h: 340, r: 36, rot: -0.08 },
      { x: 40, y: height * 0.62, w: 420, h: 320, r: 36, rot: 0.06 },
      { x: width * 0.52, y: height * 0.7, w: 480, h: 260, r: 36, rot: -0.04 },
    ];
    for (const p of panels) {
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot);
      ctx.fillStyle = hexToRgba(config.textColor || "#FFFFFF", 0.08 * intensity);
      drawRoundedRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.r);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(accent, 0.35 * intensity);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
  } else if (pattern === "spotlight-beams") {
    const beams = [
      { x1: width * 0.1, x2: width * 0.45, alpha: 0.22 },
      { x1: width * 0.48, x2: width * 0.85, alpha: 0.16 },
      { x1: width * 0.72, x2: width * 1.15, alpha: 0.25 },
    ];
    for (const b of beams) {
      const grad = ctx.createLinearGradient(b.x1, 0, b.x2, height);
      grad.addColorStop(0, hexToRgba(accent, b.alpha * intensity));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(b.x1, 0);
      ctx.lineTo(b.x1 + 190, 0);
      ctx.lineTo(b.x2 + 240, height);
      ctx.lineTo(b.x2 - 80, height);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

function boxLeftForAlign(
  anchorX: number,
  boxWidth: number,
  align: LayoutConfig["align"]
): number {
  if (align === "center") return anchorX - boxWidth / 2;
  if (align === "right") return anchorX - boxWidth;
  return anchorX;
}

export const CanvasPreview = forwardRef<CanvasPreviewHandle, CanvasPreviewProps>(
  function CanvasPreview(
    { config, className, interactive = false, onChangePositions },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const hitBoxesRef = useRef<HitBox[]>([]);
    const bgImgCacheRef = useRef<{ url: string; img: HTMLImageElement } | null>(null);

    const [hoveredBox, setHoveredBox] = useState<HitBox | null>(null);
    const [draggingKey, setDraggingKey] = useState<DraggableElementKey | null>(null);
    const dragStartRef = useRef<{
      key: DraggableElementKey;
      pointerX: number;
      pointerY: number;
      originOffsetX: number;
      originOffsetY: number;
      moved: boolean;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      exportPngDataUrl: () => {
        if (!canvasRef.current) return null;
        try {
          return canvasRef.current.toDataURL("image/png", 0.95);
        } catch {
          return null;
        }
      },
    }));

    const { width: canvasW, height: canvasH } = getDimensions(config.aspectRatio);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = getDimensions(config.aspectRatio);
      canvas.width = width;
      canvas.height = height;

      let cancelled = false;

      const getOffset = (key: DraggableElementKey): ElementOffset => {
        return config.elementPositions?.[key] || { x: 0, y: 0 };
      };

      const render = (bgImg?: HTMLImageElement) => {
        if (cancelled) return;
        ctx.clearRect(0, 0, width, height);
        const boxes: HitBox[] = [];

        // 1. Background fill / gradient
        if (config.useGradient) {
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, config.backgroundColor || "#09090B");
          grad.addColorStop(1, config.gradientEndColor || "#1E1B4B");
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = config.backgroundColor || "#09090B";
        }
        ctx.fillRect(0, 0, width, height);

        // 2. Geometric & artistic background design
        drawBackgroundPattern(ctx, width, height, config);

        // 3. Optional background photo (cover fit)
        if (bgImg) {
          const imgRatio = bgImg.width / bgImg.height;
          const canvasRatio = width / height;
          let drawW = width;
          let drawH = height;
          let offsetX = 0;
          let offsetY = 0;
          if (imgRatio > canvasRatio) {
            drawW = height * imgRatio;
            offsetX = (width - drawW) / 2;
          } else {
            drawH = width / imgRatio;
            offsetY = (height - drawH) / 2;
          }
          ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);

          ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.9, Math.max(0, config.overlayOpacity))})`;
          ctx.fillRect(0, 0, width, height);
        }

        // 4. Template-specific framing
        const padX = 92;
        const maxTextW = width - padX * 2;
        const fontStack = getFontStack(config.fontFamily);

        if (config.template === "minimal-clean") {
          ctx.strokeStyle = `${config.accentColor}66`;
          ctx.lineWidth = 4;
          drawRoundedRect(ctx, 48, 48, width - 96, height - 96, 36);
          ctx.stroke();
        } else if (config.template === "split-card") {
          ctx.fillStyle = "rgba(9, 9, 11, 0.72)";
          drawRoundedRect(ctx, 56, height * 0.36, width - 112, height * 0.56, 40);
          ctx.fill();
          ctx.strokeStyle = `${config.accentColor}80`;
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (config.template === "promo-offer") {
          ctx.fillStyle = config.accentColor;
          ctx.fillRect(0, 0, width, 20);
          ctx.fillRect(0, height - 20, width, 20);
        } else if (config.template === "quote-insight") {
          ctx.fillStyle = `${config.accentColor}26`;
          ctx.font = `700 260px Georgia, serif`;
          ctx.textAlign = "left";
          ctx.fillText("“", padX - 24, height * 0.36);
        } else if (config.template === "editorial-bold") {
          ctx.fillStyle = config.accentColor;
          ctx.fillRect(padX, height * 0.22, 120, 10);
        }

        const baseAnchorX =
          config.align === "center"
            ? width / 2
            : config.align === "right"
              ? width - padX
              : padX;
        ctx.textAlign = config.align;

        let cursorY =
          config.template === "split-card" ? height * 0.44 : height * 0.26;

        // 5. Top Badge Pill
        if (config.badgeText.trim()) {
          const off = getOffset("badge");
          const badgeUpper = config.badgeText.trim().toUpperCase();
          ctx.font = `700 26px ${fontStack}`;
          const badgeTextW = ctx.measureText(badgeUpper).width;
          const pillW = badgeTextW + 52;
          const pillH = 54;
          const basePillX =
            config.align === "center"
              ? width / 2 - pillW / 2
              : config.align === "right"
                ? width - padX - pillW
                : padX;
          const pillX = basePillX + off.x;
          const pillY = cursorY + off.y;

          ctx.fillStyle = `${config.accentColor}2E`;
          drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 999);
          ctx.fill();
          ctx.strokeStyle = `${config.accentColor}99`;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = config.accentColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(badgeUpper, pillX + pillW / 2, pillY + pillH / 2 + 2);
          ctx.textBaseline = "alphabetic";
          ctx.textAlign = config.align;

          boxes.push({
            key: "badge",
            label: ELEMENT_LABELS.badge,
            x: pillX - 8,
            y: pillY - 8,
            w: pillW + 16,
            h: pillH + 16,
          });

          cursorY += pillH + 64;
        }

        // 6. Headline
        const headlineSize = Math.round(
          config.aspectRatio === "9:16" ? config.headlineSize * 1.15 : config.headlineSize
        );
        ctx.font = `800 ${headlineSize}px ${fontStack}`;
        ctx.fillStyle = config.textColor || "#FFFFFF";
        const headlineLines = wrapText(ctx, config.headline || "Seu título aqui", maxTextW).slice(
          0,
          5
        );
        const lineHeight = Math.round(headlineSize * 1.16);
        const headOff = getOffset("headline");
        const headAnchorX = baseAnchorX + headOff.x;
        const headStartY = cursorY + headOff.y;

        let maxHeadLineW = 0;
        headlineLines.forEach((line, idx) => {
          const w = ctx.measureText(line).width;
          if (w > maxHeadLineW) maxHeadLineW = w;
          ctx.fillText(line, headAnchorX, headStartY + idx * lineHeight);
        });

        if (headlineLines.length > 0) {
          const boxW = Math.max(120, maxHeadLineW);
          const boxH = headlineLines.length * lineHeight;
          boxes.push({
            key: "headline",
            label: ELEMENT_LABELS.headline,
            x: boxLeftForAlign(headAnchorX, boxW, config.align) - 12,
            y: headStartY - headlineSize * 0.88 - 8,
            w: boxW + 24,
            h: boxH + 16,
          });
        }

        cursorY += headlineLines.length * lineHeight;

        // 7. Subheadline
        if (config.subheadline.trim()) {
          cursorY += 20;
          const subSize = config.aspectRatio === "9:16" ? 38 : 34;
          ctx.font = `400 ${subSize}px ${fontStack}`;
          ctx.fillStyle = `${config.textColor || "#FFFFFF"}CC`;
          const subLines = wrapText(ctx, config.subheadline, maxTextW).slice(0, 4);
          const subLineH = Math.round(subSize * 1.38);
          const subOff = getOffset("subheadline");
          const subAnchorX = baseAnchorX + subOff.x;
          const subStartY = cursorY + subOff.y;

          let maxSubLineW = 0;
          subLines.forEach((line, idx) => {
            const w = ctx.measureText(line).width;
            if (w > maxSubLineW) maxSubLineW = w;
            ctx.fillText(line, subAnchorX, subStartY + idx * subLineH);
          });

          if (subLines.length > 0) {
            const boxW = Math.max(120, maxSubLineW);
            const boxH = subLines.length * subLineH;
            boxes.push({
              key: "subheadline",
              label: ELEMENT_LABELS.subheadline,
              x: boxLeftForAlign(subAnchorX, boxW, config.align) - 12,
              y: subStartY - subSize * 0.88 - 8,
              w: boxW + 24,
              h: boxH + 16,
            });
          }

          cursorY += subLines.length * subLineH;
        }

        // 8. CTA Button
        if (config.ctaText.trim()) {
          const ctaOff = getOffset("cta");
          const hasLink = Boolean(config.ctaUrl && config.ctaUrl.trim());
          const ctaUpper = `${config.ctaText.trim().toUpperCase()}${hasLink ? " ↗" : ""}`;
          ctx.font = `700 28px ${fontStack}`;
          const ctaTextW = ctx.measureText(ctaUpper).width;
          const btnW = Math.min(maxTextW, ctaTextW + 84);
          const btnH = 78;
          const baseBtnY = Math.min(height - 210, cursorY + 46);
          const baseBtnX =
            config.align === "center"
              ? width / 2 - btnW / 2
              : config.align === "right"
                ? width - padX - btnW
                : padX;
          const btnX = baseBtnX + ctaOff.x;
          const btnY = baseBtnY + ctaOff.y;

          ctx.fillStyle = config.accentColor;
          drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 20);
          ctx.fill();

          ctx.fillStyle = "#09090B";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ctaUpper, btnX + btnW / 2, btnY + btnH / 2 + 2);
          ctx.textBaseline = "alphabetic";
          ctx.textAlign = config.align;

          boxes.push({
            key: "cta",
            label: ELEMENT_LABELS.cta,
            x: btnX - 8,
            y: btnY - 8,
            w: btnW + 16,
            h: btnH + 16,
          });
        }

        // 9. Footer Brand Handle
        if (config.handleText.trim()) {
          const handleOff = getOffset("handle");
          const handleStr = config.handleText.trim();
          ctx.font = `600 28px ${fontStack}`;
          ctx.fillStyle = `${config.textColor || "#FFFFFF"}B3`;
          ctx.textAlign = config.align;
          const handleX = baseAnchorX + handleOff.x;
          const handleY = height - 76 + handleOff.y;
          ctx.fillText(handleStr, handleX, handleY);

          const handleW = Math.max(100, ctx.measureText(handleStr).width);
          boxes.push({
            key: "handle",
            label: ELEMENT_LABELS.handle,
            x: boxLeftForAlign(handleX, handleW, config.align) - 10,
            y: handleY - 30,
            w: handleW + 20,
            h: 44,
          });
        }

        hitBoxesRef.current = boxes;
      };

      if (config.backgroundImageUrl) {
        if (bgImgCacheRef.current?.url === config.backgroundImageUrl) {
          render(bgImgCacheRef.current.img);
        } else {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            bgImgCacheRef.current = { url: config.backgroundImageUrl!, img };
            render(img);
          };
          img.onerror = () => render();
          img.src = config.backgroundImageUrl;
        }
      } else {
        bgImgCacheRef.current = null;
        render();
      }

      return () => {
        cancelled = true;
      };
    }, [config]);

    const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const findHit = (x: number, y: number): HitBox | null => {
      const boxes = hitBoxesRef.current;
      for (let i = boxes.length - 1; i >= 0; i--) {
        const b = boxes[i];
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          return b;
        }
      }
      return null;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactive || !onChangePositions) return;
      const pt = getCanvasPoint(e);
      if (!pt) return;
      const hit = findHit(pt.x, pt.y);
      if (!hit) return;

      e.currentTarget.setPointerCapture(e.pointerId);
      const currentOff = config.elementPositions?.[hit.key] || { x: 0, y: 0 };
      dragStartRef.current = {
        key: hit.key,
        pointerX: pt.x,
        pointerY: pt.y,
        originOffsetX: currentOff.x,
        originOffsetY: currentOff.y,
        moved: false,
      };
      setDraggingKey(hit.key);
      setHoveredBox(hit);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactive) return;
      const pt = getCanvasPoint(e);
      if (!pt) return;

      if (dragStartRef.current && onChangePositions) {
        const drag = dragStartRef.current;
        const dx = Math.round(pt.x - drag.pointerX);
        const dy = Math.round(pt.y - drag.pointerY);
        if (Math.hypot(dx, dy) > 8) {
          drag.moved = true;
        }
        if (!drag.moved) return;

        const nextPositions: Partial<Record<DraggableElementKey, ElementOffset>> = {
          ...(config.elementPositions || {}),
          [drag.key]: {
            x: drag.originOffsetX + dx,
            y: drag.originOffsetY + dy,
          },
        };
        onChangePositions(nextPositions);
        const updatedBox = hitBoxesRef.current.find((b) => b.key === drag.key) || null;
        setHoveredBox(updatedBox);
        return;
      }

      const hit = findHit(pt.x, pt.y);
      setHoveredBox(hit);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragStartRef.current) {
        const drag = dragStartRef.current;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore if not captured
        }
        // Short click on CTA button opens external link if configured
        if (!drag.moved && drag.key === "cta" && config.ctaUrl?.trim()) {
          const raw = config.ctaUrl.trim();
          const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
          window.open(url, "_blank", "noopener,noreferrer");
        }
        dragStartRef.current = null;
        setDraggingKey(null);
      }
    };

    const handlePointerLeave = () => {
      if (!dragStartRef.current) {
        setHoveredBox(null);
      }
    };

    const aspectClass =
      config.aspectRatio === "9:16"
        ? "aspect-[9/16]"
        : config.aspectRatio === "4:5"
          ? "aspect-[4/5]"
          : "aspect-square";

    const activeBox =
      (draggingKey
        ? hitBoxesRef.current.find((b) => b.key === draggingKey)
        : hoveredBox) || null;

    return (
      <div className={`relative w-full ${aspectClass} select-none`}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className={`h-full w-full rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl object-contain touch-none ${
            interactive
              ? draggingKey
                ? "cursor-grabbing"
                : hoveredBox
                  ? "cursor-grab"
                  : "cursor-default"
              : ""
          } ${className || ""}`}
        />

        {/* Visual drag highlight overlay (never baked into PNG export) */}
        {interactive && activeBox && (
          <div
            className="pointer-events-none absolute rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-500/10 transition-opacity"
            style={{
              left: `${(activeBox.x / canvasW) * 100}%`,
              top: `${(activeBox.y / canvasH) * 100}%`,
              width: `${(activeBox.w / canvasW) * 100}%`,
              height: `${(activeBox.h / canvasH) * 100}%`,
            }}
          >
            <span className="absolute -top-6 left-0 whitespace-nowrap rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
              {draggingKey
                ? `Movendo: ${activeBox.label}`
                : activeBox.key === "cta" && config.ctaUrl?.trim()
                  ? "Clique p/ abrir link • Arraste p/ mover"
                  : `Arrastar: ${activeBox.label}`}
            </span>
          </div>
        )}
      </div>
    );
  }
);
