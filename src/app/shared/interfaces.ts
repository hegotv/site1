// src/app/shared/interfaces.ts

// ===================================================================
// INTERFACCE PRINCIPALI DELL'APPLICAZIONE
// ===================================================================

/**
 * Definisce la struttura dei dati del profilo di un utente.
 * Usata in tutta l'applicazione per rappresentare l'utente loggato.
 */
export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string;
  username?: string;
}

export interface Video {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  duration: string;
  visuals: number;
  saveds: number;
  libraryID: string;
  videoID: string;
  season: number;
  premium_only: boolean;
  pub_date: string;
  last_position_seconds?: number;
  is_completed?: boolean;
  isSaved?: boolean | null;
}

/**
 * Rappresenta i dati di una categoria salvata dall'utente.
 * Spesso è una versione semplificata dell'oggetto Category completo.
 */
export interface SavedCategory {
  id: number;
  title: string;
  slug: string;
  CatimageOrizz?: string | null;
}

export interface Category {
  id: number;
  title: string;
  slug: string;
  CatimageOrizz: string | null;
  CatimageVert: string | null;
  description: string | null;
  video_ordering?: 'asc' | 'desc'; // Nuovo campo per l'ordinamento dei video
  videos: Video[];
  macro?: string;
}

/**
 * Rappresenta un oggetto Macro.
 */
export interface Macro {
  title: string;
  img: string | null;
}

// ===================================================================
// INTERFACCE PER LE RISPOSTE RAW DELL'API
// ===================================================================

/** Risposta generica dall'API. */
export interface ApiResponse {
  response: string;
  [key: string]: any;
}

/**
 * Descrive l'oggetto categoria restituito all'interno di `categories_by_macro`.
 */
export interface HomeApiCategory {
  id: number;
  title: string;
  slug: string;
  CatimageOrizz: string | null;
  CatimageVert: string | null;
  desc: string | null;
  videos: Video[];
}

/**
 * Tipo di destinazione a cui punta un banner o una tile del carousel home:
 * un singolo video, una stagione di una Category, oppure una Category intera (serie).
 */
export type HomeLinkType = 'video' | 'season' | 'series';

export interface HomeBannerVideoLink {
  link_type: 'video';
  image: string;
  title: string;
  video_id: string;
}

export interface HomeBannerSeriesLink {
  link_type: 'series';
  image: string;
  title: string;
  category_id: number;
  category_slug: string;
}

export interface HomeBannerSeasonLink {
  link_type: 'season';
  image: string;
  title: string;
  category_id: number;
  category_slug: string;
  season: number;
}

/** Payload dell'HomeBanner: può puntare a un video, una stagione o una serie. */
export type HomeBanner =
  | HomeBannerVideoLink
  | HomeBannerSeriesLink
  | HomeBannerSeasonLink;

export interface HomeCarouselVideoItem extends Video {
  link_type: 'video';
}

export interface HomeCarouselSeriesItem {
  link_type: 'series';
  title: string;
  category: string;
  category_id: number;
  category_slug: string;
  thumbnail: string;
}

export interface HomeCarouselSeasonItem {
  link_type: 'season';
  title: string;
  category: string;
  category_id: number;
  category_slug: string;
  thumbnail: string;
  season: number;
}

/** Item dell'HomeSectionVideo (carousel `hero_videos`): video, stagione o serie. */
export type HomeCarouselItem =
  | HomeCarouselVideoItem
  | HomeCarouselSeriesItem
  | HomeCarouselSeasonItem;

/**
 * Rappresenta la struttura completa della risposta dell'endpoint `/getHomeData`.
 */
export interface ApiDataResponse {
  hero_videos: HomeCarouselItem[];
  trending_main_videos: Video[];
  recently_added_videos: Video[];
  categories_by_macro: {
    [macroTitle: string]: {
      categories: HomeApiCategory[];
    };
  };
  banner?: HomeBanner;
}

/**
 * Rappresenta la risposta dell'endpoint di ricerca.
 */
export interface ApiSearchResponse {
  response: string;
  data: {
    videos: Video[];
  };
}

// ===================================================================
// FUNZIONI UTILITY
// ===================================================================

/**
 * Converte una stringa di durata (es. "01:30:00") in secondi.
 */
export function durationToSeconds(
  duration: string | number | undefined,
): number {
  if (typeof duration === 'number') return duration;
  if (!duration) return 0;

  const parts = duration.split(':').map(Number);
  if (parts.some(isNaN)) return 0;

  let seconds = 0;
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    seconds = parts[0];
  }
  return seconds;
}
