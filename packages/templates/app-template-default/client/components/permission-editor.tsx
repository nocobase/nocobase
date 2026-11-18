/**
 * A controlled two-column permission editor: a menu tree on the left, the selected menu's actions on the right.
 * The host owns the catalog, loading, Save and persistence; this component only edits the draft it is given.
 */
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InfoIcon,
  SearchIcon,
  ShieldCheckIcon,
  XIcon,
} from 'lucide-react';
import {
  Fragment,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from 'cn';
import { Button } from '#components/ui/button';
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
import { Switch } from '#components/ui/switch';
import {
  applyQuickSet,
  dependentsOf,
  effectiveScopeValue,
  filterModules,
  menuStatus,
  narrowerOptions,
  nextMenu,
  orderedActions,
  ownScopeValue,
  quickSetRemovals,
  setActionEnabled,
  setScopeValue,
  slotOptions,
  viewActionOf,
  viewScopeLabel,
  viewScopeValue,
  visibleMenuCount,
  type PermissionAction,
  type PermissionChange,
  type PermissionGrants,
  type PermissionMenu,
  type PermissionMenuState,
  type PermissionModule,
  type PermissionNotice,
  type PermissionQuickSet,
  type PermissionRisk,
  type PermissionScopeSlot,
} from './permission-editor-model.js';

export type {
  PermissionAction,
  PermissionGrant,
  PermissionGrants,
  PermissionMenu,
  PermissionModule,
  PermissionNotice,
  PermissionRisk,
  PermissionScopeOption,
  PermissionScopeSlot,
} from './permission-editor-model.js';

export interface PermissionEditorLabels {
  readonly menus: string;
  readonly search: string;
  readonly clearSearch: string;
  readonly noResults: string;
  readonly empty: string;
  readonly administration: string;
  readonly public: string;
  readonly publicNote: string;
  readonly visibleInMenu: string;
  readonly hiddenFromMenu: string;
  readonly enabledCount: (enabled: number, total: number) => string;
  readonly enableAll: string;
  readonly viewOnly: string;
  readonly disableAll: string;
  readonly next: (menu: string) => string;
  readonly sameAsView: (scope: string) => string;
  readonly scopeFor: (action: string, scope?: string) => string;
  readonly followHint: string;
  readonly riskHint: string;
  readonly risk: (risk: PermissionRisk) => string;
  readonly managed: string;
  readonly visibleMenus: (visible: number, total: number) => string;
  readonly unsaved: string;
  readonly readOnly: string;
  readonly unrestrictedTitle: string;
  readonly unrestrictedDescription: string;
  readonly expand: (module: string) => string;
  readonly collapse: (module: string) => string;
  readonly confirmDisable: (
    actions: readonly string[],
    dependents: readonly string[],
  ) => string;
  readonly confirm: string;
  readonly cancel: string;
  readonly dismiss: string;
  readonly notice: (notice: PermissionNotice) => string;
}

export interface PermissionEditorProps {
  readonly modules: readonly PermissionModule[];
  readonly value: PermissionGrants;
  readonly onChange: (next: PermissionGrants) => void;
  /** The role has every permission, such as Administrator: only an explanation is shown. */
  readonly unrestricted?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  /** Shown above the editor: the role's name and host actions such as "Preview as this role". */
  readonly header?: ReactNode;
  /** Host actions in the footer, normally Discard changes and Save. */
  readonly footer?: ReactNode;
  /** The draft differs from what is saved. */
  readonly dirty?: boolean | undefined;
  /** The menu opened first; defaults to the first menu with something to set. */
  readonly defaultMenuId?: string | undefined;
  readonly labels?: Partial<PermissionEditorLabels> | undefined;
  readonly className?: string | undefined;
}

const list = (items: readonly string[]): string =>
  new Intl.ListFormat('en', { type: 'conjunction' }).format(items);

const DEFAULT_LABELS: PermissionEditorLabels = {
  menus: 'Menus',
  search: 'Search menus or permissions',
  clearSearch: 'Clear search',
  noResults: 'No matching menus or permissions',
  empty: 'No menus to configure',
  administration: 'Administration',
  public: 'Public',
  publicNote: 'Every signed-in user can open it. No permission needed.',
  visibleInMenu: 'Visible in menu',
  hiddenFromMenu: 'Hidden from menu',
  enabledCount: (enabled, total) => `${enabled} of ${total} enabled`,
  enableAll: 'Enable all',
  viewOnly: 'View only',
  disableAll: 'Disable all',
  next: (menu) => `Next: ${menu}`,
  sameAsView: (scope) => `Same as view (${scope})`,
  scopeFor: (action, scope) =>
    scope ? `${action}: ${scope}` : `Data scope of ${action}`,
  followHint:
    'Other actions follow the view scope; they can be narrower, never wider.',
  riskHint: 'High-risk permissions are never turned on automatically.',
  risk: (risk) => (risk === 'high' ? 'High risk' : 'Sensitive'),
  managed: 'Managed by the application',
  visibleMenus: (visible, total) => `${visible} of ${total} menus visible`,
  unsaved: 'Unsaved changes',
  readOnly: 'These permissions are read-only.',
  unrestrictedTitle: 'All permissions (unrestricted)',
  unrestrictedDescription:
    'This role can open every menu and perform every action on all data. There is nothing to set.',
  expand: (module) => `Expand ${module}`,
  collapse: (module) => `Collapse ${module}`,
  confirmDisable: (actions, dependents) =>
    `Turning off ${list(actions)} also turns off ${list(dependents)}, which ${dependents.length === 1 ? 'needs' : 'need'} it.`,
  confirm: 'Turn off',
  cancel: 'Cancel',
  dismiss: 'Dismiss',
  notice: (notice) =>
    notice.kind === 'scope-reset'
      ? `${list(notice.actions)} now ${notice.actions.length === 1 ? 'follows' : 'follow'} the view scope (${notice.view}) again, because ${notice.actions.length === 1 ? 'it was' : 'they were'} wider.`
      : notice.kind === 'auto-enabled'
        ? `Also turned on ${list(notice.actions)}, which this needs.`
        : notice.kind === 'missing-requirement'
          ? [
              `${notice.action} stays off.`,
              notice.actions.length
                ? `It needs ${list(notice.actions)}, which ${notice.actions.length === 1 ? 'is' : 'are'} never turned on automatically. Turn ${notice.actions.length === 1 ? 'it' : 'them'} on first.`
                : '',
              notice.managed.length
                ? `It needs ${list(notice.managed)}, which ${notice.managed.length === 1 ? 'is' : 'are'} managed by the application and cannot be turned on here.`
                : '',
            ]
              .filter(Boolean)
              .join(' ')
          : `Nothing was turned off: ${list(notice.actions)} ${notice.actions.length === 1 ? 'is' : 'are'} managed by the application and ${notice.actions.length === 1 ? 'needs' : 'need'} it.`,
};

const FOLLOW = '__same-as-view__';

const DOT: Record<PermissionMenuState, string> = {
  public: 'bg-emerald-400',
  full: 'bg-primary',
  partial: 'bg-primary/40',
  off: 'bg-muted-foreground/25',
};

function RiskTag({
  risk,
  labels,
}: {
  readonly risk: PermissionRisk;
  readonly labels: PermissionEditorLabels;
}): ReactElement {
  return (
    <span
      data-slot='permission-risk'
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-1.5 text-xs leading-5 font-medium',
        risk === 'high'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      )}
    >
      {labels.risk(risk)}
    </span>
  );
}

