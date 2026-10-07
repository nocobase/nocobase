/**
 * The sections of the agent page. Each keeps its own draft and reports it to the page (`useSectionDraft`), which saves
 * the dirty sections of a tab together in one `PATCH /agents/:id` with only their fields.
 */
import type { ToolPolicy } from '@nocobase/agent-protocol';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { EyeIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import {
  AGENT_ACCESS,
  CONFIRM_CHANGES,
  entryTools,
  onlineEntries,
  type AgentAccess,
  type AgentSummary,
  type ConfirmChanges,
} from '../../../../shared/agents.js';
import { offersEntry } from '../../../../shared/models.js';
import { toolEnabled, type RunnerSummary } from '../../../../shared/runners.js';
import { agentsKeys } from '../../../api/keys.js';
import { AgMultiSelect } from '../../../components/ag-multi-select.js';
import { AgSection } from '../../../components/ag-section.js';
import { ActionCheckboxes } from '../../../components/agent-fields.js';
import { DefaultModelNote, NoModels } from '../../../components/agent-type.js';
import { ModelEntriesEditor } from '../../../components/model-entries.js';
import {
  SkillScriptsNotice,
  SkillsSelect,
} from '../../../components/skills-select.js';
import { Alert, AlertDescription } from '../../../components/ui/alert.js';
import { Button } from '../../../components/ui/button.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../../../components/ui/field.js';
import { Input } from '../../../components/ui/input.js';
import {
  RadioGroup,
  RadioGroupItem,
} from '../../../components/ui/radio-group.js';
import { Textarea } from '../../../components/ui/textarea.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';
import { useModelCatalog } from '../../../hooks/use-model-catalog.js';
import { errorText, useNotify } from '../../../hooks/use-notify.js';
import { useAgentText } from '../../../hooks/use-vocabulary.js';
import { offersTool } from '../../../lib/agents.js';
import {
  DEFAULT_ALLOWED_COMMANDS,
  DEFAULT_DENIED_PATTERNS,
  DEFAULT_IDLE_TIMEOUT_MS,
} from '../../../lib/tool-policy.js';
import {
  draftEntries,
  entriesError,
  entryDrafts,
  invalidPattern,
  patternLines,
  sameEntries,
  sameItems,
  wholeNumber,
  type EntryDraft,
} from '../agent-model.js';
import { BriefPreviewDialog } from './brief-preview.js';
import { useDraftPending, useSectionDraft } from './tab-draft.js';

interface SectionProps {
  readonly agent: AgentSummary;
  readonly canEdit: boolean;
}

/** The agent's overrides with `changes` applied; a key set to undefined goes back to the default. */
function policyWith(
  current: Partial<ToolPolicy> | null,
  changes: { readonly [Key in keyof ToolPolicy]?: ToolPolicy[Key] | undefined },
): Partial<ToolPolicy> | null {
  const next: { -readonly [Key in keyof ToolPolicy]?: ToolPolicy[Key] } = {
    ...(current ?? {}),
  };
  for (const key of Object.keys(changes) as (keyof ToolPolicy)[]) {
    const value = changes[key];
    if (value === undefined) delete next[key];
    else Object.assign(next, { [key]: value });
  }
  return Object.keys(next).length > 0 ? next : null;
}

// General: basics and instructions

export function BasicsSection({ agent, canEdit }: SectionProps): ReactElement {
  const { t } = useTranslation();
  const pending = useDraftPending();
  const text = useAgentText();
  // A built-in agent's name and description show translated; only a field someone changes is sent, and then shows as
  // written.
  const shownName = text.name(agent);
  const shownDescription = text.description(agent) ?? '';
  const [name, setName] = useState(shownName);
  const [description, setDescription] = useState(shownDescription);
  const [instructions, setInstructions] = useState(agent.instructions ?? '');
  const [nameError, setNameError] = useState<string>();
  const [previewing, setPreviewing] = useState(false);
  const dirty =
    name !== shownName ||
    description !== shownDescription ||
    instructions !== (agent.instructions ?? '');
  const disabled = !canEdit || pending;

  useSectionDraft('basics', dirty, () => {
    if (!name.trim()) {
      setNameError(t('agentForm.nameRequired'));
      return null;
    }
    setNameError(undefined);
    return {
      ...(name !== shownName ? { name: name.trim() } : {}),
      ...(description !== shownDescription
        ? { description: description.trim() || null }
        : {}),
      ...(instructions !== (agent.instructions ?? '')
        ? { instructions: instructions.trim() || null }
        : {}),
    };
  });

  return (
    <AgSection
      id='ag-agent-basics'
      title={t('agentDetail.basics')}
      actions={
        <Button variant='outline' size='sm' onClick={() => setPreviewing(true)}>
          <EyeIcon data-icon='inline-start' />
          {t('brief.preview')}
        </Button>
      }
    >
      <FieldGroup>
        <Field data-invalid={nameError ? true : undefined}>
          <FieldLabel htmlFor='ag-agent-edit-name'>
            {t('agentForm.name')}
          </FieldLabel>
          <Input
            id='ag-agent-edit-name'
            value={name}
            maxLength={200}
            disabled={disabled}
            aria-invalid={nameError ? true : undefined}
            onChange={(event) => setName(event.target.value)}
          />
          {nameError ? <FieldError>{nameError}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor='ag-agent-edit-description'>
            {t('agentForm.descriptionLabel')}
          </FieldLabel>
          <Input
            id='ag-agent-edit-description'
            value={description}
            maxLength={300}
            disabled={disabled}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='ag-agent-edit-instructions'>
            {t('agentForm.instructions')}
          </FieldLabel>
          <Textarea
            id='ag-agent-edit-instructions'
            rows={8}
            value={instructions}
            disabled={disabled}
            placeholder={t('agentForm.instructionsPlaceholder')}
            onChange={(event) => setInstructions(event.target.value)}
          />
          <FieldDescription>{t('agentForm.instructionsHint')}</FieldDescription>
        </Field>
      </FieldGroup>
      <BriefPreviewDialog
        agentId={agent.id}
        open={previewing}
        onClose={() => setPreviewing(false)}
      />
    </AgSection>
  );
}

// General: who can use it

export function AccessSection({ agent, canEdit }: SectionProps): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const pending = useDraftPending();
  const users = useQuery({
    queryKey: agentsKeys.users,
    queryFn: () => api.users(),
  });
  const [access, setAccess] = useState<AgentAccess>(agent.access);
  const [userIds, setUserIds] = useState<string[]>([...agent.userIds]);
  const [usersError, setUsersError] = useState<string>();
  const dirty =
    access !== agent.access ||
    (access === 'users' && !sameItems(userIds, agent.userIds));
  const disabled = !canEdit || pending;

  useSectionDraft('access', dirty, () => {
    if (access === 'users' && userIds.length === 0) {
      setUsersError(t('agentDetail.accessUsersRequired'));
      return null;
    }
    setUsersError(undefined);
    return { access, userIds: access === 'users' ? userIds : [] };
  });

  return (
    <AgSection
      id='ag-agent-access'
      title={t('agentDetail.access')}
      description={t('agentDetail.accessHint')}
    >
      <FieldGroup>
        <RadioGroup
          value={access}
          disabled={disabled}
          onValueChange={(value) => {
            const next = AGENT_ACCESS.find((level) => level === value);
            if (next) setAccess(next);
          }}
        >
          {AGENT_ACCESS.map((level) => (
            <Field key={level} orientation='horizontal'>
              <RadioGroupItem value={level} id={`ag-agent-access-${level}`} />
              <FieldContent>
                <FieldLabel htmlFor={`ag-agent-access-${level}`}>
                  {t(`agents.access.${level}`)}
                </FieldLabel>
              </FieldContent>
            </Field>
          ))}
        </RadioGroup>
        {access === 'users' ? (
          <Field data-invalid={usersError ? true : undefined}>
            <FieldLabel htmlFor='ag-agent-access-users'>
              {t('agentDetail.accessUsers')}
            </FieldLabel>
            <AgMultiSelect
              id='ag-agent-access-users'
              options={[
                ...(users.data ?? []).map((user) => ({
                  value: user.id,
                  label: user.name,
                })),
                // Someone the directory no longer lists stays visible, by id.
                ...userIds
                  .filter(
                    (id) => !(users.data ?? []).some((user) => user.id === id),
                  )
                  .map((id) => ({ value: id, label: id })),
              ]}
              value={userIds}
              disabled={disabled}
              placeholder={t('agentDetail.accessUsersPlaceholder')}
              onChange={setUserIds}
            />
            {usersError ? <FieldError>{usersError}</FieldError> : null}
          </Field>
        ) : null}
      </FieldGroup>
    </AgSection>
  );
}

// Capabilities: tool and model

export function ToolSection({
  agent,
  runners,
  canEdit,
}: SectionProps & {
  readonly runners: readonly RunnerSummary[] | undefined;
}): ReactElement {
  const { t } = useTranslation();
  const pending = useDraftPending();
  const [entries, setEntries] = useState<EntryDraft[]>(() =>
    entryDrafts(agent.modelEntries),
  );
  const [entriesErrorKey, setEntriesErrorKey] = useState<string | null>(null);
  const initialTurns = agent.toolPolicy?.maxTurns
    ? String(agent.toolPolicy.maxTurns)
    : '';
  const initialIdle = String(
    Math.round(
      (agent.toolPolicy?.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS) / 60_000,
    ),
  );
  const [maxTurns, setMaxTurns] = useState(initialTurns);
  const [idle, setIdle] = useState(initialIdle);
  const [errors, setErrors] = useState<{ turns?: string; idle?: string }>({});
  const dirty =
    !sameEntries('runner', entries, agent.modelEntries) ||
    maxTurns !== initialTurns ||
    idle !== initialIdle;
  const disabled = !canEdit || pending;

  useSectionDraft('tool', dirty, () => {
    const turns = maxTurns.trim()
      ? wholeNumber(maxTurns, 1, 10_000)
      : undefined;
    const minutes = wholeNumber(idle, 1, 1440);
    setErrors({
      ...(turns === null ? { turns: t('toolSection.turnsInvalid') } : {}),
      ...(minutes === null ? { idle: t('toolSection.idleInvalid') } : {}),
    });
    const entriesProblem = entriesError('runner', entries);
    setEntriesErrorKey(entriesProblem);
    if (turns === null || minutes === null || entriesProblem) return null;
    const idleMs = minutes * 60_000;
    return {
      modelEntries: draftEntries('runner', entries),
      toolPolicy: policyWith(agent.toolPolicy, {
        maxTurns: turns,
        idleTimeoutMs: idleMs === DEFAULT_IDLE_TIMEOUT_MS ? undefined : idleMs,
      }),
    };
  });

  return (
    <AgSection
      id='ag-agent-tool'
      title={t('toolSection.title')}
      description={t('modelEntries.hintRunner')}
    >
      <FieldGroup>
        <ModelEntriesEditor
          idPrefix='ag-agent-edit-entry'
          type='runner'
          value={entries}
          runners={runners}
          disabled={disabled}
          onChange={setEntries}
        />
        {entriesErrorKey ? <FieldError>{t(entriesErrorKey)}</FieldError> : null}
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field data-invalid={errors.turns ? true : undefined}>
            <FieldLabel htmlFor='ag-agent-edit-turns'>
              {t('toolSection.maxTurns')}
            </FieldLabel>
            <Input
              id='ag-agent-edit-turns'
              inputMode='numeric'
              value={maxTurns}
              disabled={disabled}
              placeholder={t('toolSection.unlimited')}
              onChange={(event) => setMaxTurns(event.target.value)}
            />
            {errors.turns ? <FieldError>{errors.turns}</FieldError> : null}
          </Field>
          <Field data-invalid={errors.idle ? true : undefined}>
            <FieldLabel htmlFor='ag-agent-edit-idle'>
              {t('toolSection.idleTimeout')}
            </FieldLabel>
            <Input
              id='ag-agent-edit-idle'
              inputMode='numeric'
              value={idle}
              disabled={disabled}
              onChange={(event) => setIdle(event.target.value)}
            />
            {errors.idle ? (
              <FieldError>{errors.idle}</FieldError>
            ) : (
              <FieldDescription>{t('toolSection.idleHint')}</FieldDescription>
            )}
          </Field>
        </div>
      </FieldGroup>
    </AgSection>
  );
}

// Capabilities: an online agent's model

export function ModelSection({ agent, canEdit }: SectionProps): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const pending = useDraftPending();
  const catalog = useModelCatalog();
  const [entries, setEntries] = useState<EntryDraft[]>(() =>
    entryDrafts(agent.modelEntries),
  );
  const [problem, setProblem] = useState<string | null>(null);
  const dirty = !sameEntries('online', entries, agent.modelEntries);
  const disabled = !canEdit || pending;
  const check = useMutation({
    mutationFn: (entry: EntryDraft) =>
      api.checkModel({ modelService: entry.modelService, model: entry.model }),
    onSuccess: (result) => {
      if (result.ok) notify.success(t('modelSection.testOk'));
      else
        notify.error(
          null,
          t('modelSection.testFailed', { message: result.message ?? '' }),
        );
    },
    onError: (error) =>
      notify.error(
        null,
        t('modelSection.testFailed', {
          message: errorText(t, error, t('common.requestFailed')),
        }),
      ),
  });
  const unavailable = catalog.data
    ? onlineEntries(agent).filter((entry) => !offersEntry(catalog.data, entry))
    : [];

  useSectionDraft('model', dirty, () => {
    const error = entriesError('online', entries);
    setProblem(error);
    if (error) return null;
    return {
      modelEntries: draftEntries('online', entries),
    };
  });

  return (
    <AgSection
      id='ag-agent-model'
      title={t('modelSection.title')}
      description={t('modelEntries.hintOnline')}
    >
      <FieldGroup>
        {unavailable.length > 0 ? (
          <Alert variant='destructive'>
            <AlertDescription>
              {t('modelEntries.unavailable', {
                models: unavailable
                  .map((entry) => `${entry.modelService} · ${entry.model}`)
                  .join(', '),
              })}
            </AlertDescription>
          </Alert>
        ) : null}
        <ModelEntriesEditor
          idPrefix='ag-agent-edit-online'
          type='online'
          value={entries}
          catalog={catalog.data}
          disabled={disabled}
          onChange={setEntries}
          onTest={(entry) => check.mutate(entry)}
          testing={check.isPending ? (check.variables?.key ?? null) : null}
          empty={<DefaultModelNote />}
        />
        {problem ? <FieldError>{t(problem)}</FieldError> : null}
        {entries.length > 0 &&
        catalog.data &&
        catalog.data.services.length === 0 ? (
          <NoModels />
        ) : null}
      </FieldGroup>
    </AgSection>
  );
}

