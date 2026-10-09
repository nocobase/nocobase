# Forms and validation

Forms use react-hook-form, zod 4 and `@hookform/resolvers/zod`, the `Field` family from `#components/ui/field` for structure, and the input components in `#components/ui/` for controls. The template ships `input`, `label` and `select`; add `field` and every other control before using it (`yes n | pnpm exec shadcn add field textarea checkbox`, then format the created files, as [section 1 of `shadcn.md`](shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest) describes). The layout rules for these components are in the skill's [`rules/forms.md`](../shadcn/rules/forms.md); this document covers binding them to react-hook-form and zod.

- A form component handles only fields, validation and submission; the title, the button area, and opening and closing belong to the container (`RouteDialog`, a page, a settings card). Creating and editing share one form component.
- Put the form component in the feature folder (`client/pages/<feature>/<feature>-form.tsx`); move it to `client/components/` only when several features use it.
- `client/components/ui/` does not have shadcn's old `form` component (`FormField`, `FormItem`, `FormMessage`). Do not add it; use the `Field` family throughout.

## Complete example: one form for creating and editing

`client/pages/projects/project-form.tsx` is the form create and edit share: name (required), owner (optional) and status (a Select). Passing `project` means editing (`PATCH`); omitting it means creating (`POST`). It renders no buttons: the container puts the submit button outside the `<form>` and links it through `formId`. Its complete code and props table are [`example/project-form.md`](example/project-form.md); the key points below explain what it does and why.

### Inside a RouteDialog

