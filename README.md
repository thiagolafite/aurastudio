# AuraStudio — Agência Multi-Cliente, Estúdio de Layout IA & Agendamento Automático

Plataforma web em **Next.js (App Router) + TypeScript + Tailwind CSS v4** construída para agências e gestores de social media criarem artes, gerarem ideias de layout com **IA (Google Gemini 4)** e agendarem **publicações automáticas** no **Instagram (Feed, Reels e Stories)**, **TikTok** e **Facebook**.

## Funcionalidades incluídas

- **Multi-Cliente (Agência)**: workspaces independentes por marca, com Brand Kit (cores, fonte, `@handle`, nicho, tom de voz e público-alvo) e contas sociais separadas.
- **Estúdio de Layout Visual**:
  - Editor ao vivo com renderização em alta resolução (`1080x1080`, `1080x1350`, `1080x1920`).
  - 6 templates prontos (*Editorial Bold*, *Minimalista*, *Cartão Dividido*, *Story Gradiente*, *Oferta/Promo*, *Citação*).
  - Upload de foto de fundo, cores, tipografia, alinhamento, selo superior, CTA e exportação em PNG.
  - Edição de legenda, hashtags, primeiro comentário e pré-visualização para Instagram, TikTok e Facebook.
- **Diretor de Arte IA (`@google/genai` — `gemini-4-hydrogen`)**:
  - Gera 3 propostas completas de layout + legendas adaptadas por rede e hashtags a partir de um briefing curto.
  - Aplica qualquer layout no Estúdio com **1 clique**.
  - Inclui gerador local de fallback caso `GEMINI_API_KEY` ainda não esteja configurada.
- **Calendário Editorial & Fila de Publicação**:
  - Calendário mensal interativo com diferenciação por rede e formato (`Feed`, `Stories`, `Reels`).
- **Motor de Publicação Automática (Nuvem — Vercel Schedules)**:
  - `vercel.json` configurado para executar `src/app/api/schedules/publish/route.ts` a cada 5 minutos (`America/Sao_Paulo`).
  - Conectores oficiais para **Meta Graph API v21.0** (Instagram Feed/Reels/Stories + Facebook Feed/Stories) e **TikTok Content Posting API v2**.
  - **Modo Simulação** por conta para testar todo o fluxo antes de ativar os tokens oficiais.

## Como rodar localmente

1. Instale as dependências (requer Node.js 20+ com `npm`):
   ```bash
   npm install
   ```
2. (Opcional) Copie `.env.example` para `.env.local` e adicione sua `GEMINI_API_KEY`.
   - Sem `DATABASE_URL`, o app salva automaticamente em `data/store.json` com dados de exemplo.
   - Sem `BLOB_READ_WRITE_TOKEN`, as artes exportadas são salvas em `public/uploads/`.
3. Inicie o servidor:
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`.

## Como publicar na nuvem (Vercel)

1. Suba o projeto para um repositório no GitHub e importe na **Vercel**.
2. Em **Storage** na Vercel, conecte:
   - **Neon Postgres** (define automaticamente `DATABASE_URL` — as tabelas são criadas automaticamente na 1ª requisição).
   - **Vercel Blob** (define automaticamente `BLOB_READ_WRITE_TOKEN`, necessário para URLs públicas de imagem exigidas por Meta e TikTok).
3. Em **Settings → Environment Variables**, adicione:
   - `GEMINI_API_KEY` (pegue em https://aistudio.google.com/apikey)
   - `NEXT_PUBLIC_APP_URL` (ex: `https://seu-projeto.vercel.app`)
4. Faça o deploy. O agendamento automático via **Vercel Schedules** (`vercel.json`) será ativado automaticamente.

## Conectando as APIs oficiais

- **Instagram & Facebook (Meta Graph API)**:
  - A conta do Instagram precisa ser **Profissional (Comercial ou Criador)** vinculada a uma Página do Facebook.
  - Crie um app no [Meta for Developers](https://developers.facebook.com/), adicione *Instagram Graph API* e *Facebook Login for Business* com permissões `instagram_basic`, `instagram_content_publish`, `pages_manage_posts` e `pages_read_engagement`.
  - Na aba **Contas, APIs & Marca**, troque o modo para **API Oficial** e cole o *IG Business Account ID / Page ID* e o *Long-Lived Access Token*.
- **TikTok (Content Posting API v2)**:
  - Crie um app no [TikTok for Developers](https://developers.tiktok.com/) com o produto *Content Posting API* (escopo `video.publish`).
  - Cole o *Access Token* na aba **Contas, APIs & Marca** do cliente.
