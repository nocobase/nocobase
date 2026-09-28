# Forms and validation

Forms use react-hook-form, zod 4 and `@hookform/resolvers/zod`, the `Field` family from `@/components/ui/field` for structure, and the input components in `@/components/ui/` for controls.

- A form component handles only fields, validation and submission; the title, the button area, and opening and closing belong to the container (`RouteDialog`, a page, a settings card). Creating and editing share one form component.
- Put the form component in the feature folder (`client/pages/<feature>/<feature>-form.tsx`); move it to `client/components/` only when several features use it.
- `client/components/ui/` does not have shadcn's old `form` component (`FormField`, `FormItem`, `FormMessage`). Do not add it; use the `Field` family throughout.

## Complete example: one form for creating and editing

`client/pages/projects/project-form.tsx`: the fields are name (required), owner (optional) and status (a Select). Passing `project` means editing (`PATCH`); omitting it means creating (`POST`). The form renders no buttons: the container puts the submit button outside the `<form>` and links it through `formId`.

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

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
}

export function ProjectForm({
  project,
  formId,
  onSubmitted,
  onSubmittingChange,
  onNotFound,
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
    mode: 'onTouched',
    defaultValues: {
      name: project?.name ?? '',
      owner: project?.owner ?? '',
      status: project?.status ?? 'planning',
    },
  });

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
            path: `projects/${project.id}`,
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
      if (apiError?.status === 409 && apiError.code === 'PROJECT_NAME_TAKEN') {
        // Duplicate name: show the error below the name field and move focus there.
        form.setError(
          'name',
          { message: t('projects.form.nameTaken') },
          { shouldFocus: true },
        );
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

  const rootError = form.formState.errors.root?.message;

  return (
    <form id={formId} noValidate onSubmit={(event) => void onSubmit(event)}>
      <FieldGroup>
        {rootError ? (
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertDescription>{rootError}</AlertDescription>
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
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
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

### Inside a RouteDialog

Create (`/projects/new`) and edit (`/projects/:projectId/edit`) are both child routes, and the page wraps `ProjectForm` in a `RouteDialog`. The full page code is `new.tsx` and `detail/edit.tsx` in `overlay.md`; the form-related wiring works like this:

1. **Put the submit button in `footer`.** `footer` is outside the `<form>`, so the button sets `type='submit' form={FORM_ID}`. `FORM_ID` is a constant in the page module, one per dialog (`project-new-form`, `project-edit-form`), so ids stay unique even when the edit dialog is stacked on the detail drawer. Because the button is linked to the form, pressing Enter in an input still submits; while the button is disabled, Enter does not submit.
2. **Disable the buttons while submitting**: `onSubmittingChange` updates the page's `submitting` state; both "Cancel" and the submit button are disabled, and the submit button shows a `Spinner` and "Saving…" (guideline T3.5).
3. **No closing while submitting**: `beforeClose={() => !submittingRef.current}`. The close button in the top-right corner, Esc, clicking the backdrop and `close()` all go through `beforeClose` first; when it returns `false`, the dialog does not close. The browser's Back button does not go through it.
4. **`beforeClose` reads a ref, not state.** On success the form passes `false` and then calls `onSubmitted`, and the page calls `close()` right after. At that point the new state value has not rendered yet, so `close()` still uses the `beforeClose` from when `submitting` was `true`, and the dialog will not close. That is why `onSubmittingChange` writes both a ref and state: the state disables the buttons, and the ref is what `beforeClose` reads.
5. **`useRouteOverlay()` can only be called from components inside `RouteDialog`**: wrap the form in `NewProjectBody` and the buttons in `NewProjectFooter`, and get `close` inside them. Calling it in the page component that renders `RouteDialog` throws an error; for the edit dialog, which is stacked inside the detail drawer, calling it there does not throw but returns the drawer's `close`, so it closes the drawer.
6. **After success**: when creating, first `reload()` to refresh the list, then `close()`; when editing, first call the `onSaved(record)` passed down from the detail drawer, which updates the drawer with the returned record and refreshes the list, then `close()` (guideline R2).
7. **Load the latest data before editing**: the edit page requests the record by id, shows a skeleton while loading and offers "Retry" on failure; it renders `<ProjectForm project={project} />` only after the data arrives (guidelines T3.8 and R1). On `onNotFound`, switch to a notice that the record does not exist, keep only the "Close" button, and notify the drawer and the list (guideline R3).

Excerpt from `client/pages/projects/new.tsx`:

```tsx
// … (imports omitted; full code in overlay.md)

const FORM_ID = 'project-new-form';

export default function NewProjectPage(): ReactElement {
  const { t } = useTranslation();
  // The state disables the buttons; the ref is for beforeClose: when close() runs right after a successful save, the new state value has not rendered yet.
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmittingChange = (value: boolean) => {
    submittingRef.current = value;
    setSubmitting(value);
  };

  return (
    <RouteDialog
      title={t('projects.create.title')}
      description={t('projects.form.description')}
      className='sm:max-w-lg'
      // No closing while submitting: the × button, Esc, clicking the backdrop and close() all go through beforeClose first (guideline T3.5).
      beforeClose={() => !submittingRef.current}
      footer={<NewProjectFooter submitting={submitting} />}
    >
      <NewProjectBody onSubmittingChange={handleSubmittingChange} />
    </RouteDialog>
  );
}

// useRouteOverlay() can only be called in components inside RouteDialog, so the form and the footer buttons each get a wrapper component.
function NewProjectBody({
  onSubmittingChange,
}: {
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  const { reload } = useOutletContext<ProjectsOutletContext>();
  return (
    <ProjectForm
      formId={FORM_ID}
      onSubmittingChange={onSubmittingChange}
      onSubmitted={() => {
        reload();
        void close();
      }}
    />
  );
}

function NewProjectFooter({
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
      {/* The button is outside the <form> and linked through the form attribute; while it is disabled, Enter does not submit either. */}
      <Button type='submit' form={FORM_ID} disabled={submitting}>
        {submitting ? <Spinner data-icon='inline-start' /> : null}
        {submitting ? t('actions.saving') : t('actions.create')}
      </Button>
    </>
  );
}
```

## Key points

### Schema inside the component

Validation messages must be translated, and `t` is only available inside a component, so create the schema with `useMemo(() => z.object({ ... }), [t])`. When the language changes, the schema is rebuilt and the messages change with it. Do not put the schema at module top level, and do not hard-code Chinese or English text in it.

### Do not pass generics to useForm

- Write `useForm({ resolver: zodResolver(schema), defaultValues: { ... } })`; the types are inferred from the resolver and the default values.
- When the schema uses `default()`, `transform()`, `coerce` or similar, the input and output types differ and `useForm<z.infer<typeof schema>>` fails to compile; code that compiles today breaks as soon as one `default()` is added. When you really need explicit types, write `useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>`.
- The `values` the `handleSubmit` callback receives have the output type (already trimmed, defaults filled in, transformed).
- Default values take part in inference too. An array literal is inferred as `string[]`, which does not match `z.array(z.enum(...))` and causes an error; use `satisfies` to keep the literal type: `['email'] satisfies NotifyChannel[]` (see the demo form below).
- Default values must match the schema's input type. The input type of `z.literal(true)` is `true`, so a default of `false` is an error; write "must be checked" as `z.boolean().refine((value) => value, t('...'))`.

### Field structure

Every field has the same structure:

- `Controller` wraps the field; `render` receives `field` (`value`, `onChange`, `onBlur`, `ref`, `name`) and `fieldState` (`invalid`, `error`).
- `Field` gets `data-invalid={fieldState.invalid}` (the label turns the destructive color), and the control gets `aria-invalid={fieldState.invalid}` (the border changes color, and screen readers recognize it).
- `FieldLabel`'s `htmlFor` matches the control's `id`; ids are prefixed with `formId` (`${formId}-name`).
- For a required field, add `<span aria-hidden='true' className='text-destructive'>*</span>` after the label and `aria-required='true'` on the control; optional fields get no mark (guideline T3.2).
- Help text uses `FieldDescription`, placed below the control.
- `<FieldError errors={[fieldState.error]} />` shows the error. With no error it renders nothing, so no condition is needed; it has `role='alert'`, so screen readers announce it when it appears.
- `field.ref` must go to a focusable element: `Input` and `Textarea` already get it when you spread `{...field}`; `SelectTrigger`, `Checkbox` and `Switch` need an explicit `ref={field.ref}`. When validation fails on submit, focus moves to the first field with an error (guideline T3.3).

### Select

- Pass `items` (`{ value, label }[]`) so that `SelectValue` shows the selected item's label rather than the raw value.
- `onValueChange` can pass `null`; check before calling `field.onChange`.
- `ref`, `onBlur`, `id` and `aria-invalid` all go on `SelectTrigger`. The trigger is `w-fit` by default; in a form, add `className='w-full'`.

### Optional text

Use `z.string().trim()` in the schema and an empty string as the default (`project?.owner ?? ''`), not `undefined` or `null`; otherwise the input switches between controlled and uncontrolled. On submit, convert the empty string to `null` (`values.owner || null`) to stay consistent with the backend's convention.

### Submitting

- `form.handleSubmit(async (values) => { ... })` validates every field first and calls the callback only if they pass; if they do not, it shows the errors and moves focus to the first field with an error.
- `<form noValidate onSubmit={(event) => void onSubmit(event)}>`: `noValidate` turns off the browser's built-in validation bubbles; `void` means the returned Promise is not awaited (ESLint requires it).
- While submitting: when the button is outside the form, hand the state to the container with `onSubmittingChange` (see "Inside a RouteDialog"); when the button is inside the `<form>`, use `form.formState.isSubmitting` directly (see the members card in "Array fields").
- Label the submit button with the specific action: "Create", "Save", not "OK" or "Submit" (guideline T3.4).

### Server errors

- Map business errors defined by the backend to the specific field: `form.setError('name', { message }, { shouldFocus: true })` shows the error below the field and moves focus there. Once the user changes that field and it passes validation again, the error disappears automatically.
- A 404 while editing means the record has been deleted. Call `onNotFound`; the container explains what happened, keeps only "Close" and refreshes the list, so the user does not submit again (guideline R3).
- Write other errors to `form.setError('root', { message })` and show them in an `Alert` at the top of the form: for 403, say the user has no permission; for everything else, say "The request failed. Please try again." Do not show the raw message the backend returned (guideline I3). The `root` error is cleared automatically on the next submission.
- On failure, do not close the dialog, and keep what the user has entered (guideline T3.6).
- Error copy goes in the feature's own copy group, for example `projects.error.forbidden` and `projects.error.requestFailed`.

### Success

The form reports the result with a `success` toast, including the record name (`t('projects.create.success', { name })`, guidelines T3.7 and C6), then passes the record the endpoint returned to `onSubmitted`. The container uses that record to update the current view immediately, then refreshes the list and closes the dialog (guideline R2). Do not just refresh the list and leave the detail view showing old values.

### Default values are read only on mount

`defaultValues` is read only when the form first renders; if the props change later, the form does not follow.

- Render an edit form only after the latest data arrives (see item 7 of "Inside a RouteDialog"); do not render with empty values first and call `reset` when the data arrives.
- When the same spot has to switch to another record, give the form `key={project.id}` so it remounts; do not call `reset` in an effect.
- When `RouteDialog` closes, the whole child route unmounts, and the next time it opens the form is brand new, so no manual reset is needed.

## Field types

| Control           | Schema and default                             | Binding                                                                                    | `aria-invalid` goes on | Structure                                                                                              |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `Input`           | `z.string()…`, `''`                            | Spread `{...field}`                                                                        | `Input`                | `Field`                                                                                                |
| `Textarea`        | `z.string()…`, `''`                            | Spread `{...field}`                                                                        | `Textarea`             | `Field`                                                                                                |
| `Select`          | `z.enum(OPTIONS)`, one of the options          | `items`, `value`, `onValueChange` (check for `null`); `ref` and `onBlur` on the trigger    | `SelectTrigger`        | `Field`                                                                                                |
| Single `Checkbox` | `z.boolean()`, `false`                         | `checked`, `onCheckedChange`, `ref`, `onBlur`                                              | `Checkbox`             | `Field orientation='horizontal'`, control before the label                                             |
| `Checkbox` group  | `z.array(z.enum(OPTIONS)).min(1, …)`, an array | Each item `checked={field.value.includes(item)}`; `onCheckedChange` computes the new array | Each `Checkbox`        | `FieldSet` + `FieldLegend variant='label'` + `FieldGroup data-slot='checkbox-group'`                   |
| `RadioGroup`      | `z.enum(OPTIONS)`, one of the options          | `value`, `onValueChange`, `onBlur` on `RadioGroup`                                         | Each `RadioGroupItem`  | `FieldSet` + `FieldLegend variant='label'`                                                             |
| `Switch`          | `z.boolean()`, `false`                         | `checked`, `onCheckedChange`, `ref`, `onBlur`                                              | `Switch`               | `Field orientation='horizontal'`; `FieldContent` holds the label and description, control on the right |

The demo form below uses every control in the table except `Input` and `Select`, grouped with `FieldSet` (`client/pages/projects/project-settings-form.tsx`). These fields are not part of the `Project` type; they only demonstrate the patterns. Once validation passes, it hands the cleaned-up values to the caller; for calling the endpoint, the submitting state and server errors, follow `ProjectForm` above.

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const PRIORITIES = ['low', 'medium', 'high'] as const;
const NOTIFY_CHANNELS = ['email', 'inApp', 'sms'] as const;
type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];

/** The values handed to the caller: already validated and shaped the way the endpoint expects. */
export interface ProjectSettings {
  readonly description: string | null;
  readonly priority: (typeof PRIORITIES)[number];
  readonly isPublic: boolean;
  readonly allowGuests: boolean;
  readonly notifyChannels: readonly NotifyChannel[];
}

export interface ProjectSettingsFormProps {
  /** When editing, pass the latest values; when omitted, the defaults are used. */
  readonly settings?: ProjectSettings;
  readonly formId: string;
  /** Called once validation passes. See ProjectForm for calling the endpoint, the submitting state and server errors. */
  readonly onSubmit: (settings: ProjectSettings) => void;
}

export function ProjectSettingsForm({
  settings,
  formId,
  onSubmit,
}: ProjectSettingsFormProps): ReactElement {
  const { t } = useTranslation();

  const schema = useMemo(
    () =>
      z.object({
        description: z
          .string()
          .trim()
          .max(500, t('projects.form.descriptionTooLong', { max: 500 })),
        priority: z.enum(PRIORITIES),
        isPublic: z.boolean(),
        allowGuests: z.boolean(),
        notifyChannels: z
          .array(z.enum(NOTIFY_CHANNELS))
          .min(1, t('projects.form.notifyChannelsRequired')),
      }),
    [t],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      description: settings?.description ?? '',
      priority: settings?.priority ?? 'medium',
      isPublic: settings?.isPublic ?? false,
      allowGuests: settings?.allowGuests ?? false,
      // An array literal is inferred as string[]; satisfies keeps the literal type of its elements.
      notifyChannels: settings
        ? [...settings.notifyChannels]
        : (['email'] satisfies NotifyChannel[]),
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({ ...values, description: values.description || null });
  });

  return (
    <form id={formId} noValidate onSubmit={(event) => void handleSubmit(event)}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>{t('projects.form.basics')}</FieldLegend>
          <FieldGroup>
            {/* Textarea: spread field, same as Input */}
            <Controller
              control={form.control}
              name='description'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-description`}>
                    {t('projects.fields.description')}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={`${formId}-description`}
                    rows={4}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    {t('projects.form.descriptionHint', {
                      length: field.value.length,
                      max: 500,
                    })}
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            {/* RadioGroup: value + onValueChange, wrapped in FieldSet + FieldLegend */}
            <Controller
              control={form.control}
              name='priority'
              render={({ field, fieldState }) => (
                <FieldSet data-invalid={fieldState.invalid}>
                  <FieldLegend variant='label'>
                    {t('projects.fields.priority')}
                  </FieldLegend>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    {PRIORITIES.map((priority) => (
                      <Field
                        key={priority}
                        orientation='horizontal'
                        data-invalid={fieldState.invalid}
                      >
                        <RadioGroupItem
                          value={priority}
                          id={`${formId}-priority-${priority}`}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldLabel
                          htmlFor={`${formId}-priority-${priority}`}
                          className='font-normal'
                        >
                          {t(`projects.priority.${priority}`)}
                        </FieldLabel>
                      </Field>
                    ))}
                  </RadioGroup>
                  <FieldError errors={[fieldState.error]} />
                </FieldSet>
              )}
            />
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend>{t('projects.form.collaboration')}</FieldLegend>
          <FieldDescription>
            {t('projects.form.collaborationHint')}
          </FieldDescription>
          <FieldGroup>
            {/* Switch: checked + onCheckedChange, control on the right */}
            <Controller
              control={form.control}
              name='isPublic'
              render={({ field, fieldState }) => (
                <Field
                  orientation='horizontal'
                  data-invalid={fieldState.invalid}
                >
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-public`}>
                      {t('projects.fields.isPublic')}
                    </FieldLabel>
                    <FieldDescription>
                      {t('projects.form.isPublicHint')}
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                  <Switch
                    ref={field.ref}
                    id={`${formId}-public`}
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              )}
            />
            {/* Single Checkbox: checked + onCheckedChange, control to the left of the label */}
            <Controller
              control={form.control}
              name='allowGuests'
              render={({ field, fieldState }) => (
                <Field
                  orientation='horizontal'
                  data-invalid={fieldState.invalid}
                >
                  <Checkbox
                    ref={field.ref}
                    id={`${formId}-guests`}
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldLabel
                    htmlFor={`${formId}-guests`}
                    className='font-normal'
                  >
                    {t('projects.fields.allowGuests')}
                  </FieldLabel>
                </Field>
              )}
            />
            {/* Checkbox group: the value is an array; each option computes the new array and passes it to field.onChange */}
            <Controller
              control={form.control}
              name='notifyChannels'
              render={({ field, fieldState }) => (
                <FieldSet data-invalid={fieldState.invalid}>
                  <FieldLegend variant='label'>
                    {t('projects.fields.notifyChannels')}
                  </FieldLegend>
                  <FieldGroup data-slot='checkbox-group'>
                    {NOTIFY_CHANNELS.map((channel, index) => (
                      <Field
                        key={channel}
                        orientation='horizontal'
                        data-invalid={fieldState.invalid}
                      >
                        <Checkbox
                          // On error, focus moves to the first option.
                          ref={index === 0 ? field.ref : undefined}
                          id={`${formId}-notify-${channel}`}
                          checked={field.value.includes(channel)}
                          onCheckedChange={(checked) => {
                            // Rebuild the array in option order: no duplicates, no reordering.
                            field.onChange(
                              NOTIFY_CHANNELS.filter((item) =>
                                item === channel
                                  ? checked
                                  : field.value.includes(item),
                              ),
                            );
                          }}
                          onBlur={field.onBlur}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldLabel
                          htmlFor={`${formId}-notify-${channel}`}
                          className='font-normal'
                        >
                          {t(`projects.notifyChannels.${channel}`)}
                        </FieldLabel>
                      </Field>
                    ))}
                  </FieldGroup>
                  <FieldError errors={[fieldState.error]} />
                </FieldSet>
              )}
            />
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  );
}
```

### Input and Textarea

- Spread `{...field}`, then add `id` and `aria-invalid`; write input attributes as usual, for example `type='email'` and `autoComplete='off'`.
- Put a character-count hint in `FieldDescription`, computed from `field.value.length`.
- For prefixes or suffixes (icons, units, buttons), use `InputGroup`, `InputGroupInput`, `InputGroupTextarea` and `InputGroupAddon` from `@/components/ui/input-group`; the control spreads `{...field}` the same way.

### Checkbox and Switch

- They are built on Base UI: the controlled prop is `checked`, not `value`, and the callback is `onCheckedChange(checked: boolean, eventDetails)`. Write `(checked) => field.onChange(checked)` to take only the first argument.
- They render a `span` with `role='checkbox'` (or `role='switch'`) plus a hidden `input`, and the `id` lands on the hidden `input`, so `FieldLabel htmlFor` works as usual and clicking the label toggles the control.
- `ref={field.ref}` goes on the component (it can take focus); `onBlur={field.onBlur}` makes "validate on blur" work.
- For a boolean submitted with the form, either `Checkbox` or `Switch` works. A switch on a settings page that "takes effect as soon as it is toggled" (guideline T4.3) is not part of a form: call the endpoint directly in `onCheckedChange`, without going through react-hook-form.

### Checkbox group

- The value is an array. Each option's `onCheckedChange` rebuilds the array in option order (`NOTIFY_CHANNELS.filter(...)`), so there are no duplicates and no reordering.
- Give `FieldGroup` `data-slot='checkbox-group'` to tighten the spacing between options; the `FieldLegend` of the outer `FieldSet` is the label for the whole group.
- The error belongs to the whole group: `data-invalid` goes on every `Field`, `aria-invalid` on every `Checkbox`, and `FieldError` below the group.
- Give `field.ref` only to the first option; focus moves there on error.

### RadioGroup

- `value` and `onValueChange` go on `RadioGroup`, not on the options; each `RadioGroupItem` gets `value` and `id`, and the `FieldLabel` beside it links to it with `htmlFor`.
- `RadioGroup`'s value type is `any`, and `onValueChange` receives the selected item's `value`. The options come from an `as const` constant array, so the value is always in the enum and `field.onChange` can be passed directly.
- Provide a default option, and the user never runs into a "nothing selected" error.

### Grouping and layout

| Component                  | Purpose                                                                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FieldGroup`               | A group of fields; provides the spacing between fields. Can be nested                                                                                          |
| `FieldSet` + `FieldLegend` | Semantic grouping (`<fieldset>`, `<legend>`); `FieldLegend variant='label'` uses the label font size and serves as the label of a Checkbox group or RadioGroup |
| `FieldSeparator`           | A divider between groups                                                                                                                                       |
| `FieldContent`             | In a horizontal layout, stacks the label, description and error vertically                                                                                     |
| `FieldTitle`               | Title text not tied to a control, for example the title inside an option card that is clickable as a whole                                                     |
| `Field orientation`        | `vertical` (default, label on top), `horizontal` (control and label on one line), `responsive` (horizontal when the container is wide enough)                  |

