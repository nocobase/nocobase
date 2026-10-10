/**
 * A pull request's previews on the issue page, under the pull request in its Code and deployments section
 * (`issues/detail/code-section.tsx`): one per App previewed (a pull request linked to several issues shows the same
 * ones on each). Each says where its preview stands (and, once ready, whether its App runs, stopped after a while
 * unvisited, or hibernates, and when it was last visited), its address, the head it follows against the commit it runs,
 * and the head's build as CI reported it (with its log); for those who may edit the issue, its first administrator,
 * Deploy again and Destroy, and for a preview its build's variables block, the form that sets them. Nothing here
 * builds: CI does; `use-issue-previews.ts` reads them.
 */
import { useApiClient } from '@nocobase/app-client';
import { PmTag } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation } from '@tanstack/react-query';
import {
  CopyIcon,
  MonitorPlayIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  RefreshCwIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';

import { useNotify } from '../access/notify.js';
import type { BuildState } from '../../shared/builds.js';
import {
  PREVIEW_BUSY,
  PREVIEW_VARIABLE_SCOPES,
  type IssuePreviews,
  type PreviewRuntimeState,
  type PreviewStatus,
  type PreviewVariableScope,
  type PreviewView,
} from '../../shared/previews.js';
import {
  absoluteUrl,
  destroyPreview,
  retryPreview,
  setPreviewVariables,
} from './api.js';
import { VariablesLinks } from './variables-links.js';

type Tone = 'grey' | 'amber' | 'blue' | 'green' | 'red' | 'slate';

const TONES: Readonly<Record<PreviewStatus, Tone>> = {
  waiting: 'amber',
  deploying: 'blue',
  ready: 'green',
  blocked: 'amber',
  failed: 'red',
  destroyed: 'slate',
};

const RUNTIME_TONES: Readonly<Record<PreviewRuntimeState, Tone>> = {
  running: 'green',
  starting: 'blue',
  pending: 'blue',
  stopped: 'slate',
  dormant: 'grey',
  failed: 'red',
  unknown: 'grey',
};

const BUILD_TONES: Readonly<Record<BuildState, Tone>> = {
  queued: 'grey',
  building: 'blue',
  failed: 'red',
  succeeded: 'green',
};

const short = (sha: string | null | undefined) => (sha ? sha.slice(0, 7) : '—');

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
      <dd className='min-w-0 truncate'>{children}</dd>
    </>
  );
}

function CopyValue({ value }: { readonly value: string }): ReactElement {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  return (
    <span className='inline-flex min-w-0 items-center gap-1'>
      <code className='truncate font-mono text-xs'>{value}</code>
      <Button
        variant='ghost'
        size='icon-xs'
        aria-label={copied ? t('previews.copied') : t('previews.copy')}
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        <CopyIcon />
      </Button>
    </span>
  );
}

function BuildLine({
  preview,
}: {
  readonly preview: PreviewView;
}): ReactElement {
  const { t } = useTranslation();
  const build = preview.build;
  return (
    <span className='inline-flex min-w-0 flex-wrap items-center gap-1.5'>
      {build ? (
        <PmTag
          tone={build.superseded ? 'slate' : BUILD_TONES[build.state]}
          dot={build.state !== 'building'}
          data-preview-build={build.state}
        >
          {build.state === 'building' ? <Spinner className='size-3' /> : null}
          {build.superseded
            ? t('previews.build.superseded')
            : build.releaseId
              ? t('previews.build.uploaded')
              : t(`previews.build.states.${build.state}`)}
        </PmTag>
      ) : (
        <span className='text-xs text-muted-foreground'>
          {t('previews.build.states.none')}
        </span>
      )}
      {build?.logsUrl ? (
        <a
          href={build.logsUrl}
          target='_blank'
          rel='noreferrer'
          className='text-xs text-primary underline-offset-4 hover:underline'
        >
          {t('previews.build.logs')}
        </a>
      ) : null}
    </span>
  );
}

