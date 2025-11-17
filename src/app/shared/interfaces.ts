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
 * Rappresenta la struttura completa della risposta dell'endpoint `/getHomeData`.
 */
export interface ApiDataResponse {
  hero_videos: Video[];
  trending_main_videos: Video[];
  recently_added_videos: Video[];
  categories_by_macro: {
    [macroTitle: string]: {
      categories: HomeApiCategory[];
    };
  };
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
  duration: string | number | undefined
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
