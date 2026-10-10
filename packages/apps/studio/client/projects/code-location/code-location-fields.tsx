/**
 * Where a working directory is, the same choice in the New project wizard (`pages/projects/new`) and when a project's
 * settings add one (`projects/detail/resource-dialog.tsx`), drawn with the new-project form parts (`parts/`): a new
 * GitHub repository, an existing repository, a directory on a runner, and, in the wizard alone, none. Until the person
 * picks one, the first available is chosen (`defaultCodeLocation`). The chosen one's fields sit beneath its card:
 *
 * With several Git connections, the panel of a new or an existing repository starts with the Git connection, one choice
 * for the new repository, its template repositories and an existing repository alike, the one last chosen in this
 * browser preselected (`git/last-connection.ts`); with one there is nothing to choose.
 *
 * - a new repository: where it is created, said as a read-only line (the connection's account), its name and visibility, then how it gets its first code: a NocoBase application from
 *   create-app's default template, scaffolded by the init agent on a runner (the default; it says a runner is needed,
 *   with a link to Runtimes, and that the initialization waits while none is online), generated from a template
 *   repository (the connection's, searched, or any typed `owner/repo`, checked first) with the workflow that
 *   initializes it, or made by an agent from a prompt (left empty, the repository starts with an initial commit and
 *   nothing initializes it). It is created when the form is submitted, never before, so leaving the form leaves
 *   nothing behind;
 * - an existing repository: searched through a Git connection, or given by its clone URL when the workspace has none,
 *   with its default branch, and an optional prompt;
 * - a directory on a runner: the runner by name before the absolute path, and an optional prompt.
 *
 * Whenever an agent initializes (a prompt, or a NocoBase application), the initialization agent is asked for. Without a connection (`git.enabled` false) a
 * new repository cannot be created, which its card says in one line with a link to Settings › Git, and the line under
 * the cards adds that a connection also allows generating one from a template repository. A working directory's short
 * name is set when it is edited, not here.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { PencilIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import { AgentPicker } from '@/components/agent-picker';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { NewProjectFormLabels } from './parts/labels.js';
import {
  CodeLocationChoice,
  InitMethodChoice,
  InitPromptField,
  InitWorkflowSelect,
  TemplateRepoChoice,
  type TemplateRepoCheck,
} from './parts/new-project-form.js';

import { errorText } from '../../access/notify.js';
import { useAgentFieldLabels } from '../../agents/agent-field-labels.js';
import { RepositoryPicker } from '../../git/repo-picker.js';
import type { CodeLocationState } from './use-code-location.js';

export function CodeLocationFields({
  state,
  labels: given,
}: {
  readonly state: CodeLocationState;
  readonly labels: NewProjectFormLabels;
}): ReactElement {
  const { t } = useTranslation();
  const noConnection = state.connections.length === 0;
  // Said in one line inside the card it disables, with where to connect one.
  const noGit = (
    <span className='block'>
      {t('projectPage.newProject.noGit')}{' '}
      <Link
        to='/config/git'
        className='font-medium text-primary underline-offset-4 hover:underline'
      >
        {t('projectPage.newProject.connect')}
      </Link>
    </span>
  );
  // Added to a project, the working directory's initialization holds none of the project's other issues.
  const added: NewProjectFormLabels =
    state.host === 'project'
      ? {
          ...given,
          locations: {
            ...given.locations,
            newRepo: {
              ...given.locations.newRepo,
              description: t('projectPage.codeLocation.newRepoAdded'),
            },
          },
          prompt: {
            ...given.prompt,
            optionalHint: t('projectPage.codeLocation.promptAdded'),
          },
        }
      : given;
  // Without a connection, the line under the cards also says what one would allow.
  const labels: NewProjectFormLabels = noConnection
    ? {
        ...added,
        locations: Object.fromEntries(
          Object.entries(added.locations).map(([key, location]) => [
            key,
            {
              ...location,
              description: `${location.description} ${t('projectPage.newProject.noGitTemplates')}`,
            },
          ]),
        ) as NewProjectFormLabels['locations'],
      }
    : added;
  return (
    <div className='flex flex-col gap-4' data-code-location={state.host}>
      <CodeLocationChoice
        options={state.locations}
        value={state.location}
        onChange={state.setLocation}
        unavailable={noConnection ? { newRepo: noGit } : {}}
        labels={labels}
      >
        {state.connections.length > 1 &&
        (state.location === 'newRepo' || state.location === 'existingRepo') ? (
          <ConnectionField state={state} />
        ) : null}
        {state.location === 'newRepo' && state.connection ? (
          <NewRepoFields state={state} labels={labels} />
        ) : null}
        {state.location === 'existingRepo' ? (
          <ExistingRepoFields state={state} labels={labels} />
        ) : null}
        {state.location === 'runnerDirectory' ? (
          <RunnerDirectoryFields state={state} labels={labels} />
        ) : null}
        {state.agentInit ? <InitAgentField state={state} /> : null}
      </CodeLocationChoice>
    </div>
  );
}

type FieldsProps = {
  readonly state: CodeLocationState;
  readonly labels: NewProjectFormLabels;
};

/** What checking a typed or chosen template repository says, from the check's answer. */
function templateCheckOf(state: CodeLocationState): TemplateRepoCheck | null {
  const name = state.checkedTemplate;
  if (name === null) return null;
  const check = state.templateCheck;
  if (check.isSuccess) return { name, state: 'ok' };
  if (check.isError) {
    const error = check.error;
    const reason = error instanceof ApiClientError ? error.reason : null;
    return {
      name,
      state:
        reason === 'NOT_A_TEMPLATE_REPO'
          ? 'notTemplate'
          : reason === 'TEMPLATE_REPO_NOT_FOUND' ||
              (error instanceof ApiClientError && error.status === 404)
            ? 'notFound'
            : 'failed',
    };
  }
  return { name, state: 'checking' };
}

