/** A controlled permission workspace. Filtering never changes the caller's draft. */
import { SearchIcon, ShieldCheckIcon } from 'lucide-react';
import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from 'cn';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Checkbox } from '#components/ui/checkbox';
import { Switch } from '#components/ui/switch';

export interface PermissionEditorLevel {
  readonly value: string;
  readonly label: string;
}

export interface PermissionEditorScope {
  /** An optional input for parameters of the selected scope. */
  readonly configuration?: ReactNode;
  readonly id: string;
  readonly label: string;
  readonly levels: readonly PermissionEditorLevel[];
  readonly level?: string | undefined;
}

export interface PermissionEditorRow {
  /** Unique permission identifier supplied unchanged to callbacks. */
  readonly id: string;
  readonly label: string;
  readonly hint?: string | undefined;
  /** Stable semantic action key for aligning actions across resources. */
  readonly actionKey?: string | undefined;
  /** Scope-only controls bound to this action; they are not extra permissions. */
  readonly scopes?: readonly PermissionEditorScope[];
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
  readonly hint?: string | undefined;
  /** A page with one access action uses its title as the only checkbox label. */
  readonly accessOnly?: boolean;
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
  readonly selectAll?: string;
  readonly selectVisible?: (groupName: string) => string;
  readonly summary: (enabled: number, total: number) => string;
}

export interface PermissionEditorProps {
  readonly sections: readonly PermissionEditorSection[];
  readonly readOnly?: boolean | undefined;
  readonly onEnabledChange: (rowId: string, enabled: boolean) => void;
  /** One atomic draft update; when absent, group selection is omitted. */
  readonly onEnabledBatchChange?: (
    changes: readonly { id: string; enabled: boolean }[],
  ) => void;
  readonly onLevelChange: (rowId: string, level: string) => void;
  readonly labels?: Partial<PermissionEditorLabels> | undefined;
}