Create (`/projects/new`) and edit (`/projects/edit/:projectId` from a row's menu, `/projects/:projectId/edit` from the drawer) are child routes whose pages wrap `ProjectForm` in a `RouteDialog`. Their complete code is `new.tsx` and `detail/edit.tsx` ([`example/create-dialog.md`](example/create-dialog.md) and [`example/edit-dialog.md`](example/edit-dialog.md)), and [section 2.5 of `overlay.md`](overlay.md#25-beforeclose-checks-before-closing) explains the close guard. What the form contributes to that wiring:

1. **The submit button lives in the dialog's `footer`**, outside the `<form>`, so it sets `type='submit' form={formId}`. Each dialog passes its own `formId` (`project-new-form`, `project-edit-form`), which keeps field ids unique when the edit dialog stacks on the detail drawer. Enter in an input still submits; while the button is disabled, it does not.
2. **`onSubmittingChange` reports the submitting state** to the page, which disables both buttons, shows a `Spinner` on the submit button and blocks closing (guideline T3.5). On success the form reports `false` before calling `onSubmitted`, so the page can call `close()` straight from `onSubmitted`.
3. **`onSubmitted(record)` hands over the saved record**: create refreshes the list and closes; edit first updates the drawer with the record, then closes (guideline R2).
4. **Edit renders the form only after the latest record arrives** (guidelines T3.8 and R1), and `onNotFound` lets the page replace the form with a "does not exist" notice (guideline R3).

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

- Pass `items` (`{ value, label }[]`) so that `SelectValue` shows the selected item's label rather than the raw value, and render the `SelectItem`s inside a `SelectGroup` (the skill's composition rules).
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
- Write every other error to `form.setError('root', { message })` and show it in an `Alert` at the top of the form, with the message ["Handling each kind of error" in `api.md`](api.md#handling-each-kind-of-error) gives for its status; a 401 sets `{ type: 'sessionExpired' }` and renders `SessionExpiredAlert` there instead, keeping the input. The `root` error is cleared automatically on the next submission.
- On failure, do not close the dialog, and keep what the user has entered (guideline T3.6).

### Success

The form reports the result with a `success` toast, including the record name (`t('projects.create.success', { name })`, guidelines T3.7 and C6), then passes the record the endpoint returned to `onSubmitted`. The container uses that record to update the current view immediately, then refreshes the list and closes the dialog (guideline R2). Do not just refresh the list and leave the detail view showing old values.

### Default values are read only on mount

`defaultValues` is read only when the form first renders; if the props change later, the form does not follow.

- Render an edit form only after the latest data arrives (see item 4 of "Inside a RouteDialog"); do not render with empty values first and call `reset` when the data arrives.
- When the same spot has to switch to another record, give the form `key={project.id}` so it remounts; do not call `reset` in an effect.
- When `RouteDialog` closes, the whole child route unmounts, and the next time it opens the form is brand new, so no manual reset is needed.

## Field types

| Control                        | Schema and default                                       | Binding                                                                                    | `aria-invalid` goes on | Structure                                                                                              |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `Input`                        | `z.string()…`, `''`                                      | Spread `{...field}`                                                                        | `Input`                | `Field`                                                                                                |
| `Textarea`                     | `z.string()…`, `''`                                      | Spread `{...field}`                                                                        | `Textarea`             | `Field`                                                                                                |
| `Select`                       | `z.enum(OPTIONS)`, one of the options                    | `items`, `value`, `onValueChange` (check for `null`); `ref` and `onBlur` on the trigger    | `SelectTrigger`        | `Field`                                                                                                |
| Single `Checkbox`              | `z.boolean()`, `false`                                   | `checked`, `onCheckedChange`, `ref`, `onBlur`                                              | `Checkbox`             | `Field orientation='horizontal'`, control before the label                                             |
| `Checkbox` group               | `z.array(z.enum(OPTIONS)).min(1, …)`, an array           | Each item `checked={field.value.includes(item)}`; `onCheckedChange` computes the new array | Each `Checkbox`        | `FieldSet` + `FieldLegend variant='label'` + `FieldGroup data-slot='checkbox-group'`                   |
| `RadioGroup`                   | `z.enum(OPTIONS)`, one of the options                    | `value`, `onValueChange`, `onBlur` on `RadioGroup`                                         | Each `RadioGroupItem`  | `FieldSet` + `FieldLegend variant='label'`                                                             |
| `Switch`                       | `z.boolean()`, `false`                                   | `checked`, `onCheckedChange`, `ref`, `onBlur`                                              | `Switch`               | `Field orientation='horizontal'`; `FieldContent` holds the label and description, control on the right |
| Number (`Input type='number'`) | `z.string().trim()` with a `refine` that parses it, `''` | Spread `{...field}`; convert with `Number(…)` on submit                                    | `Input`                | `Field`; see "Numbers"                                                                                 |
| Related record (`Combobox`)    | `z.string()`, the id as a string, `''`                   | `value`, `onChange`, `onBlur` passed to a picker component                                 | The picker's input     | `Field`; see "Choosing a related record"                                                               |

The demo form `client/pages/projects/project-settings-form.tsx` ([`example/settings-form.md`](example/settings-form.md)) uses every control in the table except `Input` and `Select`, grouped with `FieldSet`. For calling the endpoint, the submitting state and server errors, follow `ProjectForm`. The subsections below explain each control.

### Input and Textarea

- Spread `{...field}`, then add `id` and `aria-invalid`; write input attributes as usual, for example `type='email'` and `autoComplete='off'`.
- Put a character-count hint in `FieldDescription`, computed from `field.value.length`.
- For prefixes or suffixes (icons, units, buttons), use `InputGroup`, `InputGroupInput`, `InputGroupTextarea` and `InputGroupAddon` from `#components/ui/input-group`; the control spreads `{...field}` the same way.

### Checkbox and Switch

- They are built on Base UI: the controlled prop is `checked`, not `value`, and the callback is `onCheckedChange(checked: boolean, eventDetails)`. Write `(checked) => field.onChange(checked)` to take only the first argument.
- They render a `span` with `role='checkbox'` (or `role='switch'`) plus a hidden `input`, and the `id` lands on the hidden `input`, so `FieldLabel htmlFor` works as usual and clicking the label toggles the control.
- `ref={field.ref}` goes on the component, so a failed submission can move focus to it; `onBlur={field.onBlur}` marks the field touched.
- For a boolean submitted with the form, either `Checkbox` or `Switch` works. A switch on a settings page that "takes effect as soon as it is toggled" (guideline T4.3) is not part of a form: call the endpoint directly in `onCheckedChange`, without going through react-hook-form. `project-public-switch.tsx` ([`example/public-switch.md`](example/public-switch.md)) does this: the switch shows the value being saved and is disabled while the request runs, a success toast confirms the change, and on failure an error toast explains it and the switch returns to the saved value.

### Checkbox group

- The value is an array. Each option's `onCheckedChange` rebuilds the array in option order (`NOTIFY_CHANNELS.filter(...)`), so there are no duplicates and no reordering.
- Give `FieldGroup` `data-slot='checkbox-group'` to tighten the spacing between options; the `FieldLegend` of the outer `FieldSet` is the label for the whole group.
- The error belongs to the whole group: `data-invalid` goes on every `Field`, `aria-invalid` on every `Checkbox`, and `FieldError` below the group.
- Give `field.ref` only to the first option; focus moves there on error.

### RadioGroup

- `value` and `onValueChange` go on `RadioGroup`, not on the options; each `RadioGroupItem` gets `value` and `id`, and the `FieldLabel` beside it links to it with `htmlFor`.
- `RadioGroup`'s value type is `any`, and `onValueChange` receives the selected item's `value`. The options come from an `as const` constant array, so the value is always in the enum and `field.onChange` can be passed directly.
- Provide a default option, and the user never runs into a "nothing selected" error.

### Numbers

Keep the form value a string, exactly what the input holds, and convert on submit. `z.coerce.number()` turns an empty input into `0`, and a `number` form value cannot hold the half-typed text of an input.

- Schema: `z.string().trim().refine((value) => value === '' || Number.isFinite(Number(value)), t('projects.form.budgetInvalid'))` for an optional number; add `.min(1, t('…'))` before the `refine` for a required one, and further `refine` calls for a range.
- Default: `project?.budget == null ? '' : String(project.budget)`.
- Control: `<Input {...field} type='number' inputMode='decimal' step='0.01' />`, with `id` and `aria-invalid` as for any `Input`.
- Submit: `budget: values.budget === '' ? null : Number(values.budget)`.
- Show numbers in lists and details with `Intl.NumberFormat` (`AmountText` in [`i18n.md`](i18n.md)), right-aligned in table columns ([section 8 of `table.md`](table.md#8-column-definitions-and-row-actions)).

### Choosing a related record

A field that points at another record, such as the project's customer, stores the record's id and shows its name. `CustomerPicker` (`client/pages/projects/customer-picker.tsx`, [`example/customer-picker.md`](example/customer-picker.md)) is the pattern:

- It loads the options itself with the pattern in ["Loading data in a component" of `api.md`](api.md#loading-data-in-a-component), and maps them to `{ value: id, label: name }` items.
- It binds the id, not the item: `Combobox` receives the item the id names, and `onValueChange` hands `item?.value ?? ''` back to the form. `itemToStringLabel` shows the name in the input; `isItemEqualToValue` compares by id.
- While the options load, the input is disabled with a loading placeholder, so an edit form never shows an id without its name; a failed load replaces the control with an inline error and "Retry" (none for 403).
- In the form: schema `z.string().min(1, t('projects.form.customerRequired'))` for a required relation (plain `z.string()` for an optional one), default `project?.customerId ?? ''`, `<CustomerPicker id={…} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={fieldState.invalid} />` inside `Controller`, and `customerId: values.customerId === '' ? null : values.customerId` on submit; ids are strings, so the value needs no conversion.
- It loads one page of at most 100 records (`pageSize: 100`, the endpoint's cap) and filters them in the browser. When the related collection is larger, send the typed text to the endpoint instead: keep the input text in state, debounce it by about 300ms as the list search does ([section 5 of `table.md`](table.md#5-writing-search-and-filters-to-the-url)), request with it, and keep the currently selected record in the items so an edit form still shows its name.
- A small fixed set (fewer than about 15 records) can use `Select` with the same loaded `items` instead.

### Grouping and layout

`FieldGroup` spaces the fields and can be nested, `FieldSet` with `FieldLegend variant='label'` groups related controls and labels a Checkbox group or RadioGroup, `FieldSeparator` divides groups, `FieldContent` stacks the label, description and error beside a horizontal control, and `FieldTitle` is title text tied to no control. The skill's [`rules/forms.md`](../shadcn/rules/forms.md) and `pnpm exec shadcn docs field` show each of them.

Labels go above inputs (guideline T3.2): ordinary fields use the default `vertical` orientation on every page, settings pages included, whatever the skill suggests for those; only Checkbox, Switch and radio options use `horizontal`.

### Other controls

- The registry also has `NativeSelect`, `Slider`, `InputOTP`, `ToggleGroup` and more (for `Combobox`, see "Choosing a related record"); the skill's forms rules say when each fits, for example `ToggleGroup` for two to seven options. Before wiring a component into `Controller`, confirm the controlled prop and the callback arguments with `pnpm exec shadcn docs <name>` and the source the CLI wrote: Base UI components often use different prop names from the Radix versions.
- For dates, use the application's own `DatePicker` from `#components/date-picker`. If it does not exist yet, compose it there from the `calendar` and `popover` primitives as shadcn's Date Picker guide does (`pnpm exec shadcn docs date-picker`), with `date-fns` for formatting, rather than inline in a page. Give it `value: Date | undefined`, `onChange(date)`, `id` for the label and a `date-fns` `locale`; it accepts neither `ref` nor `aria-invalid`, so `FieldError` below it carries the error. It formats the trigger and the calendar in English unless it gets a `date-fns` locale, so map the interface language to one:

```tsx
// client/pages/projects/project-due-date-picker.tsx
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { enUS, zhCN } from 'date-fns/locale';
import type { ReactElement } from 'react';

import { DatePicker } from '#components/date-picker';

export interface ProjectDueDatePickerProps {
  readonly id: string;
  readonly value: Date | undefined;
  readonly onChange: (date: Date | undefined) => void;
}

export function ProjectDueDatePicker({
  id,
  value,
  onChange,
}: ProjectDueDatePickerProps): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  // One date-fns locale per language the application offers; add a line when you add a language.
  const dateLocale = locale.startsWith('zh') ? zhCN : enUS;
  return (
    <DatePicker
      id={id}
      className='w-full'
      value={value}
      onChange={onChange}
      locale={dateLocale}
      placeholder={t('projects.form.dueDatePlaceholder')}
    />
  );
}
```

In the form, render it inside `Controller` with `value={field.value}` and `onChange={field.onChange}`, and give the schema `z.date(t('…'))` for a required date or `z.date().optional()` with an `undefined` default for an optional one.

How a date travels to and from the endpoint depends on what it is:

- **A calendar date** (a due date, a birthday) travels as `'yyyy-MM-dd'`. Submit `format(date, 'yyyy-MM-dd')` and turn a loaded value into the default with `parseISO(value)`, both from `date-fns`: `parseISO` reads a date-only string as local midnight. `new Date('2026-01-02')` reads it as UTC midnight, which shows as January 1 west of UTC, and `toISOString()` turns local midnight into the previous day east of UTC.
- **A point in time** (`updatedAt`, a meeting start) travels as an ISO 8601 string with its offset: send `date.toISOString()`, parse with `new Date(value)`, and display with `Intl.DateTimeFormat` in the current locale ("Dates and numbers" in [`i18n.md`](i18n.md#dates-and-numbers)).

- When a component you need is not in `client/components/ui/`, add it as [section 1 of `shadcn.md`](shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest) describes; do not write it by hand.

## Validation timing, array fields, dependent fields and resetting

### Validation timing

`useForm`'s `mode` decides when fields are validated before the first submission:

| `mode`        | When it validates                                                                       |
| ------------- | --------------------------------------------------------------------------------------- |
| `'onTouched'` | When a field first loses focus, then on every change                                    |
| `'onBlur'`    | Every time a field loses focus                                                          |
| `'onChange'`  | On every change; an error can appear at the first character typed, so it is rarely used |
| `'onSubmit'`  | Only on submit (the default, guideline T3.3)                                            |
| `'all'`       | Both on blur and on change                                                              |

- Submitting always validates every field. After the first submission, a field is revalidated on every change (`reValidateMode` defaults to `'onChange'`), so the error disappears as soon as the value is corrected.
- Leave `mode` out of `useForm`: the default `'onSubmit'` is what guideline T3.3 asks for. `'onTouched'`, `'onBlur'` and `'all'` validate a field as it loses focus, and closing a dialog takes the focus off its field, so an error flashes while the dialog closes; `'onChange'` shows an error before the user has finished typing.

### Array fields

`client/pages/settings/projects/members-card.tsx` ([`example/members-card.md`](example/members-card.md)) is a card on the settings page that edits the list of project member emails, with adding and removing, and saves on its own (guidelines T4.1 and T4.2). The caller does the saving (calls the endpoint) and throws an error on failure. What it does:

- `useFieldArray({ control: form.control, name: 'members' })` returns `fields`, `append`, `remove` and other methods. It only manages **arrays of objects**: wrap a string array as `{ email }` items and convert back on submit.
- When mapping over `fields`, use `item.id` as the `key`, not `index`; otherwise, after an item in the middle is removed, the contents and errors of the inputs after it shift out of place.
- Each item has its own `Controller`, with `name` written as `` `members.${index}.email` ``; each item's error is in its own `fieldState`.
- The inputs have no visible label, so `aria-label` says which item each one is ("Member 1 email").
- `append({ email: '' })` adds an item and by default moves focus to the new input; disable the "Add" button at the limit, which the card's description states, so it needs no tooltip (guideline I7). `remove(index)` removes an item; when only one item is left, the remove button is not shown. The remove button is an icon button, so it needs an `aria-label` and a tooltip (guideline A1).
- Rules on the whole array (count, no duplicates) go on `z.array(...)`; the error is in `form.formState.errors.members?.root` and is shown below the list.

### Dependent fields and steps

- **A field that depends on another**: read the other value with `useWatch({ control: form.control, name })`, which re-renders the component when it changes, and render the dependent field only while it applies. Put the condition in the schema too, as a `refine` on the whole object with `path` naming the dependent field, so the rule and its error sit on the field the user sees. A hidden field keeps its value in the form; drop it on submit when it does not apply.
- **Steps** (a form in a separate page, guideline T3.1): keep one `useForm` for every step, so Back loses nothing; render only the current step's fields, and before moving on validate just those with `await form.trigger(['name', 'owner'])`, which focuses the first invalid field. Submit once, from the last step.

A reminder email that is required only while reminders are on:

```tsx
// client/pages/projects/project-reminder-form.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Checkbox } from '#components/ui/checkbox';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import { Input } from '#components/ui/input';

export interface ProjectReminderFormProps {
  readonly formId: string;
  readonly onSubmit: (values: {
    readonly reminderEmail: string | null;
  }) => void;
}

export function ProjectReminderForm({
  formId,
  onSubmit,
}: ProjectReminderFormProps): ReactElement {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z
        .object({ remind: z.boolean(), email: z.string().trim() })
        // Required only while reminders are on; the error shows on the email field.
        .refine(
          (values) =>
            !values.remind || z.email().safeParse(values.email).success,
          { error: t('projects.reminder.emailInvalid'), path: ['email'] },
        ),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { remind: false, email: '' },
  });
  const remind = useWatch({ control: form.control, name: 'remind' });

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) =>
        void form.handleSubmit((values) => {
          // The hidden email keeps its value; send it only when it applies.
          onSubmit({ reminderEmail: values.remind ? values.email : null });
        })(event)
      }
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name='remind'
          render={({ field }) => (
            <Field orientation='horizontal'>
              <Checkbox
                ref={field.ref}
                id={`${formId}-remind`}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
                onBlur={field.onBlur}
              />
              <FieldLabel htmlFor={`${formId}-remind`}>
                {t('projects.reminder.remind')}
              </FieldLabel>
            </Field>
          )}
        />
        {remind ? (
          <Controller
            control={form.control}
            name='email'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-email`}>
                  {t('projects.reminder.email')}
                </FieldLabel>
                <Input
                  {...field}
                  id={`${formId}-email`}
                  type='email'
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ) : null}
      </FieldGroup>
    </form>
  );
}
```

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
| Optional number            | `z.string().trim().refine((v) => v === '' \|\| Number.isFinite(Number(v)), t('...'))`, default `''`, `Number(v)` on submit                  |
| Boolean (Checkbox, Switch) | `z.boolean()`                                                                                                                               |
| Must be checked            | `z.boolean().refine((value) => value, t('...'))`; do not use `z.literal(true)` (a `false` default is a type error)                          |
| Multi-select, at least one | `z.array(z.enum(OPTIONS)).min(1, t('...'))`                                                                                                 |
| Array of objects           | `z.array(z.object({ email: z.email(t('...')) })).max(10, t('...', { max: 10 }))`                                                            |
| Rule on the whole array    | `z.array(...).refine((list) => ..., t('...'))`; the error is in `errors.<field>.root`                                                       |
| Comparing two fields       | `z.object({ ... }).refine((v) => v.password === v.confirm, { error: t('...'), path: ['confirm'] })`; the error shows on the `confirm` field |

- Pass the message directly as the argument (a string), or put it in `error` in the params object.
- Do not use v3 patterns: `required_error` and `invalid_type_error` have been removed; `z.string().email()` is deprecated in favor of `z.email()`; `message` in the params object is deprecated in favor of `error`.
- Do not use `z.coerce.number()` for a number input: the empty string is coerced to `0`, and the required check stops working. Use the string pattern in "Numbers".

## Where forms go

- Create and edit forms with **no more than 8 fields and no complex interdependencies**: put them in a `RouteDialog` as a child route (guidelines T3.1 and I1); see "Inside a RouteDialog" and [`overlay.md`](overlay.md). Do not drive create or edit dialogs with open state held inside a component.
- **More fields, or grouping or steps needed**: a separate page (guideline T3.1). `create.tsx`, [`example/create-page.md`](example/create-page.md), is the frame to follow:
  - a covering child page (`RouteChildPage`, [section 5 of `child-routes.md`](child-routes.md#5-covering-child-pages-routechildpage)) when the user opens it from a page and returns there, a list or a dashboard; otherwise a standalone page ([`page.md`](page.md)) on a top-level route. A form page declared as a child route and returned without `RouteChildPage` renders below the parent's content;
  - a form page opened from several pages — "New article" on a dashboard as well as on the list — is declared under each of them through one function that takes an owner, as ["The same detail page over another page"](child-routes.md#the-same-detail-page-over-another-page) does for a record's page, and create and edit share the component, which returns `RouteChildPage` under every one of them;
  - `PageContainer` and `PageHeader`, the form in a `max-w-2xl` column (guideline L4), fields grouped with `FieldSet`;
  - the buttons right-aligned below the form, linked with `form={formId}` when the form component renders none;
  - on success, refresh the list underneath through the outlet context's `reload()` (guideline R2; a covering page keeps the list mounted with its old rows), then `navigate(…, { replace: true })` back to the list or on to the record; Cancel navigates back with `replace` too, as closing an overlay does;
  - unsaved changes (T3.9): the application's router is a declarative `BrowserRouter`, so React Router's `useBlocker` is not available; the page keeps a `beforeunload` listener while the form reports `onDirtyChange(true)`, and records under "Guideline trade-offs" that in-app navigation is not guarded. When that guard matters, keep the form in a `RouteDialog`, whose `beforeClose` covers it ([section 2.5 of `overlay.md`](overlay.md#25-beforeclose-checks-before-closing)).
- **Settings page**: each Card is an independent form, with its buttons at the bottom right of the Card (guidelines T4.1 and T4.2); see the members card.
