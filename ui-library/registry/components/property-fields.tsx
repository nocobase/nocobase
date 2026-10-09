/**
 * The fields of a record's property card, presented: the titled card, a row of label and value, a select, chips with
 * creation, a calendar date, a whole number, a person or agent as a chosen value, and a row of people's avatars. Purely
 * presentational: values in, changes out. Every word comes from the props or from `labels`.
 */
import { format, type Locale } from 'date-fns';
import { BotIcon, CalendarIcon, Loader2Icon, XIcon } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '#components/ui/avatar';
import { Button } from '#components/ui/button';
import { Calendar } from '#components/ui/calendar';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '#components/ui/combobox';
import { Input } from '#components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { cn } from 'cn';

/** The words the fields show; `createNamed` fills `{name}`. */
export interface PropertyFieldLabels {
  readonly saving: string;
  readonly createNamed: string;
  readonly noOptions: string;
}

const defaultPropertyFieldLabels: PropertyFieldLabels = {
  saving: 'Saving…',
  createNamed: 'Create "{name}"',
  noOptions: 'No options',
};

function fill(text: string, values: Readonly<Record<string, string>>): string {
  return text.replace(
    /\{(\w+)\}/gu,
    (whole, key: string) => values[key] ?? whole,
  );
}

const CARD = 'space-y-3 rounded-lg border bg-card p-4 text-card-foreground';

/** A card of the side column, titled, with a spinner while something saves. */
export function PropertyCard({
  title,
  busy = false,
  children,
  labels = defaultPropertyFieldLabels,
}: {
  readonly title: string;
  readonly busy?: boolean;
  readonly children: ReactNode;
  readonly labels?: PropertyFieldLabels;
}): ReactElement {
  return (
    <section className={CARD} aria-label={title}>
      <h2 className='flex items-center gap-2 text-sm font-semibold'>
        {title}
        {busy ? (
          <Loader2Icon
            className='size-3.5 animate-spin text-muted-foreground'
            aria-label={labels.saving}
          />
        ) : null}
      </h2>
      {children}
    </section>
  );
}

/** A label and its value, one row of a card. */
export function PropertyRow({
  label,
  htmlFor,
  children,
}: {
  readonly label: ReactNode;
  readonly htmlFor?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 text-sm'>
      {htmlFor ? (
        <label htmlFor={htmlFor} className='text-muted-foreground'>
          {label}
        </label>
      ) : (
        <span className='text-muted-foreground'>{label}</span>
      )}
      <div className='min-w-0'>{children}</div>
    </div>
  );
}

export interface PropertyOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  /** A note beside the label, such as why it cannot be chosen. */
  readonly note?: string;
  /** Before the label, such as an agent's icon. */
  readonly icon?: ReactNode;
}

const NONE = '__none__';

/**
 * A select over options; `noneLabel` adds an empty choice, shown as a dash. `renderValue` draws the chosen one, such as
 * a status badge.
 */
