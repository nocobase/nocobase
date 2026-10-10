/**
 * The detail parts of release management's inbox entries (`releases.ts`): approving or rejecting a deployment request
 * through the plugin's own API, which checks the approver again and settles every approver's card through Studio's
 * inbox port (on a protected environment it asks for the App ID typed again, as a direct deployment there does); and
 * what the request or the failed deployment is about.
 */
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement, type ReactNode } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import { useNotify } from '../../access/notify.js';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { relativeTime } from '@/extensions/nocobase-inbox/model';
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import { useDeploymentError } from './releases-errors.js';
import { field } from './releases.locales.js';

type Decision = 'approve' | 'reject';

export function DeploymentRequestActions({
  entry,
  title,
  onDecided,
}: InboxPartProps<null>): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const requestId = field(entry, 'requestId') ?? entry.notice?.decisionKey;
  const appId = field(entry, 'appId') ?? '';
  // A protected environment asks the approver to type the App ID again, as a direct deployment there does.
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const decide = useMutation({
    mutationFn: ({
      decision,
      confirm,
    }: {
      readonly decision: Decision;
      readonly confirm?: string;
    }) =>
      api.request({
        method: 'POST',
        path: `releases/deploymentRequests/${encodeURIComponent(requestId ?? '')}/${decision}`,
        json: confirm === undefined ? {} : { confirm },
      }),
    onSuccess: (_, { decision }) => {
      setConfirming(false);
      notify.success(
        t(decision === 'approve' ? 'approved' : 'rejected', { title }),
      );
      onDecided();
    },
    onError: (error) => {
      if (
        error instanceof ApiClientError &&
        error.reason === 'CONFIRMATION_REQUIRED'
      ) {
        setTyped('');
        setConfirming(true);
        return;
      }
      notify.error(error);
    },
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all }),
  });
  return (
    <div className='flex flex-wrap items-center gap-2'>
      {(['approve', 'reject'] as const).map((decision) => (
        <Button
          key={decision}
          variant={decision === 'approve' ? 'default' : 'outline'}
          disabled={decide.isPending || !requestId}
          data-action={decision}
          onClick={() => decide.mutate({ decision })}
        >
          {decide.isPending && decide.variables.decision === decision ? (
            <Spinner data-icon='inline-start' />
          ) : null}
          {t(decision)}
        </Button>
      ))}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDescription', { appId })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={typed}
            autoFocus
            className='font-mono'
            placeholder={appId}
            aria-label={t('confirmLabel', { appId })}
            onChange={(event) => setTyped(event.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <Button
              disabled={typed !== appId || decide.isPending}
              data-action='confirm-approve'
              onClick={() =>
                decide.mutate({ decision: 'approve', confirm: typed })
              }
            >
              {decide.isPending ? <Spinner data-icon='inline-start' /> : null}
              {t('approve')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='min-w-0 wrap-anywhere'>{children}</dd>
    </>
  );
}

export function ReleasesBody({ entry }: InboxPartProps<null>): ReactElement {
  const { t, i18n } = useTranslation();
  const errorText = useDeploymentError();
  const requestedAt = field(entry, 'requestedAt');
  const note = field(entry, 'note');
  const error = field(entry, 'error');
  const requester = field(entry, 'requesterName');
  const via = field(entry, 'requestedVia');
  const sha = field(entry, 'sha');
  const ref = field(entry, 'ref');
  const logsUrl = field(entry, 'logsUrl');
  const checksum = field(entry, 'releaseChecksum');
  return (
    <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'>
      <Row label={t('app')}>
        {field(entry, 'appName') ?? t('unknown')}{' '}
        <span className='font-mono text-muted-foreground'>
          {field(entry, 'appId') ?? ''}
        </span>
      </Row>
      <Row label={t('release')}>
        <span className='tabular-nums'>
          {field(entry, 'releaseVersion') ?? t('unknown')}
        </span>
      </Row>
      <Row label={t('environment')}>
        {field(entry, 'environmentName') ?? t('unknown')}
      </Row>
      {sha ? (
        <Row label={t('commit')}>
          <span className='font-mono'>{sha.slice(0, 12)}</span>
        </Row>
      ) : null}
      {ref || logsUrl ? (
        <Row label={t('builtFrom')}>
          {ref ?? t('unknown')}
          {logsUrl && /^https?:\/\//u.test(logsUrl) ? (
            <>
              {' · '}
              <a
                href={logsUrl}
                target='_blank'
                rel='noreferrer'
                className='underline underline-offset-2'
              >
                {t('ciLog')}
              </a>
            </>
          ) : null}
        </Row>
      ) : null}
      {requester ? (
        <Row label={t('requester')}>
          {requester}
          {via === 'agent'
            ? ` (${t('agent')})`
            : via === 'key'
              ? ` (${t('apiKey')})`
              : ''}
        </Row>
      ) : null}
      {requestedAt ? (
        <Row label={t('requestedAt')}>
          <time dateTime={requestedAt}>
            {relativeTime(requestedAt, i18n.language)}
          </time>
        </Row>
      ) : null}
      {note ? <Row label={t('note')}>{note}</Row> : null}
      {checksum ? (
        <dd className='col-span-2 text-xs text-muted-foreground'>
          {t('pinned', { checksum: checksum.slice(0, 12) })}
        </dd>
      ) : null}
      {error ? (
        <Row label={t('error')}>
          <pre className='max-h-48 overflow-auto font-mono text-xs whitespace-pre-wrap'>
            {errorText(error)}
          </pre>
        </Row>
      ) : null}
    </dl>
  );
}
