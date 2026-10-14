import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon } from 'lucide-react';
import { type FormEvent, type ReactElement, useState } from 'react';
import { useNavigate } from 'react-router';

import { PRIORITIES, type Priority } from '../../../shared/common.js';
import { ISSUE_TITLE_MAX, type Executor } from '../../../shared/issues.js';
import {
  BACKLOG_STATUS,
  IN_PROGRESS_STATUS,
} from '../../../shared/statuses.js';
import { pmKeys } from '../../api/keys.js';
import { PmExecutorSelect } from '../../components/pm-executor-select.js';
import { PmRichTextEditor } from '../../components/pm-rich-text-editor.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
import { Button } from '../../components/ui/button.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '../../components/ui/field.js';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group.js';
import { Input } from '../../components/ui/input.js';
import { Spinner } from '../../components/ui/spinner.js';
import { useRouteOverlay } from '../../components/use-route-overlay.js';
import { useUnsavedChanges } from '@nocobase/app-client';
import { errorText, useNotify } from '../../hooks/use-notify.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { useViewer } from '../../hooks/use-viewer.js';
import { useExecutorOptions } from '../../lib/kinds.js';
import { canUseSetting } from '../../lib/permissions.js';
import {
  DateField,
  LabelsField,
  PropertySelect,
} from '../../components/pm-property-fields.js';
import { useMentionCandidates } from './use-mention-candidates.js';
import { usePresetProjectId } from './use-preset-project.js';

const FORM_ID = 'pm-issue-new-form';

/**
 * The new-issue form: title, description, when to start, priority, project (preselected by `usePresetProjectId`), owner
 * (the signed-in user by default), executor (another registered kind, such as an agent, or a member; the default
 * executor a kind names is preselected, `ExecutorCandidate.isDefault`), labels and dates. "Start now" creates the issue
 * in `in_progress`, where its work starts; "Later" in `backlog`, where nothing starts until it is started from its page.
 * Created, the issue opens. Anything entered counts as unsaved for the enclosing `UnsavedChangesBoundary`.
 */
