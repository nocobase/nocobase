/**
 * A project's Settings tab, presented: its working directories in order (the first is the primary one), each leading
 * to its settings page — a git repository or a directory on a runner — and its members with the project's
 * visibility, its lead chosen among them. Purely presentational: the consumer gives the data and the options, validates the form in its own words,
 * and performs every change through the callbacks (a promise the block waits for).
 */
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CrownIcon,
  FolderGit2Icon,
  FolderIcon,
  GitBranchIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Link, type To } from 'react-router';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#components/ui/empty';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Separator } from '#components/ui/separator';
import { Textarea } from '#components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '#components/ui/toggle-group';

import {
  PersonValue,
  PropertyRow,
  PropertySelect,
} from '../../components/property-fields.js';
import {
  defaultProjectDetailLabels,
  fill,
  type ProjectDetailLabels,
} from './labels.js';
import { ProjectSection } from './project-detail.js';

export type ResourceType = 'gitRepo' | 'directory';

/** A working directory as the list shows it. */
export interface ResourceItem {
  readonly id: string;
  readonly type: ResourceType;
  readonly name: string;
  /** Such as the URL and branch, or the path and runner. */
  readonly detail: string;
}

/**
 * The working directories in order, the first marked primary. Each name links to its settings page (`hrefOf`); with
 * `onAdd` and the other callbacks, its "…" menu opens its settings, moves it and removes it after a confirmation, and
 * `busy` disables them while a change runs. Without any, the list says so, with Add in the empty state.
 */