export function PropertySelect({
  id,
  options,
  value,
  noneLabel,
  disabled,
  renderValue,
  onChange,
}: {
  readonly id: string;
  readonly options: readonly PropertyOption[];
  readonly value: string | null;
  readonly noneLabel?: string;
  readonly disabled?: boolean;
  readonly renderValue?: (value: string) => ReactNode;
  readonly onChange: (value: string | null) => void;
}): ReactElement {
  const items: PropertyOption[] = [
    ...(noneLabel ? [{ value: NONE, label: noneLabel }] : []),
    ...options,
  ];
  const selected = value ?? NONE;
  if (!items.some((item) => item.value === selected))
    items.push({ value: selected, label: selected });
  return (
    <Select
      items={items}
      value={selected}
      disabled={disabled}
      onValueChange={(next: string | null) => {
        if (next === null || next === selected) return;
        onChange(next === NONE ? null : next);
      }}
    >
      <SelectTrigger id={id} size='sm' className='w-full'>
        <SelectValue className='min-w-0'>
          {(current: string) => {
            const item = items.find((entry) => entry.value === current);
            if (current === NONE)
              return (
                <span className='text-muted-foreground'>
                  —<span className='sr-only'>{noneLabel}</span>
                </span>
              );
            if (renderValue) return renderValue(current);
            return (
              <span className='flex min-w-0 items-center gap-2'>
                {item?.icon}
                <span className='truncate'>{item?.label ?? current}</span>
              </span>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(24rem,var(--available-width))] min-w-(--anchor-width)'>
        {items.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
            disabled={item.disabled === true && item.value !== selected}
          >
            <span className='flex min-w-0 items-center gap-2'>
              {item.icon ? (
                <span className='flex shrink-0 text-muted-foreground [&_svg]:size-3.5'>
                  {item.icon}
                </span>
              ) : null}
              <span className='truncate'>{item.label}</span>
              {item.note ? (
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {item.note}
                </span>
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const CREATE = '\u0000create:';

/**
 * Chips over options, as tall as the other fields while they fit one line; with `onCreate`, typing a new name offers
 * to create it and selects the id it answers. `action` sits inside the field at its end, such as a button that
 * recolours the chosen items.
 */
export function PropertyMultiSelect({
  id,
  options,
  value,
  disabled,
  placeholder,
  onCreate,
  onChange,
  action,
  labels = defaultPropertyFieldLabels,
  'aria-label': ariaLabel,
}: {
  readonly id: string;
  readonly options: readonly (PropertyOption & {
    readonly render?: ReactNode;
  })[];
  readonly value: readonly string[];
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly onCreate?: (name: string) => Promise<string | undefined>;
  readonly onChange: (value: string[]) => void;
  readonly action?: ReactNode;
  readonly labels?: PropertyFieldLabels;
  readonly 'aria-label'?: string;
}): ReactElement {
  const anchor = useComboboxAnchor();
  const [input, setInput] = useState('');
  const [creating, setCreating] = useState(false);
  const byValue = new Map(options.map((option) => [option.value, option]));
  const typed = input.trim();
  const canCreate =
    onCreate !== undefined &&
    typed !== '' &&
    !options.some(
      (option) => option.label.toLowerCase() === typed.toLowerCase(),
    );
  const items = [
    ...options.map((option) => option.value),
    ...(canCreate ? [CREATE + typed] : []),
  ];
  const labelOf = (item: string): string =>
    item.startsWith(CREATE)
      ? fill(labels.createNamed, { name: item.slice(CREATE.length) })
      : (byValue.get(item)?.label ?? item);
  const change = async (next: string[]): Promise<void> => {
    const created = next.find((item) => item.startsWith(CREATE));
    const kept = next.filter((item) => !item.startsWith(CREATE));
    if (!created || !onCreate) {
      onChange(kept);
      return;
    }
    setCreating(true);
    try {
      const newId = await onCreate(created.slice(CREATE.length));
      onChange(newId ? [...kept, newId] : kept);
      setInput('');
    } finally {
      setCreating(false);
    }
  };
  return (
    <Combobox
      multiple
      autoHighlight
      items={items}
      value={[...value]}
      disabled={disabled || creating}
      itemToStringLabel={labelOf}
      inputValue={input}
      onInputValueChange={setInput}
      onValueChange={(next: string[]) => void change(next)}
    >
      <ComboboxChips
        ref={anchor}
        className={cn('relative min-h-7 py-0.5', action ? 'pr-7' : undefined)}
      >
        <ComboboxValue>
          {value.map((item) => (
            <ComboboxChip key={item}>
              {byValue.get(item)?.render ?? labelOf(item)}
            </ComboboxChip>
          ))}
        </ComboboxValue>
        <ComboboxChipsInput
          id={id}
          aria-label={ariaLabel}
          className='min-w-6'
          placeholder={value.length === 0 ? placeholder : undefined}
        />
        {action ? (
          // Its own control: pressing it neither focuses the search nor opens the options.
          <span
            className='absolute top-0.5 right-0.5 flex items-center'
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            {action}
          </span>
        ) : null}
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{labels.noOptions}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem
              key={item}
              value={item}
              disabled={byValue.get(item)?.disabled}
            >
              {byValue.get(item)?.render ?? labelOf(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function fromDateOnly(value: string | null): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
}

function toDateOnly(date: Date | undefined): string | null {
  if (!date) return null;
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * A calendar date (`YYYY-MM-DD`) with a clear button: the shadcn Date Picker composition, a `Button` that opens a
 * `Calendar` in a `Popover`.
 */
export function PropertyDate({
  id,
  value,
  disabled,
  clearLabel,
  dateLocale,
  onChange,
}: {
  readonly id: string;
  readonly value: string | null;
  readonly disabled?: boolean;
  readonly clearLabel: string;
  /** A `date-fns` locale for the trigger and the calendar. */
  readonly dateLocale?: Locale;
  readonly onChange: (value: string | null) => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const selected = fromDateOnly(value);
  return (
    <div className='flex w-full min-w-0 items-center gap-1'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant='outline'
              disabled={disabled}
              data-empty={!selected}
              className='h-7 min-w-0 flex-1 justify-start px-2.5 text-left text-sm font-normal data-[empty=true]:text-muted-foreground'
            />
          }
        >
          <CalendarIcon data-icon='inline-start' />
          {selected ? (
            <span className='truncate'>
              {format(selected, 'PP', { locale: dateLocale })}
            </span>
          ) : (
            <span>—</span>
          )}
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            locale={dateLocale}
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange(toDateOnly(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value ? (
        <Button
          variant='ghost'
          size='icon-xs'
          className='shrink-0'
          aria-label={clearLabel}
          disabled={disabled}
          onClick={() => onChange(null)}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}

/** A whole number from 0 to `max`, or empty; saved on blur or Enter, anything else goes back. */
export function PropertyNumber({
  id,
  value,
  max,
  disabled,
  placeholder,
  invalidText,
  onChange,
}: {
  readonly id: string;
  readonly value: number | null;
  readonly max: number;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly invalidText?: string;
  readonly onChange: (value: number | null) => void;
}): ReactElement {
  const saved = value === null ? '' : String(value);
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? saved;
  const trimmed = text.trim();
  const valid =
    trimmed === '' || (/^\d{1,6}$/u.test(trimmed) && Number(trimmed) <= max);
  const commit = (): void => {
    setDraft(null);
    if (!valid || trimmed === saved) return;
    onChange(trimmed === '' ? null : Number(trimmed));
  };
  return (
    <Input
      id={id}
      inputMode='numeric'
      value={text}
      disabled={disabled}
      placeholder={placeholder}
      aria-invalid={valid ? undefined : true}
      title={valid ? undefined : invalidText}
      className='h-8'
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit();
        if (event.key === 'Escape') setDraft(null);
      }}
    />
  );
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  const first = words[0];
  if (!first) return '?';
  const [head = '?'] = [...first];
  // A script without letter case (CJK and the like) shows its first character alone.
  if (head.toUpperCase() === head.toLowerCase() && !/\d/u.test(head))
    return head;
  if (words.length === 1) return [...first].slice(0, 2).join('').toUpperCase();
  return `${head}${[...(words.at(-1) ?? '')][0] ?? ''}`.toUpperCase();
}

/** An agent's icon, for options of a kind other than a person. */
export function AgentIcon(): ReactElement {
  return <BotIcon aria-hidden='true' />;
}

export interface AvatarPerson {
  readonly id: string;
  readonly name: string;
  /** Their picture; without one the avatar shows their initials. */
  readonly avatar?: string | null;
  /** Shown after the name in the tooltip, such as why they follow or their role. */
  readonly detail?: string;
}

/** Up to `max` people as a shadcn AvatarGroup, each named in a tooltip, then an AvatarGroupCount "+N". */
export function PeopleAvatars({
  people,
  label,
  max = 5,
}: {
  readonly people: readonly AvatarPerson[];
  /** The group's accessible name, such as "3 followers". */
  readonly label: string;
  readonly max?: number;
}): ReactElement {
  const shown = people.slice(0, max);
  return (
    <AvatarGroup
      role='group'
      aria-label={label}
      className='*:data-[slot=avatar]:ring-card'
    >
      {shown.map((person) => (
        <Tooltip key={person.id}>
          <TooltipTrigger
            render={
              <Avatar size='sm'>
                {person.avatar ? (
                  <AvatarImage src={person.avatar} alt='' />
                ) : null}
                <AvatarFallback className='whitespace-nowrap'>
                  {initials(person.name)}
                </AvatarFallback>
              </Avatar>
            }
          />
          <TooltipContent>
            {person.detail ? `${person.name} · ${person.detail}` : person.name}
          </TooltipContent>
        </Tooltip>
      ))}
      {people.length > shown.length ? (
        <AvatarGroupCount className='text-xs ring-card'>
          +{people.length - shown.length}
        </AvatarGroupCount>
      ) : null}
    </AvatarGroup>
  );
}

/**
 * A person or agent with the name, for a property's chosen value. An agent shows its bot icon and a person their
 * picture when they have one; a person without a picture shows the name alone, since initials beside it say nothing
 * more.
 */
export function PersonValue({
  name,
  avatar,
  agent = false,
}: {
  readonly name: string;
  /** The person's picture. */
  readonly avatar?: string | null;
  readonly agent?: boolean;
}): ReactElement {
  if (!agent && !avatar) return <span className='truncate'>{name}</span>;
  return (
    <span className='inline-flex min-w-0 items-center gap-1.5'>
      <Avatar
        size='sm'
        aria-hidden
        className={cn('size-4', agent && 'rounded-md after:rounded-md')}
      >
        {agent || !avatar ? null : <AvatarImage src={avatar} alt='' />}
        <AvatarFallback
          className={cn('[&_svg]:size-2.5', agent && 'rounded-md')}
        >
          {agent ? <BotIcon /> : null}
        </AvatarFallback>
      </Avatar>
      <span className='truncate'>{name}</span>
    </span>
  );
}