export function NewIssueForm({
  onSubmittingChange,
  onStartChange,
  onCreated,
}: {
  readonly onSubmittingChange: (submitting: boolean) => void;
  /** Whether the issue starts right away, for the footer's button. */
  readonly onStartChange?: (startNow: boolean) => void;
  /** Where to go once created; by default the issue's page. */
  readonly onCreated?: (issue: { readonly id: string }) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const viewer = useViewer();
  const candidates = useMentionCandidates();
  const otherExecutors = useExecutorOptions();

  const projects = useQuery({
    queryKey: pmKeys.projects,
    queryFn: () => api.projects(),
  });
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => api.members(),
  });
  const labels = useQuery({
    queryKey: pmKeys.labels,
    queryFn: () => api.labels(),
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('none');
  const presetProjectId = usePresetProjectId();
  const [projectId, setProjectId] = useState<string | null>(presetProjectId);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  // Untouched, the executor shown is the default one and the server applies it.
  const [chosenExecutor, setChosenExecutor] = useState<
    Executor | null | undefined
  >(undefined);
  const defaultExecutor = otherExecutors.find((option) => option.isDefault);
  const executor =
    chosenExecutor === undefined
      ? defaultExecutor
        ? { type: defaultExecutor.type, id: defaultExecutor.id }
        : null
      : chosenExecutor;
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [startNow, setStartNow] = useState(true);
  const [titleError, setTitleError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const owner = ownerUserId ?? viewer?.userId ?? null;
  const markSaved = useUnsavedChanges(
    Boolean(title.trim() || description.trim()) ||
      priority !== 'none' ||
      projectId !== presetProjectId ||
      ownerUserId !== null ||
      chosenExecutor !== undefined ||
      !startNow ||
      labelIds.length > 0 ||
      startDate !== null ||
      dueDate !== null,
  );

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError(t('issueForm.titleRequired'));
      return;
    }
    setTitleError(undefined);
    await create();
  }

  async function create(): Promise<void> {
    const trimmed = title.trim();
    setFormError(undefined);
    onSubmittingChange(true);
    try {
      const issue = await api.createIssue({
        title: trimmed,
        statusKey: startNow ? IN_PROGRESS_STATUS : BACKLOG_STATUS,
        ...(description.trim() ? { description } : {}),
        priority,
        ...(projectId ? { projectId } : {}),
        ...(owner ? { ownerUserId: owner } : {}),
        ...(chosenExecutor === undefined ? {} : { executor: chosenExecutor }),
        ...(labelIds.length ? { labelIds } : {}),
        startDate,
        dueDate,
      });
      notify.success(t('issueForm.created', { identifier: issue.identifier }));
      void queryClient.invalidateQueries({ queryKey: pmKeys.issues });
      void queryClient.invalidateQueries({ queryKey: pmKeys.projects });
      markSaved();
      if (onCreated) onCreated(issue);
      else void navigate(`/issues/${encodeURIComponent(issue.id)}`);
    } catch (error) {
      setFormError(errorText(t, error, t('common.requestFailed')));
    } finally {
      onSubmittingChange(false);
    }
  }

  return (
    <form id={FORM_ID} onSubmit={(event) => void submit(event)} noValidate>
      <FieldGroup>
        {formError ? (
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
        <Field data-invalid={titleError ? true : undefined}>
          <FieldLabel htmlFor='pm-issue-title'>
            {t('issueForm.titleLabel')}
          </FieldLabel>
          <Input
            id='pm-issue-title'
            value={title}
            autoFocus
            maxLength={ISSUE_TITLE_MAX}
            aria-invalid={titleError ? true : undefined}
            onChange={(event) => setTitle(event.target.value)}
          />
          {titleError ? <FieldError>{titleError}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel>{t('issueForm.descriptionLabel')}</FieldLabel>
          <PmRichTextEditor
            value={description}
            aria-label={t('issueForm.descriptionLabel')}
            placeholder={t('issueForm.descriptionPlaceholder')}
            mentionCandidates={candidates}
            mentionPlacement='below'
            contentClassName='min-h-28'
            onChange={setDescription}
          />
        </Field>
        <FieldSet>
          <FieldLegend variant='label'>{t('issueForm.startLabel')}</FieldLegend>
          <RadioGroup
            value={startNow ? IN_PROGRESS_STATUS : BACKLOG_STATUS}
            onValueChange={(value) => {
              const next = value === IN_PROGRESS_STATUS;
              setStartNow(next);
              onStartChange?.(next);
            }}
          >
            <FieldLabel htmlFor='pm-issue-start-now'>
              <Field orientation='horizontal'>
                <RadioGroupItem
                  value={IN_PROGRESS_STATUS}
                  id='pm-issue-start-now'
                />
                <FieldContent>
                  <FieldTitle>{t('issueForm.startNow')}</FieldTitle>
                  <FieldDescription>
                    {t('issueForm.startNowHint')}
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor='pm-issue-start-later'>
              <Field orientation='horizontal'>
                <RadioGroupItem
                  value={BACKLOG_STATUS}
                  id='pm-issue-start-later'
                />
                <FieldContent>
                  <FieldTitle>{t('issueForm.startLater')}</FieldTitle>
                  <FieldDescription>
                    {t('issueForm.startLaterHint')}
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
          </RadioGroup>
        </FieldSet>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='pm-issue-priority'>
              {t('properties.priority')}
            </FieldLabel>
            <PropertySelect
              id='pm-issue-priority'
              size='default'
              options={PRIORITIES.map((value) => ({
                value,
                label: t(`priority.${value}`),
              }))}
              value={priority}
              onChange={(value) =>
                setPriority(PRIORITIES.find((item) => item === value) ?? 'none')
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-issue-project'>
              {t('issueForm.projectLabel')}
            </FieldLabel>
            <PropertySelect
              id='pm-issue-project'
              size='default'
              options={(projects.data ?? []).map((project) => ({
                value: project.id,
                label: project.name,
              }))}
              value={projectId}
              noneLabel={t('issueForm.noProject')}
              onChange={setProjectId}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-issue-owner'>
              {t('properties.owner')}
            </FieldLabel>
            <PropertySelect
              id='pm-issue-owner'
              size='default'
              options={(members.data ?? []).map((member) => ({
                value: member.userId,
                label:
                  member.userId === viewer?.userId
                    ? `${member.name} ${t('properties.you')}`
                    : member.name,
              }))}
              value={owner}
              disabled={!members.data}
              onChange={setOwnerUserId}
            />
            <FieldDescription>{t('issueForm.ownerHint')}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-issue-executor'>
              {t('properties.executor')}
            </FieldLabel>
            <PmExecutorSelect
              id='pm-issue-executor'
              value={executor}
              others={otherExecutors}
              members={members.data ?? []}
              onChange={setChosenExecutor}
            />
          </Field>
          <Field className='sm:col-span-2'>
            <FieldLabel htmlFor='pm-issue-labels'>
              {t('properties.labels')}
            </FieldLabel>
            <LabelsField
              id='pm-issue-labels'
              labels={labels.data ?? []}
              value={labelIds}
              canCreate={canUseSetting(viewer, 'pm.labels', 'update')}
              onChange={setLabelIds}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-issue-start'>{t('dates.start')}</FieldLabel>
            <DateField
              id='pm-issue-start'
              size='default'
              value={startDate}
              clearLabel={t('dates.clearStart')}
              onChange={setStartDate}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-issue-due'>{t('dates.due')}</FieldLabel>
            <DateField
              id='pm-issue-due'
              size='default'
              value={dueDate}
              clearLabel={t('dates.clearDue')}
              onChange={setDueDate}
            />
          </Field>
        </div>
      </FieldGroup>
    </form>
  );
}

export function NewIssueFooter({
  submitting,
  startNow = true,
}: {
  readonly submitting: boolean;
  /** Whether the form starts the issue right away: the button says so. */
  readonly startNow?: boolean;
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
        {submitting
          ? t('common.creating')
          : startNow
            ? t('issueForm.createAndStart')
            : t('common.create')}
      </Button>
    </>
  );
}
