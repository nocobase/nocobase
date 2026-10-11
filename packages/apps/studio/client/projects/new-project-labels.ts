/**
 * The words of the new-project form parts (`code-location/parts`), from Studio's
 * `projectPage.newProject.labels` (`locales.ts`): each word looked up by its path, in the shape the English resources
 * have, which is the block's. The block fills its own `{name}` placeholders.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import type { NewProjectFormLabels } from './code-location/parts/labels.js';

import { projectPageEnUS } from './locales.js';

type Shape = { readonly [key: string]: string | Shape };

/** `shape` with every word looked up at its path under `prefix`. */
function translated<T extends Shape>(
  t: (key: string) => string,
  prefix: string,
  shape: T,
): T {
  return Object.fromEntries(
    Object.entries(shape).map(([key, value]) => [
      key,
      typeof value === 'string'
        ? t(`${prefix}.${key}`)
        : translated(t, `${prefix}.${key}`, value),
    ]),
  ) as T;
}

export function useNewProjectFormLabels(): NewProjectFormLabels {
  const { t } = useTranslation();
  return useMemo(
    () =>
      translated(
        (key) => t(key),
        'projectPage.newProject.labels',
        projectPageEnUS.newProject.labels,
      ),
    [t],
  );
}
