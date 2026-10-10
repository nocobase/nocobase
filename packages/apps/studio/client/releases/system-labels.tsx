/**
 * The labels Studio adds to the Apps and releases of pull request previews (`shared/previews.ts` `RELEASE_LABELS`):
 * release management leaves them out where Apps are listed, showing the App's origin line in their place
 * (`app-origin.tsx`), shows them read-only with why they are there in an App's settings (`ReleasesSystemLabelsContext`),
 * and keeps them when someone edits an App's other labels. Every `nb-studio` label is Studio's, whatever its value.
 */
import {
  ReleasesSystemLabelsContext,
  type SystemLabels,
} from '@nocobase/app-plugin-releases/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo, type ReactElement, type ReactNode } from 'react';

import { PREVIEW_LABEL, RELEASE_LABELS } from '../../shared/previews.js';

export function ReleaseSystemLabels({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const labels = useMemo<SystemLabels>(
    () => ({
      explain(key, value) {
        if (key === RELEASE_LABELS.kind)
          return value === PREVIEW_LABEL
            ? t('previews.systemLabels.kind')
            : t('previews.systemLabels.studio');
        if (
          key === RELEASE_LABELS.repository ||
          key === RELEASE_LABELS.pullRequest ||
          key === RELEASE_LABELS.pullRequestNumber
        )
          return t('previews.systemLabels.pullRequest');
        if (key === RELEASE_LABELS.app) return t('previews.systemLabels.app');
        if (
          key === RELEASE_LABELS.build ||
          key === RELEASE_LABELS.ref ||
          key === RELEASE_LABELS.promotedBuild
        )
          return t('previews.systemLabels.build');
        if (key === RELEASE_LABELS.ensured)
          return t('previews.systemLabels.ensured');
        return null;
      },
    }),
    [t],
  );
  return (
    <ReleasesSystemLabelsContext.Provider value={labels}>
      {children}
    </ReleasesSystemLabelsContext.Provider>
  );
}
