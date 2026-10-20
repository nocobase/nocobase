/**
 * The one way to pick an agent: a trigger with the agent's avatar (its availability dot on the avatar's corner) and
 * name, and a menu of every enabled agent with what it is good at, its default and "personal runners only" tags, and,
 * for one that cannot answer the viewer now, why (it cannot be picked then). Two appearances: `field` (the default),
 * which looks like a form's select, for forms and settings; and `toolbar`, compact, for a composer. Presentational: pass
 * the agents (`ChatAgent` from
 * `@nocobase/app-plugin-agents/shared/conversations`), the one chosen, and `onSelect`; every word comes from `labels`,
 * English by default. A form that may choose no agent, such as a default setting, adds `noneOption` at the top of the
 * menu. Optional `models` adds offered chat models alongside Runner agents, with search and service groups; the caller
 * owns catalog loading, model selection and filtering online placeholders out of `agents`. `AgentIdentity` is the avatar,
 * dot and name on their own, for a picker that lists agents among other things.
 */
import {
  CheckIcon,
  ChevronDownIcon,
  SearchIcon,
  SparklesIcon,
} from 'lucide-react';
import {
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
} from 'react';

import { AgentAvatar } from '@nocobase/app-plugin-agents/client/chat';
import type {
  ChatAgent,
  ChatAvailability,
  OfflineReason,
} from '@nocobase/app-plugin-agents/shared/conversations';
import type {
  ModelRef,
  ModelService,
} from '@nocobase/app-plugin-agents/shared/models';
import { Badge } from '#components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { cn } from 'cn';

export interface AgentPickerLabels {
  /** A `toolbar` trigger's accessible name; `{name}` is the agent shown with its availability (`withStatus`). */
  readonly switch: string;
  /** A `field` trigger's accessible name, such as the field's label and the agent: `{name}` as in `switch`. */
  readonly field: string;
  /** The agent and its availability in a trigger's accessible name: `{name}`, `{status}`. */
  readonly withStatus: string;
  /** The menu's heading while choosing who a new conversation goes to. */
  readonly chooseFor: string;
  /** The menu's heading when picking starts a new conversation (`bound`). */
  readonly startWith: string;
  /** Under the menu, when the conversation stays with its agent (`bound`). */
  readonly boundHint: string;
  /** Under the menu otherwise: where answers run. */
  readonly modeHint: string;
  readonly models: string;
  readonly runnerAgents: string;
  /** The trigger while no offered model or Runner agent is selected (including catalog loading). */
  readonly modelPlaceholder: string;
  /** A chosen model's accessible name; `{name}` and `{service}` identify the offered pair. */
  readonly modelSwitch: string;
  readonly modelHint: string;
  readonly mixedHint: string;
  readonly search: string;
  readonly noResults: string;
  readonly empty: string;
  /** Shown in place of a name when there is no agent. */
  readonly none: string;
  /** A `field`'s chosen agent the list does not hold, such as one the viewer may not see. */
  readonly unknown: string;
  /** A `field`'s trigger while nothing is chosen. */
  readonly placeholder: string;
  readonly myDefault: string;
  readonly systemDefault: string;
  /** An agent only personal runners have. */
  readonly personal: string;
  /** A conversation answered by the system default in place of its own agent. */
  readonly temporary: string;
  readonly availability: Readonly<Record<'online' | OfflineReason, string>>;
}

const defaultAgentPickerLabels: AgentPickerLabels = {
  switch: 'Chatting with {name}; choose another agent',
  field: 'Agent: {name}',
  withStatus: '{name}, {status}',
  chooseFor: 'Chat with',
  startWith: 'Start a new conversation with',
  boundHint:
    'A conversation stays with its agent; choosing another starts a new conversation.',
  modeHint:
    'Lists the enabled agents and says why one cannot answer you now. Answers run on a runner: the first reply waits for one to take it, usually a few seconds.',
  models: 'Models',
  runnerAgents: 'Agents',
  modelPlaceholder: 'Choose a model',
  modelSwitch: 'Chatting with {name} ({service}); choose a model or agent',
  modelHint: 'Choose an online model to chat with.',
  mixedHint: 'Choose an online model or an Agent on a runner to chat with.',
  search: 'Search models or agents…',
  noResults: 'No matches found',
  empty: 'No agent you may chat with',
  none: 'No agent',
  unknown: 'Unknown agent',
  placeholder: 'Choose an agent',
  myDefault: 'My default',
  systemDefault: 'System default',
  personal: 'Personal runners only',
  temporary: 'Temporary',
  availability: {
    online: 'Online',
    agentMissing: 'Deleted',
    agentArchived: 'Not enabled',
    forbidden: 'Not available to you',
    noModel: 'Configure a chat model first',
    noRunner: 'No runner online, cannot be chosen',
    othersPersonal: "Only others' personal runners have it",
  },
};