export function ProjectResourceList({
  resources,
  busy = false,
  hrefOf,
  onAdd,
  onMove,
  onRemove,
  labels = defaultProjectDetailLabels,
}: {
  readonly resources: readonly ResourceItem[];
  readonly busy?: boolean;
  /** Where a working directory's settings page is. */
  readonly hrefOf?: (id: string) => To;
  readonly onAdd?: () => void;
  /** Moves the one at `from` to `to`, both list positions. */
  readonly onMove?: (from: number, to: number) => void;
  readonly onRemove?: (id: string) => void;
  readonly labels?: ProjectDetailLabels;
}): ReactElement {
  const words = labels.resources;
  const [removing, setRemoving] = useState<ResourceItem | null>(null);
  const empty = resources.length === 0;
  return (
    <ProjectSection
      title={words.title}
      description={words.description}
      actions={
        onAdd && !empty ? (
          <Button variant='ghost' size='xs' onClick={onAdd}>
            <PlusIcon data-icon='inline-start' />
            {words.add}
          </Button>
        ) : null
      }
    >
      {empty ? (
        <Empty className='min-h-40 border border-dashed p-6 md:p-6'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <FolderGit2Icon />
            </EmptyMedia>
            <EmptyTitle>{words.empty}</EmptyTitle>
            <EmptyDescription>{words.emptyDescription}</EmptyDescription>
          </EmptyHeader>
          {onAdd ? (
            <EmptyContent>
              <Button size='sm' onClick={onAdd}>
                <PlusIcon data-icon='inline-start' />
                {words.add}
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <ul className='divide-y'>
          {resources.map((resource, index) => {
            const Icon =
              resource.type === 'directory' ? FolderIcon : GitBranchIcon;
            const href = hrefOf?.(resource.id);
            return (
              <li
                key={resource.id}
                data-resource={resource.id}
                className='flex items-start gap-2 py-2 text-sm first:pt-0 last:pb-0'
              >
                <Icon
                  className='mt-0.5 size-4 shrink-0 text-muted-foreground'
                  aria-label={
                    resource.type === 'directory'
                      ? words.directory
                      : words.gitRepo
                  }
                />
                <div className='min-w-0 flex-1'>
                  <p className='flex min-w-0 items-center gap-1.5'>
                    {href ? (
                      <Link
                        to={href}
                        className='truncate font-medium underline-offset-4 hover:underline'
                      >
                        {resource.name}
                      </Link>
                    ) : (
                      <span className='truncate font-medium'>
                        {resource.name}
                      </span>
                    )}
                    {index === 0 ? (
                      <Badge variant='secondary'>{words.primary}</Badge>
                    ) : null}
                  </p>
                  {resource.detail ? (
                    <p className='truncate text-xs text-muted-foreground'>
                      {resource.detail}
                    </p>
                  ) : null}
                </div>
                {onMove || onRemove ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          disabled={busy}
                          aria-label={fill(words.actions, {
                            name: resource.name,
                          })}
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align='end'
                      className='w-auto min-w-40'
                    >
                      <DropdownMenuGroup>
                        {href ? (
                          <DropdownMenuItem render={<Link to={href} />}>
                            <SettingsIcon />
                            {words.settings}
                          </DropdownMenuItem>
                        ) : null}
                        {onMove ? (
                          <>
                            <DropdownMenuItem
                              disabled={index === 0}
                              onClick={() => onMove(index, index - 1)}
                            >
                              <ArrowUpIcon />
                              {words.moveUp}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={index === resources.length - 1}
                              onClick={() => onMove(index, index + 1)}
                            >
                              <ArrowDownIcon />
                              {words.moveDown}
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuGroup>
                      {onRemove ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant='destructive'
                            onClick={() => setRemoving(resource)}
                          >
                            <Trash2Icon />
                            {words.remove}
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {fill(words.removeTitle, { name: removing?.name ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {words.removeDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{words.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                if (removing) onRemove?.(removing.id);
                setRemoving(null);
              }}
            >
              {words.remove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProjectSection>
  );
}

/** A repository's binding to the host it was picked from; opaque to the form, which only carries it. */
export interface ResourceBindingValue {
  readonly provider: string;
  readonly connectionId: string;
  readonly repoId: string;
  readonly fullName: string;
}

/** What the resource form holds, each as typed. */
export interface ResourceFormValues {
  readonly type: ResourceType;
  readonly url: string;
  readonly defaultRef: string;
  /** Set when the repository was picked by `repositoryField`; left out otherwise. */
  readonly binding?: ResourceBindingValue | null;
  readonly runnerId: string;
  readonly path: string;
  readonly label: string;
  readonly initPrompt: string;
}

export type ResourceFormErrors = Partial<
  Record<'url' | 'runnerId' | 'path' | 'initPrompt', string>
>;

export interface RunnerChoice {
  readonly value: string;
  readonly label: string;
  /** Such as the machine's host name and whether it is online. */
  readonly description?: string;
}

const FORM_ID = 'project-resource-form';

function valuesOf(
  resource: Partial<ResourceFormValues> | null,
): ResourceFormValues {
  return {
    type: resource?.type ?? 'gitRepo',
    url: resource?.url ?? '',
    defaultRef: resource?.defaultRef ?? '',
    runnerId: resource?.runnerId ?? '',
    path: resource?.path ?? '',
    label: resource?.label ?? '',
    initPrompt: resource?.initPrompt ?? '',
    ...(resource?.binding !== undefined ? { binding: resource.binding } : {}),
  };
}

/** What `repositoryField` is given: the form's values and how to change them. */
export interface RepositoryFieldProps {
  readonly values: ResourceFormValues;
  readonly change: (patch: Partial<ResourceFormValues>) => void;
  readonly error?: string;
}

/**
 * Adds a working directory (`resource` is `'new'`) or edits one: a git repository (its URL and default branch) or a
 * directory on a runner (the runner, an absolute path and its display name; a repository is named after itself), and
 * its initialization prompt, then `children` (the consumer's own sections, such as the directory's variables) between
 * the fields and the buttons. `validate`
 * answers the errors in the consumer's words; `repositoryField`, when given, replaces the URL and default branch of a
 * new repository with the consumer's own picker, which fills them (and a binding) through `change`; `onSubmit` saves, and its rejection's message shows above the fields.
 * Closing while saving does nothing; otherwise Escape, the backdrop and Cancel call `onRequestClose`, which may ask
 * before closing, and a successful save calls `onSaved`. `onDirtyChange` reports whether the fields differ from what
 * they started with; `wrap` places the dialog's content inside a consumer's boundary, such as an unsaved-changes guard.
 */
export function ResourceDialog({
  resource,
  runners,
  validate,
  onSubmit,
  onSaved,
  onRequestClose,
  onDirtyChange,
  wrap,
  children,
  repositoryField,
  labels = defaultProjectDetailLabels,
}: {
  /** The one to edit, with its id, or `'new'`; the dialog is closed while null. */
  readonly resource:
    | (Partial<ResourceFormValues> & {
        readonly id: string;
        readonly type: ResourceType;
      })
    | 'new'
    | null;
  /** The runners a directory may be on; a text field for the runner's id without it. */
  readonly runners?: {
    readonly options: readonly RunnerChoice[];
    readonly loading: boolean;
  };
  readonly validate: (values: ResourceFormValues) => ResourceFormErrors;
  readonly onSubmit: (values: ResourceFormValues) => Promise<void>;
  readonly onSaved: () => void;
  readonly onRequestClose: () => void;
  readonly onDirtyChange?: (dirty: boolean) => void;
  readonly wrap?: (content: ReactNode) => ReactNode;
  readonly children?: ReactNode;
  readonly repositoryField?: (props: RepositoryFieldProps) => ReactNode;
  readonly labels?: ProjectDetailLabels;
}): ReactElement {
  const words = labels.resourceForm;
  const [saving, setSaving] = useState(false);
  const existing = resource !== null && resource !== 'new' ? resource : null;
  const content = resource ? (
    <ResourceForm
      // A new form for each resource opened, starting from its values.
      key={existing?.id ?? 'new'}
      initial={existing}
      runners={runners}
      validate={validate}
      onSubmit={onSubmit}
      onSaved={onSaved}
      onCancel={onRequestClose}
      onSavingChange={setSaving}
      onDirtyChange={onDirtyChange}
      {...(repositoryField && !existing ? { repositoryField } : {})}
      labels={labels}
    >
      {children}
    </ResourceForm>
  ) : null;
  return (
    <Dialog
      open={resource !== null}
      onOpenChange={(open) => {
        if (!open && !saving) onRequestClose();
      }}
    >
      <DialogContent
        className={
          children
            ? 'flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-lg'
            : 'flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md'
        }
      >
        <DialogHeader>
          <DialogTitle>
            {resource === 'new'
              ? words.newTitle
              : resource?.type === 'directory'
                ? words.editDirectoryTitle
                : words.editTitle}
          </DialogTitle>
          {resource === 'new' ? (
            <DialogDescription>{words.newDescription}</DialogDescription>
          ) : null}
        </DialogHeader>
        {content && wrap ? wrap(content) : content}
      </DialogContent>
    </Dialog>
  );
}

function ResourceForm({
  initial,
  runners,
  validate,
  onSubmit,
  onSaved,
  onCancel,
  onSavingChange,
  onDirtyChange,
  children,
  repositoryField,
  labels,
}: {
  readonly initial: Partial<ResourceFormValues> | null;
  readonly runners:
    | { readonly options: readonly RunnerChoice[]; readonly loading: boolean }
    | undefined;
  readonly validate: (values: ResourceFormValues) => ResourceFormErrors;
  readonly onSubmit: (values: ResourceFormValues) => Promise<void>;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
  readonly onSavingChange: (saving: boolean) => void;
  readonly onDirtyChange: ((dirty: boolean) => void) | undefined;
  readonly children?: ReactNode;
  readonly repositoryField?: (props: RepositoryFieldProps) => ReactNode;
  readonly labels: ProjectDetailLabels;
}): ReactElement {
  const words = labels.resourceForm;
  const [start] = useState(() => valuesOf(initial));
  const [values, setValues] = useState(start);
  const [errors, setErrors] = useState<ResourceFormErrors>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const set = (key: keyof ResourceFormValues, value: string): void =>
    setValues((current) => ({ ...current, [key]: value }));
  const dirty = (
    ['url', 'defaultRef', 'runnerId', 'path', 'label', 'initPrompt'] as const
  ).some((key) =>
    initial ? values[key] !== start[key] : values[key].trim() !== '',
  );
  const reportRef = useRef(onDirtyChange);
  useLayoutEffect(() => {
    reportRef.current = onDirtyChange;
  });
  useLayoutEffect(() => {
    reportRef.current?.(dirty);
  }, [dirty]);
  useLayoutEffect(() => () => reportRef.current?.(false), []);
  const changeSaving = (next: boolean): void => {
    setSaving(next);
    onSavingChange(next);
  };

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setFormError(undefined);
    changeSaving(true);
    try {
      await onSubmit(values);
      changeSaving(false);
      onSaved();
    } catch (error) {
      changeSaving(false);
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : words.requestFailed,
      );
    }
  }

  const runnerItems = runners
    ? [
        ...runners.options,
        ...(values.runnerId &&
        !runners.options.some((option) => option.value === values.runnerId)
          ? [{ value: values.runnerId, label: values.runnerId }]
          : []),
      ]
    : [];

  return (
    <>
      <div className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4 py-1'>
        <form id={FORM_ID} onSubmit={(event) => void submit(event)} noValidate>
          <FieldGroup>
            {formError ? (
              <p
                role='alert'
                className='rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'
              >
                {formError}
              </p>
            ) : null}
            {initial ? null : (
              <Field>
                <FieldLabel id='project-resource-type-label'>
                  {words.type}
                </FieldLabel>
                <ToggleGroup
                  variant='outline'
                  spacing={0}
                  value={[values.type]}
                  aria-labelledby='project-resource-type-label'
                  onValueChange={(next: string[]) => {
                    const [type] = next;
                    if (type === 'gitRepo' || type === 'directory') {
                      setValues((current) => ({ ...current, type }));
                      setErrors({});
                    }
                  }}
                >
                  <ToggleGroupItem value='gitRepo'>
                    <GitBranchIcon data-icon='inline-start' />
                    {labels.resources.gitRepo}
                  </ToggleGroupItem>
                  <ToggleGroupItem value='directory'>
                    <FolderIcon data-icon='inline-start' />
                    {labels.resources.directory}
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>
            )}
            {values.type === 'gitRepo' && repositoryField ? (
              <Field data-invalid={errors.url ? true : undefined}>
                <FieldLabel>{words.url}</FieldLabel>
                {repositoryField({
                  values,
                  change: (patch) =>
                    setValues((current) => ({ ...current, ...patch })),
                  ...(errors.url ? { error: errors.url } : {}),
                })}
                {errors.url ? <FieldError>{errors.url}</FieldError> : null}
              </Field>
            ) : values.type === 'gitRepo' ? (
              <>
                <Field data-invalid={errors.url ? true : undefined}>
                  <FieldLabel htmlFor='project-resource-url'>
                    {words.url}
                  </FieldLabel>
                  <Input
                    id='project-resource-url'
                    value={values.url}
                    autoFocus
                    placeholder='https://github.com/owner/repo.git'
                    aria-invalid={errors.url ? true : undefined}
                    onChange={(event) => set('url', event.target.value)}
                  />
                  {errors.url ? (
                    <FieldError>{errors.url}</FieldError>
                  ) : (
                    <FieldDescription>{words.urlHint}</FieldDescription>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor='project-resource-ref'>
                    {words.defaultRef}
                  </FieldLabel>
                  <Input
                    id='project-resource-ref'
                    value={values.defaultRef}
                    placeholder='main'
                    onChange={(event) => set('defaultRef', event.target.value)}
                  />
                  <FieldDescription>{words.defaultRefHint}</FieldDescription>
                </Field>
              </>
            ) : (
              <>
                <Field data-invalid={errors.runnerId ? true : undefined}>
                  <FieldLabel htmlFor='project-resource-runner'>
                    {words.runner}
                  </FieldLabel>
                  {runners ? (
                    <Select
                      items={runnerItems}
                      value={values.runnerId || null}
                      onValueChange={(next: string | null) => {
                        if (next) set('runnerId', next);
                      }}
                    >
                      <SelectTrigger
                        id='project-resource-runner'
                        className='w-full'
                        aria-invalid={errors.runnerId ? true : undefined}
                      >
                        <SelectValue
                          placeholder={
                            runners.loading
                              ? words.loading
                              : runners.options.length === 0
                                ? words.noRunners
                                : words.runnerPlaceholder
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                        {runnerItems.map((item) => {
                          const description = runners.options.find(
                            (option) => option.value === item.value,
                          )?.description;
                          return (
                            <SelectItem key={item.value} value={item.value}>
                              <span className='flex min-w-0 flex-col'>
                                <span>{item.label}</span>
                                {description ? (
                                  <span className='text-xs text-muted-foreground'>
                                    {description}
                                  </span>
                                ) : null}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id='project-resource-runner'
                      value={values.runnerId}
                      placeholder={words.runnerIdPlaceholder}
                      aria-invalid={errors.runnerId ? true : undefined}
                      onChange={(event) => set('runnerId', event.target.value)}
                    />
                  )}
                  {errors.runnerId ? (
                    <FieldError>{errors.runnerId}</FieldError>
                  ) : (
                    <FieldDescription>{words.runnerHint}</FieldDescription>
                  )}
                </Field>
                <Field data-invalid={errors.path ? true : undefined}>
                  <FieldLabel htmlFor='project-resource-path'>
                    {words.path}
                  </FieldLabel>
                  <Input
                    id='project-resource-path'
                    value={values.path}
                    placeholder='/Users/me/work/app'
                    className='font-mono'
                    aria-invalid={errors.path ? true : undefined}
                    onChange={(event) => set('path', event.target.value)}
                  />
                  {errors.path ? (
                    <FieldError>{errors.path}</FieldError>
                  ) : (
                    <FieldDescription>{words.pathHint}</FieldDescription>
                  )}
                </Field>
              </>
            )}
            {values.type === 'directory' ? (
              <Field>
                <FieldLabel htmlFor='project-resource-label'>
                  {words.label}
                </FieldLabel>
                <Input
                  id='project-resource-label'
                  value={values.label}
                  onChange={(event) => set('label', event.target.value)}
                />
              </Field>
            ) : null}
            <Field data-invalid={errors.initPrompt ? true : undefined}>
              <FieldLabel htmlFor='project-resource-init'>
                {words.initPrompt}
              </FieldLabel>
              <Textarea
                id='project-resource-init'
                rows={3}
                value={values.initPrompt}
                placeholder={words.initPromptPlaceholder}
                aria-invalid={errors.initPrompt ? true : undefined}
                onChange={(event) => set('initPrompt', event.target.value)}
              />
              {errors.initPrompt ? (
                <FieldError>{errors.initPrompt}</FieldError>
              ) : (
                <FieldDescription>{words.initPromptHint}</FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </form>
        {children ? (
          <div className='mt-6 space-y-6'>
            <Separator />
            {children}
          </div>
        ) : null}
      </div>
      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          disabled={saving}
          onClick={onCancel}
        >
          {words.cancel}
        </Button>
        <Button type='submit' form={FORM_ID} disabled={saving}>
          {saving ? (
            <Loader2Icon data-icon='inline-start' className='animate-spin' />
          ) : null}
          {initial
            ? saving
              ? words.saving
              : words.save
            : saving
              ? words.adding
              : words.add}
        </Button>
      </DialogFooter>
    </>
  );
}

export type ProjectVisibility = 'everyone' | 'members';

export interface MemberItem {
  readonly id: string;
  readonly name: string;
  /** Their picture; without one the row shows the name alone. */
  readonly avatar?: string | null;
  readonly lead?: boolean;
}

/**
 * The project's visibility and members. With the callbacks, the visibility can be changed, a member made the lead
 * (`onSetLead`) or removed after a confirmation (`onRemove`, not offered for the lead, who stays a member until
 * another lead is chosen), both from the row's menu, and someone searched for among `candidates` added at once
 * (`onAdd`); people already members are never offered. `busy` disables them while a change runs.
 */
export function ProjectMembersEditor({
  visibility,
  members,
  candidates,
  busy = false,
  onVisibilityChange,
  onAdd,
  onSetLead,
  onRemove,
  labels = defaultProjectDetailLabels,
}: {
  readonly visibility: ProjectVisibility;
  readonly members: readonly MemberItem[];
  /** Whom "Add" offers: people not yet members. */
  readonly candidates: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  readonly busy?: boolean;
  readonly onVisibilityChange?: (visibility: ProjectVisibility) => void;
  readonly onAdd?: (userId: string) => Promise<void>;
  readonly onSetLead?: (userId: string) => Promise<void>;
  readonly onRemove?: (userId: string) => Promise<void>;
  readonly labels?: ProjectDetailLabels;
}): ReactElement {
  const words = labels.members;
  const [removing, setRemoving] = useState<MemberItem | null>(null);
  const [pending, setPending] = useState(false);
  const memberIds = new Set(members.map((member) => member.id));
  const offered = candidates.filter(
    (candidate) => !memberIds.has(candidate.value),
  );
  return (
    <ProjectSection title={`${words.title} · ${members.length}`}>
      <PropertyRow label={words.visibility} htmlFor='project-visibility'>
        <PropertySelect
          id='project-visibility'
          options={[
            { value: 'everyone', label: words.everyone },
            { value: 'members', label: words.membersOnly },
          ]}
          value={visibility}
          disabled={!onVisibilityChange || busy}
          onChange={(value) =>
            onVisibilityChange?.(value === 'members' ? 'members' : 'everyone')
          }
        />
      </PropertyRow>
      <p className='text-xs text-muted-foreground'>
        {visibility === 'members' ? words.membersOnlyHint : words.everyoneHint}
      </p>
      {members.length === 0 && !(onAdd && offered.length > 0) ? (
        <p className='text-sm text-muted-foreground'>{words.empty}</p>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {members.map((member) => {
            const canLead = onSetLead && !member.lead;
            const canRemove = onRemove && !member.lead;
            return (
              <li
                key={member.id}
                className='flex min-h-11 items-center gap-2 px-3 py-2 text-sm'
              >
                <span className='min-w-0 flex-1'>
                  <PersonValue name={member.name} avatar={member.avatar} />
                </span>
                {member.lead ? (
                  <span className='inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground'>
                    <CrownIcon className='size-3' aria-hidden='true' />
                    {words.lead}
                  </span>
                ) : null}
                {canLead || canRemove ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant='ghost'
                          size='icon-xs'
                          disabled={busy}
                          aria-label={fill(words.actions, {
                            name: member.name,
                          })}
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align='end'
                      className='w-auto min-w-40'
                    >
                      <DropdownMenuGroup>
                        {canLead ? (
                          <DropdownMenuItem
                            onClick={() =>
                              void onSetLead(member.id).catch(() => undefined)
                            }
                          >
                            <CrownIcon />
                            {words.setLead}
                          </DropdownMenuItem>
                        ) : null}
                        {canRemove ? (
                          <DropdownMenuItem
                            variant='destructive'
                            onClick={() => setRemoving(member)}
                          >
                            <Trash2Icon />
                            {words.removeAction}
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </li>
            );
          })}
          {onAdd && offered.length > 0 ? (
            <li className='bg-muted/30 px-3 py-2'>
              <MemberSearch
                candidates={offered}
                disabled={busy}
                labels={labels}
                onPick={(userId) => onAdd(userId).catch(() => undefined)}
              />
            </li>
          ) : null}
        </ul>
      )}
      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {fill(words.removeTitle, { name: removing?.name ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {fill(words.removeDescription, { name: removing?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {words.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={pending}
              onClick={() => {
                if (!removing || !onRemove) return;
                setPending(true);
                void onRemove(removing.id)
                  .then(() => setRemoving(null))
                  .catch(() => undefined)
                  .finally(() => setPending(false));
              }}
            >
              {pending ? (
                <Loader2Icon
                  data-icon='inline-start'
                  className='animate-spin'
                />
              ) : null}
              {words.removeAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProjectSection>
  );
}

type Candidate = { readonly value: string; readonly label: string };

/** Search people by name and add the one picked at once. */
function MemberSearch({
  candidates,
  disabled,
  labels,
  onPick,
}: {
  readonly candidates: readonly Candidate[];
  readonly disabled: boolean;
  readonly labels: ProjectDetailLabels;
  readonly onPick: (userId: string) => Promise<void>;
}): ReactElement {
  const words = labels.members;
  const [input, setInput] = useState('');
  return (
    <Combobox
      items={candidates as Candidate[]}
      value={null}
      disabled={disabled}
      inputValue={input}
      itemToStringLabel={(candidate: Candidate) => candidate.label}
      onInputValueChange={(value) => setInput(value)}
      onValueChange={(candidate: Candidate | null) => {
        if (!candidate) return;
        setInput('');
        void onPick(candidate.value);
      }}
    >
      <ComboboxInput
        id='project-member-add'
        className='w-full'
        aria-label={words.choose}
        placeholder={words.choose}
        disabled={disabled}
      />
      <ComboboxContent>
        <ComboboxEmpty>{words.noMatches}</ComboboxEmpty>
        <ComboboxList>
          {(candidate: Candidate) => (
            <ComboboxItem key={candidate.value} value={candidate}>
              <PersonValue name={candidate.label} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