/**
 * The Git connection a new or an existing repository goes through, when there are several: each with its account and
 * kind.
 */
function ConnectionField({
  state,
}: {
  readonly state: CodeLocationState;
}): ReactElement {
  const { t } = useTranslation();
  const items = state.connections.map((item) => ({
    value: item.id,
    label: item.account ? `${item.name} (${item.account})` : item.name,
    name: item.name,
    description: [
      item.account,
      t(`studioGit.providers.${item.provider}.kind.${item.kind}`),
      item.demo ? t('studioGit.connections.demo') : null,
    ]
      .filter(Boolean)
      .join(' · '),
  }));
  return (
    <Field data-git-connection={state.connection?.id}>
      <FieldLabel htmlFor='code-location-connection'>
        {t('projectPage.newProject.gitConnection')}
      </FieldLabel>
      <Select
        items={items}
        value={state.connection?.id ?? null}
        onValueChange={(next: string | null) => {
          if (next) state.setConnectionId(next);
        }}
      >
        <SelectTrigger id='code-location-connection' className='w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              <span className='flex min-w-0 flex-col'>
                <span>{item.name}</span>
                <span className='text-xs text-muted-foreground'>
                  {item.description}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>
        {t('projectPage.newProject.gitConnectionHint')}
      </FieldDescription>
    </Field>
  );
}

/**
 * Where the repository is created, said as a read-only line: the connection's account (an app's installation decides
 * it). A token may create in another account it belongs to, which the pencil after the owner ("Change owner") opens.
 */
function RepoOwnerLine({ state }: FieldsProps): ReactElement {
  const { t } = useTranslation();
  const connection = state.connection;
  const [editing, setEditing] = useState(false);
  const owner =
    (connection.kind === 'token' && state.owner.trim()) ||
    connection.account ||
    '';
  return (
    <div className='flex flex-col gap-2' data-repo-owner={owner}>
      <div className='flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm'>
        <span className='text-muted-foreground'>
          {t('projectPage.newProject.owner')}
        </span>
        <span className='font-medium' data-repo-owner-name>
          {owner}
        </span>
        {connection.kind === 'token' && !editing ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type='button'
                  size='icon-xs'
                  variant='ghost'
                  aria-label={t('projectPage.newProject.changeOwner')}
                  onClick={() => setEditing(true)}
                />
              }
            >
              <PencilIcon aria-hidden />
            </TooltipTrigger>
            <TooltipContent>
              {t('projectPage.newProject.changeOwner')}
            </TooltipContent>
          </Tooltip>
        ) : null}
        <span className='text-muted-foreground'>
          {t('projectPage.newProject.ownerFrom', {
            connection: connection.name,
          })}
        </span>
      </div>
      {connection.kind === 'token' && editing ? (
        <Field>
          <FieldLabel htmlFor='code-location-owner'>
            {t('projectPage.newProject.owner')}
          </FieldLabel>
          <Input
            id='code-location-owner'
            // The pencil that opened it is gone: focus moves here.
            autoFocus
            value={state.owner}
            placeholder={connection.account ?? ''}
            onChange={(event) => state.setOwner(event.target.value)}
          />
        </Field>
      ) : connection.kind === 'app' ? (
        <p className='text-xs text-muted-foreground'>
          {t('projectPage.newProject.ownerHint')}
        </p>
      ) : null}
    </div>
  );
}