/** What the build's variables change against the App it previews, in one muted line each. */
function NewVariables({
  preview,
}: {
  readonly preview: PreviewView;
}): ReactElement | null {
  const { t } = useTranslation();
  const diff = preview.build?.newVariables;
  if (!diff || (diff.added.length === 0 && diff.removed.length === 0))
    return null;
  return (
    <div className='space-y-0.5 text-xs text-muted-foreground'>
      {diff.added.length > 0 ? (
        <p data-preview-new-variables>
          {t('previews.variables.added', {
            names: diff.added.map((item) => item.name).join(', '),
          })}
        </p>
      ) : null}
      {diff.removed.length > 0 ? (
        <p>
          {t('previews.variables.removed', {
            names: diff.removed.join(', '),
          })}
        </p>
      ) : null}
    </div>
  );
}

/** A blocked preview: what it misses, and for an editor a form saving the values, after which it deploys. */
function MissingVariables({
  issue,
  preview,
  canEdit,
  canSetEnvironment,
  onChanged,
}: {
  readonly issue: Pick<IssueDetail, 'id'>;
  readonly preview: PreviewView;
  readonly canEdit: boolean;
  readonly canSetEnvironment: boolean;
  readonly onChanged: (next: IssuePreviews) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const notify = useNotify();
  const [values, setValues] = useState<Record<string, string>>({});
  const [scope, setScope] = useState<PreviewVariableScope>('preview');
  const save = useMutation({
    mutationFn: () => {
      const filled = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== ''),
      );
      return setPreviewVariables(api, {
        issueId: issue.id,
        appId: preview.appId,
        scope: canSetEnvironment ? scope : 'preview',
        values: filled,
      });
    },
    onSuccess: (next) => {
      setValues({});
      onChanged(next);
      notify.success(t('previews.variables.saved'));
    },
    onError: (error) => notify.error(error),
  });
  const missing = preview.missingVariables;
  const filled = Object.values(values).some((value) => value !== '');
  return (
    <div className='space-y-2 rounded-md border border-dashed p-3'>
      <p className='text-sm text-muted-foreground'>
        {t('previews.variables.blocked')}
      </p>
      <VariablesLinks
        appId={preview.appId}
        environmentId={canSetEnvironment ? preview.environmentId : null}
      />
      {!canEdit || missing.length === 0 ? (
        missing.length > 0 ? (
          <p className='text-sm'>
            {t('previews.variables.missing', {
              names: missing.map((item) => item.name).join(', '),
            })}
          </p>
        ) : null
      ) : (
        <form
          className='space-y-3'
          onSubmit={(event) => {
            event.preventDefault();
            if (filled) save.mutate();
          }}
        >
          <FieldGroup className='grid gap-3 sm:grid-cols-2'>
            {missing.map((variable) => {
              const id = `preview-${preview.id}-${variable.name}`;
              return (
                <Field key={variable.name}>
                  <FieldLabel htmlFor={id} className='font-mono text-xs'>
                    {variable.name}
                  </FieldLabel>
                  <Input
                    id={id}
                    type={variable.secret ? 'password' : 'text'}
                    autoComplete='off'
                    value={values[variable.name] ?? ''}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [variable.name]: event.target.value,
                      }))
                    }
                  />
                  {variable.description ? (
                    <FieldDescription>{variable.description}</FieldDescription>
                  ) : null}
                </Field>
              );
            })}
            {canSetEnvironment ? (
              <Field className='sm:col-span-2'>
                <FieldLabel>{t('previews.variables.scope')}</FieldLabel>
                <RadioGroup
                  className='flex flex-wrap gap-x-6 gap-y-2'
                  value={scope}
                  onValueChange={(value) =>
                    setScope(value as PreviewVariableScope)
                  }
                >
                  {PREVIEW_VARIABLE_SCOPES.map((option) => (
                    <label
                      key={option}
                      className='flex items-center gap-2 text-sm'
                    >
                      <RadioGroupItem value={option} />
                      {option === 'preview'
                        ? t('previews.variables.scopePreview')
                        : t('previews.variables.scopeEnvironment')}
                    </label>
                  ))}
                </RadioGroup>
              </Field>
            ) : null}
          </FieldGroup>
          <Button type='submit' size='xs' disabled={!filled || save.isPending}>
            {save.isPending ? <Spinner data-icon='inline-start' /> : null}
            {t('previews.variables.save')}
          </Button>
        </form>
      )}
    </div>
  );
}

