import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { useNotify } from '../../access/notify.js';

import { ownerHandoffKey, useOwnerHandoffView } from './use-owner-handoff.js';

/** Shared by the issue page and its inbox decision. An old inbox item never borrows the current decision. */
export function OwnerHandoffActions({
  issueId,
  notificationKey,
}: {
  readonly issueId: string;
  readonly notificationKey?: string;
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const queries = useQueryClient();
  const notify = useNotify();
  const handoff = useOwnerHandoffView(issueId);
  const decide = useMutation({
    mutationFn: (decision: 'accept' | 'reject') =>
      api.request({
        method: 'POST',
        path: `issueOwnerHandoffs/${encodeURIComponent(issueId)}/${decision}`,
        json: {
          notificationKey:
            notificationKey ?? handoff.data?.handoff?.notificationKey,
        },
      }),
    onSuccess: (_data, decision) =>
      notify.success(
        t(`ownerHandoff.${decision === 'accept' ? 'accepted' : 'rejected'}`),
      ),
    onError: (error) =>
      notify.error(
        null,
        t(
          error instanceof ApiClientError && error.status === 409
            ? 'ownerHandoff.stale'
            : 'ownerHandoff.failed',
        ),
      ),
    onSettled: async () => {
      await Promise.all(
        [
          ownerHandoffKey(issueId),
          ['studio', 'issueProgress', issueId],
          ['pm', 'issue'],
          inboxKeys.all,
        ].map((queryKey) => queries.invalidateQueries({ queryKey })),
      );
    },
  });
  const claim = useMutation({
    mutationFn: async () => {
      const issue = await api.request<{ data: { revision: number } }>({
        path: `projects/issues/${encodeURIComponent(issueId)}`,
      });
      return api.request({
        method: 'PATCH',
        path: `projects/issues/${encodeURIComponent(issueId)}`,
        json: {
          revision: issue.data.revision,
          ownerUserId: handoff.data?.handoff?.ownerUserId,
        },
      });
    },
    onSuccess: () => notify.success(t('ownerHandoff.accepted')),
    onError: () => notify.error(null, t('ownerHandoff.failed')),
    onSettled: async () => {
      await Promise.all(
        [
          ownerHandoffKey(issueId),
          ['studio', 'issueProgress', issueId],
          ['pm', 'issue'],
          inboxKeys.all,
        ].map((queryKey) => queries.invalidateQueries({ queryKey })),
      );
    },
  });
  if (handoff.isPending)
    return notificationKey ? <Skeleton className='h-8 w-40' /> : null;
  if (handoff.isError)
    return (
      <p className='text-sm text-muted-foreground'>
        {t('ownerHandoff.loadFailed')}
      </p>
    );
  const current = handoff.data?.handoff;
  if (
    notificationKey &&
    (!current?.waiting ||
      current.notificationKey !== notificationKey ||
      current.rejectedAt)
  )
    return (
      <p className='text-sm text-muted-foreground'>{t('ownerHandoff.stale')}</p>
    );
  if (!current?.waiting) return null;
  if (current.rejectedAt)
    return (
      <div className='space-y-2'>
        <p className='text-sm text-muted-foreground'>
          {t('ownerHandoff.rejectedWaiting')}
        </p>
        {handoff.data?.canClaim ? (
          <Button
            size='sm'
            disabled={claim.isPending}
            onClick={() => claim.mutate()}
          >
            {claim.isPending ? <Spinner data-icon='inline-start' /> : null}
            {t('ownerHandoff.claim')}
          </Button>
        ) : null}
      </div>
    );
  if (!handoff.data?.canDecide) return null;
  return (
    <div
      className='flex flex-wrap items-center gap-2'
      aria-label={t('ownerHandoff.title')}
    >
      <Button
        size='sm'
        disabled={decide.isPending}
        onClick={() => decide.mutate('accept')}
      >
        {decide.isPending && decide.variables === 'accept' ? (
          <Spinner data-icon='inline-start' />
        ) : null}
        {t('ownerHandoff.accept')}
      </Button>
      <Button
        size='sm'
        variant='outline'
        disabled={decide.isPending}
        onClick={() => decide.mutate('reject')}
      >
        {decide.isPending && decide.variables === 'reject' ? (
          <Spinner data-icon='inline-start' />
        ) : null}
        {t('ownerHandoff.reject')}
      </Button>
    </div>
  );
}
