/**
 * The parts of a reopen suggestion's card (`reopen.ts`): one click reopens the listed issues, or keeps them done, and
 * the body lists them with why.
 */
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcwIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { IssueCard } from '@/components/issue-card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { useNotify } from '../../access/notify.js';
import { IssueCardRouterLink } from '../../issues/issue-card-link.js';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import { field } from './releases.locales.js';
import { reopenIssues } from './reopen-model.js';

type ReopenAction = 'reopen' | 'dismiss';

export function ReopenActions({
  entry,
  onDecided,
}: InboxPartProps<null>): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const issues = reopenIssues(entry);
  const appId = field(entry, 'appId') ?? '';
  const decide = useMutation({
    mutationFn: async (action: ReopenAction) =>
      (
        await api.request<{
          readonly data: {
            readonly reopened: readonly string[];
            readonly failed: readonly string[];
          };
        }>({
          method: 'POST',
          path: `deploys/reopenSuggestions/${encodeURIComponent(appId)}/decide`,
          json: { action },
        })
      ).data,
    onSuccess: (result, action) => {
      if (action === 'dismiss') notify.success(t('deploys.reopen.dismissed'));
      else if (result.failed.length > 0)
        notify.error(
          null,
          t('deploys.reopen.partly', {
            identifiers: result.reopened.join(', ') || '—',
            failed: result.failed.join(', '),
          }),
        );
      else
        notify.success(
          t('deploys.reopen.done', {
            identifiers: result.reopened.join(', '),
          }),
        );
      onDecided();
    },
    onError: (error) => notify.error(error),
    onSettled: () => {
      for (const queryKey of [inboxKeys.all, ['pm', 'issue'], ['pm', 'issues']])
        void queryClient.invalidateQueries({ queryKey });
    },
  });
  const pending = decide.isPending ? decide.variables : null;
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button
        disabled={decide.isPending}
        data-action='reopen'
        onClick={() => decide.mutate('reopen')}
      >
        {pending === 'reopen' ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <RotateCcwIcon data-icon='inline-start' />
        )}
        {t('deploys.reopen.reopen', { count: issues.length })}
      </Button>
      <Button
        variant='outline'
        disabled={decide.isPending}
        data-action='dismiss'
        onClick={() => decide.mutate('dismiss')}
      >
        {pending === 'dismiss' ? <Spinner data-icon='inline-start' /> : null}
        {t('deploys.reopen.dismiss')}
      </Button>
    </div>
  );
}

export function ReopenBody({ entry }: InboxPartProps<null>): ReactElement {
  const { t } = useTranslation();
  const issues = reopenIssues(entry);
  return (
    <div className='space-y-3 text-sm'>
      <ul className='divide-y rounded-lg border bg-card'>
        {issues.map((issue) => (
          <li key={issue.id}>
            <IssueCard
              issue={issue}
              appearance='plain'
              href={`/issues/${encodeURIComponent(issue.identifier)}`}
              link={IssueCardRouterLink}
              className='px-3 py-2'
            />
          </li>
        ))}
      </ul>
      <p className='text-muted-foreground'>{t('deploys.reopen.hint')}</p>
    </div>
  );
}
