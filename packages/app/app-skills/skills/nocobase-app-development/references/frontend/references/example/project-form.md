# Shared form: `project-form.tsx`

Part of the [projects worked example](../example.md). **Depends on**: [types](types.md). Used by the [create dialog](create-dialog.md) and the [edit dialog](edit-dialog.md).

Rules: [`form.md`](../form.md) and guideline T3 (T3.9 for unsaved input). The fields are name (required), owner (optional) and status (a Select). Passing `project` means editing (`PATCH`); omitting it means creating (`POST`). The form renders no buttons: the dialog's footer holds them and links the submit button through `formId`.

- **Unsaved input**: `FeedbackForm` gets `values={form.getValues}` and `savedValues={saved}` (the stored record, or the blank values of a new project). The enclosing `RouteDialog` then asks "Discard changes?" on every way out while they differ; the page writes no guard of its own ([`overlay.md`](../overlay.md)).
- **One submission at a time** through `useSubmission`, whose key goes in the `Idempotency-Key` header; after an unknown outcome a retry reuses it ([submission protection](../../../submission.md)).
- **After a confirmed save** the form announces the result for the record's scope, so the list and an open detail update without callbacks ([data changes](../data-changes.md)). After a 404 or an unknown outcome it announces the scope without a result, so views read what actually happened.

```tsx
// client/pages/projects/project-form.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ApiClientError,
  useApiClient,
  useSubmission,
  useToaster,
} from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { FeedbackForm } from '#components/feedback-form';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { announceDataChange } from '#hooks/use-data-changes';

import { RequestError } from './request-error.js';
import {
  PROJECT_STATUSES,
  type Project,
  projectScope,
  projectsScope,
} from './types.js';

export interface ProjectFormProps {
  /** When editing, the record just read; omit it when creating. */
  readonly project?: Project;
  /** The `<FeedbackForm>` id, also the prefix of the field ids. */
  readonly formId: string;
  /** Runs after a confirmed save; the form has already announced it and shown the success toast. */
  readonly onSubmitted: (project: Project) => void;
  readonly onSubmittingChange?: (submitting: boolean) => void;
}

export function ProjectForm({
  project,
  formId,
  onSubmitted,
  onSubmittingChange,
}: ProjectFormProps): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { session } = useAuthentication();
  const submission = useSubmission({
    scope: `${session?.user.id}:projects:${project?.id ?? 'new'}`,
  });
  const [error, setError] = useState<unknown>();

  // Inside the component, so the messages follow the current language.
  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t('projects.form.nameRequired'))
          .max(100),
        owner: z.string().trim().max(50),
        status: z.enum(PROJECT_STATUSES),
      }),
    [t],
  );
  // What is saved, as the form shows it. A restored draft would go to `defaultValues`, never here.
  const [saved] = useState(() => ({
    name: project?.name ?? '',
    owner: project?.owner ?? '',
    status: project?.status ?? ('planning' as const),
  }));
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: saved,
    shouldFocusError: false,
  });
  const statusItems = PROJECT_STATUSES.map((value) => ({
    value,
    label: t(`projects.status.${value}`),
  }));

  const submit = form.handleSubmit(async (values) => {
    const json = { ...values, owner: values.owner || null };
    const scope = project ? projectScope(project.id) : projectsScope;
    setError(undefined);
    onSubmittingChange?.(true);
    let result: { data: Project } | undefined;
    try {
      result = await submission.run(json, (key, signal) =>
        api.request<{ data: Project }>({
          path: project
            ? `projects/${encodeURIComponent(project.id)}`
            : 'projects',
          method: project ? 'PATCH' : 'POST',
          headers: { 'Idempotency-Key': key },
          signal,
          json,
        }),
      );
    } catch (caught: unknown) {
      const status = caught instanceof ApiClientError ? caught.status : 0;
      if (
        status === 409 &&
        caught instanceof ApiClientError &&
        caught.reason === 'PROJECT_NAME_TAKEN'
      ) {
        form.setError('name', { message: t('projects.form.nameTaken') });
      } else {
        setError(caught);
        // Gone, or the outcome is unknown: let the views read the server again.
        if (status === 404 || status === 0 || status >= 500)
          announceDataChange({ scopes: [scope] });
      }
      return;
    } finally {
      onSubmittingChange?.(false);
    }
    if (!result) return;
    const savedScope = projectScope(result.data.id);
    announceDataChange({
      scopes: [savedScope],
      results: { [savedScope]: result },
    });
    toaster.show({
      type: 'success',
      title: t(project ? 'projects.edit.success' : 'projects.create.success', {
        name: result.data.name,
      }),
    });
    onSubmitted(result.data);
  });

  return (
    <FeedbackForm
      id={formId}
      noValidate
      values={form.getValues}
      savedValues={saved}
      submitting={submission.submitting}
      validationErrors={form.formState.errors}
      error={error}
      errorContent={error ? <RequestError error={error} /> : undefined}
      onSubmit={submit}
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name='name'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-name`}>
                {t('projects.fields.name')}
                <span aria-hidden='true' className='text-destructive'>
                  *
                </span>
              </FieldLabel>
              <Input
                {...field}
                id={`${formId}-name`}
                aria-required='true'
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='owner'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-owner`}>
                {t('projects.fields.owner')}
              </FieldLabel>
              <Input
                {...field}
                id={`${formId}-owner`}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='status'
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={`${formId}-status`}>
                {t('projects.fields.status')}
              </FieldLabel>
              <Select
                items={statusItems}
                value={field.value}
                onValueChange={(value) => {
                  if (value) field.onChange(value);
                }}
              >
                <SelectTrigger
                  ref={field.ref}
                  id={`${formId}-status`}
                  className='w-full'
                  onBlur={field.onBlur}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </FieldGroup>
    </FeedbackForm>
  );
}
```