// Capabilities: skills

export function SkillsSection({ agent, canEdit }: SectionProps): ReactElement {
  const { t } = useTranslation();
  const pending = useDraftPending();
  const [selected, setSelected] = useState<string[]>([...agent.skillIds]);
  const dirty = !sameItems(selected, agent.skillIds);
  useSectionDraft('skills', dirty, () => ({ skillIds: selected }));
  return (
    <AgSection
      id='ag-agent-skills'
      title={t('agentSkills.title')}
      description={
        <>
          {agent.type === 'online'
            ? t('agentSkills.descriptionOnline')
            : t('agentSkills.description')}{' '}
          <Link
            to='/skills'
            className='font-medium text-primary underline-offset-4 hover:underline'
          >
            {t('agentSkills.manage')}
          </Link>
        </>
      }
    >
      <SkillsSelect
        id='ag-agent-skills-select'
        value={selected}
        disabled={!canEdit || pending}
        onChange={setSelected}
      />
      {agent.type === 'online' ? <SkillScriptsNotice value={selected} /> : null}
    </AgSection>
  );
}

// Capabilities: business capabilities

export function ActionsSection({ agent, canEdit }: SectionProps): ReactElement {
  const { t } = useTranslation();
  const pending = useDraftPending();
  const [actions, setActions] = useState<string[]>([...agent.actions]);
  const dirty = !sameItems(actions, agent.actions);
  useSectionDraft('actions', dirty, () => ({ actions }));
  return (
    <AgSection
      id='ag-agent-actions'
      title={t('capabilities.title')}
      description={t('capabilities.hint')}
      className='max-w-4xl'
    >
      <ActionCheckboxes
        idPrefix='ag-agent-edit-action'
        value={actions}
        type={agent.type}
        disabled={!canEdit || pending}
        detailed
        onChange={setActions}
      />
    </AgSection>
  );
}

