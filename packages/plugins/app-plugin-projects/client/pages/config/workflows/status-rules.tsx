import { useTranslation } from '@nocobase/i18n/client';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  PlusIcon,
  PuzzleIcon,
  Settings2Icon,
  Trash2Icon,
  WorkflowIcon,
} from 'lucide-react';
import {
  createElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
  useState,
} from 'react';

import {
  ANY_STATUS,
  isBuiltInEvent,
  type WorkflowDefinition,
  type WorkflowStatus,
} from '../../../../shared/workflows.js';
import {
  allowedOn,
  groupOf,
  useStatusRuleTypes,
  useTitleText,
  type StatusRuleConfig,
  type StatusRuleGroup,
  type StatusRuleTypeUI,
} from '../../../lib/status-rule-types.js';
import {
  eventAllows,
  useWorkflowEvents,
} from '../../../lib/workflow-events.js';
import { cn } from 'cn';
import { Button } from '../../../components/ui/button.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select.js';
import { useStatusName } from './use-status-name.js';
import {
  autoMoveAt,
  contributedRuleOf,
  flowOrder,
  setAutoMove,
  setRule,
} from './workflow-model.js';

type Change = (
  change: (definition: WorkflowDefinition) => WorkflowDefinition,
) => void;

/** The built-in workflow event: every sub-issue is finished. */
const SUBTASKS_EVENT = 'subtasks.done';

/**
 * One rule or automatic move in the dialog: its title and a one-line summary, expanded to edit when it has anything to
 * edit, with a button that removes it.
 */
function RuleCard({
  title,
  summary,
  Icon,
  expanded,
  onExpandedChange,
  removeLabel,
  onRemove,
  children,
  data,
}: {
  readonly title: string;
  readonly summary: ReactNode;
  readonly Icon: ComponentType<{ readonly className?: string }>;
  readonly expanded: boolean;
  readonly onExpandedChange: (expanded: boolean) => void;
  readonly removeLabel: string;
  readonly onRemove: () => void;
  /** The editor; a card without one does not expand. */
  readonly children?: ReactNode;
  readonly data: Readonly<Record<`data-${string}`, string>>;
}): ReactElement {
  const editable = Boolean(children);
  const heading = (
    <>
      <Icon
        className='mt-0.5 size-4 shrink-0 text-muted-foreground'
        aria-hidden='true'
      />
      <span className='min-w-0 flex-1'>
        <span className='block text-sm font-medium'>{title}</span>
        <span className='block truncate text-xs text-muted-foreground'>
          {summary}
        </span>
      </span>
    </>
  );
  return (
    <section className='min-w-0 rounded-lg border' {...data}>
      <Collapsible open={editable && expanded} onOpenChange={onExpandedChange}>
        <div className='flex items-start gap-1 p-1'>
          {editable ? (
            <CollapsibleTrigger className='flex min-w-0 flex-1 items-start gap-2 rounded-md p-1.5 text-left outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50'>
              {heading}
              <ChevronRightIcon
                className={cn(
                  'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform',
                  expanded && 'rotate-90',
                )}
                aria-hidden='true'
              />
            </CollapsibleTrigger>
          ) : (
            <div className='flex min-w-0 flex-1 items-start gap-2 p-1.5'>
              {heading}
            </div>
          )}
          <Button
            variant='ghost'
            size='icon-sm'
            className='mt-0.5 shrink-0'
            aria-label={removeLabel}
            title={removeLabel}
            onClick={onRemove}
          >
            <Trash2Icon />
          </Button>
        </div>
        {editable ? (
          <CollapsibleContent className='border-t px-3 py-3'>
            {children}
          </CollapsibleContent>
        ) : null}
      </Collapsible>
    </section>
  );
}

/** A rule whose plugin is not here: it does nothing on entering, and can only be removed. */
function UnavailableRule({
  status,
  type,
  onChange,
}: {
  readonly status: WorkflowStatus;
  readonly type: string;
  readonly onChange: Change;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <section
      className='flex items-start gap-3 rounded-lg border border-dashed p-3 text-sm'
      data-rule-unavailable={type}
    >
      <CircleAlertIcon
        className='mt-0.5 size-4 shrink-0 text-muted-foreground'
        aria-hidden='true'
      />
      <span className='min-w-0 flex-1'>
        <span className='font-medium'>
          {t('workflows.rules.unavailable', { type })}
        </span>
        <span className='block text-muted-foreground'>
          {t('workflows.rules.unavailableHint')}
        </span>
      </span>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('workflows.rules.removeUnavailable', { type })}
        onClick={() =>
          onChange((definition) => setRule(definition, status.key, type, null))
        }
      >
        <Trash2Icon />
      </Button>
    </section>
  );
}