const DEFAULT_LABELS: Required<PermissionEditorLabels> = {
  levelFor: (rowLabel) => `How far ${rowLabel} reaches`,
  search: 'Search categories, groups or permissions',
  enabledOnly: 'Enabled only',
  clear: 'Clear filters',
  empty: 'No permissions to configure',
  noResults: 'No matching permissions',
  navigation: 'Permission categories',
  selectAll: 'All',
  selectVisible: (name) => `Select visible permissions in ${name}`,
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
      <span className='flex min-h-7 min-w-0 items-center px-2 text-xs text-muted-foreground'>
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
      <SelectTrigger
        size='sm'
        className='h-7 w-full min-w-0 max-w-full flex-1 gap-1 border-0 bg-muted/50 px-2 text-xs shadow-none'
        aria-label={label}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        <SelectGroup>
          {levels.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              {level.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function PermissionRow({
  row,
  controlId,
  showScopeLabels = false,
  readOnly,
  labels,
  onEnabledChange,
  onLevelChange,
}: {
  readonly row: PermissionEditorRow;
  readonly controlId: string;
  readonly showScopeLabels?: boolean;
  readonly readOnly: boolean;
  readonly labels: PermissionEditorLabels;
  readonly onEnabledChange: (rowId: string, enabled: boolean) => void;
  readonly onLevelChange: (rowId: string, level: string) => void;
}): ReactElement {
  return (
    <div
      data-slot='permission-row'
      className='flex min-w-0 flex-col gap-1 rounded-md px-2 py-1.5'
    >
      <div className='grid min-h-6 min-w-0 grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-2 @2xl:grid-cols-[auto_minmax(0,1fr)] gap-y-1'>
        <Checkbox
          id={controlId}
          checked={row.enabled}
          disabled={readOnly || row.toggleable === false}
          onCheckedChange={(on) => onEnabledChange(row.id, on)}
          aria-describedby={row.hint ? `${controlId}-hint` : undefined}
        />
        <label
          htmlFor={controlId}
          className='min-h-6 min-w-0 max-w-36 cursor-pointer text-sm leading-6 font-medium break-words @2xl:max-w-none'
        >
          {row.label}
        </label>
        {row.enabled && row.levels ? (
          <div className='col-start-3 min-w-0 @2xl:col-start-2'>
            <LevelControl
              label={labels.levelFor(row.label)}
              levels={row.levels}
              value={row.level ?? ''}
              disabled={readOnly}
              onChange={(level) => onLevelChange(row.id, level)}
            />
          </div>
        ) : null}
        {row.enabled &&
          row.scopes?.map((scope) => (
            <div
              key={scope.id}
              className={cn(
                'col-start-3 grid min-w-0 gap-1 @2xl:col-start-2',
                showScopeLabels && 'col-span-2 col-start-2 @2xl:col-span-1',
              )}
            >
              {(showScopeLabels || (row.scopes && row.scopes.length > 1)) && (
                <span className='text-xs leading-5 text-muted-foreground'>
                  {scope.label}
                </span>
              )}
              <div className='flex min-h-7 min-w-0 items-center gap-1'>
                <LevelControl
                  label={labels.levelFor(`${row.label} · ${scope.label}`)}
                  levels={scope.levels}
                  value={scope.level ?? ''}
                  disabled={readOnly}
                  onChange={(level) => onLevelChange(scope.id, level)}
                />
                {scope.configuration}
              </div>
            </div>
          ))}
      </div>
      {row.hint && (
        <span
          id={`${controlId}-hint`}
          className='pl-6 text-xs text-muted-foreground'
        >
          {row.hint}
        </span>
      )}
    </div>
  );
}

/** A category navigator with a compact, searchable permission list. */
export function PermissionEditor({
  sections,
  readOnly = false,
  onEnabledChange,
  onEnabledBatchChange,
  onLevelChange,
  labels,
}: PermissionEditorProps): ReactElement {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [selected, setSelected] = useState(sections[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [enabledOnly, setEnabledOnly] = useState(false);
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
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
                [
                  section.title,
                  group.title,
                  group.hint,
                  row.label,
                  row.hint,
                  ...(row.scopes?.map((scope) => scope.label) ?? []),
                ].some((text) => text?.toLocaleLowerCase().includes(search))),
          ),
        }))
        .filter((group) => group.rows.length),
    }))
    .filter((section) => section.groups.length);
  return (
    <div className='@container flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card'>
      <div className='flex flex-wrap items-center gap-3 border-b p-3'>
        <div className='relative min-w-48 flex-1'>
          <SearchIcon
            aria-hidden
            className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
          />
          <Input
            ref={searchRef}
            className='pl-9'
            value={query}
            aria-label={words.search}
            placeholder={words.search}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <label
          htmlFor={`${id}-enabled`}
          className='flex shrink-0 items-center gap-2 text-sm whitespace-nowrap'
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
            type='button'
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
      <div className='flex max-h-128 min-w-0 flex-col overflow-auto @2xl:flex-row'>
        <nav
          aria-label={words.navigation}
          className='flex shrink-0 gap-1 overflow-x-auto border-b bg-muted/25 p-2 @2xl:sticky @2xl:top-0 @2xl:max-h-128 @2xl:w-64 @2xl:self-start @2xl:flex-col @2xl:border-r @2xl:border-b-0'
        >
          {sections.map((section) => {
            const rows = section.groups.flatMap((group) => group.rows);
            return (
              <Button
                type='button'
                key={section.id}
                variant='ghost'
                aria-current={section.id === active ? 'page' : undefined}
                onClick={() => {
                  setSelected(section.id);
                  setQuery('');
                  setEnabledOnly(false);
                }}
                className={cn(
                  'h-auto shrink-0 justify-between gap-3 px-3 py-2 text-left whitespace-nowrap @2xl:w-full @2xl:min-w-0',
                  section.id === active &&
                    'bg-primary/10 text-primary hover:bg-primary/15',
                )}
              >
                <span
                  className='min-w-0 @2xl:flex-1 @2xl:truncate'
                  title={section.title}
                >
                  {section.title}
                </span>
                <span className='shrink-0 rounded-md bg-background px-1.5 py-0.5 text-xs tabular-nums'>
                  {rows.filter((row) => row.enabled).length}/{rows.length}
                </span>
              </Button>
            );
          })}
        </nav>
        <div className='min-w-0 flex-1 @container'>
          {visible.length ? (
            visible.map((section) => {
              const original =
                sections.find((item) => item.id === section.id) ?? section;
              const singleResource = original.groups.length === 1;
              const showScopeLabels = original.groups.some((group) =>
                group.rows.some((row) => (row.scopes?.length ?? 0) > 1),
              );
              const keys = [
                ...new Set(
                  original.groups
                    .flatMap((group) => group.rows.map((row) => row.actionKey))
                    .filter((key): key is string => Boolean(key)),
                ),
              ];
              const common = ['read', 'create', 'update', 'delete'];
              const columns = [
                ...common.filter((key) => keys.includes(key)),
                ...keys.filter((key) => !common.includes(key)),
              ];
              const aligned =
                columns.length > 0 &&
                columns.length <= 4 &&
                original.groups.every(
                  (group) =>
                    group.rows.every((row) => row.actionKey) &&
                    new Set(group.rows.map((row) => row.actionKey)).size ===
                      group.rows.length,
                );
              // Keep action columns only when each has room for its label and scope.
              const alignment = [
                '',
                '@3xl:grid-cols-(--permission-columns)',
                '@3xl:grid-cols-(--permission-columns)',
                '@5xl:grid-cols-(--permission-columns)',
                '@7xl:grid-cols-(--permission-columns)',
              ][columns.length];
              const placement = [
                '',
                '@3xl:col-start-(--permission-column) @3xl:row-start-1',
                '@3xl:col-start-(--permission-column) @3xl:row-start-1',
                '@5xl:col-start-(--permission-column) @5xl:row-start-1',
                '@7xl:col-start-(--permission-column) @7xl:row-start-1',
              ][columns.length];
              return (
                <section
                  key={section.id}
                  aria-label={section.title}
                  className='flex flex-col gap-3 p-3 @lg:p-4'
                >
                  <h2 className='text-sm font-semibold'>{section.title}</h2>
                  <div className='divide-y rounded-lg border'>
                    {section.groups.map((group) => {
                      const selectable = group.rows.filter(
                        (row) => row.toggleable !== false,
                      );
                      const enabled = selectable.filter(
                        (row) => row.enabled,
                      ).length;
                      const originalGroup = sections
                        .find((item) => item.id === section.id)
                        ?.groups.find((item) => item.id === group.id);
                      const totalRows = originalGroup?.rows ?? group.rows;
                      const accessRow =
                        group.accessOnly && totalRows.length === 1
                          ? group.rows[0]
                          : undefined;
                      if (accessRow)
                        return (
                          <div
                            key={group.id}
                            className='p-3'
                            data-slot='permission-resource'
                          >
                            <PermissionRow
                              controlId={`${id}-${accessRow.id}`}
                              row={{
                                ...accessRow,
                                label: group.title ?? accessRow.label,
                                hint: group.hint ?? accessRow.hint,
                              }}
                              readOnly={readOnly}
                              labels={words}
                              onEnabledChange={(rowId, on) => {
                                if (enabledOnly && !on)
                                  searchRef.current?.focus();
                                onEnabledChange(rowId, on);
                              }}
                              onLevelChange={onLevelChange}
                            />
                          </div>
                        );
                      return (
                        <div
                          key={group.id}
                          className='grid min-w-0 gap-2 p-3 @3xl:grid-cols-[9rem_minmax(0,1fr)]'
                          data-slot='permission-resource'
                        >
                          <div className='flex min-w-0 flex-col gap-1 py-1.5'>
                            <h3 className='min-h-6 text-sm leading-6 font-medium break-words'>
                              {group.title ?? section.title}
                            </h3>
                            {group.hint && (
                              <p className='text-xs text-muted-foreground'>
                                {group.hint}
                              </p>
                            )}
                            <div
                              className={cn(
                                'flex min-h-7 items-center gap-2 text-xs text-muted-foreground',
                                showScopeLabels && '@3xl:mt-6',
                              )}
                            >
                              {onEnabledBatchChange &&
                                totalRows.length > 1 &&
                                selectable.length > 0 && (
                                  <Checkbox
                                    aria-label={words.selectVisible(
                                      group.title ?? section.title,
                                    )}
                                    checked={
                                      selectable.length > 0 &&
                                      enabled === selectable.length
                                    }
                                    indeterminate={
                                      enabled > 0 && enabled < selectable.length
                                    }
                                    disabled={readOnly}
                                    id={`${id}-${section.id}-${group.id}-all`}
                                    title={words.selectVisible(
                                      group.title ?? section.title,
                                    )}
                                    onCheckedChange={(checked) => {
                                      const changes = selectable
                                        .filter(
                                          (row) => row.enabled !== checked,
                                        )
                                        .map((row) => ({
                                          id: row.id,
                                          enabled: checked,
                                        }));
                                      if (changes.length) {
                                        if (enabledOnly && !checked)
                                          searchRef.current?.focus();
                                        onEnabledBatchChange(changes);
                                      }
                                    }}
                                  />
                                )}
                              {onEnabledBatchChange &&
                                totalRows.length > 1 &&
                                selectable.length > 0 && (
                                  <label
                                    htmlFor={`${id}-${section.id}-${group.id}-all`}
                                    className='cursor-pointer'
                                  >
                                    <span aria-hidden>{words.selectAll}</span>
                                    <span className='sr-only'>
                                      {words.selectVisible(
                                        group.title ?? section.title,
                                      )}
                                    </span>
                                  </label>
                                )}
                              {!singleResource && totalRows.length > 1 && (
                                <span
                                  className='tabular-nums'
                                  aria-label={words.summary(
                                    totalRows.filter((row) => row.enabled)
                                      .length,
                                    totalRows.length,
                                  )}
                                >
                                  {
                                    totalRows.filter((row) => row.enabled)
                                      .length
                                  }
                                  /{totalRows.length}
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className={cn(
                              'grid min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))] items-start gap-x-2 gap-y-1',
                              aligned && alignment,
                            )}
                            style={
                              {
                                '--permission-columns': `repeat(${columns.length}, minmax(0, 1fr))`,
                              } as CSSProperties
                            }
                          >
                            {[...group.rows]
                              .sort(
                                (a, b) =>
                                  columns.indexOf(a.actionKey ?? '') -
                                  columns.indexOf(b.actionKey ?? ''),
                              )
                              .map((row) => (
                                <div
                                  key={row.id}
                                  className={cn(
                                    'min-w-0',
                                    aligned && placement,
                                  )}
                                  style={
                                    {
                                      '--permission-column':
                                        columns.indexOf(row.actionKey ?? '') +
                                        1,
                                    } as CSSProperties
                                  }
                                >
                                  <PermissionRow
                                    controlId={`${id}-${row.id}`}
                                    row={row}
                                    showScopeLabels={showScopeLabels}
                                    readOnly={readOnly}
                                    labels={words}
                                    onEnabledChange={(rowId, on) => {
                                      if (enabledOnly && !on)
                                        searchRef.current?.focus();
                                      onEnabledChange(rowId, on);
                                    }}
                                    onLevelChange={onLevelChange}
                                  />
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
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