// Capabilities: whether it asks before changing data

export function ConfirmSection({ agent, canEdit }: SectionProps): ReactElement {
  const { t } = useTranslation();
  const pending = useDraftPending();
  const [confirmChanges, setConfirmChanges] = useState<ConfirmChanges>(
    agent.confirmChanges,
  );
  const dirty = confirmChanges !== agent.confirmChanges;
  useSectionDraft('confirm', dirty, () => ({ confirmChanges }));
  return (
    <AgSection
      id='ag-agent-confirm'
      title={t('capabilities.confirmChanges')}
      description={t('capabilities.confirmChangesHint')}
    >
      <RadioGroup
        value={confirmChanges}
        disabled={!canEdit || pending}
        onValueChange={(value) => {
          const next = CONFIRM_CHANGES.find((level) => level === value);
          if (next) setConfirmChanges(next);
        }}
      >
        {CONFIRM_CHANGES.map((level) => (
          <Field key={level} orientation='horizontal'>
            <RadioGroupItem value={level} id={`ag-agent-confirm-${level}`} />
            <FieldContent>
              <FieldLabel htmlFor={`ag-agent-confirm-${level}`}>
                {t(`capabilities.confirm.${level}`)}
              </FieldLabel>
              {level === 'larger' ? (
                <FieldDescription>
                  {t('capabilities.confirm.largerHint')}
                </FieldDescription>
              ) : null}
            </FieldContent>
          </Field>
        ))}
      </RadioGroup>
    </AgSection>
  );
}

