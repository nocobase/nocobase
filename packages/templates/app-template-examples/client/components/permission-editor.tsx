/** A controlled permission workspace. Filtering never changes the caller's draft. */
import { SearchIcon, ShieldCheckIcon } from 'lucide-react';
import { useId, useState, type ReactElement, type ReactNode } from 'react';
import { cn } from 'cn';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Switch } from '#components/ui/switch';

export interface PermissionEditorLevel {
  readonly value: string;
  readonly label: string;
}

export interface PermissionEditorRow {
  /** Unique across the editor; also the switch's DOM id. */
  readonly id: string;
  readonly label: string;
  readonly hint?: string | undefined;
  readonly enabled: boolean;
  readonly toggleable?: boolean;
  /** The levels a switched-on row can reach. None leaves the right column empty. */
  readonly levels?: readonly PermissionEditorLevel[] | undefined;
  /** The current level, one of `levels`' values. */
  readonly level?: string | undefined;
}

export interface PermissionEditorGroup {
  readonly id: string;
  /** Rendered as a subheading above the rows; rows without one follow the previous group directly. */
  readonly title?: string | undefined;
  readonly rows: readonly PermissionEditorRow[];
}

export interface PermissionEditorSection {
  readonly id: string;
  readonly title: string;
  readonly groups: readonly PermissionEditorGroup[];
  /** A note under the section's rows. */
  readonly footer?: ReactNode;
}

export interface PermissionEditorLabels {
  /** The accessible name of a row's level select. */
  readonly levelFor: (rowLabel: string) => string;
  readonly search: string;
  readonly enabledOnly: string;
  readonly clear: string;
  readonly empty: string;
  readonly noResults: string;
  readonly navigation: string;
  readonly summary: (enabled: number, total: number) => string;
}

export interface PermissionEditorProps {
  readonly sections: readonly PermissionEditorSection[];
  readonly readOnly?: boolean | undefined;
  readonly onEnabledChange: (rowId: string, enabled: boolean) => void;
  readonly onLevelChange: (rowId: string, level: string) => void;
  readonly labels?: Partial<PermissionEditorLabels> | undefined;
}

const DEFAULT_LABELS: PermissionEditorLabels = {
  levelFor: (rowLabel) => `How far ${rowLabel} reaches`,
  search: 'Search categories, groups or permissions',
  enabledOnly: 'Enabled only',
  clear: 'Clear filters',
  empty: 'No permissions to configure',
  noResults: 'No matching permissions',
  navigation: 'Permission categories',
  summary: (enabled, total) => `${enabled} of ${total} enabled`,
};