/** A move on an event whose plugin is gone: it is kept until removed, and nobody fires it. */
function UnavailableAutoMove({
  status,
  definition,
  event,
  onChange,
}: {
  readonly status: WorkflowStatus;
  readonly definition: WorkflowDefinition;
  readonly event: string;
  readonly onChange: Change;
}): ReactElement {
  const { t } = useTranslation();
  const name = useStatusName(definition);
  const target = autoMoveAt(definition, status.key, event);
  return (
    <section
      className='flex items-start gap-3 rounded-lg border border-dashed p-3 text-sm'
      data-event-unavailable={event}
    >
      <CircleAlertIcon
        className='mt-0.5 size-4 shrink-0 text-muted-foreground'
        aria-hidden='true'
      />
      <span className='min-w-0 flex-1'>
        <span className='font-medium'>
          {t('workflows.autoMove.unavailable', {
            event,
            to: target ? name(target) : '',
          })}
        </span>
        <span className='block text-muted-foreground'>
          {t('workflows.autoMove.unavailableHint')}
        </span>
      </span>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('workflows.autoMove.removeUnavailable', { event })}
        onClick={() =>
          onChange((current) => setAutoMove(current, status.key, event, null))
        }
      >
        <Trash2Icon />
      </Button>
    </section>
  );
}

/** A workflow event as the dialog offers it: the built-in one or one another plugin contributes. */
interface EventChoice {
  readonly key: string;
  readonly title: string;
  readonly hint: string | null;
  /** Whether a move on it may leave a status of this category; one already there is kept either way. */
  readonly offered: boolean;
  /** Where it may take the issue: every other status within the categories it may enter. */
  readonly targets: readonly WorkflowStatus[];
}

function useEventChoices(
  status: WorkflowStatus,
  definition: WorkflowDefinition,
): readonly EventChoice[] {
  const { t } = useTranslation();
  const text = useTitleText();
  const events = useWorkflowEvents();
  const others = flowOrder(definition).filter(
    (state) => state.key !== status.key && state.key !== ANY_STATUS,
  );
  return [
    {
      key: SUBTASKS_EVENT,
      title: t('workflows.autoMove.subtasksTitle'),
      hint: t('workflows.autoMove.subtasksHint'),
      offered: true,
      targets: others,
    },
    ...events.map((event) => {
      const target = autoMoveAt(definition, status.key, event.key);
      return {
        key: event.key,
        title: t('workflows.autoMove.eventTitle', {
          event: text(event.title),
        }),
        hint: event.hint ? text(event.hint) : null,
        offered: eventAllows(event, 'from', status.category),
        targets: others.filter(
          (state) =>
            eventAllows(event, 'to', state.category) || state.key === target,
        ),
      };
    }),
  ];
}

