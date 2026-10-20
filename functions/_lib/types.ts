// functions/_lib/types.ts
// Core TypeScript interfaces for LINKR platform

export type ProfileStatus = 'unassigned' | 'assigned' | 'active' | 'suspended' | 'archived';
export type ProfileTier = 'direct' | 'redirect' | 'full';

export interface LinkItem {
  type: string;
  value: string;
  label?: string;
}

export interface ProfileTheme {
  mode?: 'light' | 'dark';
  accent?: string | null;
  background?: string | null;
  profile_bg?: string | null;
  surface?: string | null;
  border?: string | null;
  text?: string | null;
  muted?: string | null;
  action?: string | null;
}

export interface ProfileShowFlags {
  name?: boolean;
  title?: boolean;
  bio?: boolean;
  photo?: boolean;
  company_logo?: boolean;
  large_logo?: boolean;
}

export const PROFILE_SECTION_IDS = ['identity', 'links', 'share', 'qr'] as const;
export type ProfileSectionId = typeof PROFILE_SECTION_IDS[number];

export const PROFILE_THEME_PRESET_IDS = ['monochrome-photo', 'gold-glass', 'gold-clean'] as const;
export type ProfileThemePresetId = typeof PROFILE_THEME_PRESET_IDS[number];

export const PROFILE_ICON_PACK_IDS = ['classic', 'bold'] as const;
export type ProfileIconPackId = typeof PROFILE_ICON_PACK_IDS[number];

/** Safe design choices only; this never contains client-authored markup or code. */
export interface ProfileDesign {
  sections?: ProfileSectionId[];
  themePreset?: ProfileThemePresetId;
  iconPack?: ProfileIconPackId;
}

export interface ProfileData {
  schema: number;
  template: string;
  profile_mode?: 'standard' | 'logo_only';
  name?: string;
  company?: string;
  title?: string;
  title_link?: string | null;
  bio?: string | null;
  location?: string | null;
  photo?: string | null;
  company_logo?: string | null;
  background_image?: string | null;
  qr_code?: string | null;
  primary_action_label?: string;
  primary_action_url?: string;
  vcard?: string | null;
  show?: ProfileShowFlags;
  theme?: ProfileTheme;
  design?: ProfileDesign;
  links?: LinkItem[];
  redirect_url?: string | null;
  retailer?: string;
  order?: string;
}

export interface ProfileRecord {
  id: string;
  seq: number;
  status: ProfileStatus;
  tier: ProfileTier;
  template: string;
  data: string; // JSON string of ProfileData
  claim_hash?: string | null;
  order_id?: number | null;
  retailer_id?: number | null;
  batch_id?: number | null;
  version: number;
  created_at: string;
  updated_at: string;
  activated_at?: string | null;
}

export interface Env {
  DB: D1Database;
  R2_STORAGE?: R2Bucket;
  ASSETS?: Fetcher;
  ENVIRONMENT?: string;
  BASE_URL?: string;
  DOMAIN?: string;
  DEFAULT_TEMPLATE?: string;
  SCAN_ANALYTICS?: any;
  CLIENT_PORTAL_URL?: string;
  CLIENT_PORTAL_API_TOKEN?: string;
}