function labelsOf(labels?: Partial<AgentPickerLabels>): AgentPickerLabels {
  return labels
    ? { ...defaultAgentPickerLabels, ...labels }
    : defaultAgentPickerLabels;
}

export type AgentTagTone = 'grey' | 'blue' | 'violet' | 'amber';

const TONE: Readonly<Record<AgentTagTone, string>> = {
  grey: 'bg-muted text-muted-foreground',
  blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
};

/** A small rounded tag in a tint of its hue. */
export function AgentTag({
  tone,
  className,
  ...props
}: ComponentProps<'span'> & { readonly tone: AgentTagTone }): ReactElement {
  return (
    <Badge
      data-size='sm'
      variant='secondary'
      data-tone={tone}
      className={cn('font-normal', TONE[tone], className)}
      {...props}
    />
  );
}

export interface AvailabilityDotProps {
  readonly availability: ChatAvailability;
  readonly className?: string;
  readonly labels?: Partial<AgentPickerLabels>;
}

/** What an availability means in words, such as "Online" or "No runner online". */
function availabilityText(
  availability: ChatAvailability,
  words: AgentPickerLabels,
): string {
  return availability.online
    ? words.availability.online
    : words.availability[availability.reason ?? 'noRunner'];
}

/** A green or grey dot with its meaning for screen readers. */
export function AvailabilityDot({
  availability,
  className,
  labels,
}: AvailabilityDotProps): ReactElement {
  const label = availabilityText(availability, labelsOf(labels));
  return (
    <span
      role='img'
      aria-label={label}
      title={label}
      data-online={availability.online ? 'true' : 'false'}
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        availability.online ? 'bg-green-500' : 'bg-muted-foreground/40',
        className,
      )}
    />
  );
}

/** An agent's tags: the viewer's default or the system default, and one only personal runners have. */
export function AgentTags({
  agent,
  labels,
}: {
  readonly agent: ChatAgent;
  readonly labels?: Partial<AgentPickerLabels>;
}): ReactElement {
  const words = labelsOf(labels);
  return (
    <>
      {agent.isMyDefault ? (
        <AgentTag tone='blue'>{words.myDefault}</AgentTag>
      ) : agent.isSystemDefault ? (
        <AgentTag tone='grey'>{words.systemDefault}</AgentTag>
      ) : null}
      {agent.personalOnly ? (
        <AgentTag tone='violet'>{words.personal}</AgentTag>
      ) : null}
    </>
  );
}

export interface AgentIdentityProps {
  /** The name the avatar is drawn from; null draws a generic avatar. */
  readonly name: string | null;
  /** The text shown; `name` by default. */
  readonly label?: string;
  /** Its availability, as a dot on the avatar's corner; none when unknown. */
  readonly availability?: ChatAvailability | null;
  readonly labels?: Partial<AgentPickerLabels>;
  readonly className?: string;
  readonly nameClassName?: string;
  /** The ring that cuts the dot out of the avatar, in the colour of what is behind it. */
  readonly ringClassName?: string;
}

/** An agent as one row: its avatar with the availability dot on the corner, then its name. */
export function AgentIdentity({
  name,
  label,
  availability,
  labels,
  className,
  nameClassName,
  ringClassName = 'ring-background',
}: AgentIdentityProps): ReactElement {
  const text = label ?? name ?? '';
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5', className)}>
      <span className='relative inline-flex shrink-0'>
        <AgentAvatar name={name} size='xs' />
        {availability ? (
          <AvailabilityDot
            availability={availability}
            {...(labels ? { labels } : {})}
            className={cn(
              'absolute -right-0.5 -bottom-0.5 ring-2',
              ringClassName,
            )}
          />
        ) : null}
      </span>
      <span className={cn('truncate', nameClassName)} title={text}>
        {text}
      </span>
    </span>
  );
}

/** What the trigger shows when it is not simply the chosen agent, such as a conversation whose agent is gone. */
export interface AgentPickerShown {
  readonly name: string | null;
  readonly availability?: ChatAvailability | null;
  /** The system default answers in place of the conversation's own agent. */
  readonly temporary?: boolean;
}