Labels go above inputs (guideline T3.2): ordinary fields use the default `vertical`; only Checkbox, Switch and radio options use `horizontal`.

### Other controls

- `client/components/ui/` also has `Combobox`, `NativeSelect`, `Slider`, `InputOTP`, `ToggleGroup` and more; for dates, use `DatePicker` from `@/components/date-picker` (`value: Date | undefined`, `onChange(date)`; it accepts neither `ref` nor `aria-invalid`). Before wiring a component into `Controller`, read its source to confirm the controlled prop and the callback arguments: Base UI components often use different prop names from the Radix versions.
- When a component you need is not in `client/components/ui/`, add it with `pnpm exec shadcn add <name>`; do not write it by hand.

## Validation timing, array fields and resetting

### Validation timing

`useForm`'s `mode` decides when fields are validated before the first submission:

| `mode`        | When it validates                                                                       |
| ------------- | --------------------------------------------------------------------------------------- |
| `'onTouched'` | When a field first loses focus, then on every change (recommended, guideline T3.3)      |
| `'onBlur'`    | Every time a field loses focus                                                          |
| `'onChange'`  | On every change; an error can appear at the first character typed, so it is rarely used |
| `'onSubmit'`  | Only on submit (default)                                                                |
| `'all'`       | Both on blur and on change                                                              |

