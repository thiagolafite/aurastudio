import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Pool } from "pg";
import type { ClientWorkspace, ScheduledPost, StoreData, User } from "@/types";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "aurastudio-data")
  : path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

let pool: Pool | null = null;
let pgInitialized = false;

function hasPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

function buildSeedData(): StoreData {
  const now = new Date();
  const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  const tomorrowMorning = new Date(now.getTime() + 22 * 60 * 60 * 1000).toISOString();
  const in2Days = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const clients: ClientWorkspace[] = [
    {
      id: "cli_aurora",
      name: "Café Aurora",
      niche: "Cafeteria artesanal & torrefação especial",
      toneOfVoice: "Acolhedor, sofisticado e sensorial",
      targetAudience: "Amantes de café especial, trabalhadores remotos e jovens adultos (24-42 anos)",
      avatarColor: "#D97706",
      brandKit: {
        primaryColor: "#1C1410",
        secondaryColor: "#3D2618",
        accentColor: "#F59E0B",
        backgroundColor: "#1C1410",
        textColor: "#FFFBEB",
        fontFamily: "serif",
        handle: "@cafeaurora.br",
      },
      accounts: [
        {
          id: "acc_aurora_ig",
          platform: "instagram",
          username: "@cafeaurora.br",
          accountName: "Café Aurora Oficial",
          connected: true,
          mode: "simulation",
          lastSyncedAt: now.toISOString(),
        },
        {
          id: "acc_aurora_tt",
          platform: "tiktok",
          username: "@cafeaurora.br",
          accountName: "Café Aurora TikTok",
          connected: true,
          mode: "simulation",
          lastSyncedAt: now.toISOString(),
        },
        {
          id: "acc_aurora_fb",
          platform: "facebook",
          username: "Café Aurora Artesanal",
          accountName: "Página Café Aurora",
          connected: true,
          mode: "simulation",
          lastSyncedAt: now.toISOString(),
        },
      ],
      createdAt: yesterday,
    },
    {
      id: "cli_fitpulse",
      name: "FitPulse Studio",
      niche: "Treino funcional, pilates e performance",
      toneOfVoice: "Energético, direto e motivador",
      targetAudience: "Pessoas buscando saúde, constância e treinos de alta energia (20-38 anos)",
      avatarColor: "#10B981",
      brandKit: {
        primaryColor: "#061612",
        secondaryColor: "#0B2E26",
        accentColor: "#10B981",
        backgroundColor: "#061612",
        textColor: "#ECFDF5",
        fontFamily: "display",
        handle: "@fitpulsestudio",
      },
      accounts: [
        {
          id: "acc_fit_ig",
          platform: "instagram",
          username: "@fitpulsestudio",
          accountName: "FitPulse Studio",
          connected: true,
          mode: "simulation",
          lastSyncedAt: now.toISOString(),
        },
        {
          id: "acc_fit_tt",
          platform: "tiktok",
          username: "@fitpulsestudio",
          accountName: "FitPulse Treinos",
          connected: true,
          mode: "simulation",
          lastSyncedAt: now.toISOString(),
        },
        {
          id: "acc_fit_fb",
          platform: "facebook",
          username: "FitPulse Studio",
          accountName: "FitPulse Página",
          connected: false,
          mode: "simulation",
        },
      ],
      createdAt: yesterday,
    },
  ];

  const posts: ScheduledPost[] = [
    {
      id: "post_seed_1",
      clientId: "cli_aurora",
      title: "Lançamento Cold Brew Baunilha",
      platforms: ["instagram", "facebook"],
      placement: "feed",
      caption:
        "O frescor que a sua tarde merece chegou. Nosso novo Cold Brew com notas naturais de baunilha de Madagascar passa por 18h de extração a frio. Qual vai ser o seu pedido de hoje?",
      hashtags: ["#cafeaurora", "#cafeespecial", "#coldbrew", "#barista"],
      firstComment: "Disponível em todas as unidades a partir das 10h!",
      mediaType: "image",
      layoutConfig: {
        template: "editorial-bold",
        aspectRatio: "4:5",
        backgroundColor: "#1C1410",
        gradientEndColor: "#4A2C1A",
        useGradient: true,
        overlayOpacity: 0.35,
        badgeText: "LANÇAMENTO DE VERÃO",
        headline: "Cold Brew Baunilha 18h",
        subheadline: "Extração lenta a frio com grãos selecionados da Mantiqueira.",
        ctaText: "PROVE HOJE NA LOJA",
        handleText: "@cafeaurora.br",
        accentColor: "#F59E0B",
        textColor: "#FFFBEB",
        align: "left",
        headlineSize: 64,
        fontFamily: "serif",
      },
      scheduledAt: in2Hours,
      status: "scheduled",
      publishLogs: [],
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: "post_seed_2",
      clientId: "cli_aurora",
      title: "Story Enquete: Espresso ou Coado?",
      platforms: ["instagram", "tiktok"],
      placement: "story",
      caption: "Começando o dia com a decisão mais importante da manhã. Comenta aí: time espresso ou time coado V60?",
      hashtags: ["#cafedamanha", "#v60", "#espresso"],
      mediaType: "image",
      layoutConfig: {
        template: "gradient-story",
        aspectRatio: "9:16",
        backgroundColor: "#2B1810",
        gradientEndColor: "#78350F",
        useGradient: true,
        overlayOpacity: 0.25,
        badgeText: "DUELO DA MANHÃ",
        headline: "Espresso intenso ou V60 suave?",
        subheadline: "Vote na enquete e ganhe 15% OFF no seu próximo pedido.",
        ctaText: "RESPONDA ESTE STORY",
        handleText: "@cafeaurora.br",
        accentColor: "#FBBF24",
        textColor: "#FFFFFF",
        align: "center",
        headlineSize: 68,
        fontFamily: "serif",
      },
      scheduledAt: tomorrowMorning,
      status: "scheduled",
      publishLogs: [],
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: "post_seed_3",
      clientId: "cli_fitpulse",
      title: "Desafio 21 Dias de Constância",
      platforms: ["instagram", "tiktok", "facebook"],
      placement: "reels",
      caption:
        "Não é sobre treinar 3 horas um dia e sumir na semana seguinte. É sobre aparecer 30 minutos todos os dias. Comente 'PULSE' para receber o cronograma gratuito!",
      hashtags: ["#fitpulse", "#desafio21dias", "#treinofuncional", "#constancia"],
      mediaType: "image",
      layoutConfig: {
        template: "promo-offer",
        aspectRatio: "9:16",
        backgroundColor: "#04120E",
        gradientEndColor: "#064E3B",
        useGradient: true,
        overlayOpacity: 0.3,
        badgeText: "TURMA ABERTA",
        headline: "21 Dias de Constância Real",
        subheadline: "Treinos guiados de 30 minutos + acompanhamento diário no app.",
        ctaText: "COMENTE 'PULSE'",
        handleText: "@fitpulsestudio",
        accentColor: "#34D399",
        textColor: "#ECFDF5",
        align: "left",
        headlineSize: 66,
        fontFamily: "display",
      },
      scheduledAt: in2Days,
      status: "scheduled",
      publishLogs: [],
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: "post_seed_4",
      clientId: "cli_aurora",
      title: "Bastidores da Torra Semanal",
      platforms: ["instagram", "facebook"],
      placement: "feed",
      caption: "Aroma de torra fresca no ar! Cada lote é acompanhado grau por grau para realçar a doçura natural do grão.",
      hashtags: ["#torrefacao", "#cafeaurora", "#cafedeverdade"],
      mediaType: "image",
      layoutConfig: {
        template: "minimal-clean",
        aspectRatio: "1:1",
        backgroundColor: "#181311",
        gradientEndColor: "#2C1D16",
        useGradient: false,
        overlayOpacity: 0.2,
        badgeText: "BASTIDORES",
        headline: "Torra Fresca Toda Terça",
        subheadline: "Do produtor direto para a sua xícara com rastreabilidade total.",
        ctaText: "RESERVE SEU PACOTE",
        handleText: "@cafeaurora.br",
        accentColor: "#F59E0B",
        textColor: "#FAF5F0",
        align: "center",
        headlineSize: 58,
        fontFamily: "serif",
      },
      scheduledAt: yesterday,
      status: "published",
      publishLogs: [
        {
          platform: "instagram",
          status: "published",
          mode: "simulation",
          externalPostId: "sim_ig_902184",
          message: "Publicado com sucesso no Feed do Instagram (Modo Simulação).",
          timestamp: yesterday,
        },
        {
          platform: "facebook",
          status: "published",
          mode: "simulation",
          externalPostId: "sim_fb_441092",
          message: "Publicado com sucesso na Página do Facebook (Modo Simulação).",
          timestamp: yesterday,
        },
      ],
      createdAt: yesterday,
      updatedAt: yesterday,
    },
  ];

  return { clients, posts, users: [] };
}