function ScopeSelect({
  label,
  options,
  value,
  disabled,
  following,
  onChange,
}: {
  readonly label: string;
  readonly options: readonly { value: string; label: string }[];
  readonly value: string;
  readonly disabled: boolean;
  readonly following?: boolean | undefined;
  readonly onChange: (value: string) => void;
}): ReactElement {
  return (
    <Select
      items={options}
      value={value}
      disabled={disabled}
      onValueChange={(next: string | null) => {
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger
        size='sm'
        aria-label={label}
        data-following={following ? '' : undefined}
        className={cn(
          'w-full min-w-0',
          following === true && 'border-dashed text-muted-foreground',
          following === false &&
            'border-primary/40 bg-primary/5 text-primary dark:bg-primary/10',
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width)'>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function ScopeControl({
  menu,
  action,
  slot,
  grants,
  disabled,
  labels,
  onScope,
}: {
  readonly menu: PermissionMenu;
  readonly action: PermissionAction;
  readonly slot: PermissionScopeSlot;
  readonly grants: PermissionGrants;
  readonly disabled: boolean;
  readonly labels: PermissionEditorLabels;
  readonly onScope: (slotId: string, value: string | undefined) => void;
}): ReactElement | null {
  const accessibleName = labels.scopeFor(action.label, slot.label);
  const options = slotOptions(menu, slot);
  const own = ownScopeValue(menu, grants, action, slot);
  const viewValue = viewScopeValue(menu, grants);
  if (slot.followsView && !action.view && viewValue !== undefined) {
    const viewLabel = viewScopeLabel(menu, grants) ?? viewValue;
    const narrower = narrowerOptions(menu, grants, slot);
    if (!narrower.length)
      return (
        <span className='flex min-h-7 items-center text-xs text-muted-foreground'>
          {labels.sameAsView(viewLabel)}
        </span>
      );
    return (
      <ScopeSelect
        label={accessibleName}
        options={[
          { value: FOLLOW, label: labels.sameAsView(viewLabel) },
          ...narrower,
        ]}
        value={own ?? FOLLOW}
        following={own === undefined}
        disabled={disabled}
        onChange={(next) =>
          onScope(slot.id, next === FOLLOW ? undefined : next)
        }
      />
    );
  }
  if (!options.length) return null;
  return (
    <ScopeSelect
      label={accessibleName}
      options={options}
      value={effectiveScopeValue(menu, grants, action, slot) ?? ''}
      disabled={disabled}
      onChange={(next) => onScope(slot.id, next)}
    />
  );
}

function ActionRow({
  menu,
  action,
  grants,
  readOnly,
  labels,
  controlId,
  onToggle,
  onScope,
}: {
  readonly menu: PermissionMenu;
  readonly action: PermissionAction;
  readonly grants: PermissionGrants;
  readonly readOnly: boolean;
  readonly labels: PermissionEditorLabels;
  readonly controlId: string;
  readonly onToggle: (action: PermissionAction, enabled: boolean) => void;
  readonly onScope: (
    action: PermissionAction,
    slotId: string,
    value: string | undefined,
  ) => void;
}): ReactElement {
  const enabled = Boolean(grants[action.id]);
  const slots = action.scopes ?? [];
  // One unnamed scope sits beside the title; named or several scopes get their own row.
  const inline = slots.length === 1 && !slots[0]?.label ? slots[0] : undefined;
  const stacked = inline ? [] : slots;
  const disabled = readOnly || !enabled || Boolean(action.managed);
  const description = action.description ?? undefined;
  return (
    <li
      data-slot='permission-action'
      data-enabled={enabled ? '' : undefined}
      className='grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-2.5 @min-[44rem]/permissions:grid-cols-[auto_minmax(0,1fr)_minmax(14rem,19rem)] @min-[44rem]/permissions:px-4'
    >
      <Switch
        id={controlId}
        checked={enabled}
        disabled={readOnly || Boolean(action.managed)}
        aria-labelledby={`${controlId}-label`}
        aria-describedby={description ? `${controlId}-description` : undefined}
        onCheckedChange={(on: boolean) => onToggle(action, on)}
      />
      <div className='grid min-w-0 gap-0.5'>
        <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
          <label
            id={`${controlId}-label`}
            htmlFor={controlId}
            className={cn(
              'cursor-pointer text-sm leading-5 font-medium break-words',
              !enabled && 'text-muted-foreground',
            )}
          >
            {action.label}
          </label>
          {action.risk && <RiskTag risk={action.risk} labels={labels} />}
        </div>
        {(description || action.managed) && (
          <p
            id={`${controlId}-description`}
            className='text-xs leading-5 break-words text-muted-foreground'
          >
            {[description, action.managed ? labels.managed : undefined]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
      {inline && (
        <div className='col-start-2 min-w-0 @min-[44rem]/permissions:col-start-3 @min-[44rem]/permissions:row-start-1'>
          <ScopeControl
            menu={menu}
            action={action}
            slot={inline}
            grants={grants}
            disabled={disabled}
            labels={labels}
            onScope={(slotId, value) => onScope(action, slotId, value)}
          />
        </div>
      )}
      {stacked.length > 0 && (
        <div
          data-slot='permission-scopes'
          className='col-span-full col-start-2 flex min-w-0 flex-col gap-2 @min-[44rem]/permissions:flex-row @min-[44rem]/permissions:flex-wrap @min-[44rem]/permissions:items-center @min-[44rem]/permissions:gap-x-5'
        >
          {stacked.map((slot) => (
            <div
              key={slot.id}
              data-slot='permission-scope'
              className='grid min-w-0 gap-1 @min-[44rem]/permissions:flex @min-[44rem]/permissions:items-center @min-[44rem]/permissions:gap-2'
            >
              {slot.label && (
                <span className='text-xs text-muted-foreground'>
                  {slot.label}
                </span>
              )}
              <div className='min-w-0 @min-[44rem]/permissions:w-60'>
                <ScopeControl
                  menu={menu}
                  action={action}
                  slot={slot}
                  grants={grants}
                  disabled={disabled}
                  labels={labels}
                  onScope={(slotId, value) => onScope(action, slotId, value)}
                />
              </div>
              {enabled && slot.configuration}
            </div>
          ))}
        </div>
      )}
      {inline && enabled && inline.configuration && (
        <div className='col-span-full col-start-2 min-w-0'>
          {inline.configuration}
        </div>
      )}
    </li>
  );
}

function MenuTree({
  modules,
  grants,
  selected,
  query,
  collapsed,
  labels,
  onSelect,
  onToggleModule,
}: {
  readonly modules: readonly PermissionModule[];
  readonly grants: PermissionGrants;
  readonly selected: string | undefined;
  readonly query: string;
  readonly collapsed: ReadonlySet<string>;
  readonly labels: PermissionEditorLabels;
  readonly onSelect: (menuId: string) => void;
  readonly onToggleModule: (moduleId: string) => void;
}): ReactElement {
  const id = useId();
  const searching = Boolean(query.trim());
  const firstAdministration = modules.findIndex(
    (module) => module.administration,
  );
  return (
    <div className='grid min-w-0 gap-0.5'>
      {modules.map((module, moduleIndex) => {
        const open = searching || !collapsed.has(module.id);
        const statuses = module.menus.map((menu) => menuStatus(menu, grants));
        const restricted = statuses.filter(
          (status) => status.state !== 'public',
        );
        const visible = restricted.filter(
          (status) => status.enabled > 0,
        ).length;
        const count = restricted.length
          ? visible
            ? `${visible}/${restricted.length}`
            : ''
          : labels.public;
        const heading =
          moduleIndex === firstAdministration ? (
            <div className='mx-2 mt-2 border-t pt-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase'>
              {labels.administration}
            </div>
          ) : null;
        const groupId = `${id}-${module.id}`;
        return (
          <Fragment key={module.id}>
            {heading}
            <div className='min-w-0'>
              <button
                type='button'
                className='flex w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm font-semibold hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default'
                aria-expanded={open}
                aria-controls={open ? groupId : undefined}
                aria-label={
                  open
                    ? labels.collapse(module.label)
                    : labels.expand(module.label)
                }
                disabled={searching}
                onClick={() => onToggleModule(module.id)}
              >
                {open ? (
                  <ChevronDownIcon
                    aria-hidden
                    className='size-3.5 shrink-0 text-muted-foreground'
                  />
                ) : (
                  <ChevronRightIcon
                    aria-hidden
                    className='size-3.5 shrink-0 text-muted-foreground'
                  />
                )}
                <span className='min-w-0 flex-1 truncate'>{module.label}</span>
                <span className='shrink-0 text-xs font-normal text-muted-foreground tabular-nums'>
                  {count}
                </span>
              </button>
              {open && (
                <ul id={groupId} className='grid min-w-0 gap-0.5 pb-1'>
                  {module.menus.map((menu, index) => {
                    const status = statuses[index];
                    const groupHeading =
                      menu.group &&
                      menu.group !== module.menus[index - 1]?.group
                        ? menu.group
                        : undefined;
                    const active = menu.id === selected;
                    return (
                      <Fragment key={menu.id}>
                        {groupHeading && (
                          <li
                            aria-hidden
                            className='px-2 pt-1.5 pl-7 text-xs text-muted-foreground'
                          >
                            {groupHeading}
                          </li>
                        )}
                        <li className='min-w-0'>
                          <button
                            type='button'
                            data-slot='permission-menu'
                            data-state={status.state}
                            aria-current={active ? 'true' : undefined}
                            className={cn(
                              'flex w-full min-w-0 items-center gap-2 rounded-md py-1.5 pr-2 pl-7 text-left text-sm hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                              active &&
                                'bg-muted font-semibold text-foreground',
                              !active &&
                                status.state === 'off' &&
                                'text-muted-foreground',
                            )}
                            onClick={() => onSelect(menu.id)}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                'size-1.5 shrink-0 rounded-full',
                                DOT[status.state],
                              )}
                            />
                            <span className='min-w-0 flex-1 truncate'>
                              {menu.label}
                            </span>
                            <span className='sr-only'>, </span>
                            <span className='shrink-0 text-xs font-normal text-muted-foreground tabular-nums'>
                              {status.state === 'public'
                                ? labels.public
                                : status.enabled
                                  ? `${status.enabled}/${status.total}`
                                  : ''}
                            </span>
                          </button>
                        </li>
                      </Fragment>
                    );
                  })}
                </ul>
              )}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

interface PendingDisable {
  readonly message: string;
  readonly apply: (grants: PermissionGrants) => PermissionChange;
}

/** A controlled editor: the application owns its catalog, the draft's persistence and Save. */
export function PermissionEditor({
  modules,
  value,
  onChange,
  unrestricted = false,
  readOnly = false,
  header,
  footer,
  dirty = false,
  defaultMenuId,
  labels,
  className,
}: PermissionEditorProps): ReactElement {
  const words: PermissionEditorLabels = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const menus = modules.flatMap((module) =>
    module.menus.map((menu) => ({ module, menu })),
  );
  const firstConfigurable =
    menus.find(({ menu }) => !menu.public && menu.actions.length)?.menu.id ??
    menus[0]?.menu.id;
  const [selectedId, setSelectedId] = useState(
    defaultMenuId ?? firstConfigurable,
  );
  const [notices, setNotices] = useState<readonly PermissionNotice[]>([]);
  const [pending, setPending] = useState<PendingDisable | undefined>();
  // A host that turns read-only while a confirmation is open cancels it.
  if (readOnly && pending) setPending(undefined);
  // Notices and a pending confirmation describe the draft they came from. When the host replaces the draft itself,
  // such as discarding changes or loading another revision, they no longer apply.
  const [shown, setShown] = useState<{
    readonly value: PermissionGrants;
    readonly expected: PermissionGrants | undefined;
  }>({ value, expected: undefined });
  if (shown.value !== value) {
    setShown({ value, expected: undefined });
    if (
      !shown.expected ||
      JSON.stringify(shown.expected) !== JSON.stringify(value)
    ) {
      setNotices([]);
      setPending(undefined);
    }
  }
  const current =
    menus.find(({ menu }) => menu.id === selectedId) ??
    menus.find(({ menu }) => menu.id === firstConfigurable);
  const filtered = filterModules(modules, query);
  const counts = visibleMenuCount(modules, value);

  const select = (menuId: string): void => {
    setSelectedId(menuId);
    setNotices([]);
    setPending(undefined);
  };
  const commit = (change: PermissionChange): void => {
    setShown({ value, expected: change.grants });
    setNotices(change.notices);
    setPending(undefined);
    onChange(change.grants);
  };
  const toggle = (action: PermissionAction, enabled: boolean): void => {
    if (readOnly) return;
    if (enabled) {
      commit(setActionEnabled(modules, value, action.id, true));
      return;
    }
    const dependents = dependentsOf(modules, value, [action.id]);
    // Managed dependents block the change; the model explains why.
    if (!dependents.length || dependents.some((item) => item.managed)) {
      commit(setActionEnabled(modules, value, action.id, false));
      return;
    }
    setNotices([]);
    setPending({
      message: words.confirmDisable(
        [action.label],
        dependents.map((item) => item.label),
      ),
      apply: (grants) => setActionEnabled(modules, grants, action.id, false),
    });
  };
  const quick = (menu: PermissionMenu, mode: PermissionQuickSet): void => {
    if (readOnly) return;
    const { own, others } = quickSetRemovals(modules, value, menu, mode);
    if (
      !others.length ||
      dependentsOf(modules, value, own).some((item) => item.managed)
    ) {
      commit(applyQuickSet(modules, value, menu, mode));
      return;
    }
    setNotices([]);
    setPending({
      message: words.confirmDisable(
        [menu.label],
        others.map((item) => item.label),
      ),
      apply: (grants) => applyQuickSet(modules, grants, menu, mode),
    });
  };

  const footerBar = (
    <div className='flex min-w-0 flex-wrap items-center gap-2 border-t px-4 py-3'>
      {/* The count stays in view while editing: it is what turning a menu's actions off changes. */}
      <span
        role='status'
        className='mr-auto inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'
      >
        {unrestricted ? null : (
          <>
            <span>{words.visibleMenus(counts.visible, counts.total)}</span>
            {dirty && (
              <span className='inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400'>
                <span
                  aria-hidden
                  className='size-1.5 rounded-full bg-current'
                />
                {words.unsaved}
              </span>
            )}
          </>
        )}
      </span>
      {footer && (
        <div className='flex flex-wrap items-center gap-2'>{footer}</div>
      )}
    </div>
  );

  if (unrestricted)
    return (
      <div
        data-slot='permission-editor'
        className={cn(
          '@container/permissions min-w-0 rounded-lg border bg-card text-card-foreground',
          className,
        )}
      >
        {header && <div className='border-b px-4 py-3'>{header}</div>}
        <div className='flex min-w-0 items-start gap-3 px-4 py-6'>
          <ShieldCheckIcon
            aria-hidden
            className='mt-0.5 size-5 shrink-0 text-primary'
          />
          <div className='grid min-w-0 gap-1'>
            <h2 className='text-base font-semibold'>
              {words.unrestrictedTitle}
            </h2>
            <p className='text-sm text-muted-foreground'>
              {words.unrestrictedDescription}
            </p>
          </div>
        </div>
        {footer && footerBar}
      </div>
    );

  const detail = (() => {
    if (!current) return null;
    const { module, menu } = current;
    const status = menuStatus(menu, value);
    const titleId = `${id}-title`;
    if (menu.public)
      return (
        <section
          aria-labelledby={titleId}
          className='grid min-w-0 content-start gap-3'
        >
          <p className='text-xs text-muted-foreground'>{module.label}</p>
          <div className='flex flex-wrap items-center gap-2'>
            <h2
              ref={titleRef}
              tabIndex={-1}
              id={titleId}
              className='text-lg font-semibold outline-none'
            >
              {menu.label}
            </h2>
            <span className='rounded-full bg-emerald-500/10 px-2 text-xs leading-5 text-emerald-700 dark:text-emerald-400'>
              {words.public}
            </span>
          </div>
          <p className='rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300'>
            {typeof menu.public === 'string'
              ? `${menu.public} ${words.publicNote}`
              : words.publicNote}
          </p>
        </section>
      );
    const { basic, business } = orderedActions(menu);
    const hasFollowers =
      menu.actions.some((action) =>
        action.scopes?.some((slot) => slot.followsView),
      ) && Boolean(viewActionOf(menu)?.scopes?.length);
    const hasRisk = menu.actions.some((action) => action.risk);
    const next = nextMenu(modules, menu.id);
    const row = (action: PermissionAction): ReactElement => (
      <ActionRow
        key={action.id}
        menu={menu}
        action={action}
        grants={value}
        readOnly={readOnly}
        labels={words}
        controlId={`${id}-${action.id}`}
        onToggle={toggle}
        onScope={(item, slotId, scope) =>
          commit(setScopeValue(modules, value, item.id, slotId, scope))
        }
      />
    );
    return (
      <section
        aria-labelledby={titleId}
        className='grid min-w-0 content-start gap-3'
      >
        <div className='grid min-w-0 gap-0.5'>
          <p className='text-xs text-muted-foreground'>{module.label}</p>
          <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2'>
            <h2
              ref={titleRef}
              tabIndex={-1}
              id={titleId}
              className='text-lg font-semibold outline-none'
            >
              {menu.label}
            </h2>
            <span
              className={cn(
                'rounded-full px-2 text-xs leading-5',
                status.enabled
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {status.enabled ? words.visibleInMenu : words.hiddenFromMenu}
            </span>
            <span className='text-xs text-muted-foreground'>
              {words.enabledCount(status.enabled, status.total)}
            </span>
            {!readOnly && (
              <div className='flex flex-wrap gap-1.5 @min-[44rem]/permissions:ml-auto'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => quick(menu, 'all')}
                >
                  {words.enableAll}
                </Button>
                {viewActionOf(menu) && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => quick(menu, 'view')}
                  >
                    {words.viewOnly}
                  </Button>
                )}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => quick(menu, 'none')}
                >
                  {words.disableAll}
                </Button>
              </div>
            )}
          </div>
          {menu.description && (
            <p className='text-sm text-muted-foreground'>{menu.description}</p>
          )}
        </div>
        {readOnly && (
          <p className='text-xs text-muted-foreground'>{words.readOnly}</p>
        )}
        {pending && (
          <div
            role='alert'
            className='flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm'
          >
            <span className='min-w-0 flex-1 basis-60'>{pending.message}</span>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setPending(undefined)}
            >
              {words.cancel}
            </Button>
            <Button
              type='button'
              variant='destructive'
              size='sm'
              onClick={() => {
                if (!readOnly) commit(pending.apply(value));
              }}
            >
              {words.confirm}
            </Button>
          </div>
        )}
        {notices.length > 0 && (
          <div
            role='status'
            className='grid min-w-0 gap-1 rounded-lg border bg-muted/40 px-3 py-2 text-sm'
          >
            {notices.map((notice, index) => (
              <div key={notice.kind} className='flex min-w-0 items-start gap-2'>
                <span className='min-w-0 flex-1'>{words.notice(notice)}</span>
                {index === 0 && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-xs'
                    aria-label={words.dismiss}
                    onClick={() => setNotices([])}
                  >
                    <XIcon aria-hidden />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        <ul
          data-slot='permission-actions'
          className='min-w-0 divide-y overflow-hidden rounded-lg border'
        >
          {basic.map(row)}
          {basic.length > 0 && business.length > 0 && (
            <li
              aria-hidden
              data-slot='permission-divider'
              className='h-1.5 bg-muted/50'
            />
          )}
          {business.map(row)}
        </ul>
        {menu.notice && (
          <div
            data-slot='permission-menu-notice'
            className='flex min-w-0 items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'
          >
            <InfoIcon aria-hidden className='mt-0.5 size-4 shrink-0' />
            <div className='min-w-0'>{menu.notice}</div>
          </div>
        )}
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          <p className='min-w-0 flex-1 basis-60 text-xs text-muted-foreground'>
            {hasFollowers ? words.followHint : hasRisk ? words.riskHint : null}
          </p>
          {next && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => {
                select(next.id);
                // Bring the new menu into view, which on a phone sits below the tree.
                requestAnimationFrame(() => titleRef.current?.focus());
              }}
            >
              {words.next(next.label)}
              <ArrowRightIcon aria-hidden />
            </Button>
          )}
        </div>
      </section>
    );
  })();

  return (
    <div
      data-slot='permission-editor'
      className={cn(
        '@container/permissions min-w-0 rounded-lg border bg-card text-card-foreground',
        className,
      )}
    >
      {header && <div className='border-b px-4 py-3'>{header}</div>}
      <div className='grid min-w-0 @min-[44rem]/permissions:grid-cols-[15.5rem_minmax(0,1fr)]'>
        <nav
          aria-label={words.menus}
          className='min-w-0 border-b p-2 @min-[44rem]/permissions:border-r @min-[44rem]/permissions:border-b-0'
        >
          <InputGroup className='mb-2'>
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
          <div className='max-h-64 min-w-0 overflow-y-auto @min-[44rem]/permissions:max-h-[min(70dvh,48rem)]'>
            {filtered.length ? (
              <MenuTree
                modules={filtered}
                grants={value}
                selected={current?.menu.id}
                query={query}
                collapsed={collapsed}
                labels={words}
                onSelect={select}
                onToggleModule={(moduleId) =>
                  setCollapsed((previous) => {
                    const nextSet = new Set(previous);
                    if (nextSet.has(moduleId)) nextSet.delete(moduleId);
                    else nextSet.add(moduleId);
                    return nextSet;
                  })
                }
              />
            ) : (
              <p
                role='status'
                className='px-2 py-3 text-sm text-muted-foreground'
              >
                {modules.length ? words.noResults : words.empty}
              </p>
            )}
          </div>
        </nav>
        <div className='min-w-0 p-4 @min-[44rem]/permissions:px-6 @min-[44rem]/permissions:py-5'>
          {detail ?? (
            <p className='text-sm text-muted-foreground'>{words.empty}</p>
          )}
        </div>
      </div>
      {footerBar}
    </div>
  );
}
