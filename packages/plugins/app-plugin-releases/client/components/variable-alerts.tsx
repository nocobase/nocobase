/**
 * What an App page says about its variables before anything else: required ones the current release lacks, values
 * changed since the running deployment, and the first administrator a first deployment generated (shown masked to
 * those who may deploy, until someone saved it).
 */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  RotateCwIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { InitialAdminView } from '../../shared/releases.js';
import { useNotify } from '../hooks/use-notify.js';
import { useLoad, useReleasesApi } from '../hooks/use-releases.js';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from './ui/alert.js';
import { Button, buttonVariants } from './ui/button.js';
import { Spinner } from './ui/spinner.js';

/**
 * Required variables of the App's most recent build that nothing supplies, with the two places a value can be set:
 * its environment (every App there) and the App itself.
 */
export function MissingVariablesAlert({
  names,
  environmentTo,
  appTo,
}: {
  readonly names: readonly string[];
  /** The environment's Variables tab; no link for a reader who may not open environments. */
  readonly environmentTo?: string;
  /** The App page's Variables tab; no link when it is already shown. */
  readonly appTo?: string;
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (names.length === 0) return null;
  return (
    <Alert variant='destructive'>
      <TriangleAlertIcon />
      <AlertTitle>{t('ui.variables.missingTitle')}</AlertTitle>
      <AlertDescription>
        <p>
          {t('ui.variables.missingDescription', { names: names.join(', ') })}
        </p>
        {environmentTo !== undefined || appTo !== undefined ? (
          <div className='mt-2 flex flex-wrap gap-2'>
            {environmentTo !== undefined ? (
              <Link
                to={environmentTo}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                {t('ui.variables.setOnEnvironment')}
              </Link>
            ) : null}
            {appTo !== undefined ? (
              <Link
                to={appTo}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                {t('ui.variables.setOnApp')}
              </Link>
            ) : null}
          </div>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

/** Values changed since the running deployment; applying deploys the current release again. */
export function ChangedVariablesAlert({
  busy,
  onApply,
}: {
  readonly busy: boolean;
  /** Absent when the caller may not deploy here directly. */
  readonly onApply?: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Alert>
      <RotateCwIcon />
      <AlertTitle>{t('ui.variables.changedTitle')}</AlertTitle>
      <AlertDescription>
        {t('ui.variables.changedDescription')}
      </AlertDescription>
      {onApply ? (
        <AlertAction>
          <Button size='sm' disabled={busy} onClick={onApply}>
            {busy ? <Spinner data-icon='inline-start' /> : null}
            {t('ui.variables.apply')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}

/** The generated first administrator, read only by those who may deploy; nothing when there is none to show. */
export function InitialAdminAlert({
  appId,
  reloadKey,
}: {
  readonly appId: string;
  readonly reloadKey?: string;
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const notify = useNotify();
  const [shown, setShown] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Nothing to show answers 404, and a caller who may not read it 403: both are simply no alert.
  const admin = useLoad(
    () =>
      api.get<InitialAdminView>(`apps/${appId}/initialAdmin`).then(
        (found) => ({
          ...found,
          // Whole hours left, read when it loads.
          hours: found.expiresAt
            ? Math.max(
                1,
                Math.ceil(
                  (Date.parse(found.expiresAt) - Date.now()) / 3_600_000,
                ),
              )
            : null,
        }),
        (reason: unknown) => {
          if (
            reason instanceof ApiClientError &&
            (reason.status === 404 || reason.status === 403)
          )
            return null;
          throw reason;
        },
      ),
    `initial-admin:${appId}:${reloadKey ?? ''}`,
  );
  const data = admin.data;
  if (!data || dismissed) return null;
  const { hours } = data;
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(data.password);
      notify.success(t('ui.initialAdmin.copied'));
    } catch (reason) {
      notify.error(reason);
    }
  };
  const dismiss = async (): Promise<void> => {
    setDismissing(true);
    try {
      await api.send('POST', `apps/${appId}/initialAdmin/dismiss`);
      setDismissed(true);
      notify.success(t('ui.initialAdmin.dismissed'));
    } catch (reason) {
      notify.error(reason);
    } finally {
      setDismissing(false);
    }
  };
  return (
    <Alert data-slot='initial-admin'>
      <KeyRoundIcon />
      <AlertTitle>{t('ui.initialAdmin.title')}</AlertTitle>
      <AlertDescription>
        <p>
          {hours === null
            ? t('ui.initialAdmin.kept')
            : t('ui.initialAdmin.expires', { hours })}
        </p>
        <dl className='mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-foreground'>
          <dt className='text-muted-foreground'>
            {t('ui.initialAdmin.username')}
          </dt>
          <dd className='font-mono text-xs leading-5'>{data.username}</dd>
          <dt className='text-muted-foreground'>
            {t('ui.initialAdmin.email')}
          </dt>
          <dd className='font-mono text-xs leading-5'>{data.email}</dd>
          <dt className='text-muted-foreground'>
            {t('ui.initialAdmin.password')}
          </dt>
          <dd className='flex flex-wrap items-center gap-1'>
            <span className='font-mono text-xs' data-slot='initial-password'>
              {shown ? data.password : '••••••••••••'}
            </span>
            <Button
              variant='ghost'
              size='icon-xs'
              aria-label={
                shown ? t('ui.initialAdmin.hide') : t('ui.initialAdmin.show')
              }
              onClick={() => setShown((value) => !value)}
            >
              {shown ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
            <Button
              variant='ghost'
              size='icon-xs'
              aria-label={t('ui.initialAdmin.copy')}
              onClick={() => void copy()}
            >
              <CopyIcon />
            </Button>
          </dd>
        </dl>
      </AlertDescription>
      <AlertAction>
        <Button
          variant='outline'
          size='sm'
          disabled={dismissing}
          onClick={() => void dismiss()}
        >
          {dismissing ? <Spinner data-icon='inline-start' /> : null}
          {t('ui.initialAdmin.dismiss')}
        </Button>
      </AlertAction>
    </Alert>
  );
}
