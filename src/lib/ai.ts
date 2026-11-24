import { GoogleGenAI } from "@google/genai";
import type {
  AiLayoutIdea,
  AspectRatio,
  BackgroundPatternId,
  ClientWorkspace,
  LayoutTemplateId,
  Placement,
  Platform,
} from "@/types";

const ALL_PATTERNS: BackgroundPatternId[] = [
  "mesh-aurora",
  "diagonal-split",
  "concentric-rings",
  "grid-tech",
  "waves-organic",
  "bauhaus-geo",
  "dot-matrix",
  "glass-cards",
  "spotlight-beams",
  "clean-gradient",
];

function pickDistinctPatterns(count: number): BackgroundPatternId[] {
  const pool = [...ALL_PATTERNS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
import { generateId } from "@/lib/db";
import { getCredentials } from "@/lib/credentials";

export interface GenerateIdeasInput {
  client: ClientWorkspace;
  topic: string;
  goal: string;
  placement: Placement;
  platforms: Platform[];
}

export interface GenerateIdeasResult {
  ideas: AiLayoutIdea[];
  provider: "gemini" | "smart-fallback";
  model: string;
}

function ratioForPlacement(placement: Placement): AspectRatio {
  if (placement === "story" || placement === "reels") return "9:16";
  return "4:5";
}

function buildFallbackIdeas(input: GenerateIdeasInput): AiLayoutIdea[] {
  const { client, topic, goal, placement, platforms } = input;
  const aspectRatio = ratioForPlacement(placement);
  const { brandKit } = client;
  const cleanTopic = topic.trim() || `Novidades de ${client.name}`;
  const [pat1, pat2, pat3] = pickDistinctPatterns(3);
  const tagBase = client.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  return [
    {
      id: generateId("idea"),
      conceptName: "Editorial de Alto Impacto",
      rationale: `Combina o padrão geométrico "${pat1}" com contraste forte da cor de destaque (${brandKit.accentColor}) para prender atenção nos primeiros 2 segundos.`,
      recommendedPlacement: placement,
      recommendedPlatforms: platforms.length ? platforms : ["instagram", "facebook"],
      layout: {
        template: "editorial-bold",
        aspectRatio,
        backgroundColor: brandKit.primaryColor,
        gradientEndColor: brandKit.secondaryColor,
        useGradient: true,
        backgroundPattern: pat1,
        patternIntensity: 0.78,
        overlayOpacity: 0.3,
        badgeText: goal.toUpperCase().slice(0, 22) || "DESTAQUE",
        headline: cleanTopic.length > 42 ? cleanTopic.slice(0, 42) + "..." : cleanTopic,
        subheadline: `Feito para ${client.targetAudience.split(",")[0].toLowerCase()} com o padrão ${client.name}.`,
        ctaText: placement === "story" ? "TOQUE NO LINK" : "SALVE ESSE POST",
        handleText: brandKit.handle,
        accentColor: brandKit.accentColor,
        textColor: brandKit.textColor,
        align: "left",
        headlineSize: placement === "story" ? 68 : 62,
        fontFamily: brandKit.fontFamily,
      },
      captionInstagram: `${cleanTopic} ✨\n\nPensado para entregar ${goal.toLowerCase()} sem complicação. Conta nos comentários o que você achou e já salva para consultar depois!`,
      captionTikTok: `POV: você descobriu como ${cleanTopic.toLowerCase()} muda o jogo 🔥 Comenta 'QUERO' que eu mando os detalhes!`,
      captionFacebook: `${cleanTopic}\n\nAqui na ${client.name}, preparamos essa novidade especialmente para o nosso público. Clique no link ou envie uma mensagem para saber mais!`,
      hashtags: [`#${tagBase}`, "#conteudoestrategico", "#marketingdigital", "#novidade"],
      bestTimeToPost: "18:30 (Horário de pico de engajamento)",
    },
    {
      id: generateId("idea"),
      conceptName: "Geometria & Prova de Valor",
      rationale: `Fundo estruturado com "${pat2}" e blocos visuais que separam o gancho da chamada para ação — excelente para conversão e cliques.`,
      recommendedPlacement: placement,
      recommendedPlatforms: platforms.length ? platforms : ["instagram", "tiktok", "facebook"],
      layout: {
        template: "split-card",
        aspectRatio,
        backgroundColor: "#0F172A",
        gradientEndColor: brandKit.secondaryColor,
        useGradient: true,
        backgroundPattern: pat2,
        patternIntensity: 0.82,
        overlayOpacity: 0.25,
        badgeText: "GUIA RÁPIDO",
        headline: `3 motivos para apostar em ${cleanTopic.slice(0, 28)}`,
        subheadline: "Direto ao ponto, aplicável hoje e alinhado ao seu resultado.",
        ctaText: "COMENTE 'EU QUERO'",
        handleText: brandKit.handle,
        accentColor: brandKit.accentColor,
        textColor: "#F8FAFC",
        align: "left",
        headlineSize: 58,
        fontFamily: brandKit.fontFamily,
      },
      captionInstagram: `Se você quer ${goal.toLowerCase()}, precisa ver isso antes de decidir 👇\n\n1. Mais clareza no dia a dia\n2. Resultado perceptível já na primeira semana\n3. Assinatura exclusiva ${client.name}\n\nComente EU QUERO para receber o link no direct!`,
      captionTikTok: `3 motivos que ninguém te contou sobre ${cleanTopic.toLowerCase()} 👀 Salva esse vídeo antes de perder!`,
      captionFacebook: `Separamos 3 motivos práticos sobre ${cleanTopic}. Compartilhe com quem também precisa ver essa dica hoje!`,
      hashtags: [`#${tagBase}`, "#dicaspraticas", "#estrategia", "#tendencia"],
      bestTimeToPost: "12:15 (Intervalo de almoço)",
    },
    {
      id: generateId("idea"),
      conceptName: "Composição Criativa / Autoridade",
      rationale: `Usa a geometria "${pat3}" com respiro visual amplo que transmite autoridade e gera alto índice de salvamentos e compartilhamentos.`,
      recommendedPlacement: placement,
      recommendedPlatforms: platforms.length ? platforms : ["instagram", "facebook"],
      layout: {
        template: placement === "story" ? "gradient-story" : "quote-insight",
        aspectRatio,
        backgroundColor: brandKit.secondaryColor,
        gradientEndColor: brandKit.primaryColor,
        useGradient: true,
        backgroundPattern: pat3,
        patternIntensity: 0.72,
        overlayOpacity: 0.2,
        badgeText: client.name.toUpperCase(),
        headline: `“${cleanTopic.slice(0, 48)}”`,
        subheadline: `Tom ${client.toneOfVoice.toLowerCase()} para conectar de verdade com a sua audiência.`,
        ctaText: "ENVIE PARA UM AMIGO",
        handleText: brandKit.handle,
        accentColor: brandKit.accentColor,
        textColor: brandKit.textColor,
        align: "center",
        headlineSize: 56,
        fontFamily: "serif",
      },
      captionInstagram: `Às vezes tudo o que muda o resultado é a forma como você olha para ${cleanTopic.toLowerCase()}.\n\nSe isso fez sentido para você, compartilhe nos seus Stories e marque ${brandKit.handle} 💛`,
      captionTikTok: `Guarda essa visão sobre ${cleanTopic.toLowerCase()} 💡 Qual dessas você já aplica?`,
      captionFacebook: `Reflexão do dia na ${client.name}: ${cleanTopic}. Concorda? Deixe sua opinião nos comentários!`,
      hashtags: [`#${tagBase}`, "#inspiracao", "#autoridade", "#marca"],
      bestTimeToPost: "20:00 (Consumo noturno)",
    },
  ];
}

export async function generateLayoutIdeas(
  input: GenerateIdeasInput
): Promise<GenerateIdeasResult> {
  const creds = await getCredentials();
  const apiKey = creds.geminiApiKey;
  if (!apiKey) {
    return {
      ideas: buildFallbackIdeas(input),
      provider: "smart-fallback",
      model: "aura-heuristic-v1 (adicione GEMINI_API_KEY para ativar Gemini 4)",
    };
  }

  const aspectRatio = ratioForPlacement(input.placement);
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Você é um Diretor de Arte e Estrategista de Social Media sênior de uma agência digital brasileira.
Gere EXATAMENTE 3 ideias criativas e distintas de layout visual + legendas otimizadas em Português do Brasil.

Dados do Cliente:
- Marca: ${input.client.name}
- Nicho: ${input.client.niche}
- Tom de voz: ${input.client.toneOfVoice}
- Público-alvo: ${input.client.targetAudience}
- Paleta da marca: primária ${input.client.brandKit.primaryColor}, secundária ${input.client.brandKit.secondaryColor}, destaque ${input.client.brandKit.accentColor}, texto ${input.client.brandKit.textColor}
- Handle: ${input.client.brandKit.handle}

Briefing do Post:
- Tema: ${input.topic}
- Objetivo: ${input.goal}
- Formato: ${input.placement} (proporção ${aspectRatio})
- Plataformas: ${input.platforms.join(", ")}

Templates válidos para layout.template: "editorial-bold", "minimal-clean", "split-card", "gradient-story", "promo-offer", "quote-insight".
Padrões geométricos válidos para layout.backgroundPattern (USE 3 DIFERENTES, um para cada ideia!): "mesh-aurora", "diagonal-split", "concentric-rings", "grid-tech", "waves-organic", "bauhaus-geo", "dot-matrix", "glass-cards", "spotlight-beams", "clean-gradient".
Fontes válidas para layout.fontFamily: "sans", "serif", "display".
Alinhamentos válidos para layout.align: "left", "center", "right".
Use cores hex válidas (#RRGGBB) com ótimo contraste. Headlines curtos e fortes (máximo 55 caracteres).`;

  try {
    const interaction = await ai.interactions.create({
      model: "gemini-4-hydrogen",
      input: prompt,
      response_format: {
        type: "object",
        properties: {
          ideas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                conceptName: { type: "string" },
                rationale: { type: "string" },
                bestTimeToPost: { type: "string" },
                captionInstagram: { type: "string" },
                captionTikTok: { type: "string" },
                captionFacebook: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } },
                layout: {
                  type: "object",
                  properties: {
                    template: { type: "string" },
                    backgroundPattern: { type: "string" },
                    patternIntensity: { type: "number" },
                    backgroundColor: { type: "string" },
                    gradientEndColor: { type: "string" },
                    useGradient: { type: "boolean" },
                    badgeText: { type: "string" },
                    headline: { type: "string" },
                    subheadline: { type: "string" },
                    ctaText: { type: "string" },
                    accentColor: { type: "string" },
                    textColor: { type: "string" },
                    align: { type: "string" },
                    headlineSize: { type: "number" },
                    fontFamily: { type: "string" },
                  },
                  required: [
                    "template",
                    "backgroundColor",
                    "gradientEndColor",
                    "useGradient",
                    "badgeText",
                    "headline",
                    "subheadline",
                    "ctaText",
                    "accentColor",
                    "textColor",
                    "align",
                    "headlineSize",
                    "fontFamily",
                  ],
                },
              },
              required: [
                "conceptName",
                "rationale",
                "bestTimeToPost",
                "captionInstagram",
                "captionTikTok",
                "captionFacebook",
                "hashtags",
                "layout",
              ],
            },
          },
        },
        required: ["ideas"],
      },
    });

    const rawText = interaction.output_text;
    if (!rawText) {
      throw new Error("Empty Gemini response");
    }

    const parsed = JSON.parse(rawText) as {
      ideas: Array<{
        conceptName: string;
        rationale: string;
        bestTimeToPost: string;
        captionInstagram: string;
        captionTikTok: string;
        captionFacebook: string;
        hashtags: string[];
        layout: {
          template: string;
          backgroundPattern?: string;
          patternIntensity?: number;
          backgroundColor: string;
          gradientEndColor: string;
          useGradient: boolean;
          badgeText: string;
          headline: string;
          subheadline: string;
          ctaText: string;
          accentColor: string;
          textColor: string;
          align: string;
          headlineSize: number;
          fontFamily: string;
        };
      }>;
    };

    const validTemplates: LayoutTemplateId[] = [
      "editorial-bold",
      "minimal-clean",
      "split-card",
      "gradient-story",
      "promo-offer",
      "quote-insight",
    ];

    const fallbackPatterns = pickDistinctPatterns(3);
    const normalized: AiLayoutIdea[] = (parsed.ideas || []).slice(0, 3).map((item, idx) => {
      const tpl = validTemplates.includes(item.layout.template as LayoutTemplateId)
        ? (item.layout.template as LayoutTemplateId)
        : "editorial-bold";
      const pat = ALL_PATTERNS.includes(item.layout.backgroundPattern as BackgroundPatternId)
        ? (item.layout.backgroundPattern as BackgroundPatternId)
        : fallbackPatterns[idx] || "mesh-aurora";
      const align =
        item.layout.align === "center" || item.layout.align === "right"
          ? item.layout.align
          : "left";
      const fontFamily =
        item.layout.fontFamily === "serif" || item.layout.fontFamily === "display"
          ? item.layout.fontFamily
          : "sans";

      return {
        id: generateId("idea"),
        conceptName: item.conceptName,
        rationale: item.rationale,
        recommendedPlacement: input.placement,
        recommendedPlatforms: input.platforms,
        bestTimeToPost: item.bestTimeToPost || "18:30",
        captionInstagram: item.captionInstagram,
        captionTikTok: item.captionTikTok,
        captionFacebook: item.captionFacebook,
        hashtags: (item.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`)),
        layout: {
          template: tpl,
          aspectRatio,
          backgroundColor: item.layout.backgroundColor || input.client.brandKit.primaryColor,
          gradientEndColor: item.layout.gradientEndColor || input.client.brandKit.secondaryColor,
          useGradient: Boolean(item.layout.useGradient),
          backgroundPattern: pat,
          patternIntensity: Math.min(1, Math.max(0.2, Number(item.layout.patternIntensity) || 0.75)),
          overlayOpacity: 0.3,
          badgeText: item.layout.badgeText || "DESTAQUE",
          headline: item.layout.headline,
          subheadline: item.layout.subheadline,
          ctaText: item.layout.ctaText || "SAIBA MAIS",
          handleText: input.client.brandKit.handle,
          accentColor: item.layout.accentColor || input.client.brandKit.accentColor,
          textColor: item.layout.textColor || input.client.brandKit.textColor,
          align,
          headlineSize: Math.min(80, Math.max(40, Number(item.layout.headlineSize) || 60)),
          fontFamily,
        },
      };
    });

    if (normalized.length === 0) {
      throw new Error("No ideas returned");
    }

    return {
      ideas: normalized,
      provider: "gemini",
      model: "gemini-4-hydrogen",
    };
  } catch (error) {
    console.error("Gemini generation error, falling back:", error);
    return {
      ideas: buildFallbackIdeas(input),
      provider: "smart-fallback",
      model: "aura-heuristic-v1 (fallback após erro na API Gemini)",
    };
  }
}