- Submitting always validates every field. After the first submission, a field is revalidated on every change (`reValidateMode` defaults to `'onChange'`), so the error disappears as soon as the value is corrected.
- `onTouched` and `onBlur` depend on `field.onBlur`: `Input` and `Textarea` already get it when they spread `field`; `SelectTrigger`, `Checkbox`, `Switch` and `RadioGroup` need `onBlur={field.onBlur}`, or they validate only on submit.

### Array fields

`client/pages/projects/project-members-card.tsx`: a card on a settings page that edits the list of project member emails, with adding and removing, and saves on its own (guidelines T4.1 and T4.2). The caller does the saving (calls the endpoint) and throws an error on failure.

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon, PlusIcon, XIcon } from 'lucide-react';
import { type ReactElement, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const MAX_MEMBERS = 10;

export interface ProjectMembersCardProps {
  /** The latest list of member emails. */
  readonly members: readonly string[];
  /** Saves the member list (the caller calls the endpoint); throws an error on failure. */
  readonly onSave: (members: string[]) => Promise<void>;
}

export function ProjectMembersCard({
  members,
  onSave,
}: ProjectMembersCardProps): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();

  const schema = useMemo(
    () =>
      z.object({
        // useFieldArray only manages arrays of objects: each member is { email }, converted to an array of strings on submit.
        members: z
          .array(z.object({ email: z.email(t('projects.form.emailInvalid')) }))
          .min(1, t('projects.form.membersRequired'))
          .max(
            MAX_MEMBERS,
            t('projects.form.membersTooMany', { max: MAX_MEMBERS }),
          )
          // A rule on the whole array; its error is in errors.members.root.
          .refine(
            (list) =>
              new Set(list.map((member) => member.email.toLowerCase())).size ===
              list.length,
            t('projects.form.membersDuplicated'),
          ),
      }),
    [t],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      members:
        members.length > 0
          ? members.map((email) => ({ email }))
          : [{ email: '' }],
    },
  });
  const list = useFieldArray({ control: form.control, name: 'members' });
  const { isDirty, isSubmitting } = form.formState;
  const rootError = form.formState.errors.root?.message;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await onSave(values.members.map((member) => member.email));
    } catch {
      form.setError('root', { message: t('projects.error.requestFailed') });
      return;
    }
    // After saving, make the submitted values the new defaults: isDirty goes back to false, and "Discard changes" returns to them too.
    form.reset(values);
    toaster.show({ type: 'success', title: t('projects.members.saved') });
  });

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)}>
      <Card>
        <CardHeader>
          <CardTitle>{t('projects.members.title')}</CardTitle>
          <CardDescription>
            {t('projects.members.description', { max: MAX_MEMBERS })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className='gap-3'>
            {rootError ? (
              <Alert variant='destructive'>
                <AlertCircleIcon />
                <AlertDescription>{rootError}</AlertDescription>
              </Alert>
            ) : null}
            {list.fields.map((item, index) => (
              // Use item.id as the key, not index: removing an item in the middle does not shift the state of the other inputs.
              <Controller
                key={item.id}
                control={form.control}
                name={`members.${index}.email`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        type='email'
                        autoComplete='off'
                        aria-label={t('projects.form.memberEmail', {
                          index: index + 1,
                        })}
                        aria-invalid={fieldState.invalid}
                      />
                      {list.fields.length > 1 ? (
                        <InputGroupAddon align='inline-end'>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <InputGroupButton
                                  size='icon-xs'
                                  aria-label={t('projects.form.removeMember', {
                                    index: index + 1,
                                  })}
                                  onClick={() => list.remove(index)}
                                />
                              }
                            >
                              <XIcon />
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('projects.form.removeMember', {
                                index: index + 1,
                              })}
                            </TooltipContent>
                          </Tooltip>
                        </InputGroupAddon>
                      ) : null}
                    </InputGroup>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            ))}
            <div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={list.fields.length >= MAX_MEMBERS}
                onClick={() => list.append({ email: '' })}
              >
                <PlusIcon data-icon='inline-start' />
                {t('projects.form.addMember')}
              </Button>
            </div>
            <FieldError errors={[form.formState.errors.members?.root]} />
          </FieldGroup>
        </CardContent>
        {/* The buttons are inside the <form>, so no form attribute is needed; both are disabled while submitting. */}
        <CardFooter className='justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            disabled={!isDirty || isSubmitting}
            onClick={() => form.reset()}
          >
            {t('actions.discard')}
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon='inline-start' /> : null}
            {isSubmitting ? t('actions.saving') : t('actions.save')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
```

- `useFieldArray({ control: form.control, name: 'members' })` returns `fields`, `append`, `remove` and other methods. It only manages **arrays of objects**: wrap a string array as `{ email }` items and convert back on submit.
- When mapping over `fields`, use `item.id` as the `key`, not `index`; otherwise, after an item in the middle is removed, the contents and errors of the inputs after it shift out of place.
- Each item has its own `Controller`, with `name` written as `` `members.${index}.email` ``; each item's error is in its own `fieldState`.
- The inputs have no visible label, so `aria-label` says which item each one is ("Member 1 email").
- `append({ email: '' })` adds an item and by default moves focus to the new input; disable the "Add" button at the limit. `remove(index)` removes an item; when only one item is left, the remove button is not shown. The remove button is an icon button, so it needs an `aria-label` and a tooltip (guideline A1).
- Rules on the whole array (count, no duplicates) go on `z.array(...)`; the error is in `form.formState.errors.members?.root` and is shown below the list.

### Resetting the form

- `form.reset()`: returns to the default values and clears the errors and the dirty state. The members card's "Discard changes" is exactly this, disabled when there are no changes (`formState.isDirty` is `false`).
- `form.reset(values)`: makes the given values the new defaults. Use it when the form stays on the page after saving (settings cards, standalone pages): `isDirty` goes back to `false`, and "Discard changes" returns to the values just saved.
- A dialog that closes after saving needs no reset: when `RouteDialog` closes, the form unmounts with the child route.
- Do not call `reset` in an effect based on props; to switch records, remount with `key` (see "Default values are read only on mount").

## Common zod 4 patterns

| Need                       | Code                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Required text              | `z.string().trim().min(1, t('...'))`                                                                                                        |
| Maximum length             | `.max(100, t('...', { max: 100 }))`                                                                                                         |
| Optional text              | `z.string().trim()`, default `''`, `value \|\| null` on submit                                                                              |
| Format                     | `z.string().regex(/^1\d{10}$/u, t('...'))`                                                                                                  |
| Required email             | `z.email(t('...'))`                                                                                                                         |
| Optional email             | `z.email(t('...')).or(z.literal(''))`                                                                                                       |
| Enum (Select, radio)       | `z.enum(STATUSES)`, with `STATUSES` declared `as const`                                                                                     |
| Boolean (Checkbox, Switch) | `z.boolean()`                                                                                                                               |
| Must be checked            | `z.boolean().refine((value) => value, t('...'))`; do not use `z.literal(true)` (a `false` default is a type error)                          |
| Multi-select, at least one | `z.array(z.enum(OPTIONS)).min(1, t('...'))`                                                                                                 |
| Array of objects           | `z.array(z.object({ email: z.email(t('...')) })).max(10, t('...', { max: 10 }))`                                                            |
| Rule on the whole array    | `z.array(...).refine((list) => ..., t('...'))`; the error is in `errors.<field>.root`                                                       |
| Comparing two fields       | `z.object({ ... }).refine((v) => v.password === v.confirm, { error: t('...'), path: ['confirm'] })`; the error shows on the `confirm` field |

- Pass the message directly as the argument (a string), or put it in `error` in the params object.
- Do not use v3 patterns: `required_error` and `invalid_type_error` have been removed; `z.string().email()` is deprecated in favor of `z.email()`; `message` in the params object is deprecated in favor of `error`.
- Do not use `z.coerce.number()` for a number input that can be left empty: the empty string is coerced to `0`, and the required check stops working.

## Where forms go

- Create and edit forms with **no more than 8 fields and no complex interdependencies**: put them in a `RouteDialog` as a child route (guidelines T3.1 and I1); see "Inside a RouteDialog" and `overlay.md`. Do not drive create or edit dialogs with open state held inside a component.
- **More fields, or grouping or steps needed**: make a standalone page (for the route, see `page.md` and `child-routes.md`). The page uses `PageContainer` + `PageHeader`; limit the form's width (`max-w-2xl`, guideline L4) and group fields with `FieldSet`. Put the buttons at the bottom of the form, right-aligned; when the buttons are inside the `<form>`, disable them with `form.formState.isSubmitting`, and when reusing a component without buttons such as `ProjectForm`, still set `form={formId}`. On success, show a message and go back to the list or detail view with `useNavigate()`. Leaving with unsaved changes (`form.formState.isDirty`) asks for confirmation first (guideline T3.9, Should).
- **Settings page**: each Card is an independent form, with its buttons at the bottom right of the Card (guidelines T4.1 and T4.2); see the members card.
