/** What an App does for a repository, in the reader's language, as the deleted-App texts say it. */
import { useTranslation } from '@nocobase/i18n/client';

import type { AppUsageRepository } from '../../shared/releases.js';

/** "staging and previews": the role, and previews when the repository previews the App. */
export function useRoleParts(): (
  repository: Pick<AppUsageRepository, 'role' | 'previews'>,
) => string {
  const { t, i18n } = useTranslation();
  return (repository) => {
    const parts = [
      ...(repository.role
        ? [t(`previews.deleteImpact.parts.${repository.role}`)]
        : []),
      ...(repository.previews
        ? [t('previews.deleteImpact.parts.previews')]
        : []),
    ];
    if (parts.length === 0) return t('previews.deleteImpact.parts.builds');
    return new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(
      parts,
    );
  };
}
