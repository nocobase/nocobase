import { useTranslation } from '@nocobase/i18n/client';
import {
  FOUNDATION_I18N_NAMESPACE,
  type FoundationText,
} from '../../shared/foundation.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function useFoundationTranslation(): {
  readonly t: Translate;
  readonly locale: string;
  /** Words a code the server sent, or shows the code itself when this client does not know it yet. */
  readonly word: (key: string, options?: Record<string, unknown>) => string;
  /** A name the application stored, translated when it is a key the page has loaded. */
  readonly text: (value: FoundationText) => string;
} {
  const { t, i18n } = useTranslation(FOUNDATION_I18N_NAMESPACE);
  const translate = t as unknown as Translate;
  return {
    t: translate,
    locale: i18n.language,
    word: (key, options) =>
      i18n.exists(key, { ns: FOUNDATION_I18N_NAMESPACE })
        ? translate(key, options)
        : (key.split('.').pop() ?? key),
    text: (value) =>
      typeof value === 'string'
        ? value
        : i18n.exists(value.key, { ns: value.ns })
          ? translate(value.key, { ns: value.ns })
          : (value.key.split('.').pop() ?? value.key),
  };
}
