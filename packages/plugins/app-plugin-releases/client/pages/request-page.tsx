/**
 * A deployment request as a route dialog, opened from its App's page at `:appId/requests/:requestId` (the pending row
 * of its deployments and the notice under the header) and, for older links, over the Apps list at
 * `requests/:requestId`. It says what would run where (the App, the environment, the release with its commit and its CI
 * log), who asked and why, and how it stands; an approver adds an optional comment and approves or rejects it here.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { CircleAlertIcon } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';
import { Link, useOutletContext, useParams } from 'react-router';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { DeploymentRequestView } from '../../shared/releases.js';
import { ActorName } from '../components/actor-name.js';
import { EnvironmentBadges, StatusTag } from '../components/release-badges.js';
import { RequestCommit } from '../components/request-decision.js';
import { RouteDialog } from '../components/route-dialog.js';
import { ListSkeleton, LoadError } from '../components/states.js';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.js';
import { Button } from '../components/ui/button.js';
import { Field, FieldLabel } from '../components/ui/field.js';
import { Spinner } from '../components/ui/spinner.js';
import { Textarea } from '../components/ui/textarea.js';
import { useRouteOverlay } from '../components/use-route-overlay.js';
import {
  useRequestDecisions,
  type RequestDecision,
  type RequestDecisions,
} from '../hooks/use-request-decisions.js';
import { useLoad, useReleasesApi } from '../hooks/use-releases.js';
import { errorText } from '../lib/errors.js';
import { formatDate } from '../lib/format.js';
import { useReleasesLinks } from '../lib/paths.js';

/** What the page behind the dialog loads again once the request is decided. */
export interface RequestOutletContext {
  readonly reloadRequests?: () => void;
}

export default function RequestPage(): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const { requestId = '' } = useParams();
  const api = useReleasesApi();
  const outlet = useOutletContext<RequestOutletContext | undefined>();
  const request = useLoad(
    () =>
      api.get<DeploymentRequestView>(
        `deploymentRequests/${encodeURIComponent(requestId)}`,
      ),
    `request:${requestId}`,
  );
  const [comment, setComment] = useState('');
  const decisions = useRequestDecisions(() => {
    outlet?.reloadRequests?.();
    request.reload();
  });
  const data = request.data;
  const reviewing = data?.decidable === true && data.status === 'pending';
  return (
    <RouteDialog
      className='sm:max-w-md'
      title={
        data
          ? t(
              `ui.requests.${reviewing ? 'reviewTitle' : 'detailTitle'}.${data.kind}`,
              { appId: data.appId },
            )
          : t('ui.requests.title')
      }
      description={
        data ? (
          <StatusTag status={data.status} wording='ui.requests.status' />
        ) : undefined
      }
      // While a decision runs, the dialog stays open.
      beforeClose={() => decisions.busy === null}
      footer={
        data && reviewing ? (
          <ReviewFooter
            request={data}
            comment={comment}
            decisions={decisions}
          />
        ) : null
      }
    >
      {data ? (
        <div className='flex flex-col gap-4'>
          {decisions.error ? (
            <Alert variant='destructive'>
              <CircleAlertIcon />
              <AlertTitle>{t('ui.requests.decideFailed')}</AlertTitle>
              <AlertDescription>
                {errorText(t, decisions.error, t('ui.errors.requestFailed'))}
              </AlertDescription>
            </Alert>
          ) : null}
          <RequestDetails request={data} />
          {reviewing ? (
            <Field>
              <FieldLabel htmlFor='rel-request-comment'>
                {t('ui.requests.comment')}
              </FieldLabel>
              <Textarea
                id='rel-request-comment'
                value={comment}
                maxLength={2000}
                disabled={decisions.busy !== null}
                onChange={(event) => setComment(event.target.value)}
              />
            </Field>
          ) : null}
        </div>
      ) : request.error !== undefined ? (
        <LoadError
          title={t('ui.requests.loadFailed')}
          error={request.error}
          onRetry={request.reload}
        />
      ) : (
        <ListSkeleton rows={5} />
      )}
    </RouteDialog>
  );
}

