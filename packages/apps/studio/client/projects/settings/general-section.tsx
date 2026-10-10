/**
 * Settings › General: the project's name and description, saved with the card's own Save (T4.2); while the workspace
 * has a connection to a code host, the project's commit attribution default follows in a card of its own.
 */
import { useUnsavedChanges } from '@nocobase/app-client';
import { useProjectUpdate } from '@nocobase/app-plugin-projects/client/projects';
import type { ProjectDetail } from '@nocobase/app-plugin-projects/shared/projects';
import { useTranslation } from '@nocobase/i18n/client';
import { Loader2Icon } from 'lucide-react';
import { useState, type FormEvent, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useNotify } from '../../access/notify.js';
import { useGitStatus } from '../../git/api.js';
import { ProjectAttributionCard } from '../../git/attribution.js';
import { SettingsCard } from './settings-card.js';

export function GeneralSection({
  project,
  canEdit,
}: {
  readonly project: ProjectDetail;
  readonly canEdit: boolean;
}): ReactElement {
  const git = useGitStatus().data;
  return (
    <>
      <ProjectCard key={project.id} project={project} canEdit={canEdit} />
      {git?.enabled ? (
        <ProjectAttributionCard projectId={project.id} canEdit={canEdit} />
      ) : null}
    </>
  );
}

function ProjectCard({
  project,
  canEdit,
}: {
  readonly project: ProjectDetail;
  readonly canEdit: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const { update, isPending } = useProjectUpdate(project.id);
  const [start, setStart] = useState({
    name: project.name,
    description: project.description ?? '',
  });
  const [values, setValues] = useState(start);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    values.name !== start.name || values.description !== start.description;
  const markSaved = useUnsavedChanges(dirty);

  async function submit(event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();
    if (!values.name.trim()) {
      setError(t('projectPage.settings.general.nameRequired'));
      return;
    }
    try {
      await update({
        name: values.name.trim(),
        description: values.description.trim() || null,
      });
      markSaved();
      setStart(values);
      notify.success(t('projectPage.settings.saved'));
    } catch (failure) {
      notify.error(failure);
    }
  }

  return (
    <SettingsCard
      id='project'
      title={t('projectPage.settings.general.title')}
      description={t('projectPage.settings.general.description')}
      actions={
        canEdit ? (
          <Button
            type='button'
            size='sm'
            disabled={isPending || !dirty}
            onClick={() => void submit()}
          >
            {isPending ? (
              <Loader2Icon data-icon='inline-start' className='animate-spin' />
            ) : null}
            {t('projectPage.settings.save')}
          </Button>
        ) : null
      }
    >
      <form onSubmit={(event) => void submit(event)} noValidate>
        <FieldGroup>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor='project-settings-name'>
              {t('projectPage.newProject.name')}
            </FieldLabel>
            <Input
              id='project-settings-name'
              value={values.name}
              maxLength={100}
              disabled={!canEdit}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }));
                setError(null);
              }}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor='project-settings-description'>
              {t('projectPage.newProject.projectDescription')}
            </FieldLabel>
            <Textarea
              id='project-settings-description'
              rows={3}
              value={values.description}
              disabled={!canEdit}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </Field>
        </FieldGroup>
      </form>
    </SettingsCard>
  );
}
