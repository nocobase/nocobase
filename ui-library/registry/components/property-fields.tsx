/**
 * The fields of a record's property card, presented: the titled card, a row of label and value, a select, chips with
 * creation, a calendar date, a whole number, a line of text, a long text, a link, a person or agent as a chosen value,
 * and a row of people's avatars. Purely presentational: values in, changes out. Every word comes from the props or
 * from `labels`.
 *
 * A card draws its fields in one of two ways. `form`, the default, shows every value in its control, ready to change.
 * `inline` reads first: a value is plain text, shaded under the pointer while it may be edited, and turns into its
 * control on a double-click, Enter or F2, a single click leaving its words selectable to copy; a picker saves on the
 * pick, a typed value when it loses focus, and Escape leaves it as it was. A long text opens whole in a pop-up on a
 * click and edits on a double-click; a link, which a click and a double-click would open, is edited from a pencil
 * shown on hover.
 */
import { format, type Locale } from 'date-fns';
import {
  BotIcon,
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PencilLineIcon,
  XIcon,
} from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '#components/ui/avatar';
import { Button, buttonVariants } from '#components/ui/button';
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
import { Textarea } from '#components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { cn } from 'cn';

import { FadingText } from './long-text.js';

/** The words the fields show; `createNamed` fills `{name}`, and `edit` and `open` fill `{label}`. */
export interface PropertyFieldLabels {
  readonly saving: string;
  readonly createNamed: string;
  readonly noOptions: string;
  /** A row's copy button, and what it says once it has copied. */
  readonly copy?: string;
  readonly copied?: string;
  /** The pencil that edits a value a click would open. */
  readonly edit?: string;
  /** A link's button in the form variant. */
  readonly open?: string;
}

const defaultPropertyFieldLabels: PropertyFieldLabels = {
  saving: 'Saving…',
  createNamed: 'Create "{name}"',
  noOptions: 'No options',
  copy: 'Copy',
  copied: 'Copied',
  edit: 'Edit {label}',
  open: 'Open {label}',
};

function fill(text: string, values: Readonly<Record<string, string>>): string {
  return text.replace(
    /\{(\w+)\}/gu,
    (whole, key: string) => values[key] ?? whole,
  );
}

const CARD = 'space-y-3 rounded-lg border bg-card p-4 text-card-foreground';

/** How a card draws its fields: each value in its control (`form`), or as text edited on a double-click (`inline`). */
export type PropertyCardVariant = 'form' | 'inline';

interface PropertyCardContextValue {
  readonly variant: PropertyCardVariant;
  readonly labels: PropertyFieldLabels;
}

const PropertyCardContext = createContext<PropertyCardContextValue>({
  variant: 'form',
  labels: defaultPropertyFieldLabels,
});

function useCard(labels?: PropertyFieldLabels): PropertyCardContextValue {
  const card = useContext(PropertyCardContext);
  return labels
    ? { variant: card.variant, labels: { ...card.labels, ...labels } }
    : card;
}

/** A card of the side column, titled, with a spinner while something saves. `variant` draws its fields. */
export function PropertyCard({
  title,
  busy = false,
  variant = 'form',
  children,
  labels = defaultPropertyFieldLabels,
}: {
  readonly title: string;
  readonly busy?: boolean;
  readonly variant?: PropertyCardVariant;
  readonly children: ReactNode;
  readonly labels?: PropertyFieldLabels;
}): ReactElement {
  const merged = { ...defaultPropertyFieldLabels, ...labels };
  return (
    <PropertyCardContext.Provider value={{ variant, labels: merged }}>
      <section
        className={cn(CARD, variant === 'inline' && 'space-y-1')}
        aria-label={title}
        data-variant={variant}
      >
        <h2
          className={cn(
            'flex items-center gap-2 text-sm font-semibold',
            variant === 'inline' && 'pb-2',
          )}
        >
          {title}
          {busy ? (
            <Loader2Icon
              className='size-3.5 animate-spin text-muted-foreground'
              aria-label={merged.saving}
            />
          ) : null}
        </h2>
        {children}
      </section>
    </PropertyCardContext.Provider>
  );
}

