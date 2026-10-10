/**
 * The inbox entry of the CI setup (source `ci`, sent by `server/builds/ci-setup.ts`):
 *
 * - `ci_key_rotation_failed`: the project's lead and the administrators hear that a repository's CI key, about to
 *   expire, could not be rotated, with how many days are left and why;
 * - `ci_key_revoked`: the project's lead hears that someone disabled or deleted the key, so the CI is set up by hand;
 * - `repository_app_removed`: the project's lead hears that an App the repository built was deleted in release
 *   management, which turned its role off (`server/releases/app-removal.ts`); it opens the repository's settings,
 *   which offer to create it again.
 *
 * The others open the project, whose Overview shows the repository's CI. The card carries everything it shows.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { KeyRoundIcon, PackageXIcon } from 'lucide-react';

import type { InboxEntry } from '@/extensions/nocobase-inbox/model';
import { defineInboxRenderer } from '@/extensions/nocobase-inbox/registry';
import { CI_NAMESPACE, ciResources } from './ci.locales.js';

function value(entry: InboxEntry, key: string): string | null {
  const found = entry.notice?.data?.[key];
  if (typeof found === 'number') return String(found);
  return typeof found === 'string' && found !== '' ? found : null;
}

const typeOf = (entry: InboxEntry) =>
  entry.notice?.type ?? 'ci_key_rotation_failed';

export const ciRenderer = defineInboxRenderer<null>({
  source: 'ci',
  types: ['ci_key_rotation_failed', 'ci_key_revoked', 'repository_app_removed'],
  namespace: CI_NAMESPACE,
  resources: ciResources,
  icon: (entry) =>
    typeOf(entry) === 'repository_app_removed' ? PackageXIcon : KeyRoundIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: (entry, where) =>
        t(`${where === 'detail' ? 'headings' : 'types'}.${typeOf(entry)}`),
      text: (entry) => {
        const repo =
          value(entry, 'repo') ?? value(entry, 'projectName') ?? t('unknown');
        if (typeOf(entry) === 'repository_app_removed')
          return {
            title: t('appRemovedTitle', {
              repo,
              app: value(entry, 'appName') ?? value(entry, 'appId') ?? '?',
            }),
            sentence: t('appRemovedSentence'),
          };
        if (typeOf(entry) === 'ci_key_revoked')
          return {
            title: t('revokedTitle', {
              repo,
              how: t(`how.${value(entry, 'how') ?? 'disabled'}`),
            }),
            sentence: t('revokedSentence'),
          };
        return {
          title: t('rotationTitle', {
            repo,
            days: value(entry, 'days') ?? '?',
          }),
          sentence: t('rotationSentence', {
            error: value(entry, 'error') ?? '',
          }),
        };
      },
      open: t('open'),
    };
  },
  context: () => ({}),
});
