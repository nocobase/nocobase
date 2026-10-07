/**
 * A copy of the UI Library's `agent-picker` (`ui-library/registry/agents/agent-picker.tsx`), its imports made relative.
 *
 * The one way to pick an agent: a trigger with the agent's avatar (its availability dot on the avatar's corner) and
 * name, and a menu of every agent the viewer may pick, grouped by type (Online, Runner) with their default and personal
 * tags and availability. Two appearances: `field` (the default), which looks like a form's select, for forms and
 * settings; and `toolbar`, compact with the mode tag, for a composer. Presentational: pass the agents (`ChatAgent` from
 * `@nocobase/app-plugin-agents/shared/conversations`), the one chosen, and `onSelect`; every word comes from `labels`,
 * English by default. A form that may choose no agent, such as a default setting, adds `noneOption` at the top of the
 * menu. `AgentIdentity` is the avatar, dot and name on their own, for a picker that lists agents among other things.
 */
import {
  CheckIcon,
  ChevronDownIcon,
  MessageSquareIcon,
  WrenchIcon,
} from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';

import type {
  ChatAgent,
  ChatAvailability,
  ConversationMode,
  OfflineReason,
} from '../../shared/conversations.js';
import { cn } from 'cn';
import { AgentAvatar } from './agent-avatar.js';
import { Badge } from './ui/badge.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';

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
  /** Under the menu otherwise. */
  readonly modeHint: string;
  readonly empty: string;
  /** Shown in place of a name when there is no agent. */
  readonly none: string;
  /** A `field`'s chosen agent the list does not hold, such as one the viewer may not see. */
  readonly unknown: string;
  /** A `field`'s trigger while nothing is chosen. */
  readonly placeholder: string;
  readonly myDefault: string;
  readonly systemDefault: string;
  readonly personal: string;
  /** A conversation answered by the system default in place of its own agent. */
  readonly temporary: string;
  readonly onlineGroup: string;
  readonly runnerGroup: string;
  readonly mode: Readonly<Record<ConversationMode, string>>;
  readonly modeHints: Readonly<Record<ConversationMode, string>>;
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
    'Online answers on the server in seconds; Runner runs a coding agent on a runtime. A conversation keeps its mode.',
  empty: 'No agent you may chat with',
  none: 'No agent',
  unknown: 'Unknown agent',
  placeholder: 'Choose an agent',
  myDefault: 'My default',
  systemDefault: 'System default',
  personal: 'Only me',
  temporary: 'Temporary',
  onlineGroup: 'Online agents',
  runnerGroup: 'Runner agents',
  mode: { online: 'Online', runner: 'Runner' },
  modeHints: {
    online: 'Answers in seconds on the server',
    runner: 'A coding agent on a runtime',
  },
  availability: {
    online: 'Online',
    agentMissing: 'Deleted',
    agentArchived: 'Archived',
    forbidden: 'Not available to you',
    noRunner: 'No runner online',
    modelUnavailable: 'Model unavailable',
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

export interface ModeTagProps extends ComponentProps<'span'> {
  readonly mode: ConversationMode;
  readonly labels?: Partial<AgentPickerLabels>;
}

/** A conversation's mode, Online or Runner, with what it means on hover. */
export function ModeTag({
  mode,
  labels,
  className,
  ...props
}: ModeTagProps): ReactElement {
  const words = labelsOf(labels);
  return (
    <span
      title={words.modeHints[mode]}
      className={cn('inline-flex', className)}
      {...props}
    >
      <AgentTag tone={mode === 'online' ? 'violet' : 'blue'}>
        {mode === 'online' ? <MessageSquareIcon /> : <WrenchIcon />}
        {words.mode[mode]}
      </AgentTag>
    </span>
  );
}

/** An agent's tags: the viewer's default or the system default, and "only me" for a personal agent. */
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
      {agent.personal ? (
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
  readonly mode?: ConversationMode | null;
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
 * `toolbar` is sized for a composer's toolbar, which is an `@container`: the name truncates only past a generous width,
 * and the mode tag shows only where the container is wide (`@md`).
 */
export type AgentPickerAppearance = 'field' | 'toolbar';

export interface AgentPickerProps {
  /** Every agent the viewer may pick. */
  readonly agents: readonly ChatAgent[];
  /** The chosen agent's id; it gets a check mark unless `bound`. */
  readonly value: string | null;
  readonly onSelect: (agentId: string) => void;
  /** `field` (the default) for forms and settings, `toolbar` for a composer. */
  readonly appearance?: AgentPickerAppearance;
  /** Offer only agents of this type; a chosen agent of another type still shows on the trigger. */
  readonly type?: ConversationMode;
  /** The trigger's content; the chosen agent by default. */
  readonly shown?: AgentPickerShown;
  /** An existing conversation: picking another agent starts a new conversation, so nothing is checked. */
  readonly bound?: boolean;
  /** Group the menu by mode, Online then Runner. */
  readonly groupByMode?: boolean;
  /** Show the mode tag on a `toolbar` trigger. */
  readonly showMode?: boolean;
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
  appearance = 'field',
  type,
  shown,
  bound = false,
  groupByMode = true,
  showMode = true,
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
  const offered = type ? agents.filter((agent) => agent.type === type) : agents;
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
  const mode = shown ? shown.mode : (chosen?.type ?? null);
  // The dot is part of the avatar, so the accessible name says what it means.
  const subject = availability
    ? format(words.withStatus, {
        name,
        status: availabilityText(availability, words),
      })
    : name;
  const groups = groupByMode
    ? (['online', 'runner'] as const)
        .map((group) => ({
          type: group,
          agents: offered.filter((agent) => agent.type === group),
        }))
        .filter((group) => group.agents.length > 0)
    : [{ type: null, agents: offered }];
  // A field holding no agent shows the words alone, as a select shows its choice.
  const avatarless = !toolbar && !shown && !chosen;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled ?? false}
        render={
          <button
            type='button'
            id={id}
            className={cn(toolbar ? TOOLBAR_TRIGGER : FIELD_TRIGGER, className)}
            aria-label={format(toolbar ? words.switch : words.field, {
              name: subject,
            })}
            data-appearance={appearance}
            data-testid={testId}
          />
        }
      >
        {avatarless ? (
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
        {toolbar && showMode && mode ? (
          <ModeTag
            mode={mode}
            labels={words}
            className='hidden shrink-0 @md:inline-flex'
          />
        ) : null}
        {toolbar && shown?.temporary ? (
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
        align={align}
        className={
          toolbar
            ? 'w-72 max-w-(--available-width)'
            : 'w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width)'
        }
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {bound ? words.startWith : words.chooseFor}
          </DropdownMenuLabel>
          {noneOption ? (
            <DropdownMenuItem onClick={noneOption.onSelect} data-agent=''>
              <span className='min-w-0 flex-1 truncate'>
                {noneOption.label}
              </span>
              {!bound && value === null ? (
                <CheckIcon className='size-3.5' aria-hidden='true' />
              ) : null}
            </DropdownMenuItem>
          ) : null}
          {offered.length === 0 ? (
            <DropdownMenuItem disabled>{words.empty}</DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        {groups.map((group) => (
          <DropdownMenuGroup
            key={group.type ?? 'all'}
            data-mode={group.type ?? undefined}
          >
            {group.type ? (
              <DropdownMenuLabel className='text-xs font-normal text-muted-foreground'>
                {group.type === 'online'
                  ? words.onlineGroup
                  : words.runnerGroup}
              </DropdownMenuLabel>
            ) : null}
            {group.agents.map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => onSelect(agent.id)}
                data-agent={agent.id}
              >
                <AgentAvatar name={agentName(agent)} size='xs' />
                <span className='min-w-0 flex-1 truncate'>
                  {agentName(agent) ?? words.none}
                </span>
                <AgentTags agent={agent} labels={words} />
                <AvailabilityDot
                  availability={agent.availability}
                  labels={words}
                />
                {!bound && value === agent.id ? (
                  <CheckIcon className='size-3.5' aria-hidden='true' />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
        {(showHint ?? toolbar) ? (
          <>
            <DropdownMenuSeparator />
            <p className='px-2 py-1 text-xs text-muted-foreground'>
              {bound ? words.boundHint : words.modeHint}
            </p>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
