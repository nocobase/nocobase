/**
 * A project's initialization (`GET /api/projectSetups/:projectId`), shown on the project's Overview while it is not done
 * and on the "Initialize project" issue's page: its state, who runs it (GitHub Actions for a template's workflow, the
 * init issue's agent for a prompt), the repository, the template and workflow, the workflow's latest run as a check
 * line with its log, the `create-app` template of a NocoBase application, what an agent's initialization still waits
 * for (a runner that can run it, its run and, for a new empty repository, the first commit), the error, and Run again
 * for a failed workflow when the viewer may.
 */
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2Icon,
  CircleDashedIcon,
  RocketIcon,
  RotateCcwIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import type { GitCheck } from '../../shared/git.js';
import type {
  InitRun,
  InitState,
  ProjectInitView,
} from '../../shared/project-init.js';
import { useNotify } from '../access/notify.js';
import { CheckRow } from '../git/pull-requests.js';
import { ProjectInitApi, projectInitKeys } from './init-api.js';
import { useProjectInit } from './init-query.js';

/** How often an unfinished initialization is read again: webhooks move it on the server. */

const STATE_VARIANT: Readonly<
  Record<InitState, 'default' | 'secondary' | 'destructive' | 'outline'>
> = {
  pending: 'secondary',
  running: 'secondary',
  failed: 'destructive',
  done: 'outline',
};

/** The workflow run as the check lines of a pull request show theirs. */
function initRunCheck(run: InitRun, fallbackName: string): GitCheck {
  const status: GitCheck['status'] =
    run.status === 'completed'
      ? 'completed'
      : run.status === 'in_progress'
        ? 'in_progress'
        : 'queued';
  return {
    kind: 'check',
    name: run.name ?? fallbackName,
    status,
    conclusion: run.conclusion,
    url: run.url,
  };
}

function Step({
  done,
  text,
}: {
  readonly done: boolean;
  readonly text: string;
}): ReactElement {
  const Icon = done ? CheckCircle2Icon : CircleDashedIcon;
  return (
    <li className='flex items-center gap-2 text-xs'>
      <Icon
        className={
          done
            ? 'size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400'
            : 'size-3.5 shrink-0 text-muted-foreground'
        }
        aria-hidden
      />
      <span>{text}</span>
    </li>
  );
}

export function ProjectInitBody({
  view,
}: {
  readonly view: ProjectInitView;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const api = new ProjectInitApi(useApiClient());
  const retry = useMutation({
    mutationFn: () => api.retry(view.projectId),
    onSuccess: (next) => {
      queryClient.setQueryData(projectInitKeys.init(view.projectId), next);
      notify.success(t('projectPage.init.retried'));
    },
    onError: (error) => notify.error(error),
  });
  const executor =
    view.method === 'prompt'
      ? t('projectPage.init.executor.agent')
      : view.workflow
        ? t('projectPage.init.executor.actions')
        : t('projectPage.init.executor.none');
  const branch = view.repo?.defaultBranch ?? '';
  return (
    <div className='space-y-3' data-project-init={view.state}>
      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <Badge variant={STATE_VARIANT[view.state]}>
          {t(`projectPage.init.states.${view.state}`)}
        </Badge>
        <span className='text-muted-foreground' data-init-executor>
          {executor}
        </span>
        {view.repo ? (
          <a
            href={view.repo.url}
            target='_blank'
            rel='noreferrer'
            className='font-mono text-xs hover:underline'
          >
            {view.repo.fullName}
          </a>
        ) : null}
      </div>
      {view.templateRepo ? (
        <p className='text-xs text-muted-foreground'>
          {t('projectPage.init.template')}:{' '}
          <span className='font-mono'>{view.templateRepo}</span>
          {view.workflow ? (
            <>
              {' · '}
              {t('projectPage.init.workflow')}:{' '}
              <span className='font-mono'>{view.workflow.path}</span>
            </>
          ) : null}
        </p>
      ) : null}
      {view.method === 'template' && view.workflow ? (
        view.run ? (
          <ul className='space-y-1' data-checks>
            <CheckRow check={initRunCheck(view.run, view.workflow.name)} />
          </ul>
        ) : view.state !== 'done' ? (
          <p className='text-xs text-muted-foreground'>
            {t('projectPage.init.waitingRun', {
              repo: view.repo?.fullName ?? '',
            })}
          </p>
        ) : null
      ) : null}
      {view.appTemplate ? (
        <p className='text-xs text-muted-foreground'>
          {t('projectPage.init.appTemplate')}:{' '}
          <span className='font-mono'>{view.appTemplate}</span>
        </p>
      ) : null}
      {view.waitingForRunner ? (
        <p
          className='text-xs text-amber-700 dark:text-amber-400'
          data-init-waiting-runner
        >
          {t('projectPage.init.waitingForRunner')}
        </p>
      ) : null}
      {view.method === 'prompt' && view.state !== 'done' ? (
        <ul className='space-y-1'>
          <Step
            done={view.runSucceeded}
            text={
              view.runSucceeded
                ? t('projectPage.init.runSucceeded')
                : t('projectPage.init.runWaiting')
            }
          />
          {view.firstCommit ? (
            <Step
              done={view.pushed}
              text={
                view.pushed
                  ? t('projectPage.init.pushed', { branch })
                  : t('projectPage.init.pushWaiting', { branch })
              }
            />
          ) : null}
        </ul>
      ) : null}
      {view.error ? (
        <p className='text-xs break-words text-destructive'>{view.error}</p>
      ) : null}
      {view.state === 'done' && view.branchProtected !== null ? (
        <p className='text-xs text-muted-foreground'>
          {view.branchProtected
            ? t('projectPage.init.branchProtected')
            : t('projectPage.init.branchNotProtected')}
        </p>
      ) : null}
      {view.canRetry ? (
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={retry.isPending}
          onClick={() => retry.mutate()}
        >
          {retry.isPending ? (
            <Spinner data-icon='inline-start' />
          ) : (
            <RotateCcwIcon data-icon='inline-start' />
          )}
          {t('projectPage.init.retry')}
        </Button>
      ) : null}
    </div>
  );
}

function InitSection({
  view,
}: {
  readonly view: ProjectInitView;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <section
      className='space-y-3 rounded-lg border bg-card p-4 text-card-foreground'
      aria-labelledby='studio-project-init-heading'
    >
      <h2
        id='studio-project-init-heading'
        className='flex items-center gap-2 text-sm font-medium'
      >
        <RocketIcon className='size-4' aria-hidden />
        {t('projectPage.init.title')}
      </h2>
      <ProjectInitBody view={view} />
    </section>
  );
}

/** On the project's Overview: the initialization while it is not done. */
export function ProjectInitCard({
  projectId,
}: {
  readonly projectId: string;
}): ReactElement | null {
  const init = useProjectInit(projectId).data;
  if (!init || init.state === 'done') return null;
  return <InitSection view={init} />;
}

/** On an issue's page: the initialization, when the issue is the project's "Initialize project" issue. */
export function IssueInitSection({
  issue,
}: {
  readonly issue: { readonly id: string; readonly projectId: string | null };
}): ReactElement | null {
  const init = useProjectInit(issue.projectId).data;
  if (!init || init.issueId !== issue.id) return null;
  return <InitSection view={init} />;
}