/** A NocoBase application: the runner its initialization needs, whether one is online, and the CI that comes with it. */
function NocobaseAppFields({ state, labels }: FieldsProps): ReactElement {
  const words = labels.nocobase;
  const offline = !state.runners.loading && state.runners.online === 0;
  return (
    <div className='flex flex-col gap-2 text-sm' data-nocobase-app>
      <p className='text-muted-foreground'>
        {words.runnerNeeded}{' '}
        <Link
          to='/runtimes'
          className='font-medium text-primary underline-offset-4 hover:underline'
        >
          {words.runtimesLink}
        </Link>
      </p>
      {offline ? (
        <p
          className='text-amber-700 dark:text-amber-400'
          data-nocobase-no-runner
        >
          {words.noRunnerOnline}
        </p>
      ) : null}
      <p className='text-muted-foreground'>{words.ci}</p>
    </div>
  );
}

/** A new repository: where it is created, then how it gets its first code. Created on submit. */
function NewRepoFields({ state, labels }: FieldsProps): ReactElement {
  const { t } = useTranslation();
  const templates = state.templates;
  return (
    <>
      <RepoOwnerLine key={state.connection.id} state={state} labels={labels} />
      <div className='grid gap-3 sm:grid-cols-2'>
        <Field>
          <FieldLabel htmlFor='code-location-repo'>
            {t('projectPage.newProject.repoName')}
          </FieldLabel>
          <Input
            id='code-location-repo'
            value={state.repoName}
            onChange={(event) => state.setRepoName(event.target.value)}
          />
        </Field>
        <Field orientation='horizontal' className='self-end'>
          <Switch
            id='code-location-private'
            checked={state.privateRepo}
            onCheckedChange={state.setPrivateRepo}
          />
          <FieldLabel htmlFor='code-location-private'>
            {t('projectPage.newProject.privateRepo')}
          </FieldLabel>
        </Field>
      </div>
      <InitMethodChoice
        value={state.method}
        onChange={state.setMethod}
        labels={labels}
      >
        {state.method === 'nocobase' ? (
          <NocobaseAppFields state={state} labels={labels} />
        ) : state.method === 'template' ? (
          <>
            <TemplateRepoChoice
              repos={state.templateRepos}
              value={state.templateRepo}
              onChange={state.setTemplateRepo}
              search={state.templateSearch}
              onSearch={state.setTemplateSearch}
              loading={templates.isPending && !templates.isError}
              loadingMore={templates.isFetchingNextPage}
              error={
                templates.isError
                  ? errorText(
                      t,
                      templates.error,
                      t('projectPage.newProject.loadFailed'),
                    )
                  : null
              }
              onRetry={() => void templates.refetch()}
              hasMore={state.templatesMore}
              onMore={() => void templates.fetchNextPage()}
              typed={state.typedTemplate}
              check={templateCheckOf(state)}
              labels={labels}
            />
            {state.templateReady ? (
              <InitWorkflowSelect
                id='code-location-init-workflow'
                workflows={state.repoWorkflows.data ?? []}
                value={state.initWorkflowId}
                loading={state.repoWorkflows.isPending}
                onChange={state.setInitWorkflowId}
                labels={labels}
              />
            ) : null}
          </>
        ) : (
          <InitPromptField
            id='code-location-init-prompt'
            value={state.prompt}
            onChange={state.setPrompt}
            labels={labels}
          />
        )}
      </InitMethodChoice>
    </>
  );
}

