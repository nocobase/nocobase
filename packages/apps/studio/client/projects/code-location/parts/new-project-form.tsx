/**
 * Creating a project in one compact form, presented: sections stacked in one dialog, each a fieldset with an optional
 * legend; the working directory as a row of small choice cards, what the chosen one means under the row and its fields
 * in a muted panel beneath (for a new repository, how it gets its first code, as three more cards: a NocoBase
 * application from create-app's default template, a template repository with the workflow that initializes it, picked
 * from a searchable list or typed as `owner/repo`, or an optional prompt for an agent); the initialization prompt
 * (optional everywhere); and the footer that creates, saying what is still missing while it cannot. Purely
 * presentational: the consumer keeps every value, loads the template repositories and their workflows, decides when
 * the form is complete, and performs the creation through `onSubmit` (a promise the footer waits for).
 */
import {
  BoxesIcon,
  CircleOffIcon,
  FolderIcon,
  GitBranchIcon,
  GitForkIcon,
  LayoutTemplateIcon,
  Loader2Icon,
  RotateCcwIcon,
  SparklesIcon,
  type LucideIcon,
} from 'lucide-react';
import { useId, useState, type ReactElement, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from 'cn';

import {
  defaultNewProjectFormLabels,
  fill,
  INIT_METHODS,
  type NewProjectCodeLocation,
  type NewProjectFormLabels,
  type NewProjectInitMethod,
  type NewProjectMissing,
  type NewProjectTemplateRepo,
  type NewProjectWorkflow,
} from './labels.js';

// --- Sections ------------------------------------------------------------------------------------------------------

export interface NewProjectSectionProps {
  /** Marks the section for tests and styling. */
  readonly id?: string;
  /** The section's legend; a section without one (the project's own fields, say) shows none. */
  readonly title?: string;
  readonly children: ReactNode;
}

/** One section of the form; sections stack, each the same fieldset with an optional legend. */
export function NewProjectSection({
  id,
  title,
  children,
}: NewProjectSectionProps): ReactElement {
  return (
    <FieldSet data-new-project-section={id}>
      {title ? <FieldLegend variant='label'>{title}</FieldLegend> : null}
      {children}
    </FieldSet>
  );
}

// --- Choice cards --------------------------------------------------------------------------------------------------

interface ChoiceOption<T extends string> {
  readonly value: T;
  readonly icon: LucideIcon;
  readonly title: string;
  /** A muted line under the title (a template repository's description). */
  readonly note?: string;
  /** Why the option is not possible now, and what to do; it is disabled and says so inside the card. */
  readonly unavailable?: ReactNode;
  readonly aside?: ReactNode;
}

/**
 * Options as a row of small shadcn choice cards, each an icon and a short title over a hidden radio; beneath the row,
 * what the chosen one means, then its own fields in a muted panel.
 */
function ChoiceCards<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  description,
  panel,
}: {
  readonly options: readonly ChoiceOption<T>[];
  readonly value: T | null;
  readonly onChange: (value: T) => void;
  readonly label?: string;
  readonly className?: string;
  /** What the chosen option means, said once under the row. */
  readonly description?: string;
  readonly panel?: ReactNode;
}): ReactElement {
  const id = useId();
  return (
    <div className='flex flex-col gap-3'>
      <RadioGroup
        value={value}
        aria-label={label}
        onValueChange={(next: unknown) => {
          const found = options.find((option) => option.value === next);
          if (found) onChange(found.value);
        }}
        className={cn('grid-cols-2', className)}
      >
        {options.map((option, index) => {
          const Icon = option.icon;
          const unavailable = option.unavailable !== undefined;
          return (
            <FieldLabel
              key={option.value}
              htmlFor={`${id}-${index}`}
              data-choice={option.value}
              data-unavailable={unavailable ? true : undefined}
              className='relative min-w-0 has-data-checked:border-primary data-unavailable:cursor-not-allowed dark:has-data-checked:border-primary'
            >
              <Field orientation='horizontal' className='items-start gap-2'>
                <Icon
                  className={cn(
                    'mt-0.5 size-4 shrink-0 text-muted-foreground',
                    unavailable && 'opacity-50',
                  )}
                />
                <FieldContent className='min-w-0 gap-0.5'>
                  <FieldTitle
                    className={cn(
                      'w-full min-w-0 text-sm',
                      unavailable && 'opacity-50',
                    )}
                  >
                    <span className='min-w-0 truncate'>{option.title}</span>
                    {option.aside}
                  </FieldTitle>
                  {option.note ? (
                    <FieldDescription className='line-clamp-1 text-xs'>
                      {option.note}
                    </FieldDescription>
                  ) : null}
                  {unavailable ? (
                    <div
                      className='text-xs leading-normal font-normal text-muted-foreground'
                      data-choice-unavailable={option.value}
                    >
                      {option.unavailable}
                    </div>
                  ) : null}
                </FieldContent>
                <RadioGroupItem
                  id={`${id}-${index}`}
                  value={option.value}
                  disabled={unavailable}
                  className='pointer-events-none absolute! top-0 left-0 opacity-0'
                />
              </Field>
            </FieldLabel>
          );
        })}
      </RadioGroup>
      {description ? (
        <p
          data-choice-description={value ?? undefined}
          className='text-sm text-muted-foreground'
        >
          {description}
        </p>
      ) : null}
      {panel ? (
        <div
          data-choice-panel={value ?? undefined}
          className='flex flex-col gap-4 rounded-lg bg-muted/50 p-4'
        >
          {panel}
        </div>
      ) : null}
    </div>
  );
}

