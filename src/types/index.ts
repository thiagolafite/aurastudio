export type Platform = "instagram" | "tiktok" | "facebook";

export type Placement = "feed" | "story" | "reels";

export type AspectRatio = "1:1" | "4:5" | "9:16";

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

export type LayoutTemplateId =
  | "editorial-bold"
  | "minimal-clean"
  | "split-card"
  | "gradient-story"
  | "promo-offer"
  | "quote-insight";

export type BackgroundPatternId =
  | "clean-gradient"
  | "mesh-aurora"
  | "diagonal-split"
  | "concentric-rings"
  | "grid-tech"
  | "waves-organic"
  | "bauhaus-geo"
  | "dot-matrix"
  | "glass-cards"
  | "spotlight-beams";

export interface BrandKit {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: "sans" | "serif" | "display";
  handle: string;
  defaultExternalUrl?: string;
}

export interface SocialAccount {
  id: string;
  platform: Platform;
  username: string;
  accountName: string;
  connected: boolean;
  mode: "simulation" | "live";
  authProvider?: "meta" | "instagram"; // "instagram" = Instagram API with Instagram Login (no Facebook Page)
  // Official API fields (Instagram Login / Meta Graph API / TikTok Content Posting API)
  externalAccountId?: string; // IG User ID, FB Page ID, or TikTok Open ID
  accessToken?: string;
  lastSyncedAt?: string;
}

export interface ClientWorkspace {
  id: string;
  name: string;
  niche: string;
  toneOfVoice: string;
  targetAudience: string;
  avatarColor: string;
  brandKit: BrandKit;
  accounts: SocialAccount[];
  createdAt: string;
}

export type DraggableElementKey = "badge" | "headline" | "subheadline" | "cta" | "handle";

export interface ElementOffset {
  x: number;
  y: number;
}

export interface LayoutConfig {
  template: LayoutTemplateId;
  aspectRatio: AspectRatio;
  backgroundColor: string;
  gradientEndColor: string;
  useGradient: boolean;
  backgroundImageUrl?: string;
  overlayOpacity: number; // 0 to 0.9
  badgeText: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaUrl?: string;
  handleText: string;
  accentColor: string;
  textColor: string;
  align: "left" | "center" | "right";
  headlineSize: number; // 36 to 84
  fontFamily: "sans" | "serif" | "display";
  backgroundPattern?: BackgroundPatternId;
  patternIntensity?: number; // 0.1 to 1.0
  elementPositions?: Partial<Record<DraggableElementKey, ElementOffset>>;
}

export interface PublishLogEntry {
  platform: Platform;
  status: "published" | "failed";
  mode: "simulation" | "live";
  externalPostId?: string;
  message: string;
  timestamp: string;
}

export interface ScheduledPost {
  id: string;
  clientId: string;
  title: string;
  platforms: Platform[];
  placement: Placement;
  caption: string;
  hashtags: string[];
  firstComment?: string;
  externalUrl?: string;
  mediaUrl?: string;
  mediaType: "image" | "video";
  layoutConfig?: LayoutConfig;
  scheduledAt: string; // ISO string
  status: PostStatus;
  publishLogs: PublishLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AiLayoutIdea {
  id: string;
  conceptName: string;
  rationale: string;
  recommendedPlacement: Placement;
  recommendedPlatforms: Platform[];
  layout: LayoutConfig;
  captionInstagram: string;
  captionTikTok: string;
  captionFacebook: string;
  hashtags: string[];
  bestTimeToPost: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  agencyName?: string;
  passwordHash: string;
  role: "admin" | "member";
  createdAt: string;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface StoreData {
  clients: ClientWorkspace[];
  posts: ScheduledPost[];
  users?: User[];
}