/** An existing repository, searched through a connection or typed; its default branch; an optional prompt. */
function ExistingRepoFields({ state, labels }: FieldsProps): ReactElement {
  const { t } = useTranslation();
  const chosen = state.manualRepo
    ? Boolean(state.cloneUrl.trim())
    : !!state.picked;
  return (
    <>
      {state.manualRepo ? (
        <Field>
          <FieldLabel htmlFor='code-location-clone-url'>
            {t('projectPage.codeLocation.cloneUrl')}
          </FieldLabel>
          <Input
            id='code-location-clone-url'
            value={state.cloneUrl}
            placeholder='https://github.com/owner/repo.git'
            onChange={(event) => state.setCloneUrl(event.target.value)}
          />
          <FieldDescription>
            {t('projectPage.codeLocation.cloneUrlHint')}
          </FieldDescription>
        </Field>
      ) : (
        <Field>
          <FieldLabel>{t('projectPage.codeLocation.repository')}</FieldLabel>
          <RepositoryPicker
            key={state.connection?.id}
            connections={state.connections}
            connectionId={state.connection?.id}
            picked={state.picked?.binding.fullName ?? null}
            onPick={state.setPicked}
          />
        </Field>
      )}
      {chosen ? (
        <Field>
          <FieldLabel htmlFor='code-location-default-branch'>
            {t('projectPage.codeLocation.defaultBranch')}
          </FieldLabel>
          <Input
            id='code-location-default-branch'
            value={state.defaultBranch}
            placeholder={state.picked?.defaultRef || 'main'}
            onChange={(event) => state.setDefaultBranch(event.target.value)}
          />
          <FieldDescription>
            {t('projectPage.codeLocation.defaultBranchHint')}
          </FieldDescription>
        </Field>
      ) : null}
      <InitPromptField
        id='code-location-init-prompt'
        optional
        value={state.prompt}
        onChange={state.setPrompt}
        labels={labels}
      />
    </>
  );
}

/** The runner by name, with its machine and status, before the absolute path on it; an optional prompt. */
function RunnerDirectoryFields({ state, labels }: FieldsProps): ReactElement {
  const { t } = useTranslation();
  const items = state.runners.options;
  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      <Field>
        <FieldLabel htmlFor='code-location-runner'>
          {t('projectPage.newProject.runner')}
        </FieldLabel>
        <Select
          items={items}
          value={state.runnerId || null}
          onValueChange={(next: string | null) => {
            if (next) state.setRunnerId(next);
          }}
        >
          <SelectTrigger id='code-location-runner' className='w-full'>
            <SelectValue
              placeholder={
                state.runners.loading
                  ? t('projectPage.codeLocation.loadingRunners')
                  : t('projectPage.codeLocation.chooseRunner')
              }
            />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                <span className='flex min-w-0 flex-col'>
                  <span>{item.label}</span>
                  {'description' in item && item.description ? (
                    <span className='text-xs text-muted-foreground'>
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor='code-location-path'>
          {t('projectPage.newProject.path')}
        </FieldLabel>
        <Input
          id='code-location-path'
          value={state.path}
          disabled={!state.runnerId}
          className='font-mono'
          placeholder='/srv/app'
          onChange={(event) => state.setPath(event.target.value)}
        />
      </Field>
      <div className='sm:col-span-2'>
        <Field orientation='horizontal'>
          <Switch
            id='code-location-directory-nocobase'
            checked={state.directoryNocobase}
            onCheckedChange={state.setDirectoryNocobase}
          />
          <FieldLabel htmlFor='code-location-directory-nocobase'>
            {t('projectPage.codeLocation.directoryNocobase')}
          </FieldLabel>
        </Field>
        {state.directoryNocobase ? (
          <p className='mt-2 text-sm text-muted-foreground'>
            {t('projectPage.codeLocation.directoryNocobaseHint')}
          </p>
        ) : (
          <InitPromptField
            id='code-location-init-prompt'
            optional
            value={state.prompt}
            onChange={state.setPrompt}
            labels={labels}
          />
        )}
      </div>
    </div>
  );
}

/** The agent of the init issue, asked for whenever a prompt initializes. */
function InitAgentField({
  state,
}: {
  readonly state: CodeLocationState;
}): ReactElement {
  const { t } = useTranslation();
  const label = t('projectPage.newProject.initAgent');
  const labels = useAgentFieldLabels(label);
  return (
    <Field>
      <FieldLabel htmlFor='code-location-init-agent'>{label}</FieldLabel>
      <AgentPicker
        id='code-location-init-agent'
        agents={state.agents.agents}
        type='runner'
        value={state.initAgentId || null}
        onSelect={state.setInitAgentId}
        labels={labels}
        placeholder={
          state.agents.loading
            ? t('projectPage.newProject.loadingAgents')
            : t('projectPage.newProject.chooseAgent')
        }
      />
      <FieldDescription>
        {t('projectPage.newProject.initAgentHint')}
      </FieldDescription>
    </Field>
  );
}
