import type { I18nRuntime } from '@nocobase/i18n';

import { STUDIO_NAMESPACE } from '../../shared/access.js';
import { ciTaskTitle } from './ci-modes.js';

/**
 * The title of the issue an agent connects a repository's CI in, in the installation's language (`ci.taskTitle` in the
 * server locales). An issue's title is stored as text everyone reads, so it is worded once rather than per viewer;
 * English when the language cannot be loaded.
 */
export async function localizedCiTaskTitle(
  i18n: I18nRuntime | undefined,
  locale: string | undefined,
  repo: string,
): Promise<string> {
  const fallback = ciTaskTitle(repo);
  if (!i18n) return fallback;
  const language = locale ?? i18n.getDefaultLocale();
  try {
    await i18n.ensureLocaleLoaded(language);
    return i18n.getFixedT(STUDIO_NAMESPACE, language)('ci.taskTitle', {
      repo,
      defaultValue: fallback,
    });
  } catch {
    return fallback;
  }
}
