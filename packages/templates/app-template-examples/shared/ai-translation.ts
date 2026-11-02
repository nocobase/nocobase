import type { ModelRef } from '@nocobase/app-plugin-agents/shared/models';

export const TRANSLATION_MAX_LENGTH = 10000;
export const TRANSLATION_LANGUAGES = [
  'zh-CN',
  'en',
  'ja',
  'ko',
  'fr',
  'de',
  'es',
] as const;

export type TranslationLanguage = (typeof TRANSLATION_LANGUAGES)[number];

export interface TranslationInput {
  text: string;
  sourceLanguage: 'auto' | TranslationLanguage;
  targetLanguage: TranslationLanguage;
  model: ModelRef;
}

export interface TranslationResult {
  translation: string;
}