/** A choice of no agent at the top of the menu, checked while `value` is null. */
export interface AgentPickerNoneOption {
  readonly label: string;
  readonly onSelect: () => void;
}

/**
 * `field` looks like a form's select: as wide as its container, the chosen agent and its availability, no tags.
 * `toolbar` is sized for a composer's toolbar, which is an `@container`: the name truncates only past a generous width.
 */
export type AgentPickerAppearance = 'field' | 'toolbar';

/** Offers chat models alongside Runner agents; catalog loading and online-agent filtering belong to the caller. */
export interface AgentPickerModels {
  readonly services: readonly ModelService[];
  readonly value: ModelRef | null;
  readonly onSelect: (model: ModelRef) => void;
  /** Blocks only model choices, never the Runner choices. */
  readonly disabled?: boolean;
}

export interface AgentPickerProps {
  /** Every agent the viewer may pick; Runner agents only when `models` is provided. */
  readonly agents: readonly ChatAgent[];
  /** The chosen agent's id; it gets a check mark unless `bound`. */
  readonly value: string | null;
  readonly onSelect: (agentId: string) => void;
  /** Opts into model-aware choices. Pass Runner agents only in `agents`; omit to keep legacy agent-only behavior. */
  readonly models?: AgentPickerModels;
  /** `field` (the default) for forms and settings, `toolbar` for a composer. */
  readonly appearance?: AgentPickerAppearance;
  /** The trigger's content; the chosen agent by default. */
  readonly shown?: AgentPickerShown;
  /** An existing conversation: picking another agent starts a new conversation, so nothing is checked. */
  readonly bound?: boolean;
  /** Show what picking means under the menu (`boundHint` or `modeHint`); by default only in a `toolbar`. */
  readonly showHint?: boolean;
  /** How an agent is named, such as in the viewer's language; `agent.name` by default. */
  readonly agentName?: (agent: ChatAgent) => string | null;
  readonly labels?: Partial<AgentPickerLabels>;
  /** Offers choosing no agent, such as "System default" for a person's own default. */
  readonly noneOption?: AgentPickerNoneOption;
  /** A `field`'s trigger while nothing is chosen; `labels.placeholder` by default. */
  readonly placeholder?: string;
  /** The trigger's id, for a form label. */
  readonly id?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly align?: 'start' | 'center' | 'end';
  readonly 'data-testid'?: string;
}

function format(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? (values[key] ?? match) : match,
  );
}

function defaultName(agent: ChatAgent): string {
  return agent.name;
}

/** The app's select trigger (`components/ui/select.tsx`), so a `field` sits among a form's selects unnoticed. */
const FIELD_TRIGGER =
  'flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-left text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40';

const TOOLBAR_TRIGGER =
  'flex max-w-44 min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 @md:max-w-64';

