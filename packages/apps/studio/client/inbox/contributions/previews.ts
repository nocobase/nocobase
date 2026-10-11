/**
 * The inbox entries of issue previews (source `previews`, sent by `server/previews/notices.ts`) and of deployment
 * marks (source `deploys`, `server/deploys/service.ts`), worded in Studio's own namespace:
 *
 * - `preview_ready`, `preview_failed`: the owner of an issue a pull request is linked to hears its preview is ready
 *   (with the address) or failed (why; for one blocked on variables, which ones and where to set them);
 * - `unreleased`: a project's release owner hears that finished issues wait for a release, counted per project.
 *
 * Each item opens what it is about (the issue, the project); nothing to decide.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { MonitorPlayIcon, PackageIcon, TriangleAlertIcon } from 'lucide-react';

import { defineInboxRenderer } from '@/extensions/nocobase-inbox/registry';
import { missingOf } from './previews-model.js';
import { PreviewFailedBody } from './previews-parts.js';
import { field } from './releases.locales.js';

export const previewsRenderer = defineInboxRenderer<null>({
  source: 'previews',
  types: ['preview_ready', 'preview_failed'],
  icon: (entry) =>
    entry.notice?.type === 'preview_failed'
      ? TriangleAlertIcon
      : MonitorPlayIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: (entry) =>
        t(`previews.inbox.types.${entry.notice?.type ?? 'preview_ready'}`),
      text: (entry) => {
        const identifier = field(entry, 'identifier') ?? '';
        const app = [field(entry, 'pullRequest'), field(entry, 'targetAppId')]
          .filter(Boolean)
          .join(' · ');
        const failed = entry.notice?.type === 'preview_failed';
        return {
          title: t(
            failed ? 'previews.inbox.failedTitle' : 'previews.inbox.readyTitle',
            { identifier, app },
          ),
          sentence: failed
            ? missingOf(entry).length > 0
              ? t('previews.variables.missing', {
                  names: missingOf(entry).join(', '),
                })
              : field(entry, 'error')
            : (field(entry, 'url') ?? field(entry, 'issueTitle')),
        };
      },
      open: t('previews.inbox.open'),
    };
  },
  Body: PreviewFailedBody,
  context: (entry) => {
    const issueId = field(entry, 'issueId');
    return issueId ? { ids: [issueId] } : {};
  },
});

export const deploysRenderer = defineInboxRenderer<null>({
  source: 'deploys',
  types: ['unreleased'],
  icon: () => PackageIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: () => t('deploys.inbox.types.unreleased'),
      text: (entry) => ({
        title: t('deploys.inbox.unreleasedTitle', {
          identifier: field(entry, 'identifier') ?? '',
        }),
        sentence: [field(entry, 'projectName'), field(entry, 'issueTitle')]
          .filter(Boolean)
          .join(' · '),
      }),
      open: t('deploys.inbox.open'),
    };
  },
  context: (entry) => {
    const projectId = field(entry, 'projectId');
    return projectId ? { ids: [projectId] } : {};
  },
});
