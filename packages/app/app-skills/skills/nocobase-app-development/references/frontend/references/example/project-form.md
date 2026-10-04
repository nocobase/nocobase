# Shared form: `project-form.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [session alert](session-expired-alert.md), [types](types.md), [copy](copy.md).

**Add first**: `yes n | pnpm exec shadcn add alert field select`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

Rules: [`form.md`](../form.md). The fields are name (required), owner (optional) and status (a Select). Passing `project` means editing (`PATCH`); omitting it means creating (`POST`). The form renders no buttons: the container puts the submit button outside the `<form>` and links it through `formId`.

```tsx
// client/pages/projects/project-form.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PROJECT_STATUSES, type Project } from './types.js';

export interface ProjectFormProps {
  /** When editing, pass the latest record, just loaded; omit it when creating. */
  readonly project?: Project;
  /** The `<form>` id. When the submit button is outside the form, the button sets `form={formId}`. */
  readonly formId: string;
  /** Called after a successful save with the record the endpoint returned. The form has already shown the success message. */
  readonly onSubmitted: (project: Project) => void;
  /** Receives `true` when submission starts and `false` when it ends; on success, `false` comes before `onSubmitted` is called. */
  readonly onSubmittingChange?: (submitting: boolean) => void;
  /** When editing, the endpoint returned 404: the record has been deleted. */
  readonly onNotFound?: () => void;
  /** Receives `true` once a field differs from its default value and `false` when it no longer does. */
  readonly onDirtyChange?: (dirty: boolean) => void;
}

export function ProjectForm({
  project,
  formId,
  onSubmitted,
  onSubmittingChange,
  onNotFound,
  onDirtyChange,
}: ProjectFormProps): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();

  // The schema lives in the component so validation messages can be built with t and follow the current language.
  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t('projects.form.nameRequired'))
          .max(100, t('projects.form.nameTooLong', { max: 100 })),
        owner: z
          .string()
          .trim()
          .max(50, t('projects.form.ownerTooLong', { max: 50 })),
        status: z.enum(PROJECT_STATUSES),
      }),
    [t],
  );

  // No generic: the types are inferred from zodResolver(schema).
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? '',
      owner: project?.owner ?? '',
      status: project?.status ?? 'planning',
    },
  });

  // Report unsaved changes to the container, which asks before closing ("beforeClose" in overlay.md).
  const { isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const statusItems = PROJECT_STATUSES.map((value) => ({
    value,
    label: t(`projects.status.${value}`),
  }));

  const onSubmit = form.handleSubmit(async (values) => {
    // values is the data after validation and trimming; empty optional text becomes null.
    const json = {
      name: values.name,
      owner: values.owner || null,
      status: values.status,
    };
    let saved: Project;
    onSubmittingChange?.(true);
    try {
      const result = project
        ? await api.request<{ data: Project }>({
            path: `projects/${encodeURIComponent(project.id)}`,
            method: 'PATCH',
            json,
          })
        : await api.request<{ data: Project }>({
            path: 'projects',
            method: 'POST',
            json,
          });
      saved = result.data;
    } catch (error: unknown) {
      const apiError = error instanceof ApiClientError ? error : undefined;
      if (
        apiError?.status === 409 &&
        apiError.reason === 'PROJECT_NAME_TAKEN'
      ) {
        // Duplicate name: show the error below the name field and move focus there.
        form.setError(
          'name',
          { message: t('projects.form.nameTaken') },
          { shouldFocus: true },
        );
      } else if (apiError?.status === 401) {
        // The session ended. Keep the input and let the user choose to sign in again (SessionExpiredAlert below).
        form.setError('root', { type: 'sessionExpired' });
      } else if (project && apiError?.status === 404) {
        // The record has been deleted: let the caller explain and refresh the list, so the user does not submit again.
        onNotFound?.();
      } else {
        // Other errors appear at the top of the form, without the raw message the backend returned.
        form.setError('root', {
          message:
            apiError?.status === 403
              ? t('projects.error.forbidden')
              : t('projects.error.requestFailed'),
        });
      }
      return;
    } finally {
      onSubmittingChange?.(false);
    }
    toaster.show({
      type: 'success',
      title: project
        ? t('projects.edit.success', { name: saved.name })
        : t('projects.create.success', { name: saved.name }),
    });
    onSubmitted(saved);
  });

  const rootError = form.formState.errors.root;

  return (
    <form id={formId} noValidate onSubmit={(event) => void onSubmit(event)}>
      <FieldGroup>
        {rootError?.type === 'sessionExpired' ? (
          <SessionExpiredAlert />
        ) : rootError ? (
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertDescription>{rootError.message}</AlertDescription>
          </Alert>
        ) : null}
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
                autoComplete='off'
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
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
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
                  aria-invalid={fieldState.invalid}
                  onBlur={field.onBlur}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {statusItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
```

| Prop                             | Description                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `project`                        | When editing, the latest record, just loaded; omit it when creating                                                                                    |
| `formId`                         | The `<form>` id; a submit button outside the form sets `form={formId}`. Also the prefix of the field ids, so two stacked forms do not collide          |
| `onSubmitted(project)`           | The save succeeded; the argument is the record the endpoint returned. The form has already shown the success message; the caller must not show another |
| `onSubmittingChange(submitting)` | `true` when submission starts, `false` when it ends; on success, `false` comes before `onSubmitted` is called                                          |
| `onNotFound()`                   | When editing, the endpoint returned 404                                                                                                                |
| `onDirtyChange(dirty)`           | Whether any field differs from its default value; the container uses it to confirm closing with unsaved changes (guideline T3.9)                       |