export function AgentPicker({
  agents,
  value,
  onSelect,
  models,
  appearance = 'field',
  shown,
  bound = false,
  showHint,
  agentName = defaultName,
  labels,
  noneOption,
  placeholder,
  id,
  disabled,
  className,
  align = 'start',
  'data-testid': testId = 'agent-picker',
}: AgentPickerProps): ReactElement {
  const words = labelsOf(labels);
  const toolbar = appearance === 'toolbar';
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const search = models ? query.trim().toLocaleLowerCase() : '';
  const matches = (text: string): boolean =>
    text.toLocaleLowerCase().includes(search);
  const offered = models
    ? agents.filter((agent) =>
        matches(`${agentName(agent) ?? ''} ${agent.description ?? ''}`),
      )
    : agents;
  const modelOptions =
    models?.services.flatMap((service) =>
      service.models
        .filter((model) => model.kind === 'chat')
        .map((model) => ({
          service,
          model,
          name: model.label || model.value,
        })),
    ) ?? [];
  const selectedModel = modelOptions.find(
    ({ service, model }) =>
      service.name === models?.value?.modelService &&
      model.value === models.value.model,
  );
  const offeredModels = modelOptions.filter(({ service, model, name }) =>
    matches(`${name} ${model.value} ${service.title}`),
  );
  const modelGroups =
    models?.services.flatMap((service) => {
      const options = offeredModels.filter(
        (option) => option.service === service,
      );
      return options.length > 0 ? [{ service, options }] : [];
    }) ?? [];
  const modelTrigger = Boolean(models && (models.value || (!value && !shown)));
  const chosen = agents.find((agent) => agent.id === value) ?? null;
  // Nothing chosen and no "no agent" choice: a field shows its placeholder.
  const empty = !toolbar && !shown && value === null && !noneOption;
  // What a field holds besides an agent: no agent, or an agent the list does not hold.
  const fieldName =
    value === null
      ? (noneOption?.label ?? null)
      : !chosen && !toolbar
        ? words.unknown
        : null;
  const shownName = shown ? shown.name : chosen ? agentName(chosen) : null;
  const name = empty
    ? (placeholder ?? words.placeholder)
    : (shownName ?? fieldName ?? words.none);
  const availability = shown ? shown.availability : chosen?.availability;
  // The dot is part of the avatar, so the accessible name says what it means.
  const subject = availability
    ? format(words.withStatus, {
        name,
        status: availabilityText(availability, words),
      })
    : name;
  // A field holding no agent shows the words alone, as a select shows its choice.
  const avatarless = !toolbar && !shown && !chosen;
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setQuery('');
      }}
      onOpenChangeComplete={(open) => {
        // Run after the menu's initial roving focus so typing searches instead of invoking typeahead.
        if (open && models) queueMicrotask(() => searchRef.current?.focus());
      }}
    >
      <DropdownMenuTrigger
        disabled={disabled ?? false}
        render={
          <button
            type='button'
            id={id}
            className={cn(toolbar ? TOOLBAR_TRIGGER : FIELD_TRIGGER, className)}
            aria-label={
              modelTrigger
                ? selectedModel
                  ? format(words.modelSwitch, {
                      name: selectedModel.name,
                      service: selectedModel.service.title,
                    })
                  : words.modelPlaceholder
                : format(toolbar ? words.switch : words.field, {
                    name: subject,
                  })
            }
            data-appearance={appearance}
            data-testid={testId}
          />
        }
      >
        {modelTrigger ? (
          <>
            <SparklesIcon
              className='size-3.5 shrink-0 text-muted-foreground'
              aria-hidden='true'
            />
            <span
              className={cn(
                'min-w-0 truncate',
                toolbar ? 'font-medium text-foreground' : 'flex-1',
                !selectedModel && 'text-muted-foreground',
              )}
            >
              {selectedModel?.name ?? words.modelPlaceholder}
            </span>
          </>
        ) : avatarless ? (
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              empty && 'text-muted-foreground',
            )}
            title={name}
          >
            {name}
          </span>
        ) : (
          <AgentIdentity
            name={shownName}
            label={name}
            availability={availability ?? null}
            labels={words}
            // The composer's toolbar sits on a card; a field on the page or a dialog.
            ringClassName={toolbar ? 'ring-card' : 'ring-background'}
            {...(toolbar
              ? { nameClassName: 'font-medium text-foreground' }
              : { className: 'flex-1' })}
          />
        )}
        {toolbar && !modelTrigger && shown?.temporary ? (
          <AgentTag tone='amber'>{words.temporary}</AgentTag>
        ) : null}
        <ChevronDownIcon
          className={
            toolbar
              ? 'size-3.5 shrink-0'
              : 'pointer-events-none size-4 shrink-0 text-muted-foreground'
          }
          aria-hidden='true'
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        // Portaled clicks still bubble through React; the composer addon must not steal the search focus.
        onClick={(event) => event.stopPropagation()}
        align={align}
        className={cn(
          models && 'flex flex-col overflow-hidden',
          toolbar
            ? 'w-72 max-w-(--available-width)'
            : 'w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width)',
        )}
      >
        {models ? (
          <>
            <div className='flex shrink-0 items-center gap-1.5 px-1.5 py-1'>
              <SearchIcon
                className='size-3.5 shrink-0 text-muted-foreground'
                aria-hidden='true'
              />
              <input
                ref={searchRef}
                type='search'
                aria-label={words.search}
                placeholder={words.search}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape' || event.key === 'Tab') return;
                  event.stopPropagation();
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    const items = event.currentTarget
                      .closest('[role="menu"]')
                      ?.querySelectorAll<HTMLElement>(
                        '[role="menuitem"]:not([aria-disabled="true"])',
                      );
                    const item =
                      event.key === 'ArrowUp'
                        ? items?.[items.length - 1]
                        : items?.[0];
                    item?.focus();
                  }
                }}
                className='h-6 w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/50'
              />
            </div>
            <DropdownMenuSeparator className='shrink-0' />
          </>
        ) : null}
        <div
          data-slot='agent-picker-options'
          className={
            models
              ? 'min-h-0 max-h-96 overflow-x-hidden overflow-y-auto [&_[data-slot=dropdown-menu-separator]]:mx-0'
              : undefined
          }
        >
          <DropdownMenuGroup>
            {!models || bound ? (
              <DropdownMenuLabel>
                {bound ? words.startWith : words.chooseFor}
              </DropdownMenuLabel>
            ) : null}
            {noneOption ? (
              <DropdownMenuItem onClick={noneOption.onSelect} data-agent=''>
                <span className='min-w-0 flex-1 truncate'>
                  {noneOption.label}
                </span>
                {!bound && value === null && !models?.value ? (
                  <CheckIcon className='size-3.5' aria-hidden='true' />
                ) : null}
              </DropdownMenuItem>
            ) : null}
            {offered.length === 0 && (!models || offeredModels.length === 0) ? (
              <DropdownMenuItem disabled>
                {models ? words.noResults : words.empty}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          {models && offeredModels.length > 0 ? (
            <DropdownMenuGroup>
              {agents.length > 0 ? (
                <DropdownMenuLabel className='text-foreground'>
                  {words.models}
                </DropdownMenuLabel>
              ) : null}
              {modelGroups.map(({ service, options }) => (
                <DropdownMenuGroup
                  key={service.name}
                  className='not-first:mt-1.5'
                >
                  <DropdownMenuLabel
                    className='truncate font-normal'
                    title={service.title}
                  >
                    {service.title}
                  </DropdownMenuLabel>
                  {options.map(({ model, name: modelName }) => (
                    <DropdownMenuItem
                      key={JSON.stringify([service.name, model.value])}
                      disabled={models.disabled ?? false}
                      onClick={() =>
                        models.onSelect({
                          modelService: service.name,
                          model: model.value,
                        })
                      }
                      aria-label={`${modelName} ${service.title}`}
                      data-model-service={service.name}
                      data-model={model.value}
                      className='pl-4'
                    >
                      <span
                        className='min-w-0 flex-1 truncate'
                        title={modelName}
                      >
                        {modelName}
                      </span>
                      <span className='inline-flex size-3.5 shrink-0 items-center justify-center'>
                        {!bound &&
                        selectedModel?.service.name === service.name &&
                        selectedModel.model.value === model.value ? (
                          <CheckIcon className='size-3.5' aria-hidden='true' />
                        ) : null}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              ))}
            </DropdownMenuGroup>
          ) : null}
          {models && offeredModels.length > 0 && offered.length > 0 ? (
            <DropdownMenuSeparator />
          ) : null}
          <DropdownMenuGroup>
            {models && offered.length > 0 ? (
              <DropdownMenuLabel className='text-foreground'>
                {words.runnerAgents}
              </DropdownMenuLabel>
            ) : null}
            {offered.map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                // An agent that cannot answer the viewer now says why and cannot be picked.
                disabled={!agent.availability.online && agent.id !== value}
                onClick={() => onSelect(agent.id)}
                data-agent={agent.id}
                className='items-start'
              >
                <AgentAvatar name={agentName(agent)} size='xs' />
                <span className='flex min-w-0 flex-1 flex-col'>
                  <span className='truncate'>
                    {agentName(agent) ?? words.none}
                  </span>
                  {agent.description ? (
                    <span className='truncate text-xs text-muted-foreground'>
                      {agent.description}
                    </span>
                  ) : null}
                  {agent.availability.online ? null : (
                    <span className='truncate text-xs text-muted-foreground'>
                      {availabilityText(agent.availability, words)}
                    </span>
                  )}
                </span>
                <AgentTags agent={agent} labels={words} />
                <AvailabilityDot
                  availability={agent.availability}
                  labels={words}
                />
                {!bound && !models?.value && value === agent.id ? (
                  <CheckIcon className='size-3.5' aria-hidden='true' />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </div>
        {(showHint ?? toolbar) ? (
          <>
            <DropdownMenuSeparator className='shrink-0' />
            <p className='shrink-0 px-2 py-1 text-xs text-muted-foreground'>
              {bound
                ? words.boundHint
                : models
                  ? agents.length > 0
                    ? words.mixedHint
                    : words.modelHint
                  : words.modeHint}
            </p>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