// Runtime: where it runs (an online agent shows it under Capabilities: on the server, with its attempts)

export function PlacementSection({
  agent,
  runners,
  canEdit,
}: SectionProps & {
  readonly runners: readonly RunnerSummary[] | undefined;
}): ReactElement {
  const { t } = useTranslation();
  const pending = useDraftPending();
  const [runnerIds, setRunnerIds] = useState<string[]>([...agent.runnerIds]);
  const [concurrency, setConcurrency] = useState(
    String(agent.maxConcurrentRuns),
  );
  const [attempts, setAttempts] = useState(String(agent.maxAttempts));
  const [errors, setErrors] = useState<{
    concurrency?: string;
    attempts?: string;
  }>({});
  const dirty =
    !sameItems(runnerIds, agent.runnerIds) ||
    concurrency !== String(agent.maxConcurrentRuns) ||
    attempts !== String(agent.maxAttempts);
  const disabled = !canEdit || pending;
  // An online agent runs on the server: no runners, and no concurrency limit.
  const chat = agent.type === 'online';
  const agentTools = entryTools(agent);
  const toolName = agentTools.map((tool) => t(`tools.${tool}`)).join(' / ');
  const candidates = (runners ?? []).filter(
    (runner) =>
      runner.status !== 'revoked' &&
      (agentTools.some(
        (agentTool) =>
          toolEnabled(runner, agentTool) &&
          runner.tools.some((tool) => tool.kind === agentTool),
      ) ||
        agent.runnerIds.includes(runner.id)),
  );
  const online = runners
    ? runners.filter((runner) =>
        agentTools.some((tool) => offersTool(runner, tool)),
      ).length
    : 0;

  useSectionDraft('placement', dirty, () => {
    const max = chat
      ? agent.maxConcurrentRuns
      : wholeNumber(concurrency, 1, 100);
    const tries = wholeNumber(attempts, 1, 10);
    setErrors({
      ...(max === null ? { concurrency: t('agentForm.maxInvalid') } : {}),
      ...(tries === null ? { attempts: t('placement.attemptsInvalid') } : {}),
    });
    if (max === null || tries === null) return null;
    return chat
      ? { maxAttempts: tries }
      : { runnerIds, maxConcurrentRuns: max, maxAttempts: tries };
  });

  return (
    <AgSection id='ag-agent-placement' title={t('placement.title')}>
      <FieldGroup>
        {chat ? <p className='text-sm'>{t('agentTypes.onServer')}</p> : null}
        <p className='text-sm' hidden={chat}>
          {t('placement.online', { tool: toolName, count: online })}
          {runners && online === 0 ? (
            <>
              {' '}
              <Link to='/runtimes/connect' className='underline'>
                {t('runtimes.add')}
              </Link>
            </>
          ) : null}
        </p>
        <Field hidden={chat}>
          <FieldLabel htmlFor='ag-agent-runners'>
            {t('placement.runners')}
          </FieldLabel>
          <AgMultiSelect
            id='ag-agent-runners'
            options={candidates.map((runner) => ({
              value: runner.id,
              label: `${runner.name} · ${t(`runtimes.status.${runner.status}`)}`,
            }))}
            value={runnerIds}
            disabled={disabled}
            placeholder={t('placement.anyRunner')}
            emptyText={t('placement.noCandidates', { tool: toolName })}
            onChange={setRunnerIds}
          />
          <FieldDescription>{t('placement.runnersHint')}</FieldDescription>
        </Field>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field
            hidden={chat}
            data-invalid={errors.concurrency ? true : undefined}
          >
            <FieldLabel htmlFor='ag-agent-concurrency'>
              {t('agentForm.maxConcurrentRuns')}
            </FieldLabel>
            <Input
              id='ag-agent-concurrency'
              inputMode='numeric'
              value={concurrency}
              disabled={disabled}
              onChange={(event) => setConcurrency(event.target.value)}
            />
            {errors.concurrency ? (
              <FieldError>{errors.concurrency}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={errors.attempts ? true : undefined}>
            <FieldLabel htmlFor='ag-agent-attempts'>
              {t('placement.attempts')}
            </FieldLabel>
            <Input
              id='ag-agent-attempts'
              inputMode='numeric'
              value={attempts}
              disabled={disabled}
              onChange={(event) => setAttempts(event.target.value)}
            />
            {errors.attempts ? (
              <FieldError>{errors.attempts}</FieldError>
            ) : null}
          </Field>
        </div>
      </FieldGroup>
    </AgSection>
  );
}

// Runtime: the commands it may run on the runner's machine

export function CommandPolicySection({
  agent,
  canEdit,
}: SectionProps): ReactElement {
  const { t } = useTranslation();
  const pending = useDraftPending();
  const initialAllowed = (
    agent.toolPolicy?.allowedCommands ?? DEFAULT_ALLOWED_COMMANDS
  ).join('\n');
  const initialDenied = (
    agent.toolPolicy?.deniedPatterns ?? DEFAULT_DENIED_PATTERNS
  ).join('\n');
  const [allowed, setAllowed] = useState(initialAllowed);
  const [denied, setDenied] = useState(initialDenied);
  const [patternError, setPatternError] = useState<string>();
  const dirty = allowed !== initialAllowed || denied !== initialDenied;
  const disabled = !canEdit || pending;

  useSectionDraft('commands', dirty, () => {
    const allowedLines = patternLines(allowed);
    const deniedLines = patternLines(denied);
    const bad = invalidPattern([...allowedLines, ...deniedLines]);
    setPatternError(
      bad ? t('capabilities.patternInvalid', { pattern: bad }) : undefined,
    );
    if (bad) return null;
    return {
      toolPolicy: policyWith(agent.toolPolicy, {
        allowedCommands: sameItems(allowedLines, DEFAULT_ALLOWED_COMMANDS)
          ? undefined
          : allowedLines,
        deniedPatterns: sameItems(deniedLines, DEFAULT_DENIED_PATTERNS)
          ? undefined
          : deniedLines,
      }),
    };
  });

  return (
    <AgSection
      id='ag-agent-commands'
      title={t('commandPolicy.title')}
      description={t('commandPolicy.hint')}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='ag-agent-allowed'>
            {t('capabilities.allowedCommands')}
          </FieldLabel>
          <Textarea
            id='ag-agent-allowed'
            rows={4}
            spellCheck={false}
            className='font-mono text-xs'
            value={allowed}
            disabled={disabled}
            onChange={(event) => setAllowed(event.target.value)}
          />
          <FieldDescription>
            {t('capabilities.allowedCommandsHint')}
          </FieldDescription>
        </Field>
        <Field data-invalid={patternError ? true : undefined}>
          <FieldLabel htmlFor='ag-agent-denied'>
            {t('capabilities.deniedPatterns')}
          </FieldLabel>
          <Textarea
            id='ag-agent-denied'
            rows={4}
            spellCheck={false}
            className='font-mono text-xs'
            value={denied}
            disabled={disabled}
            onChange={(event) => setDenied(event.target.value)}
          />
          {patternError ? (
            <FieldError>{patternError}</FieldError>
          ) : (
            <FieldDescription>
              {t('capabilities.deniedPatternsHint')}
            </FieldDescription>
          )}
        </Field>
      </FieldGroup>
    </AgSection>
  );
}
