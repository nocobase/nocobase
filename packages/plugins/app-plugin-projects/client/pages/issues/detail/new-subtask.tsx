import { ACCESS_NAMESPACE } from '../../../../shared/access.js';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon } from 'lucide-react';
import { type FormEvent, type ReactElement, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router';

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
import { Textarea } from '../../../components/ui/textarea.js';
import { useRouteOverlay } from '../../../components/use-route-overlay.js';
import { errorText, useNotify } from '../../../hooks/use-notify.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';
import { useExecutorOptions } from '../../../lib/kinds.js';

const FORM_ID = 'pm-subtask-new-form';
const STAGE_PATTERN = /^\d{1,4}$/u;

export default function NewSubtaskPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const unsaved = useUnsavedChangesGuard();
  const onSubmittingChange = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  // Back to the issue, without this dialog's own parameters.
  const issueSearch = (() => {
    const next = new URLSearchParams(location.search);
    next.delete('tab');
    next.delete('draft');
    next.delete('job');
    const search = next.toString();
    return search ? `?${search}` : '';
  })();
  const manual = (
    <UnsavedChangesBoundary guard={unsaved}>
      <Body onSubmittingChange={onSubmittingChange} />
    </UnsavedChangesBoundary>
  );
  return (
    <RouteDialog
      title={t('subtasks.newTitle')}
      description={t('subtasks.newDescription')}
      className='sm:max-w-xl'
      closeTo={{ pathname: '..', search: issueSearch }}
      beforeClose={() => !submittingRef.current && unsaved.confirmDiscard()}
      footer={<Footer submitting={submitting} />}
    >
      {manual}
    </RouteDialog>
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
    void create();
  }

  async function create(): Promise<void> {
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
    </form>
  );
}

function Footer({
  submitting,
}: {
  readonly submitting: boolean;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
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