const ROW_ACTION =
  'size-6 place-items-center rounded-md bg-card text-muted-foreground transition-colors hover:bg-hover hover:text-foreground';

/**
 * A label and its value, one row of a card. `copyable` adds a button at the row's end, shown under the pointer, that
 * copies the value as it reads, or the `data-copy` a value carries (a link's whole address); it is not shown while the
 * value is empty or being edited.
 */
export function PropertyRow({
  label,
  htmlFor,
  copyable = false,
  children,
}: {
  readonly label: ReactNode;
  readonly htmlFor?: string;
  readonly copyable?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  const { variant, labels } = useCard();
  const valueRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = (): void => {
    const element = valueRef.current;
    const value = (
      element?.querySelector('[data-copy]')?.getAttribute('data-copy') ??
      element?.innerText ??
      element?.textContent ??
      ''
    ).trim();
    if (!value) return;
    void navigator.clipboard
      ?.writeText(value)
      .then(() => setCopied(true))
      .catch(() => undefined);
  };
  const copyLabel = copied ? labels.copied : labels.copy;
  return (
    <div
      className={cn(
        'group/row grid grid-cols-[6rem_minmax(0,1fr)] gap-3 text-sm',
        variant === 'inline' ? 'items-start' : 'items-center',
      )}
    >
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          className={cn(
            'text-muted-foreground',
            variant === 'inline' && 'py-1',
          )}
        >
          {label}
        </label>
      ) : (
        <span
          className={cn(
            'text-muted-foreground',
            variant === 'inline' && 'py-1',
          )}
        >
          {label}
        </span>
      )}
      <div ref={valueRef} className='relative min-w-0'>
        {children}
        {copyable ? (
          <button
            type='button'
            aria-label={copyLabel}
            title={copyLabel}
            onClick={copy}
            className={cn(
              'absolute top-0.5 right-0.5 hidden group-focus-within/row:grid group-hover/row:grid group-has-[[data-editing]]/row:hidden! group-has-[[data-placeholder]]/row:hidden!',
              ROW_ACTION,
            )}
          >
            {copied ? (
              <CheckIcon aria-hidden='true' className='size-3.5' />
            ) : (
              <CopyIcon aria-hidden='true' className='size-3.5' />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** A value's placeholder, or a dash: what an empty value shows, marked so a row does not offer to copy it. */
function Empty({
  placeholder,
}: {
  readonly placeholder?: string;
}): ReactElement {
  return (
    <span data-placeholder='' className='text-muted-foreground'>
      {placeholder ?? '—'}
    </span>
  );
}

/**
 * An inline card's value at rest: its text, shaded under the pointer while it may be edited, entering editing on a
 * double-click, Enter or F2. Not a button: a single click leaves its words selectable to copy.
 */
function InlineValue({
  id,
  label,
  editable,
  onEdit,
  className,
  children,
}: {
  readonly id?: string;
  readonly label?: string;
  readonly editable: boolean;
  readonly onEdit: () => void;
  readonly className?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div
      id={id}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      aria-label={editable ? label : undefined}
      className={cn(
        '-mx-2 min-h-7 rounded-md px-2 py-1 break-words select-text',
        editable && 'cursor-text transition-colors hover:bg-hover',
        className,
      )}
      onDoubleClick={
        editable
          ? () => {
              // The double-click also selected a word; left alone, it would stay selected over the editor.
              window.getSelection()?.removeAllRanges();
              onEdit();
            }
          : undefined
      }
      onKeyDown={
        editable
          ? (event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === 'Enter' || event.key === 'F2') {
                event.preventDefault();
                onEdit();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

/**
 * A typed value's draft: saved on blur or Enter (Cmd/Ctrl+Enter in a multi-line one), Escape putting it back. `done`
 * runs after either, which an inline card uses to leave editing.
 */
function useDraft<T>(
  saved: string,
  parse: (text: string) => { valid: boolean; value: T },
  onChange: (value: T) => void,
  done?: () => void,
): {
  readonly text: string;
  readonly valid: boolean;
  readonly setText: (text: string) => void;
  readonly commit: () => void;
  readonly cancel: () => void;
} {
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? saved;
  const parsed = parse(text);
  return {
    text,
    valid: parsed.valid,
    setText: setDraft,
    commit: () => {
      setDraft(null);
      if (parsed.valid && text.trim() !== saved.trim()) onChange(parsed.value);
      done?.();
    },
    cancel: () => {
      setDraft(null);
      done?.();
    },
  };
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
  'aria-label': ariaLabel,
}: {
  readonly id: string;
  readonly options: readonly PropertyOption[];
  readonly value: string | null;
  readonly noneLabel?: string;
  readonly disabled?: boolean;
  readonly renderValue?: (value: string) => ReactNode;
  readonly onChange: (value: string | null) => void;
  /** The value's accessible name while an inline card shows it as text. */
  readonly 'aria-label'?: string;
}): ReactElement {
  const { variant } = useCard();
  const [editing, setEditing] = useState(false);
  const items: PropertyOption[] = [
    ...(noneLabel ? [{ value: NONE, label: noneLabel }] : []),
    ...options,
  ];
  const selected = value ?? NONE;
  if (!items.some((item) => item.value === selected))
    items.push({ value: selected, label: selected });
  const show = (current: string): ReactNode => {
    const item = items.find((entry) => entry.value === current);
    if (current === NONE)
      return (
        <span data-placeholder='' className='text-muted-foreground'>
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
  };
  const inline = variant === 'inline';
  if (inline && !editing)
    return (
      <InlineValue
        id={id}
        label={ariaLabel}
        editable={!disabled}
        onEdit={() => setEditing(true)}
        className='flex items-center'
      >
        {show(selected)}
      </InlineValue>
    );
  return (
    <Select
      items={items}
      value={selected}
      disabled={disabled}
      // Inline, the list opens as editing starts, and closing it ends editing.
      defaultOpen={inline}
      onOpenChange={(open) => {
        if (inline && !open) setEditing(false);
      }}
      onValueChange={(next: string | null) => {
        if (next === null || next === selected) return;
        onChange(next === NONE ? null : next);
      }}
    >
      <SelectTrigger
        id={id}
        size='sm'
        data-editing={inline ? '' : undefined}
        className='w-full'
      >
        <SelectValue className='min-w-0'>{show}</SelectValue>
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
  const { variant } = useCard();
  const [editing, setEditing] = useState(false);
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
  const inline = variant === 'inline';
  if (inline && !editing)
    return (
      <InlineValue
        id={id}
        label={ariaLabel}
        editable={!disabled}
        onEdit={() => setEditing(true)}
        className='flex flex-wrap items-center gap-1'
      >
        {value.length === 0 ? (
          <Empty placeholder={placeholder} />
        ) : (
          value.map((item) => (
            <span
              key={item}
              className='inline-flex h-5 items-center rounded-sm bg-muted px-1.5 text-xs font-medium'
            >
              {byValue.get(item)?.render ?? labelOf(item)}
            </span>
          ))
        )}
      </InlineValue>
    );
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
      // Inline, the options open as editing starts, and closing them ends editing.
      defaultOpen={inline}
      onOpenChange={(open) => {
        if (inline && !open && !creating) setEditing(false);
      }}
    >
      <ComboboxChips
        ref={anchor}
        data-editing={inline ? '' : undefined}
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
          autoFocus={inline}
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
  'aria-label': ariaLabel,
}: {
  readonly id: string;
  readonly value: string | null;
  readonly disabled?: boolean;
  readonly clearLabel: string;
  /** A `date-fns` locale for the trigger and the calendar. */
  readonly dateLocale?: Locale;
  readonly onChange: (value: string | null) => void;
  /** The value's accessible name while an inline card shows it as text. */
  readonly 'aria-label'?: string;
}): ReactElement {
  const { variant } = useCard();
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const selected = fromDateOnly(value);
  const inline = variant === 'inline';
  const text = selected ? format(selected, 'PP', { locale: dateLocale }) : null;
  if (inline && !editing)
    return (
      <InlineValue
        id={id}
        label={ariaLabel}
        editable={!disabled}
        onEdit={() => {
          setEditing(true);
          setOpen(true);
        }}
      >
        {text ?? <Empty />}
      </InlineValue>
    );
  return (
    <div
      className='flex w-full min-w-0 items-center gap-1'
      data-editing={inline ? '' : undefined}
    >
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (inline && !next) setEditing(false);
        }}
      >
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
          {text ? <span className='truncate'>{text}</span> : <span>—</span>}
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
              if (inline) setEditing(false);
            }}
          />
          {inline && value ? (
            // Inline, a click beside the calendar ends editing, so clearing is offered under it.
            <div className='border-t p-2'>
              <Button
                variant='ghost'
                size='sm'
                className='w-full'
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                  setEditing(false);
                }}
              >
                <XIcon data-icon='inline-start' />
                {clearLabel}
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
      {!inline && value ? (
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
  'aria-label': ariaLabel,
}: {
  readonly id: string;
  readonly value: number | null;
  readonly max: number;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly invalidText?: string;
  readonly onChange: (value: number | null) => void;
  /** The value's accessible name while an inline card shows it as text. */
  readonly 'aria-label'?: string;
}): ReactElement {
  const { variant } = useCard();
  const [editing, setEditing] = useState(false);
  const inline = variant === 'inline';
  const draft = useDraft(
    value === null ? '' : String(value),
    (text) => {
      const trimmed = text.trim();
      return {
        valid:
          trimmed === '' ||
          (/^\d{1,6}$/u.test(trimmed) && Number(trimmed) <= max),
        value: trimmed === '' ? null : Number(trimmed),
      };
    },
    onChange,
    inline ? () => setEditing(false) : undefined,
  );
  if (inline && !editing)
    return (
      <InlineValue
        id={id}
        label={ariaLabel}
        editable={!disabled}
        onEdit={() => setEditing(true)}
        className='tabular-nums'
      >
        {value === null ? <Empty placeholder={placeholder} /> : value}
      </InlineValue>
    );
  return (
    <Input
      id={id}
      inputMode='numeric'
      autoFocus={inline}
      value={draft.text}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-invalid={draft.valid ? undefined : true}
      title={draft.valid ? undefined : invalidText}
      data-editing={inline ? '' : undefined}
      className={inline ? 'h-7' : 'h-8'}
      onChange={(event) => draft.setText(event.target.value)}
      onBlur={draft.commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') draft.commit();
        if (event.key === 'Escape') draft.cancel();
      }}
    />
  );
}

/** A line of text, or empty; saved on blur or Enter, Escape putting it back. */
export function PropertyText({
  id,
  value,
  disabled,
  placeholder,
  onChange,
  'aria-label': ariaLabel,
}: {
  readonly id: string;
  readonly value: string | null;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly onChange: (value: string | null) => void;
  /** The value's accessible name while an inline card shows it as text. */
  readonly 'aria-label'?: string;
}): ReactElement {
  const { variant } = useCard();
  const [editing, setEditing] = useState(false);
  const inline = variant === 'inline';
  const draft = useDraft(
    value ?? '',
    (text) => ({ valid: true, value: text.trim() === '' ? null : text.trim() }),
    onChange,
    inline ? () => setEditing(false) : undefined,
  );
  if (inline && !editing)
    return (
      <InlineValue
        id={id}
        label={ariaLabel}
        editable={!disabled}
        onEdit={() => setEditing(true)}
      >
        {value ? value : <Empty placeholder={placeholder} />}
      </InlineValue>
    );
  return (
    <Input
      id={id}
      autoFocus={inline}
      value={draft.text}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      data-editing={inline ? '' : undefined}
      className={inline ? 'h-7' : 'h-8'}
      onChange={(event) => draft.setText(event.target.value)}
      onBlur={draft.commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') draft.commit();
        if (event.key === 'Escape') draft.cancel();
      }}
    />
  );
}

/**
 * A long text, or empty: a description, an introduction, an address. The form variant edits it in a textarea. An
 * inline card shows three lines that fade out while there is more; a click opens a pop-up beside the column, wide
 * enough to read the whole text and to edit it there with a double-click (straight into the editor while it is
 * empty), so the column never grows. Leaving the pop-up saves the edit, Cmd/Ctrl+Enter saves at once, and Escape
 * leaves the text as it was.
 */
export function PropertyLongText({
  id,
  label,
  value,
  disabled,
  placeholder,
  onChange,
}: {
  readonly id: string;
  /** What the text is, such as "Introduction": its pop-up's heading and its editor's accessible name. */
  readonly label: string;
  readonly value: string | null;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly onChange: (value: string | null) => void;
}): ReactElement {
  const { variant } = useCard();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const editable = !disabled;
  const blank = !value?.trim();
  const edit = (): void => {
    setDraft(value ?? '');
    setEditing(true);
  };
  const save = (): void => {
    const next = draft.trim() === '' ? null : draft;
    if (next !== value) onChange(next);
    setEditing(false);
  };
  if (variant === 'form')
    return (
      <FormLongText
        id={id}
        label={label}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={onChange}
      />
    );
  if (blank && !editable)
    return (
      <div className='-mx-2 px-2 py-1'>
        <Empty placeholder={placeholder} />
      </div>
    );
  return (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        if (next) {
          setOpen(true);
          if (blank) edit();
          return;
        }
        // Escape leaves the text as it was; any other way out saves it.
        if (editing && details.reason !== 'escape-key') save();
        setEditing(false);
        setOpen(false);
      }}
    >
      <PopoverTrigger
        id={id}
        nativeButton={false}
        aria-label={label}
        render={<div />}
        className='-mx-2 block cursor-pointer rounded-md px-2 py-1 text-left transition-colors hover:bg-hover'
      >
        {blank ? (
          <Empty placeholder={placeholder} />
        ) : (
          <FadingText>{value}</FadingText>
        )}
      </PopoverTrigger>
      {/* Beside the column, toward the page's middle; a very long text scrolls inside. */}
      <PopoverContent
        side='left'
        align='start'
        sideOffset={8}
        initialFocus={blank ? editorRef : true}
        className='max-h-[min(36rem,70vh)] w-[28rem] max-w-[calc(100vw-2rem)] gap-2 overflow-y-auto p-4'
      >
        <span className='truncate text-xs font-medium text-muted-foreground'>
          {label}
        </span>
        {editing ? (
          <Textarea
            ref={editorRef}
            aria-label={label}
            autoFocus
            rows={10}
            value={draft}
            data-editing=''
            className='max-h-[50vh] text-sm leading-relaxed'
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                save();
              }
            }}
          />
        ) : (
          // A double-click edits it, as it does every other value.
          <div
            className={cn(
              'text-sm leading-relaxed break-words whitespace-pre-line',
              editable && 'cursor-text',
            )}
            onDoubleClick={
              editable
                ? () => {
                    window.getSelection()?.removeAllRanges();
                    edit();
                  }
                : undefined
            }
          >
            {value}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** The form variant's long text: a textarea saved on blur or Cmd/Ctrl+Enter, Escape putting it back. */
function FormLongText({
  id,
  label,
  value,
  disabled,
  placeholder,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string | null;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly onChange: (value: string | null) => void;
}): ReactElement {
  const draft = useDraft(
    value ?? '',
    (text) => ({ valid: true, value: text.trim() === '' ? null : text }),
    onChange,
  );
  return (
    <Textarea
      id={id}
      value={draft.text}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={label}
      className='max-h-40 min-h-20 text-sm'
      onChange={(event) => draft.setText(event.target.value)}
      onBlur={draft.commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey))
          draft.commit();
        if (event.key === 'Escape') draft.cancel();
      }}
    />
  );
}

/** A value's pencil, shown under the pointer at the end of its row, left of the copy button. */
function PencilButton({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}): ReactElement {
  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      onClick={onClick}
      onDoubleClick={(event) => event.stopPropagation()}
      className={cn(
        'absolute top-0.5 right-7.5 hidden group-focus-within/row:grid group-hover/row:grid group-has-[[data-editing]]/row:hidden!',
        ROW_ACTION,
      )}
    >
      <PencilLineIcon aria-hidden='true' className='size-3.5' />
    </button>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

function hrefOf(url: string): string {
  return /^[a-z][a-z\d+.-]*:/iu.test(url) ? url : `https://${url}`;
}

/**
 * A link, such as a website, or empty. The form variant edits its address in an input, with a button that opens it;
 * an inline card shows its host as a chip that opens it in a new tab, and edits it from the pencil shown on hover,
 * Enter / F2, or a double-click beside the chip, since a click opens it. A row copies its whole address.
 */
export function PropertyLink({
  id,
  label,
  value,
  disabled,
  placeholder,
  onChange,
  labels,
}: {
  readonly id: string;
  /** What the link is, such as "Website": the accessible name of its chip and its buttons. */
  readonly label: string;
  readonly value: string | null;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly onChange: (value: string | null) => void;
  readonly labels?: PropertyFieldLabels;
}): ReactElement {
  const card = useCard(labels);
  const [editing, setEditing] = useState(false);
  const inline = card.variant === 'inline';
  const draft = useDraft(
    value ?? '',
    (text) => ({ valid: true, value: text.trim() === '' ? null : text.trim() }),
    onChange,
    inline ? () => setEditing(false) : undefined,
  );
  const openLabel = fill(card.labels.open ?? 'Open {label}', { label });
  if (inline && !editing) {
    const editable = !disabled;
    return (
      <div className='relative'>
        <InlineValue
          id={id}
          label={label}
          editable={editable}
          onEdit={() => setEditing(true)}
          className='flex items-center'
        >
          {value ? (
            <a
              href={hrefOf(value)}
              target='_blank'
              rel='noopener noreferrer'
              title={value}
              data-copy={value}
              aria-label={`${label}: ${openLabel}`}
              // A double-click on the chip opens the link once, not the editor.
              onDoubleClick={(event) => event.stopPropagation()}
              className='-my-0.5 inline-flex min-w-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-foreground transition-colors hover:bg-hover'
            >
              <span className='min-w-0 truncate'>{hostOf(value)}</span>
              <ExternalLinkIcon
                aria-hidden='true'
                className='size-3 shrink-0 text-muted-foreground'
              />
            </a>
          ) : (
            <Empty placeholder={placeholder} />
          )}
        </InlineValue>
        {editable && value ? (
          <PencilButton
            label={fill(card.labels.edit ?? 'Edit {label}', { label })}
            onClick={() => setEditing(true)}
          />
        ) : null}
      </div>
    );
  }
  return (
    <div
      className='flex w-full min-w-0 items-center gap-1'
      data-editing={inline ? '' : undefined}
    >
      <Input
        id={id}
        type='url'
        autoFocus={inline}
        value={draft.text}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={label}
        data-copy={value ?? undefined}
        className={cn('min-w-0 flex-1', inline ? 'h-7' : 'h-8')}
        onChange={(event) => draft.setText(event.target.value)}
        onBlur={draft.commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') draft.commit();
          if (event.key === 'Escape') draft.cancel();
        }}
      />
      {!inline && value ? (
        // A link drawn as a button: it opens the address, so it is announced as a link.
        <a
          href={hrefOf(value)}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={openLabel}
          title={openLabel}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
            'shrink-0',
          )}
        >
          <ExternalLinkIcon />
        </a>
      ) : null}
    </div>
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
