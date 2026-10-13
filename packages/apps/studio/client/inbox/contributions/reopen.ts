/**
 * The card suggesting to reopen what a deployment no longer runs (source `deploys`, type `reopen_suggested`, sent by
 * `server/deploys/service.ts` to whoever deployed a rollback or an older release): the issues still done whose change
 * the App no longer runs, reopened in one click or kept done, through `/api/deploys/reopenSuggestions/:appId/decide`.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { RotateCcwIcon } from 'lucide-react';

import { isSettled, kindOf } from '@/extensions/nocobase-inbox/model';
import { defineInboxRenderer } from '@/extensions/nocobase-inbox/registry';
import { field } from './releases.locales.js';
import { reopenIssues } from './reopen-model.js';
import { ReopenActions, ReopenBody } from './reopen-parts.js';

export const REOPEN_SUGGESTED_TYPE = 'reopen_suggested';

export const reopenRenderer = defineInboxRenderer<null>({
  source: 'deploys',
  types: [REOPEN_SUGGESTED_TYPE],
  icon: () => RotateCcwIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: () => t('deploys.reopen.type'),
      text: (entry) => {
        const app = field(entry, 'appName') ?? '';
        return {
          title: t(
            entry.notice?.data?.rollback === true
              ? 'deploys.reopen.title'
              : 'deploys.reopen.withdrawTitle',
            { app },
          ),
          sentence: t('deploys.reopen.sentence', {
            app,
            version: field(entry, 'version') ?? '',
            count: reopenIssues(entry).length,
          }),
        };
      },
    };
  },
  // The registry names the slot a hook; this card needs none to know: it went only to the person who may answer it.
  // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
  useCanAct: (entry) =>
    kindOf(entry) === 'decision' && !isSettled(entry)
      ? { state: 'yes' }
      : { state: 'none' },
  Actions: ReopenActions,
  Body: ReopenBody,
  context: (entry) => ({ ids: reopenIssues(entry).map((issue) => issue.id) }),
});
