# Forms and validation

How to build a create or edit form with the template's components. The visual and interaction rules are T3 (forms) and T4 (settings) in [`../ui-guidelines.md`](../ui-guidelines.md); the dialog around the form, closing and the discard question are in [`overlay.md`](overlay.md); refreshing other views after a save is [`data-changes.md`](data-changes.md). The runnable reference is `client/pages/skill-projects/edit.tsx` of the [executable list and edit example](executable-list-edit.md).

Stack: react-hook-form, zod 4 with `@hookform/resolvers/zod`, `FeedbackForm` from `#components/feedback-form`, the `Field` family from `#components/ui/field` and controls from `#components/ui/`. The templates ship `input`, `label` and `select`; add the rest first (`yes n | pnpm exec shadcn add field textarea checkbox`, then format the created files, [`shadcn.md`](shadcn.md)). Do not add shadcn's old `form` component (`FormField`, `FormItem`).

## Where forms go

- Create and edit forms always open in a `RouteDialog` child route: create at `new`, edit at `:id/edit` (T3.1, I6). A long form scrolls inside the dialog, which already fits a phone; a form with steps keeps its steps inside the dialog. No create or edit forms in drawers, covering pages or component-state dialogs. Route declaration is in [`page.md`](page.md) and [`child-routes.md`](child-routes.md).
- A settings page is the exception: each `Card` is its own form with its save button at its bottom right (T4.1, T4.2). A toggle that applies at once is not a form (T4.3, [Checkbox and Switch](#checkbox-and-switch)).
- One form component serves create and edit. It owns fields, validation and submission; the title, footer buttons and closing belong to the dialog. Keep it in the feature folder (`client/pages/<feature>/<feature>-form.tsx`).

## Shared submission lock and retry identity

Every submit path goes through one `useSubmission({ scope })` controller from `@nocobase/app-client`, started before asynchronous validation, and sends its key as `Idempotency-Key` (or the Repository `idempotencyKey`). `submission.submitting` drives the buttons and the close lock; `submission.pending` (unknown outcome, same key kept for retry) never locks anything. The protocol is [submission protection](../../submission.md).

## Shared failure feedback

`FeedbackForm` replaces the native `<form>`. It keeps the caller's input, shows field errors beside their fields and one safe form-level message for anything unmapped, and focuses the first error in layout order.

- `values={form.getValues}` and `savedValues` (the stored record, or blank create values) drive the overlay's discard question ([overlay §2.5](overlay.md#25-beforeclose-checks-before-closing)).
- `validationErrors={form.formState.errors}` (with `useForm({ shouldFocusError: false })`) and `submitting={submission.submitting}`.
- `error` takes the caught request error and `errorContent` trusted translated copy or actions for it; never raw server text, `Error.message` or stacks.
- `fieldMessage` maps known `reason`/`domain` violations to field copy; `feedback` takes a `FormFeedback` controller.

Native controls carry the submitted `name`; custom triggers carry `data-field-path`. For editors that are not always mounted, create one `new FormFeedback({ messages })` per form and `register` descriptors (`id`, `path()`, `value()`, `anchor()`, `control()`, `label()`, `accessible()`, `editable()`, `reveal()`) from the always-mounted layout owner, using a stable row key, never the array index. Never register a permission-hidden field as accessible. Existing applications adopt this through the [form feedback upgrade](../../../../nocobase-app-upgrade/references/form-feedback-upgrade.md).

## Inside a RouteDialog

The shape, following `skill-projects/edit.tsx`:

```tsx
const formId = useId();
const submission = useSubmission({
  scope: `${userId}:projects:${project?.id ?? 'new'}`,
});
const [saved] = useState(() => toFormValues(project)); // stored values, or blank for create
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: saved,
  shouldFocusError: false,
});

<RouteDialog
  title={t(project ? 'projects.edit.title' : 'projects.create.title')}
  className='sm:max-w-md'
  beforeClose={() => !submission.submitting}
  footer={
    <>
      <CancelButton disabled={submission.submitting} />
      <Button type='submit' form={formId} disabled={submission.submitting}>
        {t(project ? 'actions.save' : 'actions.create')}
      </Button>
    </>
  }
>
  <FeedbackForm
    id={formId}
    noValidate
    values={form.getValues}
    savedValues={saved}
    validationErrors={form.formState.errors}
    submitting={submission.submitting}
    error={error}
    onSubmit={async (event) => {
      event.preventDefault();
      await submit(); // validate, request, announce, toast, navigate — all inside onSubmit
    }}
  >
    <FieldGroup>{/* fields */}</FieldGroup>
  </FeedbackForm>
</RouteDialog>;
```

1. The submit button sits in the dialog's `footer`, outside the form, so it is `type='submit' form={formId}`; Enter in a field submits too. Use `useId()` or a per-dialog id so field ids stay unique when dialogs stack.
2. `CancelButton` is a small component inside the dialog that calls `useRouteOverlay().close()` ([overlay §2.4](overlay.md#24-close-with-userouteoverlay)).
3. While submitting, both buttons are disabled, the save button shows progress (`PendingButton` or a `Spinner`) and `beforeClose` blocks closing (T3.5).
4. On success: `announceDataChange` with the response ([`data-changes.md`](data-changes.md)), a success toast naming the record (T3.7, C6), then navigate to `..` with `location.search`, still inside `onSubmit`, so leaving does not ask.
5. Edit renders the form only after the latest record loads (T3.8, R1); while loading or on a load error the dialog shows a skeleton or the error with Cancel.

## Schema and useForm

- Build the schema inside the component, `useMemo(() => z.object({ … }), [t])`, so messages are translated and follow the language. No hard-coded text.
- Do not pass generics to `useForm`; types come from the resolver and `defaultValues`. When `default()`, `transform()` or `coerce` make input and output differ, write `useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>`.
- Keep literal types in defaults with `satisfies` (`['email'] satisfies NotifyChannel[]`). A "must be checked" box is `z.boolean().refine((v) => v, t('…'))`, not `z.literal(true)`.
- Leave `mode` at its default `'onSubmit'` (T3.3); after the first submit fields revalidate on change.
- Optional text: `z.string().trim()`, default `''` (never `undefined`/`null`, which flips controlled inputs), and `value || null` on submit.

## Field structure

- `Controller` wraps each field; `Field` gets `data-invalid={fieldState.invalid}` and the control `aria-invalid={fieldState.invalid}`.
- `FieldLabel htmlFor` matches the control's `id` (`${formId}-name`). Required fields get `<span aria-hidden='true' className='text-destructive'>*</span>` after the label and `aria-required='true'` (T3.2); optional fields get no mark.
- Help text is `FieldDescription` below the control; `<FieldError errors={[fieldState.error]} />` renders nothing without an error.
- `field.ref` reaches a focusable element: spreading `{...field}` does it for `Input`/`Textarea`; `SelectTrigger`, `Checkbox` and `Switch` take `ref={field.ref}`.
- Labels go above inputs on every page; only Checkbox, Switch and radio options use `orientation='horizontal'`. Group with `FieldGroup`, `FieldSet` + `FieldLegend variant='label'`, `FieldSeparator`; see `pnpm exec shadcn docs field`.

## Field types

- `Input`, `Textarea`: `z.string()…`, default `''`, spread `{...field}`; `InputGroup` for prefixes and suffixes.
- `Select`: `z.enum(OPTIONS)`; pass `items`, `value`, `onValueChange` (may pass `null`); `ref`, `onBlur`, `id`, `aria-invalid` and `className='w-full'` on `SelectTrigger`.
- `Checkbox`, `Switch`: `z.boolean()`, `false`; `checked`, `onCheckedChange={(checked) => field.onChange(checked)}`, `ref`, `onBlur`.
- Checkbox group: `z.array(z.enum(OPTIONS)).min(1, …)`; `checked={field.value.includes(item)}`, rebuilding the array in option order.
- `RadioGroup`: `z.enum(OPTIONS)` with a default; `value`, `onValueChange`, `onBlur` on the group, `value` and `id` on each item.
- Number, related record, date and files: the sections below.

### Checkbox and Switch

They are Base UI: `checked`/`onCheckedChange`, with the `id` on a hidden input so `FieldLabel` works. A checkbox group puts `data-slot='checkbox-group'` on its `FieldGroup`, its error below the group and `field.ref` on the first option. A Switch that applies at once on a settings page (T4.3) is not in a form: it calls the endpoint in `onCheckedChange`, is disabled while saving, toasts on success and returns to the saved value on failure.

### Numbers

Keep the form value a string (`z.coerce.number()` turns an empty input into `0`). Optional: `z.string().trim().refine((v) => v === '' || Number.isFinite(Number(v)), t('…'))`; required: add `.min(1, t('…'))` first. Default `value == null ? '' : String(value)`; submit `v === '' ? null : Number(v)`. Display with `Intl.NumberFormat`.

### Choosing a related record

A related record stores its id and shows its name, through a picker component built on `Combobox` (see the relation picker in [`executable-relation-batch.md`](executable-relation-batch.md)):

- It loads its options with `useListData` and maps them to `{ value: id, label: name }`; `onValueChange` returns `item?.value ?? ''`, `itemToStringLabel` shows the name, `isItemEqualToValue` compares ids.
- While options load the input is disabled with a loading placeholder; a failed load shows an inline error with Retry (none for 403).
- It loads one page of up to 100 and filters in the browser; a larger collection sends the typed text to the endpoint, debounced about 300 ms, and keeps the selected record in the items. Under about 15 fixed options, a `Select` will do.

### File uploads and attachments

Use the preinstalled block in `client/extensions/nocobase-file-component-ui/` (`FileUploadField`, `FileList`, `FilePreviewField`, `FilePreviewDialog`, `FileThumbnail`), never `<input type='file'>` ([`ui-library.md`](ui-library.md)).

- Get the repository with `useService(clientFileRepositoryManagerToken)` (`@nocobase/app-client`, token from `@nocobase/app-plugin-file/client`) and `useMemo(() => fileManager.repository('<resource>'), [fileManager])`, where the resource exposes `uploadOne`. Register the file plugin in `client/plugins.ts` (and `plugins: [file()]` in tests).
- `<FileUploadField repository={repository} value={files} onChange={setFiles} multiple maxFiles={10} maxSize={10 * 1024 * 1024} accept={['application/pdf', 'image/png']} />`, following the server's limits. Submit the records' ids.
- Uploads finish before the form submits: `onStatusChange={(status) => setUploadBlocked(status !== 'idle')}` and disable save while blocked. An upload or removal is an unsaved change.
- Preview with the server's `contentUrl`, never a raw storage key. The content route is public to whoever holds the URL; protect it with your own route when that matters. Show `onError` errors as the form's own translated message.

### Dates

A date field is the application's `DatePicker` from `client/components/date-picker.tsx`, a `Calendar` in a `Popover` (I10). Never `<input type='date'>` or `<Input type='date'>`, never a hand-written calendar, never another package's private picker.

1. If `client/components/date-picker.tsx` is missing, add the primitives (`yes n | pnpm exec shadcn add calendar popover button`) and copy the [tested composition](../../../assets/date-picker-example/client/components/date-picker.tsx), checking its imports against the installed primitives (`pnpm exec shadcn docs calendar popover`; Base UI uses `render={<Button />}`, Radix `asChild`).
2. Pages render `<DatePicker id value onChange />` (also `disabled`, `clearable`, `placeholder`, `locale`); it takes no `ref` or `aria-invalid`, so `FieldError` carries the error.
3. A calendar date travels as `'yyyy-MM-dd'`: submit `format(date, 'yyyy-MM-dd')`, load with `parseISO(value)` (or `formatDateOnly`/`parseDateOnly` from the reference's [`date-only.ts`](../../../assets/date-picker-example/client/lib/date-only.ts)). Never `new Date('2026-01-02')` or `toISOString()` for a date-only value; both shift the day across time zones.
4. A point in time travels as ISO 8601 with offset (`toISOString()`, `new Date(value)`) and displays with `Intl.DateTimeFormat`. A date and time pairs `DatePicker` with `<Input type='time'>`.
5. Run the component checker ([`../design-contract.md`](../design-contract.md)) and test picking, loading, clearing, keyboard focus and a time zone west and east of UTC.

## Server errors

- A business error tied to a field: `form.setError('name', { message })`; it shows below the field and clears once the value is valid again.
- A 404 on edit means the record is gone: show it through `errorContent`, disable save, keep only Cancel, and announce the scope so other views show it missing (R3).
- Other failures go to `FeedbackForm`'s `error` with trusted copy in `errorContent` ([`api.md`](api.md)); clear the caller's error on the next submit. Never close the dialog or drop input on failure (T3.6).
- An unknown outcome (network, timeout, 5xx) keeps the input and the operation key, shows the "may have been saved" copy and announces the scopes without results; never resubmit automatically.

## Default values are read only on mount

`defaultValues` is read on the first render only. Render an edit form after its record arrives, never empty-then-`reset`. To switch records in place, remount with `key={record.id}`. A dialog unmounts its form on close, so no reset is needed. On a settings card that stays open after saving, `form.reset(savedValues)` makes the saved values the new baseline and pass them as `savedValues`; "Discard changes" is `form.reset()`.

## Array fields

`useFieldArray({ control: form.control, name: 'members' })` manages arrays of objects only (wrap strings as `{ email }`). Use `item.id` as the key, never the index. Each item has its own `Controller` named `` `members.${index}.email` `` and an `aria-label` naming its position. "Add" (`append`) is disabled at the stated limit; the icon remove button has an `aria-label` and tooltip (A1) and is hidden for the last item. Rules on the whole array go on `z.array(…)` and show from `errors.members?.root`.

## Dependent fields and steps

- Read another field with `useWatch({ control: form.control, name })` and render the dependent field only while it applies. Put the rule in the schema as an object `refine` with `path: ['dependent']`, and drop the hidden value on submit.
- Steps inside the dialog keep one `useForm`; render only the current step and validate it with `await form.trigger(['name', 'owner'])` before moving on; submit once from the last step.

## Common zod 4 patterns

- Required text: `z.string().trim().min(1, t('…'))`, plus `.max(100, t('…', { max: 100 }))`.
- Email: `z.email(t('…'))`; optional: `z.email(t('…')).or(z.literal(''))`.
- Enum: `z.enum(STATUSES)` with `STATUSES` declared `as const`.
- Two fields: `.refine((v) => v.password === v.confirm, { error: t('…'), path: ['confirm'] })`.
- A rule on an array: `z.array(…).refine((list) => …, t('…'))`, shown from `errors.<field>.root`.

Zod 4 removed `required_error` and `invalid_type_error`; use `z.email()` instead of `z.string().email()` and `error` instead of `message`.