const LOCATION_ICONS: Readonly<Record<NewProjectCodeLocation, LucideIcon>> = {
  newRepo: GitForkIcon,
  existingRepo: GitBranchIcon,
  runnerDirectory: FolderIcon,
  none: CircleOffIcon,
};

export interface CodeLocationChoiceProps {
  /** The locations offered, in order. */
  readonly options: readonly NewProjectCodeLocation[];
  readonly value: NewProjectCodeLocation;
  readonly onChange: (value: NewProjectCodeLocation) => void;
  /** Locations offered but not possible now (no code host connected, say), with why. */
  readonly unavailable?: Readonly<
    Partial<Record<NewProjectCodeLocation, ReactNode>>
  >;
  /** The chosen location's own fields, in a muted panel beneath the row. */
  readonly children?: ReactNode;
  readonly labels?: NewProjectFormLabels;
}

/** Where the working directory is, as small cards two by two, with what the chosen one means and its fields beneath. */
export function CodeLocationChoice({
  options,
  value,
  onChange,
  unavailable = {},
  children,
  labels = defaultNewProjectFormLabels,
}: CodeLocationChoiceProps): ReactElement {
  return (
    <ChoiceCards
      options={options.map((location) => ({
        value: location,
        icon: LOCATION_ICONS[location],
        title: labels.locations[location].title,
        unavailable: unavailable[location],
      }))}
      value={value}
      onChange={onChange}
      // Two by two: in a dialog of the wizard's width, a card holds its title and one line of why it is unavailable.
      className='grid-cols-2'
      description={labels.locations[value].description}
      panel={children}
    />
  );
}

// --- A new repository's first code --------------------------------------------------------------------------------

const METHOD_ICONS: Readonly<Record<NewProjectInitMethod, LucideIcon>> = {
  nocobase: BoxesIcon,
  template: LayoutTemplateIcon,
  prompt: SparklesIcon,
};

export interface InitMethodChoiceProps {
  readonly value: NewProjectInitMethod;
  readonly onChange: (value: NewProjectInitMethod) => void;
  /** Methods not possible now, with why. */
  readonly unavailable?: Readonly<
    Partial<Record<NewProjectInitMethod, ReactNode>>
  >;
  /** The chosen method's own fields, placed beneath the choices. */
  readonly children?: ReactNode;
  readonly labels?: NewProjectFormLabels;
}

/**
 * How a new repository gets its first code, three cards side by side: a NocoBase application, generated from a
 * template repository, or made by an agent from a prompt.
 */
