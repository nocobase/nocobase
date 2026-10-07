import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon } from 'lucide-react';
import { type FormEvent, type ReactElement, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { PRIORITIES, type Priority } from '../../../shared/common.js';
import {
  PROJECT_NAME_MAX,
  type ProjectVisibility,
} from '../../../shared/projects.js';
import { pmKeys } from '../../api/keys.js';
import { RouteDialog } from '../../components/route-dialog.js';
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
import { Textarea } from '../../components/ui/textarea.js';
import { UnsavedChangesBoundary } from '../../components/unsaved-changes.js';
import {
  useUnsavedChanges,
  useUnsavedChangesGuard,
} from '@nocobase/app-client';
import { useRouteOverlay } from '../../components/use-route-overlay.js';
import { errorText, useNotify } from '../../hooks/use-notify.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { useViewer } from '../../hooks/use-viewer.js';
import {
  DateField,
  PropertySelect,
} from '../../components/pm-property-fields.js';
import { WorkflowSelect } from './workflow-select.js';

const FORM_ID = 'pm-project-new-form';

/** Route `/projects/new`: name, description, visibility, lead, priority, workflow and dates; opens the project after. */
export default function NewProjectPage(): ReactElement {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const unsaved = useUnsavedChangesGuard();
  const handleSubmittingChange = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  return (
    <RouteDialog
      title={t('projectForm.title')}
      description={t('projectForm.description')}
      className='sm:max-w-xl'
      beforeClose={() => !submittingRef.current && unsaved.confirmDiscard()}
      footer={<Footer submitting={submitting} />}
    >
      <UnsavedChangesBoundary guard={unsaved}>
        <Body onSubmittingChange={handleSubmittingChange} />
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
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const viewer = useViewer();
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => api.members(),
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<ProjectVisibility>('everyone');
  // Undefined until chosen: the creator leads by default, and "No lead" is a choice of its own.
  const [leadUserId, setLeadUserId] = useState<string | null | undefined>(
    undefined,
  );
  const [priority, setPriority] = useState<Priority>('none');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const lead = leadUserId === undefined ? (viewer?.userId ?? null) : leadUserId;
  const markSaved = useUnsavedChanges(
    Boolean(name.trim() || description.trim()) ||
      visibility !== 'everyone' ||
      leadUserId !== undefined ||
      priority !== 'none' ||
      startDate !== null ||
      dueDate !== null ||
      workflowId !== null,
  );

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t('projectForm.nameRequired'));
      return;
    }
    setNameError(undefined);
    setFormError(undefined);
    onSubmittingChange(true);
    try {
      const project = await api.createProject({
        name: trimmed,
        description: description.trim() || null,
        visibility,
        leadUserId: lead,
        priority,
        startDate,
        dueDate,
        workflowId,
      });
      onSubmittingChange(false);
      markSaved();
      notify.success(t('projectForm.created', { name: project.name }));
      void queryClient.invalidateQueries({ queryKey: pmKeys.projects });
      void navigate(`/projects/${encodeURIComponent(project.id)}`, {
        replace: true,
      });
    } catch (error) {
      onSubmittingChange(false);
      setFormError(errorText(t, error, t('common.requestFailed')));
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
        <Field data-invalid={nameError ? true : undefined}>
          <FieldLabel htmlFor='pm-project-name'>
            {t('projectForm.name')}
          </FieldLabel>
          <Input
            id='pm-project-name'
            value={name}
            autoFocus
            maxLength={PROJECT_NAME_MAX}
            aria-invalid={nameError ? true : undefined}
            onChange={(event) => setName(event.target.value)}
          />
          {nameError ? <FieldError>{nameError}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor='pm-project-description'>
            {t('projects.descriptionLabel')}
          </FieldLabel>
          <Textarea
            id='pm-project-description'
            rows={3}
            value={description}
            placeholder={t('projectForm.descriptionPlaceholder')}
            onChange={(event) => setDescription(event.target.value)}
          />
          <FieldDescription>
            {t('projectForm.descriptionHint')}
          </FieldDescription>
        </Field>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='pm-project-visibility'>
              {t('projects.visibilityLabel')}
            </FieldLabel>
            <PropertySelect
              size='default'
              id='pm-project-visibility'
              options={[
                { value: 'everyone', label: t('projects.visibility.everyone') },
                { value: 'members', label: t('projects.visibility.members') },
              ]}
              value={visibility}
              onChange={(value) =>
                setVisibility(value === 'members' ? 'members' : 'everyone')
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-project-lead'>
              {t('projects.columns.lead')}
            </FieldLabel>
            <PropertySelect
              size='default'
              id='pm-project-lead'
              options={(members.data ?? []).map((member) => ({
                value: member.userId,
                label: member.name,
              }))}
              value={lead}
              noneLabel={t('projects.noLead')}
              onChange={setLeadUserId}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-project-priority'>
              {t('properties.priority')}
            </FieldLabel>
            <PropertySelect
              size='default'
              id='pm-project-priority'
              options={PRIORITIES.map((value) => ({
                value,
                label: t(`priority.${value}`),
              }))}
              value={priority}
              onChange={(value) => {
                const next = PRIORITIES.find((item) => item === value);
                if (next) setPriority(next);
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-project-workflow'>
              {t('projects.workflow')}
            </FieldLabel>
            <WorkflowSelect
              size='default'
              id='pm-project-workflow'
              value={workflowId}
              onChange={setWorkflowId}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-project-start'>
              {t('dates.start')}
            </FieldLabel>
            <DateField
              size='default'
              id='pm-project-start'
              value={startDate}
              clearLabel={t('dates.clearStart')}
              onChange={setStartDate}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-project-due'>{t('dates.due')}</FieldLabel>
            <DateField
              size='default'
              id='pm-project-due'
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