function LevelControl({
  label,
  levels,
  value,
  disabled,
  onChange,
}: {
  readonly label: string;
  readonly levels: readonly PermissionEditorLevel[];
  readonly value: string;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}): ReactElement | null {
  if (levels.length === 0) return null;
  if (levels.length === 1)
    return (
      <span className='block truncate px-2.5 text-sm text-muted-foreground'>
        {levels[0]?.label}
      </span>
    );
  return (
    <Select
      items={levels}
      value={value}
      disabled={disabled}
      onValueChange={(next: string | null) => {
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger size='sm' className='w-full' aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {levels.map((level) => (
          <SelectItem key={level.value} value={level.value}>
            {level.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PermissionRow({
  row,
  readOnly,
  labels,
  onEnabledChange,
  onLevelChange,
}: {
  readonly row: PermissionEditorRow;
  readonly readOnly: boolean;
  readonly labels: PermissionEditorLabels;
  readonly onEnabledChange: (rowId: string, enabled: boolean) => void;
  readonly onLevelChange: (rowId: string, level: string) => void;
}): ReactElement {
  return (
    <div
      data-slot='permission-row'
      className='grid min-h-12 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 px-3 py-2 @lg:grid-cols-[auto_minmax(0,1fr)_14rem]'
    >
      <Switch
        id={row.id}
        checked={row.enabled}
        disabled={readOnly || row.toggleable === false}
        onCheckedChange={(on) => onEnabledChange(row.id, on)}
      />
      <label htmlFor={row.id} className='min-w-0 text-sm'>
        <span className='block font-medium'>{row.label}</span>
        {row.hint ? (
          <span className='block text-xs text-muted-foreground'>
            {row.hint}
          </span>
        ) : null}
      </label>
      {/* Below the label in a narrow editor, in its own column once there is room. */}
      <div className='col-start-2 max-w-56 min-w-0 empty:hidden @lg:col-start-auto @lg:max-w-none @lg:text-right'>
        {row.enabled && row.levels ? (
          <LevelControl
            label={labels.levelFor(row.label)}
            levels={row.levels}
            value={row.level ?? ''}
            disabled={readOnly}
            onChange={(level) => onLevelChange(row.id, level)}
          />
        ) : null}
      </div>
    </div>
  );
}

/** A category navigator with a compact, searchable permission list. */
export function PermissionEditor({
  sections,
  readOnly = false,
  onEnabledChange,
  onLevelChange,
  labels,
}: PermissionEditorProps): ReactElement {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [selected, setSelected] = useState(sections[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [enabledOnly, setEnabledOnly] = useState(false);
  const id = useId();
  const active = sections.some((section) => section.id === selected)
    ? selected
    : sections[0]?.id;
  const search = query.trim().toLocaleLowerCase();
  const filtering = Boolean(search) || enabledOnly;
  const visible = sections
    .filter((section) => filtering || section.id === active)
    .map((section) => ({
      ...section,
      groups: section.groups
        .map((group) => ({
          ...group,
          rows: group.rows.filter(
            (row) =>
              (!enabledOnly || row.enabled) &&
              (!search ||
                [section.title, group.title, row.label, row.hint].some((text) =>
                  text?.toLocaleLowerCase().includes(search),
                )),
          ),
        }))
        .filter((group) => group.rows.length),
    }))
    .filter((section) => section.groups.length);
  return (
    <div className='@container flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card'>
      <div className='flex flex-wrap items-center gap-3 border-b p-3'>
        <div className='relative min-w-0 flex-1'>
          <SearchIcon
            aria-hidden
            className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
          />
          <Input
            className='pl-9'
            value={query}
            aria-label={words.search}
            placeholder={words.search}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <label
          htmlFor={`${id}-enabled`}
          className='flex items-center gap-2 text-sm'
        >
          <Switch
            id={`${id}-enabled`}
            checked={enabledOnly}
            onCheckedChange={setEnabledOnly}
          />
          {words.enabledOnly}
        </label>
        {filtering && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setQuery('');
              setEnabledOnly(false);
            }}
          >
            {words.clear}
          </Button>
        )}
      </div>
      <div className='flex min-w-0 flex-col @2xl:flex-row'>
        <nav
          aria-label={words.navigation}
          className='flex shrink-0 gap-1 overflow-x-auto border-b bg-muted/25 p-2 @2xl:w-52 @2xl:flex-col @2xl:border-r @2xl:border-b-0'
        >
          {sections.map((section) => {
            const rows = section.groups.flatMap((group) => group.rows);
            return (
              <Button
                key={section.id}
                variant='ghost'
                aria-current={section.id === active ? 'page' : undefined}
                onClick={() => {
                  setSelected(section.id);
                  setQuery('');
                  setEnabledOnly(false);
                }}
                className={cn(
                  'h-auto shrink-0 justify-between gap-4 px-3 py-2.5 text-left whitespace-normal',
                  section.id === active &&
                    'bg-primary/10 text-primary hover:bg-primary/15',
                )}
              >
                <span>{section.title}</span>
                <span className='rounded-md bg-background px-1.5 py-0.5 text-xs tabular-nums'>
                  {rows.filter((row) => row.enabled).length}/{rows.length}
                </span>
              </Button>
            );
          })}
        </nav>
        <div className='min-w-0 flex-1 @container'>
          {visible.length ? (
            visible.map((section) => {
              const rows = section.groups.flatMap((group) => group.rows);
              return (
                <section
                  key={section.id}
                  aria-label={section.title}
                  className='flex flex-col gap-3 p-3 @lg:p-4'
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <h2 className='text-sm font-semibold'>{section.title}</h2>
                    <span className='text-xs text-muted-foreground'>
                      {words.summary(
                        rows.filter((row) => row.enabled).length,
                        rows.length,
                      )}
                    </span>
                  </div>
                  <div className='flex flex-col gap-3'>
                    {section.groups.map((group) => (
                      <div
                        key={group.id}
                        className='overflow-hidden rounded-lg border'
                      >
                        {group.title && (
                          <h3 className='border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground'>
                            {group.title}
                          </h3>
                        )}
                        <div className='divide-y'>
                          {group.rows.map((row) => (
                            <PermissionRow
                              key={row.id}
                              row={row}
                              readOnly={readOnly}
                              labels={words}
                              onEnabledChange={onEnabledChange}
                              onLevelChange={onLevelChange}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {section.footer && (
                    <div className='text-xs text-muted-foreground'>
                      {section.footer}
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            <div
              role='status'
              className='flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground'
            >
              <ShieldCheckIcon aria-hidden className='size-6' />
              {filtering ? words.noResults : words.empty}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
