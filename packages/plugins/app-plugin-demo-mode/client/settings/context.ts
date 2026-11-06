import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { createContext, useContext, type Context } from 'react';

import type { DemoSettingsComponents } from './components.js';
import { DEMO_MODE_NAMESPACE } from '../namespace.js';

/** A dataset count label in the application's language. */
export type DemoLabelKind = 'count';

export interface DemoSettingsOptions {
  /** Optional host page chrome and primitives; keep component identities stable across renders. */
  readonly components?: DemoSettingsComponents;
  /** The application's name for a dataset count (`count`, `companies`); undefined falls back to its id. */
  readonly label?: (kind: DemoLabelKind, id: string) => string | undefined;
  /**
   * Called when a data operation this page watched finishes.
   * An application refreshes what it caches, such as its query cache.
   */
  readonly onDataChange?: () => void;
}

export const DemoSettingsContext: Context<DemoSettingsOptions> =
  createContext<DemoSettingsOptions>({});

export function useT(): (
  key: string,
  values?: Record<string, unknown>,
) => string {
  const { t } = useTranslation(DEMO_MODE_NAMESPACE);
  return (key, values) => t(`settings.${key}`, values);
}

/** A dataset count's name: the application's label, else its id. */
export function useLabel(): (kind: DemoLabelKind, id: string) => string {
  const { label } = useContext(DemoSettingsContext);
  return (kind, id) => label?.(kind, id) ?? id;
}

/** A language's own name, such as 简体中文 for zh-CN. */
export function languageName(language: string): string {
  if (language === 'zh-CN') return '简体中文';
  if (language === 'en-US') return 'English';
  try {
    return (
      new Intl.DisplayNames([language], { type: 'language' }).of(language) ??
      language
    );
  } catch {
    return language;
  }
}

/** A sentence for a failed request: the known reasons first, then the server's own translated message. */
export function useErrorText(): (error: unknown) => string {
  const t = useT();
  return (error) => {
    if (!(error instanceof ApiClientError)) return t('errors.failed');
    if (error.reason === 'DEMO_MODE_REQUIRED')
      return t('errors.demoModeRequired');
    if (error.status === 401) return t('errors.signedOut');
    if (error.status === 403) return t('errors.denied');
    const localized = (
      error.payload as
        { error?: { localizedMessage?: { message?: unknown } } } | undefined
    )?.error?.localizedMessage;
    return typeof localized?.message === 'string' && localized.message.trim()
      ? localized.message
      : t('errors.failed');
  };
}