/** An automatic move: where the system moves the issue when the event happens, chosen in the card. */
function AutoMoveCard({
  status,
  definition,
  choice,
  expanded,
  onExpandedChange,
  onRemove,
  onChange,
}: {
  readonly status: WorkflowStatus;
  readonly definition: WorkflowDefinition;
  readonly choice: EventChoice;
  readonly expanded: boolean;
  readonly onExpandedChange: (expanded: boolean) => void;
  readonly onRemove: () => void;
  readonly onChange: Change;
}): ReactElement {
  const { t } = useTranslation();
  const name = useStatusName(definition);
  const target = autoMoveAt(definition, status.key, choice.key);
  const id = `pm-rule-auto-move-${status.key}-${choice.key.replaceAll('.', '-')}`;
  return (
    <RuleCard
      title={choice.title}
      summary={
        target
          ? t('workflows.autoMove.summary', { to: name(target) })
          : t('workflows.autoMove.chooseTarget')
      }
      Icon={WorkflowIcon}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      removeLabel={t('workflows.rules.remove', { title: choice.title })}
      onRemove={onRemove}
      data={{ 'data-auto-move-event': choice.key }}
    >
      <div className='space-y-2 text-sm'>
        <label htmlFor={id} className='block font-medium'>
          {t('workflows.autoMove.target')}
        </label>
        <Select
          items={choice.targets.map((state) => ({
            value: state.key,
            label: name(state.key),
          }))}
          value={target}
          onValueChange={(value: string | null) => {
            if (value)
              onChange((current) =>
                setAutoMove(current, status.key, choice.key, value),
              );
          }}
        >
          <SelectTrigger id={id} className='w-full'>
            <SelectValue placeholder={t('workflows.autoMove.chooseTarget')} />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            {choice.targets.map((state) => (
              <SelectItem key={state.key} value={state.key}>
                {name(state.key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {choice.hint ? (
          <p className='text-muted-foreground'>{choice.hint}</p>
        ) : null}
        <p className='text-muted-foreground'>{t('workflows.autoMove.hint')}</p>
      </div>
    </RuleCard>
  );
}

/** One entry of the "Add rule" menu. */
interface AddItem {
  readonly key: string;
  readonly title: string;
  readonly hint: string | null;
  readonly add: () => void;
}

type AddGroup = StatusRuleGroup | 'autoMove';

function AddRuleMenu({
  groups,
}: {
  readonly groups: readonly {
    readonly key: AddGroup;
    readonly items: readonly AddItem[];
  }[];
}): ReactElement {
  const { t } = useTranslation();
  const shown = groups.filter((group) => group.items.length > 0);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='outline' size='sm' disabled={shown.length === 0} />
        }
      >
        <PlusIcon data-icon='inline-start' />
        {t('workflows.rules.add')}
        <ChevronDownIcon data-icon='inline-end' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        side='top'
        className='w-80 max-w-[calc(100vw-2rem)]'
      >
        {shown.map((group, index) => (
          <DropdownMenuGroup key={group.key} data-add-group={group.key}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>
              {t(`workflows.rules.groups.${group.key}`)}
            </DropdownMenuLabel>
            {group.items.map((item) => (
              <DropdownMenuItem
                key={item.key}
                className='flex-col items-start gap-0.5'
                data-add-rule={item.key}
                onClick={item.add}
              >
                <span className='font-medium'>{item.title}</span>
                {item.hint ? (
                  <span className='text-xs whitespace-normal text-muted-foreground'>
                    {item.hint}
                  </span>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The dialog's content: the status's rules, each a card collapsed to its title and summary and expanded to edit, its
 * automatic moves, what is unavailable, and the "Add rule" menu. Every rule type, this plugin's own and the contributed
 * ones, goes through the same path (`useStatusRuleTypes`).
 */
function StatusRulesBody({
  status,
  statusName,
  definition,
  onChange,
  onDone,
}: {
  readonly status: WorkflowStatus;
  readonly statusName: string;
  readonly definition: WorkflowDefinition;
  readonly onChange: Change;
  readonly onDone: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const text = useTitleText();
  const types = useStatusRuleTypes();
  const known = new Map(types.map((type) => [type.type, type]));
  const events = useWorkflowEvents();
  const choices = useEventChoices(status, definition);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // Automatic moves added from the menu without a target yet: the definition has nothing of them until one is chosen.
  const [pending, setPending] = useState<readonly string[]>([]);
  const toggle = (key: string) => (open: boolean) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (open) next.add(key);
      else next.delete(key);
      return next;
    });
  const rules = status.rules ?? [];
  const ruleStatus = {
    key: status.key,
    name: statusName,
    category: status.category,
  };
  const setConfig = (type: string, config: StatusRuleConfig | null) =>
    onChange((current) =>
      setRule(
        current,
        status.key,
        type,
        config === null ? null : { type, config },
      ),
    );

  const moves = choices.filter(
    (choice) =>
      autoMoveAt(definition, status.key, choice.key) !== null ||
      pending.includes(choice.key),
  );
  const knownEvents = new Set(events.map((event) => event.key));
  const unavailableMoves = definition.transitions.flatMap((transition) =>
    transition.on &&
    transition.from === status.key &&
    !isBuiltInEvent(transition.on) &&
    !knownEvents.has(transition.on)
      ? [transition.on]
      : [],
  );

  const addType = (type: StatusRuleTypeUI) => {
    onChange((current) =>
      setRule(
        current,
        status.key,
        type.type,
        type.initialConfig
          ? { type: type.type, config: type.initialConfig }
          : { type: type.type },
      ),
    );
    if (type.Editor) toggle(`rule:${type.type}`)(true);
  };
  const ruleItems = (group: StatusRuleGroup): AddItem[] =>
    types
      .filter(
        (type) =>
          groupOf(type) === group &&
          allowedOn(type, status.category) &&
          !contributedRuleOf(status, type.type),
      )
      .map((type) => ({
        key: type.type,
        title: text(type.title),
        hint: type.hint ? text(type.hint) : null,
        add: () => addType(type),
      }));
  const moveItems: AddItem[] = choices
    .filter((choice) => choice.offered && !moves.includes(choice))
    .map((choice) => ({
      key: choice.key,
      title: choice.title,
      hint: choice.hint,
      add: () => {
        setPending((current) => [...current, choice.key]);
        toggle(`event:${choice.key}`)(true);
      },
    }));

  const empty =
    rules.length === 0 && moves.length === 0 && unavailableMoves.length === 0;
  return (
    <>
      <div
        className='min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3'
        data-status-rules={status.key}
      >
        {empty ? (
          <p className='py-4 text-center text-muted-foreground'>
            {t('workflows.rules.empty')}
          </p>
        ) : null}
        {rules.map((rule) => {
          const type = known.get(rule.type);
          if (!type)
            return (
              <UnavailableRule
                key={rule.type}
                status={status}
                type={rule.type}
                onChange={onChange}
              />
            );
          const key = `rule:${type.type}`;
          const config = ('config' in rule ? rule.config : undefined) ?? {};
          const title = text(type.title);
          return (
            <RuleCard
              key={key}
              title={title}
              summary={createElement(type.Summary, {
                config,
                status: ruleStatus,
              })}
              Icon={type.Icon ?? PuzzleIcon}
              expanded={expanded.has(key)}
              onExpandedChange={toggle(key)}
              removeLabel={t('workflows.rules.remove', { title })}
              onRemove={() => setConfig(type.type, null)}
              data={{ 'data-rule-type': type.type }}
            >
              {type.Editor
                ? createElement(type.Editor, {
                    config,
                    onChange: (next) => setConfig(type.type, next),
                    status: ruleStatus,
                    idPrefix: `pm-rule-${type.type}-${status.key}`,
                  })
                : null}
            </RuleCard>
          );
        })}
        {moves.map((choice) => {
          const key = `event:${choice.key}`;
          return (
            <AutoMoveCard
              key={key}
              status={status}
              definition={definition}
              choice={choice}
              expanded={expanded.has(key)}
              onExpandedChange={toggle(key)}
              onRemove={() => {
                setPending((current) =>
                  current.filter((item) => item !== choice.key),
                );
                onChange((current) =>
                  setAutoMove(current, status.key, choice.key, null),
                );
              }}
              onChange={onChange}
            />
          );
        })}
        {unavailableMoves.map((event) => (
          <UnavailableAutoMove
            key={event}
            status={status}
            definition={definition}
            event={event}
            onChange={onChange}
          />
        ))}
      </div>
      <DialogFooter className='mx-0 mb-0 flex-row items-center justify-between gap-2 sm:justify-between'>
        <AddRuleMenu
          groups={[
            { key: 'action', items: ruleItems('action') },
            { key: 'condition', items: ruleItems('condition') },
            { key: 'autoMove', items: moveItems },
          ]}
        />
        <Button onClick={onDone}>{t('workflows.rules.done')}</Button>
      </DialogFooter>
    </>
  );
}

/**
 * What entering a status does, in a dialog opened from its row: the rules it has, each a card collapsed to its title
 * and a one-line summary, and an "Add rule" menu listing what it may still have, by group: actions on entering, entry
 * conditions, and automatic moves (where the system moves the issue once its sub-issues are finished, or on an event
 * another plugin contributes through `WorkflowEventsContext`). A rule whose plugin is gone, or a move on an event
 * whose plugin is gone, is listed to be removed. The dialog keeps its height and scrolls inside, so its footer stays
 * in view. Changes go into the draft; the page's Save sends them with the rest. `add` (a status without rules) shows
 * the button as "Add rule" instead of the settings icon.
 */
export function StatusRulesButton({
  status,
  definition,
  label,
  add = false,
  onChange,
}: {
  readonly status: WorkflowStatus;
  readonly definition: WorkflowDefinition;
  readonly label: string;
  readonly add?: boolean;
  readonly onChange: Change;
}): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const name = t('workflows.rules.edit', { name: label });
  return (
    <>
      {add ? (
        <Button
          variant='outline'
          size='sm'
          aria-label={name}
          onClick={() => setOpen(true)}
        >
          <PlusIcon data-icon='inline-start' />
          {t('workflows.rules.add')}
        </Button>
      ) : (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={name}
          title={name}
          onClick={() => setOpen(true)}
        >
          <Settings2Icon />
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl'>
          <DialogHeader className='border-b p-4 pr-10'>
            <DialogTitle>
              {t('workflows.rules.title', { name: label })}
            </DialogTitle>
            <DialogDescription>
              {t('workflows.rules.description')}
            </DialogDescription>
          </DialogHeader>
          {open ? (
            <StatusRulesBody
              status={status}
              statusName={label}
              definition={definition}
              onChange={onChange}
              onDone={() => setOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