export function PreviewEntry({
  issue,
  preview,
  canEdit,
  canSetEnvironment,
  onChanged,
}: {
  readonly issue: Pick<IssueDetail, 'id'>;
  readonly preview: PreviewView;
  readonly canEdit: boolean;
  readonly canSetEnvironment: boolean;
  readonly onChanged: (next: IssuePreviews) => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const notify = useNotify();
  const pullRequest = preview.pullRequest
    ? `${preview.pullRequest.repo}#${preview.pullRequest.number}`
    : preview.appId;
  // Under its pull request it is named by the App it previews; the confirmation names both.
  const target = preview.targetAppName ?? preview.targetAppId;
  const name = target ? `${pullRequest} · ${target}` : pullRequest;
  const retry = useMutation({
    mutationFn: () => retryPreview(api, issue.id, preview.appId),
    onSuccess: (next) => {
      onChanged(next);
      notify.success(t('previews.retried'));
    },
    onError: (error) => notify.error(error),
  });
  const destroy = useMutation({
    mutationFn: () => destroyPreview(api, issue.id, preview.appId),
    onSuccess: (next) => {
      onChanged(next);
      notify.success(t('previews.destroyed'));
    },
    onError: (error) => notify.error(error),
  });
  const pending = retry.isPending || destroy.isPending;
  const live = preview.status !== 'destroyed';
  const busy = PREVIEW_BUSY.includes(preview.status);
  // Once ready, the App's own runtime says more than "ready": running, stopped, hibernating or starting.
  const runtime =
    preview.status === 'ready' && preview.runtime ? preview.runtime : null;
  const starting =
    runtime?.state === 'starting' || runtime?.state === 'pending';
  const url = live && preview.url ? absoluteUrl(preview.url) : null;
  const updating =
    preview.status === 'ready' &&
    preview.sha !== null &&
    preview.deployedSha !== null &&
    preview.sha !== preview.deployedSha;
  const error =
    preview.status === 'failed' && preview.error
      ? preview.error === 'limitReached'
        ? t('previews.blockers.limitReached')
        : preview.error
      : null;
  const runtimeHint =
    runtime &&
    (runtime.state === 'stopped' ||
      runtime.state === 'dormant' ||
      runtime.state === 'starting')
      ? t(`previews.runtimeHint.${runtime.state}`)
      : null;
  const canRetry =
    preview.build?.releaseId != null &&
    !preview.build.superseded &&
    (preview.status === 'failed' || preview.status === 'ready');

  return (
    <li
      className='space-y-2 py-3 first:pt-0 last:pb-0'
      data-studio-preview={preview.status}
      data-studio-preview-app={preview.appId}
      data-studio-preview-target={preview.targetAppId ?? undefined}
    >
      <div className='flex items-center justify-between gap-2'>
        <span className='flex min-w-0 items-center gap-1.5 text-sm font-medium'>
          <MonitorPlayIcon
            className='size-3.5 shrink-0 text-muted-foreground'
            aria-hidden
          />
          <span className='truncate'>
            {target
              ? t('previews.entryOf', { app: target })
              : t('previews.entry')}
          </span>
        </span>
        <div className='flex shrink-0 items-center gap-1.5'>
          {runtime ? (
            <PmTag
              tone={RUNTIME_TONES[runtime.state]}
              dot={!starting}
              data-preview-status={preview.status}
              data-preview-runtime={runtime.state}
            >
              {starting ? <Spinner className='size-3' /> : null}
              {t(`previews.runtime.${runtime.state}`)}
            </PmTag>
          ) : (
            <PmTag
              tone={TONES[preview.status]}
              dot={!busy}
              data-preview-status={preview.status}
            >
              {busy ? <Spinner className='size-3' /> : null}
              {t(`previews.statuses.${preview.status}`)}
            </PmTag>
          )}
          {url && preview.status === 'ready' ? (
            <Button
              size='xs'
              variant='outline'
              nativeButton={false}
              render={<a href={url} target='_blank' rel='noreferrer' />}
            >
              <ExternalLinkIcon data-icon='inline-start' />
              {t('previews.open')}
            </Button>
          ) : null}
        </div>
      </div>
      <dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm'>
        {url ? (
          <Row label={t('previews.url')}>
            <a
              href={url}
              target='_blank'
              rel='noreferrer'
              className='text-primary underline-offset-4 hover:underline'
            >
              {url}
            </a>
          </Row>
        ) : null}
        {preview.sha ? (
          <Row label={t('previews.head')}>
            <code className='font-mono text-xs'>{short(preview.sha)}</code>
          </Row>
        ) : null}
        {live && preview.sha ? (
          <Row label={t('previews.build.label')}>
            <BuildLine preview={preview} />
          </Row>
        ) : null}
        {preview.deployedSha && preview.deployedSha !== preview.sha ? (
          <Row label={t('previews.deployed')}>
            <code className='font-mono text-xs'>
              {short(preview.deployedSha)}
            </code>
          </Row>
        ) : null}
        {runtime?.lastAccessedAt ? (
          <Row label={t('previews.lastVisit')}>
            {new Date(runtime.lastAccessedAt).toLocaleString(i18n.language)}
          </Row>
        ) : null}
      </dl>
      {live && preview.sha ? <NewVariables preview={preview} /> : null}
      {preview.status === 'blocked' ? (
        <MissingVariables
          issue={issue}
          preview={preview}
          canEdit={canEdit}
          canSetEnvironment={canSetEnvironment}
          onChanged={onChanged}
        />
      ) : null}
      {updating ? (
        <p className='text-xs text-muted-foreground'>
          {t('previews.updating', { sha: short(preview.sha) })}
        </p>
      ) : null}
      {runtimeHint ? (
        <p className='text-xs text-muted-foreground'>{runtimeHint}</p>
      ) : null}
      {error ? (
        <p className='text-sm break-words text-destructive'>{error}</p>
      ) : null}
      {preview.admin && live ? (
        <Collapsible>
          <CollapsibleTrigger
            render={<Button variant='ghost' size='xs' className='-ml-2' />}
          >
            <KeyRoundIcon data-icon='inline-start' />
            {t('previews.admin')}
          </CollapsibleTrigger>
          <CollapsibleContent className='space-y-1 pt-1'>
            <dl className='grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-sm'>
              <Row label={t('previews.username')}>
                <CopyValue value={preview.admin.username} />
              </Row>
              <Row label={t('previews.password')}>
                <CopyValue value={preview.admin.password} />
              </Row>
            </dl>
            <p className='text-xs text-muted-foreground'>
              {t('previews.adminHint')}
            </p>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      <div className='flex flex-wrap items-center gap-2'>
        {canEdit && canRetry ? (
          <Button
            size='xs'
            variant='outline'
            disabled={pending}
            onClick={() => retry.mutate()}
          >
            {retry.isPending ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <RefreshCwIcon data-icon='inline-start' />
            )}
            {t('previews.retry')}
          </Button>
        ) : null}
        {canEdit && live ? (
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button size='xs' variant='ghost' disabled={pending} />}
            >
              <Trash2Icon data-icon='inline-start' />
              {t('previews.destroy')}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('previews.destroyTitle', { app: name })}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('previews.destroyDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  variant='destructive'
                  onClick={() => destroy.mutate()}
                >
                  {t('previews.destroy')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
        {live && preview.deploymentId ? (
          <Button
            variant='link'
            size='xs'
            nativeButton={false}
            render={
              <Link to={`/releases/${encodeURIComponent(preview.appId)}`} />
            }
          >
            {t('previews.appLog')}
          </Button>
        ) : null}
      </div>
    </li>
  );
}
