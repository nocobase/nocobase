import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon } from 'lucide-react';
import {
  type FormEvent,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router';

import { PRIORITIES, type Priority } from '../../../shared/common.js';
import {
  ISSUE_TITLE_MAX,
  type Executor,
  type IssueStartOption,
} from '../../../shared/issues.js';
import { INITIAL_STATUS, messageText } from '../../../shared/workflows.js';
import { pmKeys } from '../../api/keys.js';
import { PmExecutorSelect } from '../../components/pm-executor-select.js';
import { PmPendingFiles } from '../../components/pm-pending-files.js';
import { PmRichTextEditor } from '../../components/pm-rich-text-editor.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
import { Button } from '../../components/ui/button.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import { Spinner } from '../../components/ui/spinner.js';
import { useRouteOverlay } from '../../components/use-route-overlay.js';
import { useUnsavedChanges } from '@nocobase/app-client';
import { useAttachmentUploads } from '../../hooks/use-attachment-uploads.js';
import { errorText, useNotify } from '../../hooks/use-notify.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { useViewer } from '../../hooks/use-viewer.js';
import { startingExecutor, useExecutorOptions } from '../../lib/kinds.js';
import { statusName } from '../../lib/status.js';
import { StartDialog, type StartRequest } from './detail/start-dialog.js';
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
 * The new-issue form: title, description, priority, project (preselected by `usePresetProjectId`), owner (the signed-in user by default), executor (another registered kind, such as an agent, or a member),
 * labels and dates. The process is where the issue starts: when the project's workflow offers ways to start
 * (`startOption` rules, `GET /api/projects/issues/starts`), the form lists them, such as "Design first" or "Straight to
 * development", starting at the workflow's initial status; otherwise the server starts the issue there. Giving the
 * issue to an agent asks "Start now?" before creating, unless it starts in backlog, where nothing starts. Created, the
 * issue opens. Anything entered counts as unsaved for the enclosing `UnsavedChangesBoundary`.
 *
 * Files chosen, pasted (a screenshot) or dropped on the description are uploaded at once and become the new issue's own
 * files. Nothing is sent while one still uploads, and the files stay as they are while the issue is being created. A
 * failed create keeps them for another try; leaving the form without creating discards those still attached to
 * nothing, except while a create is on its way, which may attach them (the server's purge takes any left over).
 */
export function NewIssueForm({
  onSubmittingChange,
  onUploadingChange,
  onCreated,
}: {
  readonly onSubmittingChange: (submitting: boolean) => void;
  /** Whether a file is still uploading, for a submit button outside the form. */
  readonly onUploadingChange?: (uploading: boolean) => void;
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
  const [executor, setExecutor] = useState<Executor | null>(null);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [chosenStatus, setChosenStatus] = useState<string | null>(null);
  const [startRequest, setStartRequest] = useState<StartRequest | null>(null);
  const [titleError, setTitleError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  // Read at once by a second press or a paste that comes before the next render.
  const submittingRef = useRef(false);
  const uploads = useAttachmentUploads({ discardOnUnmount: true });
  const { uploading } = uploads;
  const uploadingChangeRef = useRef(onUploadingChange);
  useEffect(() => {
    uploadingChangeRef.current = onUploadingChange;
  });
  useEffect(() => {
    uploadingChangeRef.current?.(uploading);
  }, [uploading]);
  const addFiles = (files: File[]): void => {
    if (!submittingRef.current) uploads.add(files);
  };
  const owner = ownerUserId ?? viewer?.userId ?? null;
  const starts = useQuery({
    queryKey: pmKeys.starts(projectId),
    queryFn: () => api.starts(projectId),
  });
  const startOptions = starts.data?.options ?? [];
  // A process the project's workflow does not offer (the project changed) falls back to its initial status.
  const statusKey =
    chosenStatus !== null &&
    startOptions.some((option) => option.status.key === chosenStatus)
      ? chosenStatus
      : (starts.data?.initialStatus ?? null);
  const startLabel = (option: IssueStartOption): string =>
    messageText(option.label, t) ??
    statusName(
      t,
      startOptions.map((item) => item.status),
      option.status.key,
    );
  const chosenOption = startOptions.find(
    (option) => option.status.key === statusKey,
  );
  const markSaved = useUnsavedChanges(
    Boolean(title.trim() || description.trim()) ||
      priority !== 'none' ||
      projectId !== presetProjectId ||
      ownerUserId !== null ||
      executor !== null ||
      chosenStatus !== null ||
      labelIds.length > 0 ||
      startDate !== null ||
      dueDate !== null ||
      uploads.uploads.length > 0,
  );

  /** Whether the form may be sent now; says why not while a file still uploads. */
  function ready(): boolean {
    if (submittingRef.current) return false;
    if (uploads.uploading) {
      setFormError(t('issueForm.uploadsPending'));
      return false;
    }
    return true;
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!ready()) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError(t('issueForm.titleRequired'));
      return;
    }
    setTitleError(undefined);
    const starting = startingExecutor({
      fromStatus: null,
      toStatus: statusKey ?? INITIAL_STATUS,
      executorBefore: null,
      executorAfter: executor,
      statuses: startOptions.map((option) => option.status),
    });
    if (starting) {
      setStartRequest({
        kind: starting.type,
        names: [
          otherExecutors.find(
            (option) =>
              option.type === starting.type && option.id === starting.id,
          )?.name ?? starting.id,
        ],
      });
      return;
    }
    await create();
  }

  async function create(start?: boolean): Promise<void> {
    // Also reached from the "Start now?" dialog, which a file added meanwhile must not get past.
    if (!ready()) return;
    const trimmed = title.trim();
    const attachmentIds = uploads.ids;
    setFormError(undefined);
    submittingRef.current = true;
    setSubmitting(true);
    onSubmittingChange(true);
    // Leaving now (the browser's Back) must not discard files the request may already have attached.
    if (attachmentIds.length > 0) uploads.setSending(true);
    try {
      const issue = await api.createIssue({
        title: trimmed,
        ...(chosenOption && statusKey ? { statusKey } : {}),
        ...(start === undefined ? {} : { start }),
        ...(description.trim() ? { description } : {}),
        priority,
        ...(projectId ? { projectId } : {}),
        ...(owner ? { ownerUserId: owner } : {}),
        ...(executor ? { executor } : {}),
        ...(labelIds.length ? { labelIds } : {}),
        startDate,
        dueDate,
        ...(attachmentIds.length ? { attachmentIds: [...attachmentIds] } : {}),
      });
      // The files are the issue's now: closing the form must not delete them.
      uploads.clear();
      notify.success(t('issueForm.created', { identifier: issue.identifier }));
      void queryClient.invalidateQueries({ queryKey: pmKeys.issues });
      void queryClient.invalidateQueries({ queryKey: pmKeys.projects });
      markSaved();
      if (onCreated) onCreated(issue);
      else void navigate(`/issues/${encodeURIComponent(issue.id)}`);
    } catch (error) {
      // Refused: nothing was attached, so the files are this form's again, for another try or to be discarded.
      uploads.setSending(false);
      setFormError(errorText(t, error, t('common.requestFailed')));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
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
        <Field
          onDragOver={uploads.onDragOver}
          onDrop={(event) => {
            if (submittingRef.current) event.preventDefault();
            else uploads.onDrop(event);
          }}
        >
          <FieldLabel>{t('issueForm.descriptionLabel')}</FieldLabel>
          <PmRichTextEditor
            value={description}
            aria-label={t('issueForm.descriptionLabel')}
            placeholder={t('issueForm.descriptionPlaceholder')}
            mentionCandidates={candidates}
            mentionPlacement='below'
            contentClassName='min-h-28'
            onChange={setDescription}
            onFiles={addFiles}
          />
          <PmPendingFiles
            uploads={uploads.uploads}
            disabled={submitting}
            onAdd={addFiles}
            onRemove={(key) => {
              if (!submittingRef.current) uploads.remove(key);
            }}
          />
        </Field>
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
          {startOptions.length > 0 ? (
            <Field className='sm:col-span-2'>
              <FieldLabel htmlFor='pm-issue-process'>
                {t('issueForm.processLabel')}
              </FieldLabel>
              <PropertySelect
                id='pm-issue-process'
                size='default'
                options={startOptions.map((option) => ({
                  value: option.status.key,
                  label: startLabel(option),
                }))}
                value={statusKey}
                onChange={(value) => {
                  if (value) setChosenStatus(value);
                }}
              />
              <FieldDescription>
                {(chosenOption ? messageText(chosenOption.hint, t) : null) ??
                  t('issueForm.processHint', {
                    status: statusKey
                      ? statusName(
                          t,
                          startOptions.map((option) => option.status),
                          statusKey,
                        )
                      : '',
                  })}
              </FieldDescription>
            </Field>
          ) : null}
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
              onChange={setExecutor}
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
      <StartDialog
        request={startRequest}
        onDecide={(start) => {
          setStartRequest(null);
          void create(start);
        }}
        onCancel={() => setStartRequest(null)}
      />
    </form>
  );
}

export function NewIssueFooter({
  submitting,
  uploading = false,
}: {
  readonly submitting: boolean;
  /** A file is still uploading: the issue cannot be created yet. */
  readonly uploading?: boolean;
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
      <Button type='submit' form={FORM_ID} disabled={submitting || uploading}>
        {submitting ? <Spinner data-icon='inline-start' /> : null}
        {submitting ? t('common.creating') : t('common.create')}
      </Button>
    </>
  );
}
