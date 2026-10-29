/** A controlled permission workspace. Filtering never changes the caller's draft. */
import {
  ChevronDownIcon,
  ChevronRightIcon,
  InfoIcon,
  SearchIcon,
  XIcon,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#components/ui/tabs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Checkbox } from '#components/ui/checkbox';
import { LongTextPreview } from '#components/long-text';
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
  readonly path?: string | undefined;
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
  readonly path?: string | undefined;
  readonly hint?: string | undefined;
  readonly rowId?: string | undefined;
  readonly children?: readonly PermissionEditorNavigationNode[];
}

export interface PermissionEditorLabels {
  /** The accessible name of a row's level select. */
  readonly levelFor: (rowLabel: string) => string;
  readonly search: string;
  readonly enabledOnly: string;
  readonly granted?: string;
  readonly ungranted?: string;
  readonly authorizationStatus?: string;
  readonly clearSearch?: string;
  readonly collapseAll?: string;
  readonly expandAll?: string;
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
  granted: 'Granted',
  ungranted: 'Ungranted',
  authorizationStatus: 'Authorization status',
  clearSearch: 'Clear search',
  collapseAll: 'Collapse all',
  expandAll: 'Expand all',
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
      const context = [
        ...parents,
        node.label,
        node.hint ?? '',
        node.path ?? '',
      ];
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
  counts,
  ...rowProps
}: {
  readonly nodes: readonly PermissionEditorNavigationNode[];
  readonly rows: ReadonlyMap<string, PermissionEditorRow>;
  readonly prefix: string;
  readonly collapsed: ReadonlySet<string>;
  readonly filtering: boolean;
  readonly onDisclosure: (key: string) => void;
  readonly nested?: boolean;
  readonly counts?:
    ReadonlyMap<string, { enabled: number; total: number }> | undefined;
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
                      path: node.path ?? row.path,
                    }}
                    presentation='navigation'
                  />
                </div>
              ) : (
                <div className='grid min-w-0 flex-1 gap-1 px-2 py-1.5 text-muted-foreground'>
                  <LongTextPreview
                    label={node.label}
                    className='text-xs leading-5 font-normal'
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
              {!nested && !row && counts?.has(node.id) && (
                <span className='ml-auto shrink-0 px-2 py-1.5 text-xs text-muted-foreground'>
                  {rowProps.labels.summary(
                    counts.get(node.id)!.enabled,
                    counts.get(node.id)!.total,
                  )}
                </span>
              )}
            </div>
            {expanded && children.length > 0 && (
              <div id={childrenId} className='min-w-0 pl-4 sm:pl-6'>
                <PermissionNavigation
                  {...rowProps}
                  nodes={children}
                  rows={rows}
                  prefix={prefix}
                  collapsed={collapsed}
                  filtering={filtering}
                  onDisclosure={onDisclosure}
                  nested
                  counts={counts}
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
        className='w-full min-w-0 max-w-full flex-1'
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
  readonly presentation?: 'tile' | 'navigation' | 'inline';
}): ReactElement {
  const hasControls =
    row.enabled && Boolean(row.levels?.length || row.scopes?.length);
  const singleRange =
    hasControls && (row.scopes?.length ?? 0) + (row.levels ? 1 : 0) === 1;
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
        'group/field grid min-w-0 gap-2 rounded-md px-2 py-2 hover:bg-hover',
        presentation === 'inline' && 'inline-flex items-start',
        singleRange && 'sm:flex sm:flex-wrap sm:items-start sm:gap-x-5',
      )}
    >
      <div
        className={cn(
          'flex min-w-0 items-start gap-3',
          singleRange && 'sm:max-w-lg',
        )}
      >
        <Checkbox
          id={controlId}
          className='mt-0.5 shrink-0'
          checked={row.enabled}
          disabled={readOnly || row.toggleable === false}
          onCheckedChange={(on: boolean) => onEnabledChange(row.id, on)}
          aria-describedby={describedBy}
        />
        <div className='grid min-w-0 flex-1 gap-1'>
          <div className='flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1'>
            <label
              htmlFor={controlId}
              className='cursor-pointer text-sm leading-5 font-normal break-words'
            >
              {row.label}
            </label>
            {row.path && (
              <code className='text-xs text-muted-foreground [overflow-wrap:anywhere]'>
                {row.path}
              </code>
            )}
            {row.hint && (
              <div
                id={`${controlId}-hint`}
                className='min-w-0 basis-48 grow text-xs leading-5 text-muted-foreground'
              >
                {row.hint}
              </div>
            )}
          </div>
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
        <div
          data-slot='permission-scopes'
          className={cn(
            'grid min-w-0 gap-x-5 gap-y-2 pl-7 sm:grid-cols-2',
            singleRange && 'w-full sm:w-80 sm:shrink-0 sm:grid-cols-1 sm:pl-0',
          )}
        >
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
            <div
              key={scope.id}
              className='grid min-w-0 grid-cols-[minmax(4rem,auto)_minmax(0,1fr)] items-center gap-2'
            >
              <span className='max-w-36 text-xs break-words text-muted-foreground'>
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
            <p
              key={hint}
              className='text-xs leading-5 text-muted-foreground sm:col-span-full'
            >
              {hint}
            </p>
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
  const [status, setStatus] = useState('all');
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
  const filtering = Boolean(search) || status !== 'all';
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
                (status === 'all' || row.enabled === (status === 'granted')) &&
                matches([
                  section.title,
                  section.description,
                  group.title,
                  group.hint,
                  group.actionHint,
                  row.label,
                  row.hint,
                  row.path,
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
    setStatus('all');
    searchRef.current?.focus();
  };
  const disclose = (key: string): void =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const groupKey = (section: string, group: string): string =>
    `${id}-${section}-group-${group}`;
  const branchKeys = (
    nodes: readonly PermissionEditorNavigationNode[],
    prefix: string,
  ): string[] =>
    nodes.flatMap((node) =>
      node.children?.length
        ? [`${prefix}-${node.id}`, ...branchKeys(node.children, prefix)]
        : [],
    );
  const activeSection = available.find((section) => section.id === active);
  const collapseKeys = activeSection
    ? activeSection.navigation
      ? branchKeys(activeSection.navigation, `${id}-${activeSection.id}`)
      : activeSection.groups
          .filter((group) => !group.accessOnly || group.rows.length !== 1)
          .map((group) => groupKey(activeSection.id, group.id))
    : [];
  const allCollapsed =
    collapseKeys.length > 0 && collapseKeys.every((key) => collapsed.has(key));
  const changeEnabled = (rowId: string, enabled: boolean): void => {
    if (status !== 'all') searchRef.current?.focus();
    onEnabledChange(rowId, enabled);
  };
  const navigationCounts = (
    section: PermissionEditorSection,
  ): ReadonlyMap<string, { enabled: number; total: number }> => {
    const rows = new Map(
      section.groups.flatMap((group) =>
        group.rows.map((row) => [row.id, row] as const),
      ),
    );
    const counts = new Map<string, { enabled: number; total: number }>();
    const visit = (node: PermissionEditorNavigationNode): Set<string> => {
      const ids = new Set(
        node.rowId && rows.has(node.rowId) ? [node.rowId] : [],
      );
      for (const child of node.children ?? [])
        for (const childId of visit(child)) ids.add(childId);
      counts.set(node.id, {
        enabled: [...ids].filter((rowId) => rows.get(rowId)?.enabled).length,
        total: ids.size,
      });
      return ids;
    };
    for (const node of section.navigation ?? []) visit(node);
    return counts;
  };
  const rowProps = {
    readOnly,
    readOnlyHintId: `${id}-readonly`,
    labels: words,
    onEnabledChange: changeEnabled,
    onLevelChange,
  };
  return (
    <Tabs
      value={active ?? ''}
      onValueChange={(value) => {
        setSelected(String(value));
        setQuery('');
        setStatus('all');
      }}
      className='min-w-0 gap-3'
    >
      {available.length > 0 && (
        <div className='overflow-x-auto pb-1'>
          <TabsList variant='line' aria-label={words.navigation}>
            {available.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      )}
      <div className='flex min-w-0 flex-wrap items-center gap-3 border-b pb-3'>
        <InputGroup className='min-w-0 basis-full sm:basis-56 sm:flex-1'>
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            value={query}
            aria-label={words.search}
            placeholder={words.search}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                type='button'
                size='icon-xs'
                aria-label={words.clearSearch}
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
              >
                <XIcon aria-hidden />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <Tabs
          value={status}
          onValueChange={(value) => setStatus(String(value))}
        >
          <TabsList aria-label={words.authorizationStatus}>
            <TabsTrigger value='all'>{words.selectAll}</TabsTrigger>
            <TabsTrigger value='granted'>{words.granted}</TabsTrigger>
            <TabsTrigger value='ungranted'>{words.ungranted}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={filtering || !collapseKeys.length}
          onClick={() =>
            setCollapsed((current) => {
              const next = new Set(current);
              for (const key of collapseKeys) {
                if (allCollapsed) next.delete(key);
                else next.add(key);
              }
              return next;
            })
          }
        >
          {allCollapsed ? words.expandAll : words.collapseAll}
        </Button>
        {filtering && visible.length > 0 && (
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
      <TabsContent value={active ?? ''} className='min-w-0'>
        <div className='min-w-0 md:max-h-[min(65dvh,48rem)] md:overflow-y-auto md:pr-2'>
          {readOnly && (
            <p
              id={`${id}-readonly`}
              className='mb-3 text-xs text-muted-foreground'
            >
              {words.readOnly}
            </p>
          )}
          {visible.length ? (
            visible.map((section) => {
              const original = available.find(
                (item) => item.id === section.id,
              )!;
              const allRows = original.groups.flatMap((group) => group.rows);
              return (
                <section
                  key={section.id}
                  aria-label={section.title}
                  className='grid min-w-0 gap-3 py-1'
                >
                  <div className='flex flex-wrap items-baseline justify-between gap-2'>
                    {filtering && (
                      <h2 className='text-sm font-normal'>{section.title}</h2>
                    )}
                    {section.description && (
                      <p className='text-xs text-muted-foreground'>
                        {section.description}
                      </p>
                    )}
                    <span className='ml-auto text-xs text-muted-foreground'>
                      {words.summary(
                        allRows.filter((row) => row.enabled).length,
                        allRows.length,
                      )}
                    </span>
                  </div>
                  {section.navigation ? (
                    <PermissionNavigationSection
                      {...rowProps}
                      section={section}
                      prefix={`${id}-${section.id}`}
                      collapsed={collapsed}
                      filtering={filtering}
                      onDisclosure={disclose}
                      counts={navigationCounts(original)}
                    />
                  ) : (
                    <div className='divide-y rounded-lg border'>
                      {section.groups.map((group) => {
                        const key = groupKey(section.id, group.id);
                        const complete = original.groups.find(
                          (item) => item.id === group.id,
                        )!;
                        const inline = complete.rows.every(
                          (row) =>
                            !row.hint &&
                            !row.scopes?.length &&
                            !row.levels?.length,
                        );
                        const accessRow =
                          group.accessOnly && group.rows.length === 1
                            ? group.rows[0]
                            : undefined;
                        const closed =
                          !accessRow && !filtering && collapsed.has(key);
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
                            className='min-w-0 p-2'
                          >
                            {!accessRow && (
                              <div className='flex min-w-0 flex-wrap items-center gap-2 rounded-md px-1 py-1 hover:bg-hover'>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon-sm'
                                  disabled={filtering}
                                  aria-label={
                                    closed
                                      ? words.expandGroup(
                                          group.title ?? group.id,
                                        )
                                      : words.collapseGroup(
                                          group.title ?? group.id,
                                        )
                                  }
                                  aria-expanded={!closed}
                                  aria-controls={closed ? undefined : key}
                                  onClick={() => disclose(key)}
                                >
                                  {closed ? (
                                    <ChevronRightIcon aria-hidden />
                                  ) : (
                                    <ChevronDownIcon aria-hidden />
                                  )}
                                </Button>
                                {group.title && (
                                  <h3 className='text-sm font-normal break-words'>
                                    {group.title}
                                  </h3>
                                )}
                                {group.hint && (
                                  <span className='text-xs text-muted-foreground'>
                                    {group.hint}
                                  </span>
                                )}
                                <span className='ml-auto text-xs text-muted-foreground'>
                                  {words.summary(
                                    complete.rows.filter((row) => row.enabled)
                                      .length,
                                    complete.rows.length,
                                  )}
                                </span>
                              </div>
                            )}
                            {!closed && (
                              <div id={key} className='min-w-0'>
                                {group.actionHint && (
                                  <p className='px-2 py-1 text-xs text-muted-foreground'>
                                    {group.actionHint}
                                  </p>
                                )}
                                <div
                                  data-slot='permission-actions'
                                  className={cn(
                                    'min-w-0',
                                    inline
                                      ? 'flex flex-wrap items-start gap-x-3'
                                      : 'grid',
                                  )}
                                >
                                  {rows.map((row) => (
                                    <PermissionRow
                                      key={row.id}
                                      {...rowProps}
                                      row={row}
                                      controlId={`${id}-${row.id}`}
                                      presentation={inline ? 'inline' : 'tile'}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
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
              );
            })
          ) : (
            <Empty role='status' className='min-h-40 border p-6'>
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
              {filtering && (
                <Button type='button' variant='outline' onClick={clearFilters}>
                  {words.clear}
                </Button>
              )}
            </Empty>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