export function InitMethodChoice({
  value,
  onChange,
  unavailable = {},
  children,
  labels = defaultNewProjectFormLabels,
}: InitMethodChoiceProps): ReactElement {
  return (
    <div className='flex flex-col gap-4'>
      <ChoiceCards
        options={INIT_METHODS.map((method) => ({
          value: method,
          icon: METHOD_ICONS[method],
          title: labels.initMethods[method].title,
          unavailable: unavailable[method],
        }))}
        value={value}
        onChange={onChange}
        className='grid-cols-1 sm:grid-cols-3'
        description={labels.initMethods[value].description}
      />
      {children}
    </div>
  );
}

/** What checking a template repository by its name (typed, or chosen outside the listed ones) says. */
export interface TemplateRepoCheck {
  readonly name: string;
  readonly state: 'checking' | 'ok' | 'notTemplate' | 'notFound' | 'failed';
}

export interface TemplateRepoChoiceProps {
  /** The connection's template repositories read so far. */
  readonly repos: readonly NewProjectTemplateRepo[];
  /** The chosen repository's `owner/name`, or null. */
  readonly value: string | null;
  readonly onChange: (fullName: string | null) => void;
  /** What is typed: a search of the list, or any template's `owner/repo`. */
  readonly search: string;
  readonly onSearch: (search: string) => void;
  /** The first page is being read. */
  readonly loading?: boolean;
  /** A further page is being read. */
  readonly loadingMore?: boolean;
  /** Why the list could not be read; null when it could. */
  readonly error?: string | null;
  readonly onRetry?: () => void;
  /** More of the connection's repositories may be read with `onMore`, also on scrolling to the end of the list. */
  readonly hasMore?: boolean;
  readonly onMore?: () => void;
  /** A typed `owner/repo` the list does not hold, offered to use. */
  readonly typed?: string | null;
  /** The check of the typed or chosen repository, when one is checked. */
  readonly check?: TemplateRepoCheck | null;
  readonly labels?: NewProjectFormLabels;
}

/**
 * A list being read, said in words beside a spinner: it sits on the muted panel, where skeleton rows do not show.
 */
function ListLoading({
  text,
  ...data
}: {
  readonly text: string;
  readonly [attribute: `data-${string}`]: boolean;
}): ReactElement {
  return (
    <div
      role='status'
      className='flex items-center gap-2 p-3 text-sm text-muted-foreground'
      {...data}
    >
      <Loader2Icon className='size-4 animate-spin' aria-hidden />
      {text}
    </div>
  );
}

/**
 * The template repository to generate the new one from: a searchable list of the connection's, read a page at a time
 * (more on scrolling to its end), which also takes any template's `owner/repo` typed in, checked on the host before it
 * can be used. Loading says so beside a spinner, a failure its reason with Retry, an empty list says `owner/repo` may be
 * typed. Once chosen, the list gives way to the choice and "Choose another".
 */