async function ensurePgSchema(): Promise<void> {
  if (pgInitialized) return;
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      agency_name TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      niche TEXT NOT NULL,
      tone_of_voice TEXT NOT NULL,
      target_audience TEXT NOT NULL,
      avatar_color TEXT NOT NULL,
      brand_kit JSONB NOT NULL,
      accounts JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      platforms JSONB NOT NULL,
      placement TEXT NOT NULL,
      caption TEXT NOT NULL,
      hashtags JSONB NOT NULL,
      first_comment TEXT,
      media_url TEXT,
      media_type TEXT NOT NULL DEFAULT 'image',
      layout_config JSONB,
      scheduled_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      publish_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const countRes = await db.query("SELECT COUNT(*)::int AS count FROM clients");
  if (countRes.rows[0].count === 0) {
    const seed = buildSeedData();
    for (const c of seed.clients) {
      await db.query(
        `INSERT INTO clients (id, name, niche, tone_of_voice, target_audience, avatar_color, brand_kit, accounts, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          c.id,
          c.name,
          c.niche,
          c.toneOfVoice,
          c.targetAudience,
          c.avatarColor,
          JSON.stringify(c.brandKit),
          JSON.stringify(c.accounts),
          c.createdAt,
        ]
      );
    }
    for (const p of seed.posts) {
      await db.query(
        `INSERT INTO scheduled_posts (id, client_id, title, platforms, placement, caption, hashtags, first_comment, media_url, media_type, layout_config, scheduled_at, status, publish_logs, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb, $8, $9, $10, $11::jsonb, $12, $13, $14::jsonb, $15, $16)
         ON CONFLICT (id) DO NOTHING`,
        [
          p.id,
          p.clientId,
          p.title,
          JSON.stringify(p.platforms),
          p.placement,
          p.caption,
          JSON.stringify(p.hashtags),
          p.firstComment ?? null,
          p.mediaUrl ?? null,
          p.mediaType,
          p.layoutConfig ? JSON.stringify(p.layoutConfig) : null,
          p.scheduledAt,
          p.status,
          JSON.stringify(p.publishLogs),
          p.createdAt,
          p.updatedAt,
        ]
      );
    }
  }
  pgInitialized = true;
}

async function readLocalStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as StoreData;
    return {
      clients: parsed.clients || [],
      posts: parsed.posts || [],
      users: parsed.users || [],
    };
  } catch {
    const seed = buildSeedData();
    await writeLocalStore(seed);
    return seed;
  }
}

async function writeLocalStore(data: StoreData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function mapPgClient(row: Record<string, unknown>): ClientWorkspace {
  return {
    id: String(row.id),
    name: String(row.name),
    niche: String(row.niche),
    toneOfVoice: String(row.tone_of_voice),
    targetAudience: String(row.target_audience),
    avatarColor: String(row.avatar_color),
    brandKit: row.brand_kit as ClientWorkspace["brandKit"],
    accounts: row.accounts as ClientWorkspace["accounts"],
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapPgPost(row: Record<string, unknown>): ScheduledPost {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    title: String(row.title),
    platforms: row.platforms as ScheduledPost["platforms"],
    placement: row.placement as ScheduledPost["placement"],
    caption: String(row.caption),
    hashtags: row.hashtags as string[],
    firstComment: row.first_comment ? String(row.first_comment) : undefined,
    mediaUrl: row.media_url ? String(row.media_url) : undefined,
    mediaType: (row.media_type as "image" | "video") || "image",
    layoutConfig: (row.layout_config as ScheduledPost["layoutConfig"]) || undefined,
    scheduledAt: new Date(String(row.scheduled_at)).toISOString(),
    status: row.status as ScheduledPost["status"],
    publishLogs: (row.publish_logs as ScheduledPost["publishLogs"]) || [],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

export async function listClients(): Promise<ClientWorkspace[]> {
  if (hasPostgres()) {
    await ensurePgSchema();
    const res = await getPool().query("SELECT * FROM clients ORDER BY created_at ASC");
    return res.rows.map(mapPgClient);
  }
  const store = await readLocalStore();
  return store.clients;
}

export async function getClientById(id: string): Promise<ClientWorkspace | null> {
  if (hasPostgres()) {
    await ensurePgSchema();
    const res = await getPool().query("SELECT * FROM clients WHERE id = $1", [id]);
    return res.rows[0] ? mapPgClient(res.rows[0]) : null;
  }
  const store = await readLocalStore();
  return store.clients.find((c) => c.id === id) ?? null;
}

export async function createClient(
  input: Omit<ClientWorkspace, "id" | "createdAt">
): Promise<ClientWorkspace> {
  const client: ClientWorkspace = {
    ...input,
    id: generateId("cli"),
    createdAt: new Date().toISOString(),
  };
  if (hasPostgres()) {
    await ensurePgSchema();
    await getPool().query(
      `INSERT INTO clients (id, name, niche, tone_of_voice, target_audience, avatar_color, brand_kit, accounts, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)`,
      [
        client.id,
        client.name,
        client.niche,
        client.toneOfVoice,
        client.targetAudience,
        client.avatarColor,
        JSON.stringify(client.brandKit),
        JSON.stringify(client.accounts),
        client.createdAt,
      ]
    );
    return client;
  }
  const store = await readLocalStore();
  store.clients.push(client);
  await writeLocalStore(store);
  return client;
}

export async function updateClient(
  id: string,
  patch: Partial<Omit<ClientWorkspace, "id" | "createdAt">>
): Promise<ClientWorkspace | null> {
  const existing = await getClientById(id);
  if (!existing) return null;
  const updated: ClientWorkspace = { ...existing, ...patch };

  if (hasPostgres()) {
    await ensurePgSchema();
    await getPool().query(
      `UPDATE clients
       SET name = $2, niche = $3, tone_of_voice = $4, target_audience = $5,
           avatar_color = $6, brand_kit = $7::jsonb, accounts = $8::jsonb
       WHERE id = $1`,
      [
        id,
        updated.name,
        updated.niche,
        updated.toneOfVoice,
        updated.targetAudience,
        updated.avatarColor,
        JSON.stringify(updated.brandKit),
        JSON.stringify(updated.accounts),
      ]
    );
    return updated;
  }

  const store = await readLocalStore();
  const idx = store.clients.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.clients[idx] = updated;
  await writeLocalStore(store);
  return updated;
}

export async function deleteClient(id: string): Promise<boolean> {
  if (hasPostgres()) {
    await ensurePgSchema();
    const res = await getPool().query("DELETE FROM clients WHERE id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  }
  const store = await readLocalStore();
  const prevLen = store.clients.length;
  store.clients = store.clients.filter((c) => c.id !== id);
  store.posts = store.posts.filter((p) => p.clientId !== id);
  await writeLocalStore(store);
  return store.clients.length < prevLen;
}

export async function listPosts(clientId?: string): Promise<ScheduledPost[]> {
  if (hasPostgres()) {
    await ensurePgSchema();
    const res = clientId
      ? await getPool().query(
          "SELECT * FROM scheduled_posts WHERE client_id = $1 ORDER BY scheduled_at ASC",
          [clientId]
        )
      : await getPool().query("SELECT * FROM scheduled_posts ORDER BY scheduled_at ASC");
    return res.rows.map(mapPgPost);
  }
  const store = await readLocalStore();
  const filtered = clientId
    ? store.posts.filter((p) => p.clientId === clientId)
    : store.posts;
  return filtered.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
}

export async function getPostById(id: string): Promise<ScheduledPost | null> {
  if (hasPostgres()) {
    await ensurePgSchema();
    const res = await getPool().query("SELECT * FROM scheduled_posts WHERE id = $1", [id]);
    return res.rows[0] ? mapPgPost(res.rows[0]) : null;
  }
  const store = await readLocalStore();
  return store.posts.find((p) => p.id === id) ?? null;
}

export async function createPost(
  input: Omit<ScheduledPost, "id" | "createdAt" | "updatedAt" | "publishLogs">
): Promise<ScheduledPost> {
  const now = new Date().toISOString();
  const post: ScheduledPost = {
    ...input,
    id: generateId("post"),
    publishLogs: [],
    createdAt: now,
    updatedAt: now,
  };

  if (hasPostgres()) {
    await ensurePgSchema();
    await getPool().query(
      `INSERT INTO scheduled_posts (
        id, client_id, title, platforms, placement, caption, hashtags, first_comment,
        media_url, media_type, layout_config, scheduled_at, status, publish_logs, created_at, updated_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb, $8, $9, $10, $11::jsonb, $12, $13, $14::jsonb, $15, $16)`,
      [
        post.id,
        post.clientId,
        post.title,
        JSON.stringify(post.platforms),
        post.placement,
        post.caption,
        JSON.stringify(post.hashtags),
        post.firstComment ?? null,
        post.mediaUrl ?? null,
        post.mediaType,
        post.layoutConfig ? JSON.stringify(post.layoutConfig) : null,
        post.scheduledAt,
        post.status,
        JSON.stringify(post.publishLogs),
        post.createdAt,
        post.updatedAt,
      ]
    );
    return post;
  }

  const store = await readLocalStore();
  store.posts.push(post);
  await writeLocalStore(store);
  return post;
}

export async function updatePost(
  id: string,
  patch: Partial<Omit<ScheduledPost, "id" | "createdAt">>
): Promise<ScheduledPost | null> {
  const existing = await getPostById(id);
  if (!existing) return null;
  const updated: ScheduledPost = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  if (hasPostgres()) {
    await ensurePgSchema();
    await getPool().query(
      `UPDATE scheduled_posts
       SET client_id = $2, title = $3, platforms = $4::jsonb, placement = $5,
           caption = $6, hashtags = $7::jsonb, first_comment = $8, media_url = $9,
           media_type = $10, layout_config = $11::jsonb, scheduled_at = $12,
           status = $13, publish_logs = $14::jsonb, updated_at = $15
       WHERE id = $1`,
      [
        id,
        updated.clientId,
        updated.title,
        JSON.stringify(updated.platforms),
        updated.placement,
        updated.caption,
        JSON.stringify(updated.hashtags),
        updated.firstComment ?? null,
        updated.mediaUrl ?? null,
        updated.mediaType,
        updated.layoutConfig ? JSON.stringify(updated.layoutConfig) : null,
        updated.scheduledAt,
        updated.status,
        JSON.stringify(updated.publishLogs),
        updated.updatedAt,
      ]
    );
    return updated;
  }

  const store = await readLocalStore();
  const idx = store.posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.posts[idx] = updated;
  await writeLocalStore(store);
  return updated;
}

export async function deletePost(id: string): Promise<boolean> {
  if (hasPostgres()) {
    await ensurePgSchema();
    const res = await getPool().query("DELETE FROM scheduled_posts WHERE id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  }
  const store = await readLocalStore();
  const prevLen = store.posts.length;
  store.posts = store.posts.filter((p) => p.id !== id);
  await writeLocalStore(store);
  return store.posts.length < prevLen;
}

function mapPgUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    agencyName: row.agency_name ? String(row.agency_name) : undefined,
    passwordHash: String(row.password_hash),
    role: row.role === "member" ? "member" : "admin",
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  if (hasPostgres()) {
    await ensurePgSchema();
    const res = await getPool().query("SELECT * FROM users WHERE LOWER(email) = $1", [normalized]);
    return res.rows[0] ? mapPgUser(res.rows[0]) : null;
  }
  const store = await readLocalStore();
  return (store.users || []).find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  if (hasPostgres()) {
    await ensurePgSchema();
    const res = await getPool().query("SELECT * FROM users WHERE id = $1", [id]);
    return res.rows[0] ? mapPgUser(res.rows[0]) : null;
  }
  const store = await readLocalStore();
  return (store.users || []).find((u) => u.id === id) ?? null;
}

export async function createUser(
  input: Omit<User, "id" | "createdAt">
): Promise<User> {
  const user: User = {
    ...input,
    email: input.email.trim().toLowerCase(),
    id: generateId("usr"),
    createdAt: new Date().toISOString(),
  };

  if (hasPostgres()) {
    await ensurePgSchema();
    await getPool().query(
      `INSERT INTO users (id, name, email, agency_name, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.id,
        user.name,
        user.email,
        user.agencyName ?? null,
        user.passwordHash,
        user.role,
        user.createdAt,
      ]
    );
    return user;
  }

  const store = await readLocalStore();
  store.users = store.users || [];
  store.users.push(user);
  await writeLocalStore(store);
  return user;
}

export async function listDueScheduledPosts(): Promise<ScheduledPost[]> {
  const nowIso = new Date().toISOString();
  if (hasPostgres()) {
    await ensurePgSchema();
    const res = await getPool().query(
      `SELECT * FROM scheduled_posts
       WHERE status = 'scheduled' AND scheduled_at <= $1
       ORDER BY scheduled_at ASC`,
      [nowIso]
    );
    return res.rows.map(mapPgPost);
  }
  const store = await readLocalStore();
  const nowMs = Date.now();
  return store.posts.filter(
    (p) => p.status === "scheduled" && new Date(p.scheduledAt).getTime() <= nowMs
  );
}
