/**
 * Route `/agents/new`: create an agent. First its type, which it keeps for good: Online (it answers on the server through
 * a model service, no runner) or Runner (it drives a coding tool on a runtime). Then its name and description, its tools
 * and models in order (model services and models for Online, coding tools, each with how many runners offer it now,
 * and models for Runner), each with its reasoning effort, its instructions and what it may do. Everything else
 * (skills, where it runs, who may use it, variables) is set on its page, which opens once it exists.
 *
 * The business actions start as the application marks them (`defaultOn`), until a preset or the person chooses.
 */
import {
  ApiClientError,
  useUnsavedChanges,
  useUnsavedChangesGuard,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon } from 'lucide-react';
import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';
import { Link, useNavigate } from 'react-router';

import { agentsKeys } from '../../api/keys.js';
import { ActionCheckboxes } from '../../components/agent-fields.js';
import {
  AgentTypePicker,
  DefaultModelNote,
  NoModels,
} from '../../components/agent-type.js';
import { ModelEntriesEditor } from '../../components/model-entries.js';
import { RouteDialog } from '../../components/route-dialog.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
import { Button } from '../../components/ui/button.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import { Spinner } from '../../components/ui/spinner.js';
import { Textarea } from '../../components/ui/textarea.js';
import { UnsavedChangesBoundary } from '../../components/unsaved-changes.js';
import { useRouteOverlay } from '../../components/use-route-overlay.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useModelCatalog } from '../../hooks/use-model-catalog.js';
import { errorText, useNotify } from '../../hooks/use-notify.js';
import {
  defaultActionKeys,
  useAgentActions,
} from '../../lib/action-catalog.js';
import { onlineFor } from '../../lib/agents.js';
import {
  applyPreset,
  isDirtyDraft,
  newAgentDraft,
  newAgentInput,
  newEntryDraft,
  type EntryDraft,
  type NewAgentDraft,
} from './agent-model.js';
import { PresetPicker } from './preset-picker.js';

const NO_ACTIONS: readonly string[] = [];

const FORM_ID = 'ag-agent-new-form';

export default function NewAgentPage(): ReactElement {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const unsaved = useUnsavedChangesGuard();
  const change = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  return (
    <RouteDialog
      title={t('agentForm.title')}
      description={t('agentForm.description')}
      className='sm:max-w-2xl'
      beforeClose={() => !submittingRef.current && unsaved.confirmDiscard()}
      footer={<Footer submitting={submitting} />}
    >
      <UnsavedChangesBoundary guard={unsaved}>
        <Body onSubmittingChange={change} />
      </UnsavedChangesBoundary>
    </RouteDialog>
  );
}

