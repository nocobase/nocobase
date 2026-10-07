import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, SparklesIcon } from 'lucide-react';
import { type FormEvent, type ReactElement, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router';

import { ISSUE_TITLE_MAX, type Executor } from '../../../../shared/issues.js';
import { STAGE_MAX } from '../../../../shared/subtasks.js';
import { pmKeys } from '../../../api/keys.js';
import { PmExecutorSelect } from '../../../components/pm-executor-select.js';
import { PmMultiSelect } from '../../../components/pm-multi-select.js';
import { RouteDialog } from '../../../components/route-dialog.js';
import { UnsavedChangesBoundary } from '../../../components/unsaved-changes.js';
import {
  useUnsavedChanges,
  useUnsavedChangesGuard,
} from '@nocobase/app-client';
import { Alert, AlertDescription } from '../../../components/ui/alert.js';
import { Button } from '../../../components/ui/button.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../../../components/ui/field.js';
import { Input } from '../../../components/ui/input.js';
import { Spinner } from '../../../components/ui/spinner.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs.js';
import { Textarea } from '../../../components/ui/textarea.js';
import { useRouteOverlay } from '../../../components/use-route-overlay.js';
import { errorText, useNotify } from '../../../hooks/use-notify.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';
import { startingExecutor, useExecutorOptions } from '../../../lib/kinds.js';
import { INITIAL_STATUS } from '../../../../shared/workflows.js';
import { INTAKE_DRAFT_PARAM, IntakePanel } from '../../intake/intake-panel.js';
import { useIntakeBreakdown } from '../../intake/use-intake-breakdown.js';
import { INTAKE_JOB_PARAM } from '../../intake/use-intake-ai.js';
import { StartDialog, type StartRequest } from './start-dialog.js';

const FORM_ID = 'pm-subtask-new-form';
const STAGE_PATTERN = /^\d{1,4}$/u;

const TABS = ['ai', 'manual'] as const;
type SubtaskTab = (typeof TABS)[number];

/**
 * Route `/issues/:issueId/new-subtask`: the "New sub-issue" dialog over the issue's page, with two ways to create.
 * "AI breakdown" (`?tab=ai`): AI reads the issue and drafts its sub-issues (`?job=` follows the request, `?draft=`
 * shows the drafts, `useIntakeBreakdown`), which are reviewed and edited in the draft editor and created together.
 * "Manual" (`?tab=manual`, the default without a request or draft): one sub-issue, with its stage, the siblings it
 * waits for, and an executor, as the old issue page offered. The AI tab shows only when the viewer can ask AI or a
 * request or draft is open. Both tabs stay mounted, so switching keeps what either holds. Closing or creating stays on
 * the issue's page. It cannot close while the sub-issue is being created, and asks before discarding what was typed.
 * Giving it to an agent asks "Start now?" first.
 */
export default function NewSubtaskPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { issueId = '' } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const [wide, setWide] = useState(Boolean(params.get(INTAKE_DRAFT_PARAM)));
  const submittingRef = useRef(false);
  const unsaved = useUnsavedChangesGuard();
  const api = usePmApi();
  const parent = useQuery({
    queryKey: pmKeys.issue(issueId),
    queryFn: () => api.issue(issueId),
  });
  const breakdown = useIntakeBreakdown(parent.data?.id ?? issueId, (jobId) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('tab', 'ai');
        next.set(INTAKE_JOB_PARAM, jobId);
        return next;
      },
      { replace: true },
    ),
  );
  const following = Boolean(
    params.get(INTAKE_DRAFT_PARAM) || params.get(INTAKE_JOB_PARAM),
  );
  const withAi = breakdown.available || following;
  const asked = params.get('tab');
  const tab: SubtaskTab = !withAi
    ? 'manual'
    : (TABS as readonly string[]).includes(asked ?? '')
      ? (asked as SubtaskTab)
      : following
        ? 'ai'
        : 'manual';
  const onSubmittingChange = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  // Back to the issue, without this dialog's own parameters.
  const issueSearch = (() => {
    const next = new URLSearchParams(location.search);
    next.delete('tab');
    next.delete(INTAKE_DRAFT_PARAM);
    next.delete(INTAKE_JOB_PARAM);
    const search = next.toString();
    return search ? `?${search}` : '';
  })();
  const choose = (value: SubtaskTab) => {
    const next = new URLSearchParams(params);
    next.set('tab', value);
    setParams(next, { replace: true });
  };
  const manual = (
    <UnsavedChangesBoundary guard={unsaved}>
      <Body onSubmittingChange={onSubmittingChange} />
    </UnsavedChangesBoundary>
  );
  return (
    <RouteDialog
      title={t('subtasks.newTitle')}
      description={
        tab === 'manual' ? t('subtasks.newDescription') : t('subtasks.aiIntro')
      }
      className={
        tab === 'manual'
          ? 'sm:max-w-xl'
          : wide
            ? 'sm:max-w-5xl'
            : 'sm:max-w-2xl'
      }
      closeTo={{ pathname: '..', search: issueSearch }}
      beforeClose={() => !submittingRef.current && unsaved.confirmDiscard()}
      footer={tab === 'manual' ? <Footer submitting={submitting} /> : null}
    >
      {withAi ? (
        <Tabs
          value={tab}
          onValueChange={(value: SubtaskTab) => choose(value)}
          className='gap-4'
        >
          <TabsList variant='line' aria-label={t('newIssue.tabsLabel')}>
            {TABS.map((value) => (
              <TabsTrigger key={value} value={value}>
                {t(`subtasks.tabs.${value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value='manual' keepMounted>
            {manual}
          </TabsContent>
          <TabsContent value='ai' keepMounted>
            {following ? (
              <BreakdownPanel issueId={issueId} onDraftChange={setWide} />
            ) : (
              <div className='flex justify-start'>
                <Button
                  disabled={
                    breakdown.starting || !breakdown.available || !parent.data
                  }
                  data-testid='subtask-ai-breakdown'
                  onClick={() => void breakdown.start()}
                >
                  {breakdown.starting ? (
                    <Spinner data-icon='inline-start' />
                  ) : (
                    <SparklesIcon data-icon='inline-start' />
                  )}
                  {t('intakeAi.breakdown')}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        manual
      )}
    </RouteDialog>
  );
}

/** The AI tab once a breakdown is asked for: its progress, then its drafts; created, the dialog closes on the issue. */
function BreakdownPanel({
  issueId,
  onDraftChange,
}: {
  readonly issueId: string;
  readonly onDraftChange: (shown: boolean) => void;
}): ReactElement {
  const queryClient = useQueryClient();
  const { close } = useRouteOverlay();
  return (
    <IntakePanel
      onDraftChange={onDraftChange}
      onCreated={() => {
        void queryClient.invalidateQueries({ queryKey: pmKeys.issues });
        void queryClient.invalidateQueries({ queryKey: pmKeys.issue(issueId) });
        void close();
      }}
    />
  );
}

function Body({
  onSubmittingChange,
}: {
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { close } = useRouteOverlay();
  const { issueId = '' } = useParams();

  const parent = useQuery({
    queryKey: pmKeys.issue(issueId),
    queryFn: () => api.issue(issueId),
  });
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => api.members(),
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState('');
  const [blockedBy, setBlockedBy] = useState<string[]>([]);
  const [executor, setExecutor] = useState<Executor | null>(null);
  const [titleError, setTitleError] = useState<string>();
  const [stageError, setStageError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [startRequest, setStartRequest] = useState<StartRequest | null>(null);
  const others = useExecutorOptions();
  const markSaved = useUnsavedChanges(
    [title, description, stage].some((value) => value.trim() !== '') ||
      blockedBy.length > 0 ||
      executor !== null,
  );
  const siblings = parent.data?.subtasks ?? [];

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = title.trim();
    const stageValue = stage.trim();
    const stageValid =
      stageValue === '' ||
      (STAGE_PATTERN.test(stageValue) && Number(stageValue) <= STAGE_MAX);
    setTitleError(trimmed ? undefined : t('issueForm.titleRequired'));
    setStageError(stageValid ? undefined : t('subtasks.stageInvalid'));
    if (!trimmed || !stageValid) return;
    const starting = startingExecutor({
      fromStatus: null,
      toStatus: INITIAL_STATUS,
      executorBefore: null,
      executorAfter: executor,
    });
    if (starting) {
      setStartRequest({
        kind: starting.type,
        names: [
          others.find(
            (option) =>
              option.type === starting.type && option.id === starting.id,
          )?.name ?? starting.id,
        ],
      });
      return;
    }
    void create();
  }

  async function create(start?: boolean): Promise<void> {
    const trimmed = title.trim();
    const stageValue = stage.trim();
    setFormError(undefined);
    onSubmittingChange(true);
    try {
      const issue = await api.createIssue({
        title: trimmed,
        ...(description.trim() ? { description: description.trim() } : {}),
        parentIssueId: parent.data?.id ?? issueId,
        ...(stageValue ? { stage: Number(stageValue) } : {}),
        ...(blockedBy.length > 0 ? { blockedBy } : {}),
        ...(executor ? { executor } : {}),
        ...(start === false ? { start } : {}),
      });
      notify.success(t('issueForm.created', { identifier: issue.identifier }));
      void queryClient.invalidateQueries({ queryKey: pmKeys.issues });
      void queryClient.invalidateQueries({ queryKey: pmKeys.issue(issueId) });
      onSubmittingChange(false);
      markSaved();
      void close();
    } catch (error) {
      onSubmittingChange(false);
      setFormError(errorText(t, error, t('common.requestFailed')));
    }
  }

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate>
      <FieldGroup>
        {formError ? (
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
        <Field data-invalid={titleError ? true : undefined}>
          <FieldLabel htmlFor='pm-subtask-title'>
            {t('issueForm.titleLabel')}
          </FieldLabel>
          <Input
            id='pm-subtask-title'
            value={title}
            autoFocus
            maxLength={ISSUE_TITLE_MAX}
            aria-invalid={titleError ? true : undefined}
            onChange={(event) => setTitle(event.target.value)}
          />
          {titleError ? <FieldError>{titleError}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor='pm-subtask-description'>
            {t('issueForm.descriptionLabel')}
          </FieldLabel>
          <Textarea
            id='pm-subtask-description'
            rows={4}
            value={description}
            placeholder={t('issueForm.descriptionPlaceholder')}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field data-invalid={stageError ? true : undefined}>
            <FieldLabel htmlFor='pm-subtask-stage'>
              {t('subtasks.stageLabel')}
            </FieldLabel>
            <Input
              id='pm-subtask-stage'
              inputMode='numeric'
              value={stage}
              aria-invalid={stageError ? true : undefined}
              onChange={(event) => setStage(event.target.value)}
            />
            {stageError ? (
              <FieldError>{stageError}</FieldError>
            ) : (
              <FieldDescription>{t('subtasks.stageHint')}</FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-subtask-executor'>
              {t('properties.executor')}
            </FieldLabel>
            <PmExecutorSelect
              id='pm-subtask-executor'
              value={executor}
              members={members.data ?? []}
              others={others}
              onChange={setExecutor}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor='pm-subtask-blocked-by'>
            {t('subtasks.blockedByLabel')}
          </FieldLabel>
          <PmMultiSelect
            id='pm-subtask-blocked-by'
            options={siblings.map((sibling) => ({
              value: sibling.id,
              label: `${sibling.identifier} ${sibling.title}`,
            }))}
            value={blockedBy}
            onChange={setBlockedBy}
            placeholder={t('subtasks.blockedByPlaceholder')}
            emptyText={t('subtasks.noSiblings')}
          />
          <FieldDescription>{t('subtasks.blockedByHint')}</FieldDescription>
        </Field>
      </FieldGroup>
      <StartDialog
        request={startRequest}
        onCancel={() => setStartRequest(null)}
        onDecide={(start) => {
          setStartRequest(null);
          void create(start);
        }}
      />
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