export function TemplateRepoChoice({
  repos,
  value,
  onChange,
  search,
  onSearch,
  loading = false,
  loadingMore = false,
  error = null,
  onRetry,
  hasMore = false,
  onMore,
  typed = null,
  check = null,
  labels = defaultNewProjectFormLabels,
}: TemplateRepoChoiceProps): ReactElement {
  const words = labels.templateRepos;
  const problem = (found: TemplateRepoCheck | null): string | null =>
    found?.state === 'notTemplate'
      ? fill(words.notTemplate, { name: found.name })
      : found?.state === 'notFound'
        ? fill(words.notFound, { name: found.name })
        : found?.state === 'failed'
          ? fill(words.checkFailed, { name: found.name })
          : null;
  if (value !== null) {
    const chosen = repos.find((repo) => repo.fullName === value);
    const chosenCheck = check?.name === value ? check : null;
    const refused = problem(chosenCheck);
    return (
      <Field data-template-repo={value}>
        <FieldLabel>{words.label}</FieldLabel>
        <div className='flex flex-wrap items-center gap-2 text-sm'>
          <LayoutTemplateIcon className='size-4 text-muted-foreground' />
          <span className='font-mono'>{value}</span>
          {chosen?.private ? (
            <Badge variant='outline'>{words.private}</Badge>
          ) : null}
          {chosenCheck?.state === 'checking' ? (
            <Loader2Icon
              className='size-4 animate-spin text-muted-foreground'
              aria-label={fill(words.checking, { name: value })}
            />
          ) : null}
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => onChange(null)}
          >
            {words.change}
          </Button>
        </div>
        {refused ? (
          <p className='text-sm text-destructive' data-template-check='refused'>
            {refused}
          </p>
        ) : chosen ? (
          <FieldDescription className='line-clamp-2'>
            {chosen.description || words.noDescription}
          </FieldDescription>
        ) : null}
      </Field>
    );
  }
  const typedCheck = typed !== null && check?.name === typed ? check : null;
  const typedProblem = problem(typedCheck);
  return (
    <Field data-template-repos>
      <FieldLabel>{words.label}</FieldLabel>
      <Command shouldFilter={false} className='rounded-md border'>
        <CommandInput
          value={search}
          placeholder={words.search}
          aria-label={words.search}
          onValueChange={onSearch}
        />
        <CommandList
          className='max-h-56'
          onScroll={(event) => {
            const list = event.currentTarget;
            if (
              hasMore &&
              !loadingMore &&
              onMore &&
              list.scrollTop + list.clientHeight >= list.scrollHeight - 24
            )
              onMore();
          }}
        >
          {typed !== null ? (
            <CommandGroup>
              <CommandItem
                value={`typed:${typed}`}
                data-template-typed={typed}
                disabled={typedCheck?.state !== 'ok'}
                onSelect={() => onChange(typed)}
              >
                <LayoutTemplateIcon className='text-muted-foreground' />
                <span className='truncate'>
                  {typedCheck === null || typedCheck.state === 'checking'
                    ? fill(words.checking, { name: typed })
                    : (typedProblem ?? fill(words.useTyped, { name: typed }))}
                </span>
              </CommandItem>
            </CommandGroup>
          ) : null}
          {loading ? (
            <ListLoading text={words.loading} data-template-loading />
          ) : error !== null ? (
            <div
              className='flex flex-wrap items-center gap-2 p-3 text-sm'
              data-template-error
            >
              <span className='text-destructive'>
                {fill(words.loadFailed, { reason: error })}
              </span>
              {onRetry ? (
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={onRetry}
                >
                  <RotateCcwIcon />
                  {words.retry}
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              {repos.length === 0 && typed === null && !loadingMore ? (
                <CommandEmpty data-template-empty>
                  {search.trim() ? words.noMatch : words.empty}
                </CommandEmpty>
              ) : null}
              {repos.length > 0 ? (
                <CommandGroup>
                  {repos.map((repo) => (
                    <CommandItem
                      key={repo.fullName}
                      value={repo.fullName}
                      data-template-repo-option={repo.fullName}
                      onSelect={() => onChange(repo.fullName)}
                    >
                      <span className='flex min-w-0 flex-col'>
                        <span className='truncate'>{repo.fullName}</span>
                        <span className='truncate text-xs text-muted-foreground'>
                          {repo.description || words.noDescription}
                        </span>
                      </span>
                      {repo.private ? (
                        <Badge variant='outline'>{words.private}</Badge>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {loadingMore ? (
                <ListLoading
                  text={words.loadingMore}
                  data-template-loading-more
                />
              ) : null}
            </>
          )}
        </CommandList>
      </Command>
      {hasMore && onMore && !loading && error === null ? (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='self-start'
          disabled={loadingMore}
          onClick={onMore}
        >
          {words.more}
        </Button>
      ) : null}
    </Field>
  );
}

/** The value of "no workflow" in `InitWorkflowSelect`. */
const NO_WORKFLOW = 'none';

export interface InitWorkflowSelectProps {
  readonly id?: string;
  readonly workflows: readonly NewProjectWorkflow[];
  /** The chosen workflow's id; null for none. */
  readonly value: string | null;
  readonly onChange: (workflowId: string | null) => void;
  readonly loading?: boolean;
  readonly labels?: NewProjectFormLabels;
}

/** Which of the template's workflows initializes the project, or none (ready at once). */
export function InitWorkflowSelect({
  id = 'new-project-init-workflow',
  workflows,
  value,
  onChange,
  loading = false,
  labels = defaultNewProjectFormLabels,
}: InitWorkflowSelectProps): ReactElement {
  const items = [
    { value: NO_WORKFLOW, label: labels.workflow.none },
    ...workflows.map((workflow) => ({
      value: workflow.id,
      label: `${workflow.name} (${workflow.path})`,
    })),
  ];
  const chosen = workflows.find((workflow) => workflow.id === value) ?? null;
  return (
    <Field data-init-workflow={chosen?.path ?? NO_WORKFLOW}>
      <FieldLabel htmlFor={id}>{labels.workflow.label}</FieldLabel>
      <Select
        items={items}
        value={chosen ? chosen.id : NO_WORKFLOW}
        disabled={loading}
        onValueChange={(next: string | null) =>
          onChange(next && next !== NO_WORKFLOW ? next : null)
        }
      >
        <SelectTrigger id={id} className='w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>
        {loading
          ? labels.workflow.loading
          : workflows.length === 0
            ? labels.workflow.empty
            : chosen
              ? fill(labels.workflow.chosenHint, { name: chosen.name })
              : labels.workflow.noneHint}
      </FieldDescription>
    </Field>
  );
}

export interface InitPromptFieldProps {
  readonly id?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /**
   * For a working directory that already exists: the prompt may stay empty (no initialization). Otherwise it is what
   * the agent creates in an empty repository.
   */
  readonly optional?: boolean;
  readonly labels?: NewProjectFormLabels;
}

/** What the agent is asked to do first: create the empty repository's first commit, or prepare a working directory. */
export function InitPromptField({
  id = 'new-project-init-prompt',
  value,
  onChange,
  optional = false,
  labels = defaultNewProjectFormLabels,
}: InitPromptFieldProps): ReactElement {
  return (
    <Field data-init-prompt={optional ? 'optional' : 'required'}>
      <FieldLabel htmlFor={id}>
        {optional ? labels.prompt.optionalLabel : labels.prompt.label}
      </FieldLabel>
      <Textarea
        id={id}
        rows={3}
        value={value}
        placeholder={optional ? labels.prompt.optionalPlaceholder : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldDescription>
        {optional ? labels.prompt.optionalHint : labels.prompt.hint}
      </FieldDescription>
    </Field>
  );
}

// --- Footer --------------------------------------------------------------------------------------------------------

export interface NewProjectFormFooterProps {
  /** Whether the form is complete. */
  readonly canSubmit: boolean;
  /** While it is not, what is missing first, said beside the button that creates. */
  readonly missing?: NewProjectMissing | null;
  readonly onCancel: () => void;
  /** Creates; the footer stays busy until it answers. */
  readonly onSubmit: () => Promise<void>;
  /** The button that creates, "Create project" by default. */
  readonly submitLabel?: string;
  readonly labels?: NewProjectFormLabels;
}

/** Why it cannot create yet, then Cancel and the button that creates. */
export function NewProjectFormFooter({
  canSubmit,
  missing,
  onCancel,
  onSubmit,
  submitLabel,
  labels = defaultNewProjectFormLabels,
}: NewProjectFormFooterProps): ReactElement {
  const [busy, setBusy] = useState(false);
  const reasonId = useId();
  const reason =
    !canSubmit && !busy && missing ? labels.incomplete[missing] : null;
  return (
    <>
      {reason ? (
        <p
          id={reasonId}
          data-new-project-missing={missing}
          className='self-center text-sm text-muted-foreground'
        >
          {reason}
        </p>
      ) : null}
      <Button type='button' variant='ghost' disabled={busy} onClick={onCancel}>
        {labels.cancel}
      </Button>
      <Button
        type='button'
        disabled={!canSubmit || busy}
        aria-describedby={reason ? reasonId : undefined}
        onClick={() => {
          setBusy(true);
          void onSubmit().finally(() => setBusy(false));
        }}
      >
        {busy ? <Loader2Icon className='animate-spin' /> : null}
        {submitLabel ?? labels.create}
      </Button>
    </>
  );
}