/** Inside the dialog, so Cancel and a decision close it. */
function ReviewFooter({
  request,
  comment,
  decisions,
}: {
  readonly request: DeploymentRequestView;
  readonly comment: string;
  readonly decisions: RequestDecisions;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const { close, isClosing } = useRouteOverlay();
  const { busy } = decisions;
  const decide = async (decision: RequestDecision): Promise<void> => {
    if (await decisions.decide(request, decision, comment)) void close();
  };
  return (
    <>
      <Button
        variant='ghost'
        disabled={busy !== null || isClosing}
        onClick={() => void close()}
      >
        {t('ui.confirm.cancel')}
      </Button>
      <Button
        variant='outline'
        disabled={busy !== null}
        onClick={() => void decide('reject')}
      >
        {busy === 'reject' ? <Spinner data-icon='inline-start' /> : null}
        {t('ui.requests.reject')}
      </Button>
      <Button disabled={busy !== null} onClick={() => void decide('approve')}>
        {busy === 'approve' ? <Spinner data-icon='inline-start' /> : null}
        {t('ui.requests.approve')}
      </Button>
      {decisions.dialog}
    </>
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

function RequestDetails({
  request,
}: {
  readonly request: DeploymentRequestView;
}): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const links = useReleasesLinks();
  const build = request.release?.build ?? null;
  return (
    <dl
      className='grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm'
      data-slot='request-details'
    >
      <Row label={t('ui.requests.app')}>
        <Link
          to={links.app(request.appId)}
          className='font-mono font-medium hover:underline'
        >
          {request.appId}
        </Link>
      </Row>
      <Row label={t('ui.apps.environment')}>
        <span className='inline-flex flex-wrap items-center gap-1.5'>
          {request.environment?.name ?? request.environmentId}
          <EnvironmentBadges protected={request.environment?.protected} />
        </span>
      </Row>
      <Row label={t('ui.apps.version')}>
        <span className='font-mono text-xs tabular-nums'>
          {request.release?.version ?? '—'}
        </span>
        <span className='ml-2 text-xs text-muted-foreground'>
          {t('ui.requests.pinned', {
            checksum: request.releaseChecksum.slice(0, 12),
          })}
        </span>
      </Row>
      <Row label={t('ui.requests.commit')}>
        <RequestCommit request={request} />
      </Row>
      <Row label={t('ui.requests.build')}>
        {build && /^https?:\/\//u.test(build) ? (
          <a
            href={build}
            target='_blank'
            rel='noreferrer'
            className='text-primary underline-offset-4 hover:underline'
          >
            {t('ui.requests.ciLog')}
          </a>
        ) : (
          (build ?? '—')
        )}
      </Row>
      <Row label={t('ui.requests.requestedBy')}>
        {request.requestedBy ? (
          <span className='inline-flex items-center gap-1.5'>
            <ActorName id={request.requestedBy} kind={request.requestedVia} />
            <span className='text-xs text-muted-foreground'>
              {t(`ui.actors.${request.requestedVia}`)}
            </span>
          </span>
        ) : (
          '—'
        )}
      </Row>
      <Row label={t('ui.requests.requestedAt')}>
        <span className='tabular-nums'>
          {formatDate(request.createdAt, i18n.language)}
        </span>
      </Row>
      <Row label={t('ui.requests.note')}>
        <span className='whitespace-pre-wrap'>{request.note ?? '—'}</span>
      </Row>
      {request.decidedBy ? (
        <>
          <Row label={t('ui.requests.decidedBy')}>
            <ActorName id={request.decidedBy} kind='human' />
            <span className='ml-2 text-xs text-muted-foreground tabular-nums'>
              {formatDate(request.decidedAt, i18n.language)}
            </span>
          </Row>
          <Row label={t('ui.requests.decisionNote')}>
            <span className='whitespace-pre-wrap'>
              {request.decisionNote ?? '—'}
            </span>
          </Row>
        </>
      ) : null}
    </dl>
  );
}