function Body({
  onSubmittingChange,
}: {
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { close } = useRouteOverlay();
  const runners = useQuery({
    queryKey: agentsKeys.runners,
    queryFn: () => api.runners(),
  });
  const catalog = useModelCatalog();
  const [draft, setDraft] = useState<NewAgentDraft>(newAgentDraft);
  const [presetKey, setPresetKey] = useState<string | null>(null);
  // An online agent starts on the first service and model offered, until the person changes its rows.
  const firstService = catalog.data?.services[0]?.name ?? '';
  const firstModel = catalog.data?.services[0]?.models[0]?.value ?? '';
  const offeredRows = useMemo<EntryDraft[]>(
    () =>
      firstService && firstModel
        ? [newEntryDraft({ modelService: firstService, model: firstModel })]
        : [],
    [firstService, firstModel],
  );
  const onlineRows = draft.onlineEntries ?? offeredRows;
  // The actions a new agent starts with, once the catalog is known, unless the person chose already.
  const options = useAgentActions(NO_ACTIONS);
  const defaultsKey = defaultActionKeys(options).join('\n');
  const defaults = useMemo(
    () => (defaultsKey ? defaultsKey.split('\n') : []),
    [defaultsKey],
  );
  const [actionsChosen, setActionsChosen] = useState(false);
  const actions = actionsChosen ? draft.actions : defaults;
  const [nameError, setNameError] = useState<string>();
  const [modelError, setModelError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const markSaved = useUnsavedChanges(
    presetKey !== null || actionsChosen || isDirtyDraft(draft),
  );
  const set = <Key extends keyof NewAgentDraft>(
    key: Key,
    value: NewAgentDraft[Key],
  ): void => setDraft((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    // Only the actions an agent of its type may be given.
    const fitting = actions.filter((key) => {
      const types = options?.find((option) => option.key === key)?.types;
      return !types || types.includes(draft.type);
    });
    const result = newAgentInput({ ...draft, actions: fitting }, onlineRows);
    setNameError('nameError' in result ? t(result.nameError) : undefined);
    setModelError('modelError' in result ? t(result.modelError) : undefined);
    if (!('input' in result)) return;
    setFormError(undefined);
    onSubmittingChange(true);
    try {
      const agent = await api.createAgent(result.input);
      onSubmittingChange(false);
      markSaved();
      notify.success(t('agentForm.created', { name: agent.name }));
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      await close();
      void navigate(`/agents/${encodeURIComponent(agent.id)}`);
    } catch (error) {
      onSubmittingChange(false);
      setFormError(
        error instanceof ApiClientError && error.status === 403
          ? t('common.forbidden')
          : errorText(t, error, t('common.requestFailed')),
      );
    }
  }

  const noRunner =
    runners.data !== undefined &&
    draft.runnerEntries.length > 0 &&
    draft.runnerEntries.every(
      (entry) => onlineFor(runners.data, entry.tool) === 0,
    );
  const noModels =
    catalog.data !== undefined && catalog.data.services.length === 0;

  return (
    <form id={FORM_ID} onSubmit={(event) => void submit(event)} noValidate>
      <FieldGroup>
        {formError ? (
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel>{t('agentTypes.question')}</FieldLabel>
          <AgentTypePicker
            value={draft.type}
            onChange={(type) => set('type', type)}
          />
          <FieldDescription>{t('agentTypes.immutable')}</FieldDescription>
        </Field>
        <PresetPicker
          value={presetKey}
          onChange={(preset, name, description) => {
            setPresetKey(preset?.key ?? null);
            setActionsChosen(preset !== null);
            setDraft((current) => {
              if (preset)
                return applyPreset(current, preset, name, description);
              const blank = newAgentDraft(defaults);
              return {
                ...current,
                description: blank.description,
                instructions: blank.instructions,
                actions: blank.actions,
              };
            });
          }}
        />
        <Field data-invalid={nameError ? true : undefined}>
          <FieldLabel htmlFor='ag-agent-name'>{t('agentForm.name')}</FieldLabel>
          <Input
            id='ag-agent-name'
            value={draft.name}
            autoFocus
            maxLength={200}
            aria-invalid={nameError ? true : undefined}
            onChange={(event) => set('name', event.target.value)}
          />
          {nameError ? <FieldError>{nameError}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor='ag-agent-description'>
            {t('agentForm.descriptionLabel')}
          </FieldLabel>
          <Input
            id='ag-agent-description'
            value={draft.description}
            maxLength={300}
            onChange={(event) => set('description', event.target.value)}
          />
        </Field>
        <Field data-invalid={modelError ? true : undefined}>
          <FieldLabel>{t('modelEntries.title')}</FieldLabel>
          <ModelEntriesEditor
            idPrefix='ag-agent-new-entry'
            type={draft.type}
            value={draft.type === 'online' ? onlineRows : draft.runnerEntries}
            runners={runners.data}
            catalog={catalog.data}
            empty={<DefaultModelNote />}
            onChange={(entries) =>
              setDraft((current) =>
                current.type === 'online'
                  ? { ...current, onlineEntries: entries }
                  : { ...current, runnerEntries: entries },
              )
            }
          />
          {modelError ? <FieldError>{modelError}</FieldError> : null}
        </Field>
        {draft.type === 'online' &&
        onlineRows.length > 0 &&
        noModels &&
        catalog.data ? (
          <NoModels />
        ) : null}
        {draft.type === 'runner' && noRunner ? (
          <FieldDescription>
            {t('agentForm.noRunners', {
              tool: [
                ...new Set(
                  draft.runnerEntries.map((entry) => t(`tools.${entry.tool}`)),
                ),
              ].join(', '),
            })}{' '}
            <Link to='/runtimes/connect' className='underline'>
              {t('runtimes.add')}
            </Link>
          </FieldDescription>
        ) : null}
        <Field>
          <FieldLabel htmlFor='ag-agent-instructions'>
            {t('agentForm.instructions')}
          </FieldLabel>
          <Textarea
            id='ag-agent-instructions'
            rows={6}
            value={draft.instructions}
            placeholder={t('agentForm.instructionsPlaceholder')}
            onChange={(event) => set('instructions', event.target.value)}
          />
        </Field>
        <FieldSet>
          <FieldLegend variant='label'>{t('capabilities.title')}</FieldLegend>
          <FieldDescription>{t('capabilities.hint')}</FieldDescription>
          <ActionCheckboxes
            idPrefix='ag-agent-action'
            value={actions}
            type={draft.type}
            onChange={(next) => {
              setActionsChosen(true);
              set('actions', next);
            }}
          />
        </FieldSet>
      </FieldGroup>
    </form>
  );
}

function Footer({
  submitting,
}: {
  readonly submitting: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={submitting}
        onClick={() => void close()}
      >
        {t('actions.cancel')}
      </Button>
      <Button type='submit' form={FORM_ID} disabled={submitting}>
        {submitting ? <Spinner data-icon='inline-start' /> : null}
        {submitting ? t('common.creating') : t('common.create')}
      </Button>
    </>
  );
}
