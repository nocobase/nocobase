/** A controlled permission workspace. Filtering never changes the caller's draft. */
import {
  ChevronDownIcon,
  ChevronRightIcon,
  InfoIcon,
  SearchIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import {
  useId,
  useRef,
  useState,
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
import { LongText, LongTextPreview } from '#components/long-text';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#components/ui/empty';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#components/ui/tooltip';

export interface PermissionEditorLevel {
  readonly value: string;
  readonly label: string;
}

export interface PermissionEditorScope {
  /** An optional input for parameters of the selected scope. */
  readonly configuration?: ReactNode;
  readonly hint?: string | undefined;
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
  /** Optional action metadata; presentation preserves the supplied row order. */
  readonly actionKey?: string | undefined;
  /** Scope-only controls bound to this action; they are not extra permissions. */
  readonly scopes?: readonly PermissionEditorScope[];
  readonly enabled: boolean;
  readonly toggleable?: boolean;
  /** The levels an enabled row can reach. None leaves the right column empty. */
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
  /** An explanation shared by all actions, shown once across the resource row. */
  readonly actionHint?: string | undefined;
  readonly rows: readonly PermissionEditorRow[];
}

export interface PermissionEditorSection {
  readonly id: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly groups: readonly PermissionEditorGroup[];
  /** Optional application navigation; row references never imply inherited or bulk grants. */
  readonly navigation?: readonly PermissionEditorNavigationNode[];
  /** A note under the section's rows. */
  readonly footer?: ReactNode;
}

export interface PermissionEditorNavigationNode {
  readonly id: string;
  readonly label: string;
  readonly hint?: string | undefined;
  readonly rowId?: string | undefined;
  readonly children?: readonly PermissionEditorNavigationNode[];
}

export interface PermissionEditorLabels {
  /** The accessible name of a row's level select. */
  readonly levelFor: (rowLabel: string) => string;
  readonly search: string;
  readonly enabledOnly: string;
  readonly clear: string;
  readonly empty: string;
  readonly emptyDescription?: string;
  readonly readOnly?: string;
  readonly managedPermission?: string;
  readonly noResults: string;
  readonly navigation: string;
  readonly expandGroup?: (name: string) => string;
  readonly collapseGroup?: (name: string) => string;
  readonly selectAll?: string;
  readonly dataRanges?: (count: number) => string;
  readonly scopeExplanation?: string;
  readonly scopeHintFor?: (name: string) => string;
  readonly selectVisible?: (groupName: string) => string;
  readonly summary: (enabled: number, total: number) => string;
}

export interface PermissionEditorProps {
  readonly sections: readonly PermissionEditorSection[];
  readonly readOnly?: boolean | undefined;
  readonly onEnabledChange: (rowId: string, enabled: boolean) => void;
  /** Compatibility with existing hosts; the editor now renders individual controls only. */
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
  emptyDescription:
    'Ask the application developer to expose the permissions this role can configure.',
  readOnly: 'These permissions are read-only.',
  managedPermission: 'This permission is managed by the application.',
  noResults: 'No matching permissions',
  navigation: 'Permission categories',
  expandGroup: (name) => `Expand ${name}`,
  collapseGroup: (name) => `Collapse ${name}`,
  selectAll: 'All',
  dataRanges: (count) => `Data ranges (${count})`,
  scopeExplanation:
    'Each range applies to its corresponding data. The operation must also pass its authorization checks.',
  scopeHintFor: (name) => `About the data range for ${name}`,
  selectVisible: (name) => `Select visible permissions in ${name}`,
  summary: (enabled, total) => `${enabled} of ${total} enabled`,
};

function navigationSearchContext(
  nodes: readonly PermissionEditorNavigationNode[],
): ReadonlyMap<string, readonly string[]> {
  const result = new Map<string, readonly string[]>();
  const visit = (
    items: readonly PermissionEditorNavigationNode[],
    parents: readonly string[],
  ): void => {
    for (const node of items) {
      const context = [...parents, node.label, node.hint ?? ''];
      if (node.rowId)
        result.set(node.rowId, [...(result.get(node.rowId) ?? []), ...context]);
      visit(node.children ?? [], context);
    }
  };
  visit(nodes, []);
  return result;
}

function visibleNavigation(
  nodes: readonly PermissionEditorNavigationNode[],
  rows: ReadonlyMap<string, PermissionEditorRow>,
): readonly PermissionEditorNavigationNode[] {
  const used = new Set<string>();
  const visit = (
    items: readonly PermissionEditorNavigationNode[],
  ): PermissionEditorNavigationNode[] =>
    items.flatMap((node) => {
      const rowId =
        node.rowId && rows.has(node.rowId) && !used.has(node.rowId)
          ? node.rowId
          : undefined;
      if (rowId) used.add(rowId);
      const children = visit(node.children ?? []);
      return rowId || children.length ? [{ ...node, rowId, children }] : [];
    });
  const visible = visit(nodes);
  // An incomplete presentation tree must not silently remove caller-supplied controls.
  return [
    ...visible,
    ...[...rows.values()]
      .filter((row) => !used.has(row.id))
      .map((row) => ({ id: `row:${row.id}`, label: row.label, rowId: row.id })),
  ];
}

function NavigationDisclosure({
  label,
  expanded,
  childrenId,
  onClick,
}: {
  readonly label: string;
  readonly expanded: boolean;
  readonly childrenId: string;
  readonly onClick: () => void;
}): ReactElement {
  const triggerId = useId();
  return (
    <TooltipProvider>
      <Tooltip triggerId={triggerId}>
        <TooltipTrigger
          id={triggerId}
          render={
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='mt-1 size-6 shrink-0'
              aria-label={label}
              aria-expanded={expanded}
              aria-controls={expanded ? childrenId : undefined}
              onClick={onClick}
            />
          }
        >
          {expanded ? (
            <ChevronDownIcon aria-hidden />
          ) : (
            <ChevronRightIcon aria-hidden />
          )}
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function PermissionNavigation({
  nodes,
  rows,
  prefix,
  collapsed,
  filtering,
  onDisclosure,
  nested = false,
  ...rowProps
}: {
  readonly nodes: readonly PermissionEditorNavigationNode[];
  readonly rows: ReadonlyMap<string, PermissionEditorRow>;
  readonly prefix: string;
  readonly collapsed: ReadonlySet<string>;
  readonly filtering: boolean;
  readonly onDisclosure: (key: string) => void;
  readonly nested?: boolean;
} & Omit<
  Parameters<typeof PermissionRow>[0],
  'row' | 'controlId' | 'presentation'
>): ReactElement {
  const hasBranches = nested || nodes.some((node) => node.children?.length);
  return (
    <ul className='grid min-w-0 gap-0.5'>
      {nodes.map((node) => {
        const row = node.rowId ? rows.get(node.rowId) : undefined;
        const children = node.children ?? [];
        const key = `${prefix}-${node.id}`;
        const expanded = filtering || !collapsed.has(key);
        const childrenId = `${prefix}-branch-${encodeURIComponent(node.id)}`;
        return (
          <li
            key={node.id}
            className={cn('min-w-0', !nested && children.length > 0 && 'mt-2')}
          >
            <div className='flex min-w-0 items-start gap-1'>
              {hasBranches &&
                (children.length ? (
                  filtering ? (
                    <span className='mt-1 flex size-6 shrink-0 items-center justify-center text-muted-foreground'>
                      <ChevronDownIcon aria-hidden className='size-4' />
                    </span>
                  ) : (
                    <NavigationDisclosure
                      label={
                        expanded
                          ? rowProps.labels.collapseGroup(node.label)
                          : rowProps.labels.expandGroup(node.label)
                      }
                      expanded={expanded}
                      childrenId={childrenId}
                      onClick={() => onDisclosure(key)}
                    />
                  )
                ) : (
                  <span aria-hidden className='mt-1 size-6 shrink-0' />
                ))}
              {row ? (
                <div className='min-w-0 flex-1'>
                  <PermissionRow
                    {...rowProps}
                    controlId={`${prefix}-${row.id}`}
                    row={{
                      ...row,
                      label: node.label,
                      hint: node.hint ?? row.hint,
                    }}
                    presentation='navigation'
                  />
                </div>
              ) : (
                <div className='grid min-w-0 flex-1 gap-1 px-2 py-1.5 text-muted-foreground'>
                  <LongTextPreview
                    label={node.label}
                    className='text-xs leading-5 font-medium'
                  >
                    {node.label}
                  </LongTextPreview>
                  {node.hint && (
                    <LongTextPreview label={node.label} className='text-xs'>
                      {node.hint}
                    </LongTextPreview>
                  )}
                </div>
              )}
            </div>
            {expanded && children.length > 0 && (
              <div
                id={childrenId}
                className='mt-0.5 ml-3 min-w-0 border-l pl-2 sm:pl-3'
              >
                <PermissionNavigation
                  {...rowProps}
                  nodes={children}
                  rows={rows}
                  prefix={prefix}
                  collapsed={collapsed}
                  filtering={filtering}
                  onDisclosure={onDisclosure}
                  nested
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PermissionNavigationSection({
  section,
  ...props
}: {
  readonly section: PermissionEditorSection;
} & Omit<
  Parameters<typeof PermissionNavigation>[0],
  'nodes' | 'rows'
>): ReactElement {
  const rows = new Map(
    section.groups.flatMap((group) =>
      group.rows.map(
        (row) =>
          [
            row.id,
            group.accessOnly && group.rows.length === 1
              ? {
                  ...row,
                  label: group.title ?? row.label,
                  hint: group.hint ?? row.hint,
                }
              : row,
          ] as const,
      ),
    ),
  );
  return (
    <div data-slot='permission-navigation' className='min-w-0 py-1'>
      <PermissionNavigation
        {...props}
        rows={rows}
        nodes={visibleNavigation(section.navigation ?? [], rows)}
      />
    </div>
  );
}

function ScopeHint({
  label,
  children,
}: {
  readonly label: string;
  readonly children: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const triggerId = useId();
  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen} triggerId={triggerId}>
        <TooltipTrigger
          id={triggerId}
          closeOnClick={false}
          render={
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-6 shrink-0 text-muted-foreground'
              aria-label={label}
              aria-describedby={open ? `${triggerId}-content` : undefined}
              onClick={() => setOpen(true)}
            />
          }
        >
          <InfoIcon aria-hidden className='size-3.5' />
        </TooltipTrigger>
        <TooltipContent role='tooltip' id={`${triggerId}-content`}>
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

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
  readOnly,
  readOnlyHintId,
  labels,
  onEnabledChange,
  onLevelChange,
  presentation = 'tile',
}: {
  readonly row: PermissionEditorRow;
  readonly controlId: string;
  readonly readOnly: boolean;
  readonly readOnlyHintId: string;
  readonly labels: Required<PermissionEditorLabels>;
  readonly onEnabledChange: (rowId: string, enabled: boolean) => void;
  readonly onLevelChange: (rowId: string, level: string) => void;
  readonly presentation?: 'tile' | 'navigation';
}): ReactElement {
  const hasControls =
    row.enabled && Boolean(row.levels?.length || row.scopes?.length);
  const describedBy =
    [
      row.hint ? `${controlId}-hint` : undefined,
      readOnly ? readOnlyHintId : undefined,
      row.toggleable === false ? `${controlId}-managed` : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div
      data-slot='permission-row'
      className={cn(
        'grid min-w-0 items-start gap-2 transition-colors',
        presentation === 'navigation'
          ? 'rounded-md px-2 py-1.5 hover:bg-muted/40 focus-within:bg-muted/40'
          : cn(
              'rounded-lg border p-2.5',
              row.enabled ? 'border-primary/20 bg-primary/5' : 'bg-card',
            ),
      )}
    >
      <div className='flex min-w-0 items-start gap-2'>
        <Checkbox
          id={controlId}
          className='mt-0.5 shrink-0'
          checked={row.enabled}
          disabled={readOnly || row.toggleable === false}
          onCheckedChange={(on: boolean) => onEnabledChange(row.id, on)}
          aria-describedby={describedBy}
        />
        <div className='grid min-w-0 gap-1'>
          <label
            htmlFor={controlId}
            className='cursor-pointer text-sm font-medium leading-5 break-words'
          >
            {row.label}
          </label>
          {row.hint && (
            <div id={`${controlId}-hint`}>
              <LongTextPreview label={row.label} className='text-xs'>
                {row.hint}
              </LongTextPreview>
            </div>
          )}
          {row.toggleable === false && (
            <p
              id={`${controlId}-managed`}
              className='text-xs text-muted-foreground'
            >
              {labels.managedPermission}
            </p>
          )}
        </div>
      </div>
      {hasControls && (
        <div data-slot='permission-scopes' className='grid min-w-0 gap-2 pl-6'>
          {row.levels && (
            <LevelControl
              label={labels.levelFor(row.label)}
              levels={row.levels}
              value={row.level ?? ''}
              disabled={readOnly}
              onChange={(level) => onLevelChange(row.id, level)}
            />
          )}
          {row.scopes?.map((scope) => (
            <div key={scope.id} className='grid min-w-0 gap-1'>
              <span className='text-xs text-muted-foreground'>
                {scope.label}
              </span>
              <div className='flex min-w-0 items-center gap-1'>
                <LevelControl
                  label={labels.levelFor(`${row.label} · ${scope.label}`)}
                  levels={scope.levels}
                  value={scope.level ?? ''}
                  disabled={readOnly}
                  onChange={(level) => onLevelChange(scope.id, level)}
                />
                {scope.configuration}
                {scope.hint && (
                  <ScopeHint
                    label={labels.scopeHintFor(`${row.label} · ${scope.label}`)}
                  >
                    {scope.hint}
                  </ScopeHint>
                )}
              </div>
            </div>
          ))}
          {[
            ...new Set(row.scopes?.map((scope) => scope.hint).filter(Boolean)),
          ].map((hint) => (
            <LongTextPreview key={hint} label={row.label} className='text-xs'>
              {hint}
            </LongTextPreview>
          ))}
        </div>
      )}
    </div>
  );
}

/** A controlled editor: the application owns its catalog, policies and save lifecycle. */
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
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const available = sections.filter((section) =>
    section.groups.some((group) => group.rows.length > 0),
  );
  const active = available.some((section) => section.id === selected)
    ? selected
    : available[0]?.id;
  const search = query.trim().toLocaleLowerCase();
  const filtering = Boolean(search) || enabledOnly;
  const matches = (values: readonly (string | undefined)[]): boolean =>
    !search ||
    values.some((value) => value?.toLocaleLowerCase().includes(search));
  const visible = available
    .filter((section) => filtering || section.id === active)
    .map((section) => {
      const context = navigationSearchContext(section.navigation ?? []);
      return {
        ...section,
        groups: section.groups
          .map((group) => ({
            ...group,
            rows: group.rows.filter(
              (row) =>
                (!enabledOnly || row.enabled) &&
                matches([
                  section.title,
                  section.description,
                  group.title,
                  group.hint,
                  group.actionHint,
                  row.label,
                  row.hint,
                  ...(context.get(row.id) ?? []),
                  ...(row.scopes?.map((scope) => scope.label) ?? []),
                ]),
            ),
          }))
          .filter((group) => group.rows.length),
      };
    })
    .filter((section) => section.groups.length);
  const clearFilters = (): void => {
    setQuery('');
    setEnabledOnly(false);
    searchRef.current?.focus();
  };
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
          <Checkbox
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
            onClick={clearFilters}
          >
            {words.clear}
          </Button>
        )}
      </div>
      <div className='flex max-h-128 min-w-0 flex-col overflow-auto @2xl:flex-row'>
        {available.length > 0 && (
          <nav
            aria-label={words.navigation}
            className='flex shrink-0 gap-1 overflow-x-auto border-b bg-muted/25 p-2 @2xl:sticky @2xl:top-0 @2xl:w-52 @2xl:self-start @2xl:flex-col @2xl:border-r @2xl:border-b-0'
          >
            {available.map((section) => (
              <Button
                key={section.id}
                type='button'
                variant='ghost'
                aria-current={section.id === active ? 'page' : undefined}
                aria-controls={`${id}-content`}
                onClick={() => {
                  setSelected(section.id);
                  setQuery('');
                  setEnabledOnly(false);
                }}
                className={cn(
                  'h-auto min-h-8 shrink-0 justify-start px-3 py-2 text-left text-sm font-normal whitespace-nowrap @2xl:w-full @2xl:whitespace-normal',
                  section.id === active &&
                    'bg-primary/10 font-medium text-primary hover:bg-primary/15',
                )}
              >
                {section.title}
              </Button>
            ))}
          </nav>
        )}
        <div id={`${id}-content`} className='min-w-0 flex-1'>
          {readOnly && (
            <p
              id={`${id}-readonly`}
              className='px-4 pt-3 text-xs text-muted-foreground'
            >
              {words.readOnly}
            </p>
          )}
          {visible.length ? (
            visible.map((section) => (
              <section
                key={section.id}
                aria-label={section.title}
                className='grid min-w-0 gap-3 p-3'
              >
                {filtering && (
                  <h2 className='text-base font-medium'>{section.title}</h2>
                )}
                {section.description && (
                  <LongText className='text-xs text-muted-foreground'>
                    {section.description}
                  </LongText>
                )}
                {section.navigation ? (
                  <PermissionNavigationSection
                    section={section}
                    prefix={`${id}-${section.id}`}
                    collapsed={collapsed}
                    filtering={filtering}
                    onDisclosure={(key) =>
                      setCollapsed((current) => {
                        const next = new Set(current);
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      })
                    }
                    readOnly={readOnly}
                    readOnlyHintId={`${id}-readonly`}
                    labels={words}
                    onEnabledChange={(rowId, on) => {
                      if (enabledOnly && !on) searchRef.current?.focus();
                      onEnabledChange(rowId, on);
                    }}
                    onLevelChange={onLevelChange}
                  />
                ) : (
                  <div
                    className={cn(
                      'grid min-w-0 gap-3',
                      section.groups.every(
                        (group) => group.accessOnly && group.rows.length === 1,
                      ) &&
                        'grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]',
                    )}
                  >
                    {section.groups.map((group) => {
                      const accessRow =
                        group.accessOnly && group.rows.length === 1
                          ? group.rows[0]
                          : undefined;
                      const rows = accessRow
                        ? [
                            {
                              ...accessRow,
                              label: group.title ?? accessRow.label,
                              hint: group.hint ?? accessRow.hint,
                            },
                          ]
                        : group.rows;
                      return (
                        <div
                          key={group.id}
                          data-slot='permission-resource'
                          className={cn(
                            'grid min-w-0 gap-2',
                            !accessRow && 'rounded-lg border p-3',
                          )}
                        >
                          {!accessRow && group.title && (
                            <h3 className='text-base font-medium'>
                              {group.title}
                            </h3>
                          )}
                          {!accessRow && group.hint && (
                            <LongText className='text-xs text-muted-foreground'>
                              {group.hint}
                            </LongText>
                          )}
                          {!accessRow && group.actionHint && (
                            <LongText className='text-xs text-muted-foreground'>
                              {group.actionHint}
                            </LongText>
                          )}
                          {/* The 18rem minimum keeps scope controls usable; enabling an action never changes its column span. */}
                          <div
                            data-slot='permission-actions'
                            className='grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] items-start gap-2'
                          >
                            {rows.map((row) => (
                              <div key={row.id} className='min-w-0'>
                                <PermissionRow
                                  controlId={`${id}-${row.id}`}
                                  row={row}
                                  readOnly={readOnly}
                                  readOnlyHintId={`${id}-readonly`}
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
                )}
                {section.footer && (
                  <div className='text-xs text-muted-foreground'>
                    {section.footer}
                  </div>
                )}
              </section>
            ))
          ) : (
            <Empty role='status' className='min-h-40 border p-6 m-4'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <ShieldCheckIcon aria-hidden />
                </EmptyMedia>
                <EmptyTitle>
                  {filtering ? words.noResults : words.empty}
                </EmptyTitle>
                <EmptyDescription>
                  {filtering ? words.clear : words.emptyDescription}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
