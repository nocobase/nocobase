/**
 * "Edit" on a working directory of the project's Settings › Working directories (`directories-section.tsx`): where it
 * is, as its kind allows (`code-location/edit-fields.tsx`: a repository's URL, picked again through a connection or
 * typed, and default branch; a directory's runner and path), and a directory's display name, which the project's list
 * and the agents see in place of its path (a repository is always shown as `owner/repo`). Its initialization prompt and binding are kept as they are unless the
 * repository is picked again. A dialog of a few fields with a picker (I1), opened by the section's URL
 * (`?section=directories&edit=<id>`); a failed save stays in the dialog (I3).
 */
import { useUnsavedChanges } from '@nocobase/app-client';
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';
import { useTranslation } from '@nocobase/i18n/client';
import { Loader2Icon } from 'lucide-react';
import { useState, type FormEvent, type ReactElement } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { ProjectDetailLabels } from '@/extensions/nocobase-project-detail/labels';
import type {
  ResourceFormErrors,
  ResourceFormValues,
  RunnerChoice,
} from '@/extensions/nocobase-project-detail/project-settings';

import type { GitConnectionChoice } from '../../../shared/git.js';
import { WorkingDirectoryEditFields } from '../code-location/edit-fields.js';

function valuesOf(resource: ProjectResource): ResourceFormValues {
  return {
    type: resource.type,
    url: resource.url ?? '',
    defaultRef: resource.defaultRef ?? '',
    binding: resource.binding,
    runnerId: resource.runnerId ?? '',
    path: resource.path ?? '',
    label: resource.label ?? '',
    // Not asked here; kept as it is.
    initPrompt: resource.initPrompt ?? '',
  };
}

const COMPARED = ['url', 'defaultRef', 'runnerId', 'path', 'label'] as const;

export interface DirectoryDialogProps {
  /** The working directory edited; null while the dialog is closed. */
  readonly resource: ProjectResource | null;
  readonly onClose: () => void;
  readonly runners: {
    readonly options: readonly RunnerChoice[];
    readonly loading: boolean;
  };
  /** The Git connections a repository may be picked through again; none leaves typing its URL. */
  readonly connections: readonly GitConnectionChoice[];
  readonly validate: (values: ResourceFormValues) => ResourceFormErrors;
  readonly onSubmit: (
    values: ResourceFormValues,
    existing: ProjectResource,
  ) => Promise<void>;
  readonly labels: ProjectDetailLabels;
}

export function DirectoryDialog({
  resource,
  onClose,
  ...props
}: DirectoryDialogProps): ReactElement {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  return (
    <Dialog
      open={resource !== null}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {t('projectPage.settings.directories.edit')}
          </DialogTitle>
          <DialogDescription>
            {t(
              resource?.type === 'gitRepo'
                ? 'projectPage.settings.directories.repoDescription'
                : 'projectPage.settings.directories.directoryDescription',
            )}
          </DialogDescription>
        </DialogHeader>
        {resource ? (
          <DirectoryForm
            key={resource.id}
            resource={resource}
            onClose={onClose}
            onSavingChange={setSaving}
            {...props}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DirectoryForm({
  resource,
  onClose,
  onSavingChange,
  runners,
  connections,
  validate,
  onSubmit,
  labels,
}: Omit<DirectoryDialogProps, 'resource'> & {
  readonly resource: ProjectResource;
  readonly onSavingChange: (saving: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const [start] = useState(() => valuesOf(resource));
  const [values, setValues] = useState(start);
  const [errors, setErrors] = useState<ResourceFormErrors>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const dirty =
    values.binding !== start.binding ||
    COMPARED.some((key) => values[key] !== start[key]);
  const markSaved = useUnsavedChanges(dirty);
  const repository = resource.type === 'gitRepo';
  const change = (patch: Partial<ResourceFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setErrors({});
  };

  async function submit(event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();
    if (saving) return;
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setFormError(undefined);
    setSaving(true);
    onSavingChange(true);
    // An unchanged binding is left out, which keeps what is stored.
    const { binding, ...rest } = values;
    const submitted: ResourceFormValues =
      binding === start.binding || binding === undefined
        ? rest
        : { ...rest, binding };
    try {
      await onSubmit(submitted, resource);
      markSaved();
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : labels.resourceForm.requestFailed,
      );
    } finally {
      setSaving(false);
      onSavingChange(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      className='flex min-h-0 flex-1 flex-col gap-4'
    >
      <div className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4 py-1'>
        <FieldGroup>
          {formError ? (
            <Alert variant='destructive'>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <WorkingDirectoryEditFields
            values={values}
            change={change}
            errors={errors}
            connections={connections}
            runners={runners}
            labels={labels}
          />
          {repository ? null : (
            <Field>
              <FieldLabel htmlFor='directory-dialog-label'>
                {t('projectPage.codeLocation.label')}
              </FieldLabel>
              <Input
                id='directory-dialog-label'
                value={values.label}
                maxLength={200}
                onChange={(event) => change({ label: event.target.value })}
              />
              <FieldDescription>
                {t('projectPage.codeLocation.labelHint')}
              </FieldDescription>
            </Field>
          )}
        </FieldGroup>
      </div>
      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          disabled={saving}
          onClick={onClose}
        >
          {t('projectPage.settings.cancel')}
        </Button>
        <Button type='submit' disabled={saving || !dirty}>
          {saving ? (
            <Loader2Icon data-icon='inline-start' className='animate-spin' />
          ) : null}
          {t('projectPage.settings.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}
