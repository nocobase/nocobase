/**
 * A controlled role editor. Page access: a tree of checkboxes that decides which pages a role opens, with the number
 * of operations each page's objects allow and the operations a page turns on by default. Operations: a list of
 * objects beside the selected object's actions, where each action and its data scope is set once for every page that
 * uses the object. System settings: None, View or Manage per settings page, or action by action. Hosts add tabs of
 * their own, such as Members. The host owns the catalog, loading, Save and persistence; this component only edits the
 * draft it is given.
 */
import {
  CheckIcon,
  ChevronDownIcon,
  CircleIcon,
  InfoIcon,
  SearchIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';
import {
  Fragment,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from 'cn';
import { Button } from '#components/ui/button';
import { Checkbox } from '#components/ui/checkbox';
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
import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import {
  applyQuickSet,
  applyQuickSetMany,
  quickSetLevel,
  quickSetManyRemovals,
  enableDefaults,
  menuActionCount,
  menuLeaves,
  pageAccessGaps,
  setSettingsLevel,
  settingsLevel,
  configurationLocked,
  dependentsOf,
  effectiveScopeValue,
  blockedLeaderObject,
  followedObject,
  filterObjects,
  findAction,
  isMenuChecked,
  isMenuToggleable,
  menuCheckState,
  menuCount,
  menuWarnings,
  narrowerOptions,
  objectCount,
  objectStatus,
  orderedActions,
  ownScopeValue,
  quickSetRemovals,
  setActionEnabled,
  setMenuChecked,
  setScopeValue,
  settingsCount,
  settingsPageObject,
  slotOptions,
  viewActionOf,
  viewScopeLabel,
  viewScopeValue,
  type PermissionAction,
  type PermissionChange,
  type PermissionGrants,
  type PermissionMenuNode,
  type PermissionMenuWarning,
  type PermissionNotice,
  type PermissionObject,
  type PermissionPageGap,
  type PermissionQuickSet,
  type PermissionScopeSlot,
  type PermissionSettingsPage,
  type PermissionValue,
} from './permission-editor-model.js';

export type {
  PermissionAction,
  PermissionGrant,
  PermissionGrants,
  PermissionMenuNode,
  PermissionMenuUses,
  PermissionNotice,
  PermissionObject,
  PermissionRisk,
  PermissionScopeOption,
  PermissionScopeSlot,
  PermissionSettingsPage,
  PermissionValue,
} from './permission-editor-model.js';

export type PermissionEditorTab = 'menus' | 'objects' | 'settings';

/** A host tab after the built-in ones, such as a role's members. */
export interface PermissionEditorExtraTab {
  readonly value: string;
  readonly label: ReactNode;
  readonly content: ReactNode;
}

export interface PermissionEditorLabels {
  readonly menusTab: string;
  readonly objectsTab: string;
  readonly settingsTab: string;
  readonly tabCount: (count: number, total: number) => string;
  readonly noMenus: string;
  readonly emptyPage: (menu: string, object: string) => string;
  readonly openView: (action: string) => string;
  /** A menu without a permission of its own: it shows while this action is on, set on the object. */
  readonly opensWith: (action: string) => string;
  readonly attention: (count: number) => string;
  readonly objects: string;
  readonly search: string;
  readonly clearSearch: string;
  readonly noResults: string;
  readonly empty: string;
  readonly objectEnabled: (enabled: number, total: number) => string;
  readonly objectOff: string;
  /** The quick settings of an object or a group: off, View only, and every action but risky ones. */
  readonly quickNone: string;
  readonly quickView: string;
  readonly quickAll: string;
  readonly quickAllHint: string;
  /** Beside an object set action by action, which none of the quick settings matches. */
  readonly quickCustom: string;
  readonly quickLevel: (object: string) => string;
  readonly groupQuick: string;
  readonly groupQuickLevel: (group: string) => string;
  readonly groupEnabled: (enabled: number, total: number) => string;
  readonly objectsHint: string;
  readonly onlyEnabled: string;
  readonly expandObject: string;
  readonly collapseObject: string;
  readonly sameAsView: (scope: string) => string;
  /** A slot following another object's View, such as the customers a Contacts action reads. */
  readonly sameAsObjectView: (object: string, scope: string) => string;
  /** Beside a scope that follows another View which is off: it keeps its value until that View is on. */
  readonly needsView: (object: string) => string;
  readonly scopeFor: (action: string, scope?: string) => string;
  readonly managed: string;
  readonly unsaved: string;
  readonly readOnly: string;
  readonly unrestrictedTitle: string;
  readonly unrestrictedDescription: string;
  readonly confirmDisable: (
    actions: readonly string[],
    dependents: readonly string[],
  ) => string;
  readonly confirm: string;
  readonly cancel: string;
  readonly dismiss: string;
  readonly notice: (notice: PermissionNotice) => string;
  /** A page's "x / y operations", opening its object in the Operations tab. */
  readonly operationCount: (enabled: number, total: number) => string;
  /** Beside a checked page none of whose listed objects can be viewed. */
  readonly opensEmpty: string;
  /** Under a page just checked: the operations it turned on. */
  readonly defaultsAdded: (actions: readonly string[]) => string;
  readonly adjustOperations: string;
  readonly usedOn: (pages: readonly string[]) => string;
  readonly notOnPage: string;
  /** An object with operations on whose pages the role cannot open. */
  readonly missingPage: (pages: readonly string[]) => string;
  readonly sensitive: string;
  readonly highRisk: string;
  readonly settingsLevel: (page: string) => string;
  readonly settingsNone: string;
  readonly settingsView: string;
  readonly settingsManage: string;
  /** A settings page set action by action: how many of its actions are on. */
  readonly settingsCustom: (enabled: number, total: number) => string;
  readonly settingsDetails: string;
  readonly settingsCollapse: string;
  /** Above the settings pages: the ones this role sees in System settings. */
  readonly settingsVisible: (pages: readonly string[]) => string;
  readonly settingsNoneVisible: string;
  /** Beside a settings page with a high-risk operation. */
  readonly containsHighRisk: string;
  /** Beside a public page, which has no checkbox. */
  readonly publicPage: string;
  readonly searchPages: string;
  readonly onlyChecked: string;
  readonly noMatchingPages: string;
  /** Beside a group: how many of its pages are checked. */
  readonly groupChecked: (checked: number, total: number) => string;
  readonly toggleGroup: (group: string) => string;
  readonly usedOnLabel: string;
  readonly pageOpens: string;
  readonly pageClosed: string;
  /** Unsaved changes on a tab, as its badge's accessible name. */
  readonly tabChanges: (count: number) => string;
}

export interface PermissionEditorProps {
  /** The sidebar's menus. Groups hold menus; a public menu shows as fixed. */
  readonly menus: readonly PermissionMenuNode[];
  /** Business objects with their actions, each set once whichever menus use it. */
  readonly objects: readonly PermissionObject[];
  /**
   * System settings pages and the settings objects they use, set in their own tab. Their entries are not menus: each
   * shows while the action that opens it is on. Leave empty to hide the tab.
   */
  readonly settings?: readonly PermissionSettingsPage[] | undefined;
  readonly value: PermissionValue;
  readonly onChange: (next: PermissionValue) => void;
  /** The role has every permission, such as Administrator: only an explanation is shown. */
  readonly unrestricted?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  /** Shown above the tabs: the role's name and host actions such as "Duplicate as new role". */
  readonly header?: ReactNode;
  /** Host actions in the footer, normally Discard changes and Save. */
  readonly footer?: ReactNode;
  /** The draft differs from what is saved. */
  readonly dirty?: boolean | undefined;
  readonly defaultTab?: PermissionEditorTab | undefined;
  /** Tabs after the built-in ones. */
  readonly tabs?: readonly PermissionEditorExtraTab[] | undefined;
  /** Unsaved changes by tab value, shown as a badge on the tab. */
  readonly tabBadges?: Readonly<Record<string, number>> | undefined;
  /**
   * The actions each page turns on when it is checked, by menu id, at their default scopes. Risky and managed actions
   * are never turned on this way.
   */
  readonly menuDefaults?:
    Readonly<Record<string, readonly string[]>> | undefined;
  /** The object opened first; defaults to the first one. */
  readonly defaultObjectId?: string | undefined;
  readonly labels?: Partial<PermissionEditorLabels> | undefined;
  readonly className?: string | undefined;
}

const NO_SETTINGS: readonly PermissionSettingsPage[] = [];
const NO_TABS: readonly PermissionEditorExtraTab[] = [];
const NO_GROUPS: ReadonlySet<string> = new Set();

const list = (items: readonly string[]): string =>
  new Intl.ListFormat('en', { type: 'conjunction' }).format(items);

const TAB_TRIGGER =
  'min-w-0 flex-col gap-0 px-1 py-1 text-center leading-tight whitespace-normal @max-[44rem]/permissions:!h-auto @min-[44rem]/permissions:flex-none @min-[44rem]/permissions:flex-row @min-[44rem]/permissions:gap-1.5 @min-[44rem]/permissions:py-0.5 @min-[44rem]/permissions:whitespace-nowrap';

const DEFAULT_LABELS: PermissionEditorLabels = {
  menusTab: 'Page access',
  objectsTab: 'Operations',
  settingsTab: 'System settings',
  tabCount: (count, total) => `${count} / ${total}`,
  noMenus: 'No menus',
  emptyPage: (menu, object) =>
    `“${menu}” is checked, but this role cannot view ${object} yet, so the page opens empty.`,
  openView: (action) => `Turn on “${action}”`,
  opensWith: (action) => `Shown with “${action}”`,
  attention: (count) =>
    `${count} ${count === 1 ? 'menu needs' : 'menus need'} attention`,
  objects: 'Business objects',
  search: 'Search objects or actions',
  clearSearch: 'Clear search',
  noResults: 'No matching objects or actions',
  empty: 'No business objects to configure',
  objectEnabled: (enabled, total) => `${enabled} of ${total} on`,
  objectOff: 'Off',
  quickNone: 'Off',
  quickView: 'View only',
  quickAll: 'All',
  quickAllHint: 'Turns on every operation except high-risk ones',
  quickCustom: 'Custom',
  quickLevel: (object) => `Operations on ${object}`,
  groupQuick: 'Whole group',
  groupQuickLevel: (group) => `Operations on everything in ${group}`,
  groupEnabled: (enabled, total) => `${enabled} of ${total} objects on`,
  objectsHint:
    'Checking a page turns on the operations it uses. Set objects here with Off, View only or All, at their default data scope, and open one to set its operations one by one.',
  onlyEnabled: 'Only on',
  expandObject: 'One by one',
  collapseObject: 'Hide',
  sameAsView: (scope) => `Same as view (${scope})`,
  sameAsObjectView: (object, scope) => `Same as ${object} view (${scope})`,
  needsView: (object) => `Needs ${object} view`,
  scopeFor: (action, scope) =>
    scope ? `${action}: ${scope}` : `Data scope of ${action}`,
  managed: 'Managed by the application',
  unsaved: 'Unsaved changes',
  readOnly: 'These permissions are read-only.',
  unrestrictedTitle: 'All permissions (unrestricted)',
  unrestrictedDescription:
    'This role can open every menu and perform every action on all data. There is nothing to set.',
  confirmDisable: (actions, dependents) =>
    `Turning off ${list(actions)} also turns off ${list(dependents)}, which ${dependents.length === 1 ? 'needs' : 'need'} it.`,
  confirm: 'Turn off',
  cancel: 'Cancel',
  dismiss: 'Dismiss',
  operationCount: (enabled, total) => `${enabled}/${total} operations`,
  opensEmpty: 'Opens empty',
  defaultsAdded: (actions) =>
    `Also allowed ${list(actions.map((action) => `“${action}”`))} with the default scope.`,
  adjustOperations: 'Adjust in Operations',
  usedOn: (pages) => `Used on: ${list(pages)}`,
  notOnPage: 'Not used on any page',
  missingPage: (pages) =>
    `This role cannot open ${list(pages.map((page) => `“${page}”`))}: these operations work only through other pages or the API.`,
  sensitive: 'Sensitive',
  highRisk: 'High risk',
  settingsLevel: (page) => `Access to ${page}`,
  settingsNone: 'None',
  settingsView: 'View',
  settingsManage: 'Manage',
  settingsCustom: (enabled, total) => `Custom ${enabled}/${total}`,
  settingsDetails: 'Set one by one',
  settingsCollapse: 'Hide',
  settingsVisible: (pages) =>
    `This role sees in System settings: ${list(pages)}.`,
  settingsNoneVisible: 'This role sees no System settings pages.',
  containsHighRisk: 'Includes high risk',
  publicPage: 'Everyone',
  searchPages: 'Search pages',
  onlyChecked: 'Only checked',
  noMatchingPages: 'No matching pages',
  groupChecked: (checked, total) => `${checked}/${total} checked`,
  toggleGroup: (group) => `Show or hide ${group}`,
  usedOnLabel: 'Used on',
  pageOpens: 'This role opens this page',
  pageClosed: 'This role cannot open this page',
  tabChanges: (count) =>
    `${count} unsaved ${count === 1 ? 'change' : 'changes'}`,
  notice: (notice) =>
    notice.kind === 'scope-reset'
      ? `${list(notice.actions)} now ${notice.actions.length === 1 ? 'follows' : 'follow'} the view scope (${notice.view}) again.`
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
        // Long scope names wrap onto more lines instead of being cut off with an ellipsis.
        className={cn(
          'w-full min-w-0 py-1 text-left whitespace-normal data-[size=sm]:h-auto data-[size=sm]:min-h-7 *:data-[slot=select-value]:line-clamp-none',
          following === true && 'border-dashed text-muted-foreground',
        )}
      >
        <SelectValue className='break-words' />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width)'>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className='*:min-w-0 *:shrink *:whitespace-normal'
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function ScopeControl({
  object,
  objects,
  action,
  slot,
  grants,
  disabled,
  labels,
  onScope,
}: {
  readonly object: PermissionObject;
  readonly objects: readonly PermissionObject[];
  readonly action: PermissionAction;
  readonly slot: PermissionScopeSlot;
  readonly grants: PermissionGrants;
  readonly disabled: boolean;
  readonly labels: PermissionEditorLabels;
  readonly onScope: (slotId: string, value: string | undefined) => void;
}): ReactElement | null {
  const accessibleName = labels.scopeFor(action.label, slot.label);
  const options = slotOptions(object, slot, objects);
  const own = ownScopeValue(object, grants, action, slot, objects);
  const viewValue = viewScopeValue(object, grants, slot, objects);
  // The View it follows is off: show the value it keeps, read-only, and what turning it back on needs.
  const blocked = grants[action.id]
    ? blockedLeaderObject(object, slot, objects, grants)
    : undefined;
  if (blocked) {
    const value = own ?? '';
    const shown = options.some((option) => option.value === value)
      ? options
      : [...options, { value, label: value }];
    return (
      <div className='grid min-w-0 gap-1'>
        <ScopeSelect
          label={accessibleName}
          options={shown}
          value={value}
          disabled
          onChange={() => undefined}
        />
        <p
          data-slot='permission-scope-needs-view'
          className='text-xs text-amber-700 dark:text-amber-400'
        >
          {labels.needsView(blocked.label)}
        </p>
      </div>
    );
  }
  if (slot.followsView && viewValue !== undefined) {
    const viewLabel =
      viewScopeLabel(object, grants, slot, objects) ?? viewValue;
    const narrower = narrowerOptions(object, grants, slot, objects);
    const other = followedObject(object, slot, objects, grants);
    const same = other
      ? labels.sameAsObjectView(other.label, viewLabel)
      : labels.sameAsView(viewLabel);
    // Opening a role shows what it stores: a value wider than View, or one View does not list, stays visible as itself
    // until an administrator changes it or changes View.
    const stored =
      own !== undefined &&
      own !== viewValue &&
      !narrower.some((option) => option.value === own)
        ? {
            value: own,
            label: options.find((option) => option.value === own)?.label ?? own,
          }
        : undefined;
    if (!narrower.length && !stored)
      return (
        <span className='flex min-h-7 items-center text-xs text-muted-foreground'>
          {same}
        </span>
      );
    const picked =
      stored?.value ??
      (narrower.some((option) => option.value === own) ? own : undefined);
    return (
      <ScopeSelect
        label={accessibleName}
        options={[
          { value: FOLLOW, label: same },
          ...narrower,
          ...(stored ? [stored] : []),
        ]}
        value={picked ?? FOLLOW}
        following={picked === undefined}
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
      value={effectiveScopeValue(object, grants, action, slot, objects) ?? ''}
      disabled={disabled}
      onChange={(next) => onScope(slot.id, next)}
    />
  );
}

/**
 * A slot's extra controls, such as a custom filter. Locked, as on a follower or a read-only row, its summary still shows
 * but every control in it is natively disabled, so neither a click nor the keyboard opens it.
 */
function SlotConfiguration({
  locked,
  className,
  children,
}: {
  readonly locked: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <fieldset
      data-slot='permission-scope-configuration'
      disabled={locked}
      className={cn('m-0 min-w-0 border-0 p-0', className)}
    >
      {children}
    </fieldset>
  );
}

function ActionRow({
  object,
  objects,
  action,
  grants,
  readOnly,
  labels,
  controlId,
  onToggle,
  onScope,
  scoped = true,
}: {
  readonly object: PermissionObject;
  readonly objects: readonly PermissionObject[];
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
  /** Settings have no data scope: their rows show only the switch, whatever scopes an action carries. */
  readonly scoped?: boolean;
}): ReactElement {
  const enabled = Boolean(grants[action.id]);
  const slots = scoped ? (action.scopes ?? []) : [];
  // One unnamed scope sits beside the title; named or several scopes get their own row.
  const inline = slots.length === 1 && !slots[0]?.label ? slots[0] : undefined;
  const stacked = inline ? [] : slots;
  const disabled = readOnly || !enabled || Boolean(action.managed);
  const description = action.description ?? undefined;
  return (
    <li
      data-slot='permission-action'
      data-enabled={enabled ? '' : undefined}
      className={cn(
        'grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-2.5',
        // Settings rows have no scope column and sit in a grid of cards.
        scoped
          ? '@min-[44rem]/permissions:grid-cols-[auto_minmax(0,1fr)_minmax(14rem,16rem)] @min-[44rem]/permissions:px-4'
          : 'rounded-md border bg-card',
        action.view && 'bg-muted/30',
      )}
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
        {/* The risk badge sits beside the label, so the switch keeps the action's name. */}
        <div className='flex min-w-0 flex-wrap items-center gap-1.5'>
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
          {action.risk && (
            <span
              data-slot='permission-risk'
              className={cn(
                'inline-flex rounded px-1.5 text-xs leading-5 font-normal',
                action.risk === 'high'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
              )}
            >
              {action.risk === 'high' ? labels.highRisk : labels.sensitive}
            </span>
          )}
        </div>
        {enabled && action.warning && (
          <p className='text-xs leading-5 text-destructive'>{action.warning}</p>
        )}
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
      {/* An operation that is off has no data scope to choose, so its scope stays hidden until it is on. */}
      {inline && enabled && (
        <div className='col-start-2 min-w-0 @min-[44rem]/permissions:col-start-3 @min-[44rem]/permissions:row-start-1'>
          <ScopeControl
            object={object}
            objects={objects}
            action={action}
            slot={inline}
            grants={grants}
            disabled={disabled}
            labels={labels}
            onScope={(slotId, value) => onScope(action, slotId, value)}
          />
        </div>
      )}
      {stacked.length > 0 && enabled && (
        <div
          data-slot='permission-scopes'
          className='col-span-full col-start-2 flex min-w-0 flex-col gap-2'
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
              {/* One scope per line; the select grows with its text and wraps only at the row's width. */}
              <div className='w-full min-w-0 @min-[44rem]/permissions:w-fit @min-[44rem]/permissions:max-w-full @min-[44rem]/permissions:min-w-60'>
                <ScopeControl
                  object={object}
                  objects={objects}
                  action={action}
                  slot={slot}
                  grants={grants}
                  disabled={disabled}
                  labels={labels}
                  onScope={(slotId, value) => onScope(action, slotId, value)}
                />
              </div>
              {enabled && slot.configuration && (
                <SlotConfiguration
                  locked={
                    disabled || configurationLocked(object, slot, objects)
                  }
                >
                  {slot.configuration}
                </SlotConfiguration>
              )}
            </div>
          ))}
        </div>
      )}
      {inline && enabled && inline.configuration && (
        <SlotConfiguration
          locked={disabled || configurationLocked(object, inline, objects)}
          className='col-span-full col-start-2'
        >
          {inline.configuration}
        </SlotConfiguration>
      )}
    </li>
  );
}

/** The labels of the objects a page lists, for its operation count's tooltip. */
function objectNames(
  ids: readonly string[],
  objects: readonly PermissionObject[],
): string {
  return ids
    .flatMap((id) => objects.find((item) => item.id === id)?.label ?? [])
    .join(' · ');
}

/**
 * The menus a search and "only checked" keep. A group whose name matches keeps all its menus; another group keeps the
 * menus that match. Public menus open for everyone, so "only checked" leaves them out.
 */
function filterMenus(
  nodes: readonly PermissionMenuNode[],
  query: string,
  onlyChecked: boolean,
  value: PermissionValue,
): readonly PermissionMenuNode[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle && !onlyChecked) return nodes;
  const keep = (node: PermissionMenuNode, matched: boolean): boolean =>
    (matched || node.label.toLocaleLowerCase().includes(needle)) &&
    (!onlyChecked || (!node.public && isMenuChecked(node, value)));
  return nodes.flatMap((node): PermissionMenuNode[] => {
    if (!node.children?.length) return keep(node, !needle) ? [node] : [];
    const matched = !needle || node.label.toLocaleLowerCase().includes(needle);
    const children = matched
      ? filterMenus(node.children, '', onlyChecked, value)
      : filterMenus(node.children, query, onlyChecked, value);
    return children.length ? [{ ...node, children }] : [];
  });
}

/** The operations a page just turned on, shown under it until the next change. */
interface MenuFlash {
  readonly menu: string;
  readonly actions: readonly string[];
  /** The object to open from the notice. */
  readonly object: string;
}

function MenuRows({
  nodes,
  depth,
  value,
  objects,
  readOnly,
  labels,
  idPrefix,
  empty,
  flash,
  collapsed,
  onToggleGroup,
  onCheck,
  onOpenAction,
  onOpenObject,
}: {
  readonly nodes: readonly PermissionMenuNode[];
  readonly depth: number;
  readonly value: PermissionValue;
  readonly objects: readonly PermissionObject[];
  readonly readOnly: boolean;
  readonly labels: PermissionEditorLabels;
  readonly idPrefix: string;
  /** Checked menus that would open empty. */
  readonly empty: ReadonlySet<string>;
  readonly flash: MenuFlash | undefined;
  /** Groups folded away; a search unfolds every group it keeps. */
  readonly collapsed: ReadonlySet<string>;
  readonly onToggleGroup: (id: string) => void;
  readonly onCheck: (node: PermissionMenuNode, checked: boolean) => void;
  readonly onOpenAction: (actionId: string) => void;
  readonly onOpenObject: (objectId: string) => void;
}): ReactElement {
  return (
    <>
      {nodes.map((node) => {
        const group = Boolean(node.children?.length);
        const state = menuCheckState(node, value);
        const controlId = `${idPrefix}-${node.id}`;
        const uses = [
          ...(node.uses?.primary ?? []),
          ...(node.uses?.related ?? []).filter(
            (id) => !node.uses?.primary?.includes(id),
          ),
        ];
        const count = group
          ? undefined
          : menuActionCount(node, objects, value.grants);
        const opensEmpty = empty.has(node.id);
        const folded = group && collapsed.has(node.id);
        const groupTotals = group ? menuCount([node], value) : undefined;
        return (
          <Fragment key={node.id}>
            <li
              data-slot={group ? 'permission-menu-group' : 'permission-menu'}
              className={cn(
                'flex min-w-0 items-center gap-3 border-t py-2 pr-3 first:border-t-0',
                group && 'bg-muted/40',
              )}
              style={{ paddingInlineStart: `${0.75 + depth * 1.25}rem` }}
            >
              {!group && node.public ? (
                // A public page opens for everyone: there is nothing to check, only a tag beside its name.
                <span aria-hidden className='size-4 shrink-0' />
              ) : (
                <Checkbox
                  id={controlId}
                  checked={state === 'checked'}
                  indeterminate={state === 'mixed'}
                  disabled={readOnly || !isMenuToggleable(node)}
                  className='data-disabled:cursor-not-allowed data-disabled:opacity-50 data-indeterminate:border-primary data-indeterminate:bg-primary/60'
                  onCheckedChange={(checked: boolean) =>
                    onCheck(node, state === 'mixed' ? true : checked)
                  }
                />
              )}
              <div className='flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1'>
                <label
                  htmlFor={!group && node.public ? undefined : controlId}
                  className={cn(
                    'min-w-0 text-sm break-words',
                    group ? 'font-semibold' : !node.public && 'cursor-pointer',
                  )}
                >
                  {node.label}
                </label>
                {!group && node.public && (
                  <span
                    data-slot='permission-menu-public'
                    className='rounded bg-muted px-1.5 text-xs leading-5 text-muted-foreground'
                  >
                    {labels.publicPage}
                  </span>
                )}
                {count && (
                  <Button
                    type='button'
                    variant='link'
                    size='xs'
                    data-slot='permission-menu-operations'
                    title={objectNames(uses, objects) || undefined}
                    className={cn(
                      'h-auto rounded px-1.5 py-0 text-xs leading-5 tabular-nums no-underline hover:underline',
                      opensEmpty
                        ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                        : count.enabled
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                    )}
                    onClick={() => onOpenObject(count.object.id)}
                  >
                    {labels.operationCount(count.enabled, count.total)}
                  </Button>
                )}
                {opensEmpty && (
                  <span
                    data-slot='permission-menu-empty'
                    className='inline-flex items-center gap-1 text-xs leading-5 text-amber-800 dark:text-amber-300'
                  >
                    <TriangleAlertIcon aria-hidden className='size-3' />
                    {labels.opensEmpty}
                  </span>
                )}
                {!group && node.opensWith && (
                  <Button
                    type='button'
                    variant='link'
                    size='xs'
                    className='h-auto p-0 text-xs'
                    onClick={() => onOpenAction(node.opensWith!)}
                  >
                    {labels.opensWith(
                      findAction(objects, node.opensWith)?.action.label ??
                        node.opensWith,
                    )}
                  </Button>
                )}
              </div>
              {groupTotals && groupTotals.total > 0 && (
                <span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
                  {labels.groupChecked(groupTotals.checked, groupTotals.total)}
                </span>
              )}
              {group && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-xs'
                  aria-expanded={!folded}
                  aria-label={labels.toggleGroup(node.label)}
                  onClick={() => onToggleGroup(node.id)}
                >
                  <ChevronDownIcon
                    aria-hidden
                    className={cn(
                      'transition-transform',
                      folded && '-rotate-90',
                    )}
                  />
                </Button>
              )}
            </li>
            {flash?.menu === node.id && (
              <li
                role='status'
                data-slot='permission-menu-defaults'
                className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-t bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-900 dark:text-emerald-200'
                style={{ paddingInlineStart: `${2.5 + depth * 1.25}rem` }}
              >
                <span className='min-w-0'>
                  {labels.defaultsAdded(flash.actions)}
                </span>
                <Button
                  type='button'
                  variant='link'
                  size='xs'
                  className='h-auto p-0 text-xs'
                  onClick={() => onOpenObject(flash.object)}
                >
                  {labels.adjustOperations}
                </Button>
              </li>
            )}
            {group && !folded && (
              <MenuRows
                nodes={node.children ?? []}
                depth={depth + 1}
                value={value}
                objects={objects}
                readOnly={readOnly}
                labels={labels}
                idPrefix={idPrefix}
                empty={empty}
                flash={flash}
                collapsed={collapsed}
                onToggleGroup={onToggleGroup}
                onCheck={onCheck}
                onOpenAction={onOpenAction}
                onOpenObject={onOpenObject}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

function TabBadge({
  count,
  labels,
}: {
  readonly count: number | undefined;
  readonly labels: PermissionEditorLabels;
}): ReactElement | null {
  if (!count) return null;
  return (
    <span
      data-slot='permission-tab-changes'
      aria-label={labels.tabChanges(count)}
      className='rounded-full bg-amber-500/15 px-1.5 text-xs leading-5 font-normal text-amber-800 tabular-nums dark:text-amber-300'
    >
      {count}
    </span>
  );
}

function SettingsLevelControl({
  page,
  level,
  readOnly,
  labels,
  onLevel,
}: {
  readonly page: PermissionSettingsPage;
  readonly level: ReturnType<typeof settingsLevel>;
  readonly readOnly: boolean;
  readonly labels: PermissionEditorLabels;
  readonly onLevel: (level: 'none' | 'view' | 'manage') => void;
}): ReactElement {
  const several = page.objects.some((object) => object.actions.length > 1);
  const risky = page.objects.some((object) =>
    object.actions.some((action) => action.risk === 'high'),
  );
  const levels: ['none' | 'view' | 'manage', string][] = [
    ['none', labels.settingsNone],
    ['view', labels.settingsView],
    ...(several
      ? [['manage', labels.settingsManage] as ['manage', string]]
      : []),
  ];
  return (
    <div
      role='group'
      aria-label={labels.settingsLevel(page.label)}
      data-slot='permission-settings-level'
      className='inline-flex shrink-0 overflow-hidden rounded-md border'
    >
      {levels.map(([item, label]) => (
        <button
          key={item}
          type='button'
          aria-pressed={level === item}
          disabled={readOnly}
          className={cn(
            'min-w-12 border-l px-3 py-1.5 text-sm first:border-l-0 hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
            level === item &&
              (item === 'none'
                ? 'bg-muted font-medium'
                : // Managing a page with high-risk operations reads as the risk it is.
                  item === 'manage' && risky
                  ? 'bg-destructive font-medium text-white hover:bg-destructive/90'
                  : 'bg-primary font-medium text-primary-foreground hover:bg-primary/90'),
          )}
          onClick={() => onLevel(item)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

interface PendingDisable {
  readonly message: string;
  readonly apply: (value: PermissionValue) => {
    readonly value: PermissionValue;
    readonly notices: readonly PermissionNotice[];
  };
}

/** A controlled editor: the application owns its catalog, the draft's persistence and Save. */
export function PermissionEditor({
  menus,
  objects,
  value,
  onChange,
  unrestricted = false,
  readOnly = false,
  header,
  footer,
  dirty = false,
  settings = NO_SETTINGS,
  defaultTab = 'menus',
  defaultObjectId,
  labels,
  className,
  tabs: extraTabs = NO_TABS,
  tabBadges,
  menuDefaults,
}: PermissionEditorProps): ReactElement {
  const words: PermissionEditorLabels = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<string>(defaultTab);
  const [flash, setFlash] = useState<MenuFlash | undefined>();
  const [query, setQuery] = useState('');
  // Objects set action by action when the editor opened show their actions; the others fold them away until asked.
  // Kept from the first render, so an object does not fold away while it is being changed.
  const [initiallyCustom] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        objects
          .filter((object) => quickSetLevel(object, value.grants) === 'custom')
          .map((object) => object.id)
          .concat(defaultObjectId ? [defaultObjectId] : []),
      ),
  );
  const [expandedObjects, setExpandedObjects] = useState<
    Readonly<Record<string, boolean>>
  >({});
  const [onlyEnabled, setOnlyEnabled] = useState(false);
  const [notices, setNotices] = useState<readonly PermissionNotice[]>([]);
  const [settingsOpen, setSettingsOpen] = useState<
    Readonly<Record<string, boolean>>
  >({});
  const [menuQuery, setMenuQuery] = useState('');
  const [onlyChecked, setOnlyChecked] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [pending, setPending] = useState<PendingDisable | undefined>();
  // A host that turns read-only while a confirmation is open cancels it.
  if (readOnly && pending) setPending(undefined);
  // Notices and a pending confirmation describe the draft they came from. When the host replaces the draft itself,
  // such as discarding changes or loading another revision, they no longer apply.
  const [shown, setShown] = useState<{
    readonly value: PermissionValue;
    readonly expected: PermissionValue | undefined;
  }>({ value, expected: undefined });
  if (shown.value !== value) {
    setShown({ value, expected: undefined });
    if (
      !shown.expected ||
      JSON.stringify(shown.expected) !== JSON.stringify(value)
    ) {
      setNotices([]);
      setPending(undefined);
      setFlash(undefined);
    }
  }
  // Requirements may cross between business and settings objects, so the rules see them all.
  const allObjects = useMemo(
    () => [...objects, ...settings.flatMap((page) => page.objects)],
    [objects, settings],
  );
  const filtered = filterObjects(objects, query);
  // Group titles only tell groups apart, so a single group shows none.
  const grouped = new Set(objects.map((object) => object.group ?? '')).size > 1;
  const warnings = menuWarnings(menus, objects, value);
  const emptyMenus = new Set(warnings.map((warning) => warning.menu.id));
  const gaps = pageAccessGaps(menus, objects, value);
  const gapIds = new Set(gaps.map((gap) => gap.object.id));
  const menuTotals = menuCount(menus, value);
  const objectTotals = objectCount(objects, value.grants);
  const settingsTotals = settingsCount(settings, value.grants);

  /** Opens an object's actions in Operations and moves the focus to it. */
  const select = (objectId: string): void => {
    setExpandedObjects((open) => ({ ...open, [objectId]: true }));
    setQuery('');
    setOnlyEnabled(false);
    setNotices([]);
    setPending(undefined);
  };
  const focusObject = (objectId: string): void => {
    requestAnimationFrame(() => {
      const title = document.getElementById(`${id}-object-${objectId}`);
      title?.focus();
      title?.scrollIntoView?.({ block: 'start' });
    });
  };
  const commitValue = (
    next: PermissionValue,
    changeNotices: readonly PermissionNotice[],
  ): void => {
    // A change that alters nothing, such as a select echoing the value it was given, keeps the current notices.
    if (
      !changeNotices.length &&
      JSON.stringify(next) === JSON.stringify(value)
    ) {
      setPending(undefined);
      return;
    }
    setShown({ value, expected: next });
    setNotices(changeNotices);
    setPending(undefined);
    setFlash(undefined);
    onChange(next);
  };
  const commit = (change: PermissionChange): void =>
    commitValue({ menus: value.menus, grants: change.grants }, change.notices);
  const ask = (message: string, apply: PendingDisable['apply']): void => {
    setNotices([]);
    setPending({ message, apply });
  };
  const toggle = (action: PermissionAction, enabled: boolean): void => {
    if (readOnly) return;
    if (enabled) {
      commit(setActionEnabled(allObjects, value.grants, action.id, true));
      return;
    }
    const dependents = dependentsOf(allObjects, value.grants, [action.id]);
    // Managed dependents block the change; the model explains why.
    if (!dependents.length || dependents.some((item) => item.managed)) {
      commit(setActionEnabled(allObjects, value.grants, action.id, false));
      return;
    }
    ask(
      words.confirmDisable(
        [action.label],
        dependents.map((item) => item.label),
      ),
      (draft) => {
        const change = setActionEnabled(
          allObjects,
          draft.grants,
          action.id,
          false,
        );
        return {
          value: { menus: draft.menus, grants: change.grants },
          notices: change.notices,
        };
      },
    );
  };
  const quick = (object: PermissionObject, mode: PermissionQuickSet): void => {
    if (readOnly) return;
    const { own, others } = quickSetRemovals(
      allObjects,
      value.grants,
      object,
      mode,
    );
    if (
      !others.length ||
      dependentsOf(allObjects, value.grants, own).some((item) => item.managed)
    ) {
      commit(applyQuickSet(allObjects, value.grants, object, mode));
      return;
    }
    ask(
      words.confirmDisable(
        [object.label],
        others.map((item) => item.label),
      ),
      (draft) => {
        const change = applyQuickSet(allObjects, draft.grants, object, mode);
        return {
          value: { menus: draft.menus, grants: change.grants },
          notices: change.notices,
        };
      },
    );
  };
  const quickMany = (
    targets: readonly PermissionObject[],
    mode: PermissionQuickSet,
    group: string,
  ): void => {
    if (readOnly) return;
    const others = quickSetManyRemovals(
      allObjects,
      value.grants,
      targets,
      mode,
    );
    if (!others.length) {
      commit(applyQuickSetMany(allObjects, value.grants, targets, mode));
      return;
    }
    ask(
      words.confirmDisable(
        [group],
        others.map((item) => item.label),
      ),
      (draft) => {
        const change = applyQuickSetMany(
          allObjects,
          draft.grants,
          targets,
          mode,
        );
        return {
          value: { menus: draft.menus, grants: change.grants },
          notices: change.notices,
        };
      },
    );
  };
  const check = (node: PermissionMenuNode, checked: boolean): void => {
    if (readOnly || node.public || !isMenuToggleable(node)) return;
    const next = setMenuChecked(menus, value, node.id, checked);
    // Checking a page turns on the operations it opens with, so it does not open empty.
    const opened = checked
      ? menuLeaves([node]).filter(
          (leaf) =>
            next.menus.includes(leaf.id) && !value.menus.includes(leaf.id),
        )
      : [];
    const defaults = opened.flatMap((leaf) => menuDefaults?.[leaf.id] ?? []);
    const change = defaults.length
      ? enableDefaults(allObjects, next.grants, defaults)
      : undefined;
    commitValue(
      change ? { menus: next.menus, grants: change.grants } : next,
      change?.notices ?? [],
    );
    const first = change?.added[0];
    if (change && first) {
      const owner = findAction(allObjects, first);
      setFlash({
        menu: opened.length === 1 && opened[0] ? opened[0].id : node.id,
        actions: change.added.map(
          (id) => findAction(allObjects, id)?.action.label ?? id,
        ),
        object: owner?.object.id ?? '',
      });
    }
  };
  const openObject = (objectId: string): void => {
    if (!objects.some((object) => object.id === objectId)) return;
    select(objectId);
    setTab('objects');
    setFlash(undefined);
    focusObject(objectId);
  };
  const openAction = (actionId: string): void => {
    const found = findAction(allObjects, actionId);
    if (!found) return;
    select(found.object.id);
    setTab('objects');
    focusObject(found.object.id);
  };
  const openView = (warning: PermissionMenuWarning): void => {
    select(warning.object.id);
    setTab('objects');
    focusObject(warning.object.id);
  };

  const status =
    tab === 'menus'
      ? warnings.length
        ? words.attention(warnings.length)
        : undefined
      : undefined;
  // Saving is offered while there is something to save: a bar that stays at the bottom of the screen, so the changes
  // made far down a long list can be saved without scrolling back.
  const footerBar = (
    <div
      data-slot='permission-save-bar'
      className='sticky bottom-3 z-10 mx-3 mb-3 flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-background shadow-lg'
    >
      <span
        role='status'
        className='mr-auto inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-sm'
      >
        <span className='inline-flex items-center gap-1.5'>
          <span aria-hidden className='size-1.5 rounded-full bg-amber-400' />
          {words.unsaved}
        </span>
        {status && <span className='text-background/70'>{status}</span>}
      </span>
      {footer && (
        <div className='flex flex-wrap items-center gap-2'>{footer}</div>
      )}
    </div>
  );
  const saveBar = dirty && !unrestricted && footer ? footerBar : null;

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
        {/* Host tabs such as members still apply to a role that has every permission. */}
        {extraTabs.map((extra) => (
          <section
            key={extra.value}
            aria-label={
              typeof extra.label === 'string' ? extra.label : undefined
            }
            className='flex min-w-0 flex-col gap-3 border-t px-4 py-4'
          >
            <h3 className='text-sm font-semibold'>{extra.label}</h3>
            {extra.content}
          </section>
        ))}
      </div>
    );

  const messages = (
    <>
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
              if (readOnly) return;
              const change = pending.apply(value);
              commitValue(change.value, change.notices);
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
    </>
  );

  const filtering = Boolean(menuQuery.trim()) || onlyChecked;
  const shownMenus = filterMenus(menus, menuQuery, onlyChecked, value);
  const menusPanel = (
    <div className='grid min-w-0 gap-3 p-4'>
      {readOnly && (
        <p className='text-xs text-muted-foreground'>{words.readOnly}</p>
      )}
      {warnings.map((warning) => (
        <div
          key={`${warning.menu.id}:${warning.object.id}`}
          data-slot='permission-menu-warning'
          className='flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-200'
        >
          <TriangleAlertIcon aria-hidden className='size-4 shrink-0' />
          <span className='min-w-0 flex-1 basis-60'>
            {words.emptyPage(warning.menu.label, warning.object.label)}
          </span>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => openView(warning)}
          >
            {words.openView(warning.action.label)}
          </Button>
        </div>
      ))}
      {messages}
      {menus.length > 0 && (
        <div className='flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2'>
          <InputGroup className='w-full @min-[44rem]/permissions:w-72'>
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              value={menuQuery}
              aria-label={words.searchPages}
              placeholder={words.searchPages}
              onChange={(event) => setMenuQuery(event.target.value)}
            />
            {menuQuery && (
              <InputGroupAddon align='inline-end'>
                <InputGroupButton
                  type='button'
                  size='icon-xs'
                  aria-label={words.clearSearch}
                  onClick={() => setMenuQuery('')}
                >
                  <XIcon aria-hidden />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          <label className='inline-flex cursor-pointer items-center gap-2 text-sm'>
            <Switch
              size='sm'
              checked={onlyChecked}
              onCheckedChange={(on: boolean) => setOnlyChecked(on)}
            />
            {words.onlyChecked}
          </label>
        </div>
      )}
      {menus.length && !shownMenus.length ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {words.noMatchingPages}
        </p>
      ) : menus.length ? (
        <div className='min-w-0 overflow-hidden rounded-lg border'>
          <ul data-slot='permission-menus' className='min-w-0'>
            <MenuRows
              nodes={shownMenus}
              collapsed={filtering ? NO_GROUPS : collapsedGroups}
              onToggleGroup={(groupId) =>
                setCollapsedGroups((current) => {
                  const next = new Set(current);
                  if (!next.delete(groupId)) next.add(groupId);
                  return next;
                })
              }
              depth={0}
              value={value}
              objects={objects}
              readOnly={readOnly}
              labels={words}
              idPrefix={`${id}-menu`}
              empty={emptyMenus}
              flash={flash}
              onCheck={check}
              onOpenAction={openAction}
              onOpenObject={openObject}
            />
          </ul>
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>{words.noMenus}</p>
      )}
    </div>
  );

  const quickLabels: Record<PermissionQuickSet, string> = {
    none: words.quickNone,
    view: words.quickView,
    all: words.quickAll,
  };
  /** Off, View only or Enable all for one object or a group, one tap each; a custom mix highlights none of them. */
  const quickControl = (
    label: string,
    level: PermissionQuickSet | 'custom' | undefined,
    withView: boolean,
    onPick: (mode: PermissionQuickSet) => void,
    size: 'sm' | 'xs' = 'sm',
  ): ReactElement => (
    <div
      role='group'
      aria-label={label}
      data-slot='permission-quick-set'
      data-level={level}
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-md border',
        level === 'custom' && 'border-amber-500/60',
      )}
    >
      {(['none', 'view', 'all'] as const)
        .filter((mode) => mode !== 'view' || withView)
        .map((mode) => (
          <button
            key={mode}
            type='button'
            aria-pressed={level === mode}
            disabled={readOnly}
            title={mode === 'all' ? words.quickAllHint : undefined}
            className={cn(
              'min-w-11 flex-1 border-l text-center whitespace-nowrap first:border-l-0 hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
              size === 'sm' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs',
              level === mode &&
                (mode === 'none'
                  ? 'bg-muted font-medium'
                  : 'bg-primary font-medium text-primary-foreground hover:bg-primary/90'),
            )}
            onClick={() => onPick(mode)}
          >
            {quickLabels[mode]}
          </button>
        ))}
    </div>
  );
  const objectCard = (object: PermissionObject): ReactElement => {
    const titleId = `${id}-object-${object.id}`;
    const detailsId = `${titleId}-details`;
    const { basic, business } = orderedActions(object);
    const status = objectStatus(object, value.grants);
    const level = quickSetLevel(object, value.grants);
    const search = query.trim().toLocaleLowerCase();
    // A search that finds an operation, not the object, opens the object to show it.
    const foundInside =
      Boolean(search) &&
      !object.label.toLocaleLowerCase().includes(search) &&
      object.actions.some((action) =>
        action.label.toLocaleLowerCase().includes(search),
      );
    const expanded =
      expandedObjects[object.id] ??
      (foundInside || initiallyCustom.has(object.id));
    const risky = object.actions.some((action) => action.risk === 'high');
    // The pages that list this object, each marked by whether this role opens it.
    const usedBy = menuLeaves(menus).filter(
      (menu) =>
        menu.uses?.primary?.includes(object.id) ||
        menu.uses?.related?.includes(object.id),
    );
    const row = (action: PermissionAction): ReactElement => (
      <ActionRow
        key={action.id}
        object={object}
        objects={allObjects}
        action={action}
        grants={value.grants}
        readOnly={readOnly}
        labels={words}
        controlId={`${id}-${action.id}`}
        onToggle={toggle}
        onScope={(item, slotId, scope) =>
          commit(
            setScopeValue(allObjects, value.grants, item.id, slotId, scope),
          )
        }
      />
    );
    const enabledLabels = object.actions
      .filter((action) => value.grants[action.id])
      .map((action) => action.label);
    return (
      <section
        key={object.id}
        aria-labelledby={titleId}
        data-slot='permission-object'
        data-state={status.state}
        className='grid min-w-0 border-t first:border-t-0'
      >
        <div className='flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2 px-3 py-2.5'>
          <div className='flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1'>
            <h3
              id={titleId}
              tabIndex={-1}
              className='text-sm font-semibold outline-none'
            >
              {object.label}
            </h3>
            <span
              className={cn(
                'rounded px-1.5 text-xs leading-5 tabular-nums',
                status.enabled
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <span aria-hidden>
                {status.enabled}/{status.total}
              </span>
              <span className='sr-only'>
                {status.enabled
                  ? words.objectEnabled(status.enabled, status.total)
                  : words.objectOff}
              </span>
            </span>
            {level === 'custom' && (
              <span className='rounded bg-amber-500/10 px-1.5 text-xs leading-5 text-amber-800 dark:text-amber-300'>
                {words.quickCustom}
              </span>
            )}
            {risky && (
              <span
                data-slot='permission-risk'
                className='rounded bg-destructive/10 px-1.5 text-xs leading-5 text-destructive'
              >
                {words.containsHighRisk}
              </span>
            )}
            {gapIds.has(object.id) && (
              <TriangleAlertIcon
                aria-hidden
                data-slot='permission-object-gap'
                className='size-3.5 shrink-0 text-amber-600'
              />
            )}
            {usedBy.length > 0 && (
              <span
                data-slot='permission-object-used-on'
                className='flex min-w-0 flex-wrap items-center gap-1 text-xs'
              >
                <span className='sr-only'>{words.usedOnLabel}</span>
                {usedBy.map((menu) => {
                  const opens = isMenuChecked(menu, value);
                  return (
                    <span
                      key={menu.id}
                      title={opens ? words.pageOpens : words.pageClosed}
                      className={cn(
                        'inline-flex items-center gap-1 rounded px-1.5 leading-5',
                        opens
                          ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {opens ? (
                        <CheckIcon aria-hidden className='size-3' />
                      ) : (
                        <CircleIcon aria-hidden className='size-2.5' />
                      )}
                      {menu.label}
                      <span className='sr-only'>
                        {opens ? words.pageOpens : words.pageClosed}
                      </span>
                    </span>
                  );
                })}
              </span>
            )}
          </div>
          {/* On a phone the three choices take the row's width under the name, easy to tap. */}
          <div className='order-last flex w-full shrink-0 @min-[44rem]/permissions:order-none @min-[44rem]/permissions:w-auto [&>[data-slot=permission-quick-set]]:w-full @min-[44rem]/permissions:[&>[data-slot=permission-quick-set]]:w-auto'>
            {quickControl(
              words.quickLevel(object.label),
              level,
              Boolean(viewActionOf(object)),
              (mode) => quick(object, mode),
            )}
          </div>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='ml-auto @min-[44rem]/permissions:ml-0'
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={`${expanded ? words.collapseObject : words.expandObject} ${object.label}`}
            onClick={() =>
              setExpandedObjects((open) => ({
                ...open,
                [object.id]: !expanded,
              }))
            }
          >
            {expanded ? words.collapseObject : words.expandObject}
            <ChevronDownIcon
              aria-hidden
              className={cn('transition-transform', expanded && 'rotate-180')}
            />
          </Button>
        </div>
        {!expanded && enabledLabels.length > 0 && (
          <p className='-mt-1 px-3 pb-2.5 text-xs text-muted-foreground'>
            {enabledLabels.join(' · ')}
          </p>
        )}
        {expanded && (
          <div
            id={detailsId}
            className='grid min-w-0 gap-3 border-t border-dashed bg-muted/20 px-3 py-3'
          >
            {object.description && (
              <p className='text-sm text-muted-foreground'>
                {object.description}
              </p>
            )}
            {usedBy.length === 0 && object.usedOn && (
              <p className='text-xs text-muted-foreground'>
                {object.usedOn.length
                  ? words.usedOn(object.usedOn)
                  : words.notOnPage}
              </p>
            )}
            {gaps
              .filter((gap: PermissionPageGap) => gap.object.id === object.id)
              .map((gap) => (
                <div
                  key={gap.object.id}
                  role='note'
                  data-slot='permission-object-page-gap'
                  className='flex min-w-0 items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-200'
                >
                  <TriangleAlertIcon
                    aria-hidden
                    className='mt-0.5 size-4 shrink-0'
                  />
                  <span className='min-w-0'>
                    {words.missingPage(gap.menus.map((menu) => menu.label))}
                  </span>
                </div>
              ))}
            <ul
              data-slot='permission-actions'
              className='min-w-0 divide-y overflow-hidden rounded-lg border bg-card'
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
            {object.notice && (
              <div
                data-slot='permission-object-notice'
                className='flex min-w-0 items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'
              >
                <InfoIcon aria-hidden className='mt-0.5 size-4 shrink-0' />
                <div className='min-w-0'>{object.notice}</div>
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  const settingsGroups = [...new Set(settings.map((page) => page.group ?? ''))];
  const visibleSettings = settings.filter(
    (page) => settingsLevel(page, value.grants) !== 'none',
  );
  const settingsPanel = (
    <div className='grid min-w-0 gap-3 p-4'>
      {readOnly && (
        <p className='text-xs text-muted-foreground'>{words.readOnly}</p>
      )}
      <p
        data-slot='permission-settings-summary'
        className='text-sm text-muted-foreground'
      >
        {visibleSettings.length
          ? words.settingsVisible(visibleSettings.map((page) => page.label))
          : words.settingsNoneVisible}
      </p>
      {messages}
      {settingsGroups.map((group) => (
        <div key={group} className='grid min-w-0 gap-2'>
          {group && (
            <h3 className='text-xs font-medium text-muted-foreground'>
              {group}
            </h3>
          )}
          {settings
            .filter((page) => (page.group ?? '') === group)
            .map((page) => {
              const status = objectStatus(
                settingsPageObject(page),
                value.grants,
              );
              const level = settingsLevel(page, value.grants);
              // A page set action by action opens with its actions shown; the others fold them away until asked.
              const expanded = settingsOpen[page.id] ?? level === 'partial';
              const risky = page.objects.some((object) =>
                object.actions.some((action) => action.risk === 'high'),
              );
              const titleId = `${id}-settings-${page.id}`;
              const detailsId = `${titleId}-details`;
              return (
                <section
                  key={page.id}
                  aria-labelledby={titleId}
                  data-slot='permission-settings-page'
                  className='grid min-w-0 gap-2 rounded-lg border p-3'
                >
                  <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2'>
                    <div className='flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1'>
                      <h2 id={titleId} className='text-sm font-semibold'>
                        {page.label}
                      </h2>
                      {risky && (
                        <span
                          data-slot='permission-risk'
                          className='rounded bg-destructive/10 px-1.5 text-xs leading-5 text-destructive'
                        >
                          {words.containsHighRisk}
                        </span>
                      )}
                      {level === 'partial' && (
                        <span className='rounded bg-amber-500/10 px-1.5 text-xs leading-5 text-amber-800 tabular-nums dark:text-amber-300'>
                          {words.settingsCustom(status.enabled, status.total)}
                        </span>
                      )}
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <SettingsLevelControl
                        page={page}
                        level={level}
                        readOnly={readOnly}
                        labels={words}
                        onLevel={(next) =>
                          commit(
                            setSettingsLevel(
                              allObjects,
                              value.grants,
                              page,
                              next,
                            ),
                          )
                        }
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        aria-expanded={expanded}
                        aria-controls={detailsId}
                        onClick={() =>
                          setSettingsOpen((open) => ({
                            ...open,
                            [page.id]: !expanded,
                          }))
                        }
                      >
                        {expanded
                          ? words.settingsCollapse
                          : words.settingsDetails}
                        <ChevronDownIcon
                          aria-hidden
                          className={cn(
                            'transition-transform',
                            expanded && 'rotate-180',
                          )}
                        />
                      </Button>
                    </div>
                  </div>
                  {page.description && (
                    <p className='text-xs text-muted-foreground'>
                      {page.description}
                    </p>
                  )}
                  {expanded && (
                    <div id={detailsId} className='grid min-w-0 gap-2'>
                      {page.objects.map((object) => (
                        <div key={object.id} className='grid min-w-0 gap-1.5'>
                          {page.objects.length > 1 && (
                            <h4 className='text-xs font-medium text-muted-foreground'>
                              {object.label}
                            </h4>
                          )}
                          <ul className='grid min-w-0 gap-2 @min-[44rem]/permissions:grid-cols-[repeat(auto-fill,minmax(18rem,1fr))]'>
                            {[
                              ...orderedActions(object).basic,
                              ...orderedActions(object).business,
                            ].map((action) => (
                              <ActionRow
                                key={action.id}
                                object={object}
                                objects={allObjects}
                                action={action}
                                grants={value.grants}
                                readOnly={readOnly}
                                labels={words}
                                controlId={`${id}-${action.id}`}
                                onToggle={toggle}
                                onScope={() => undefined}
                                scoped={false}
                              />
                            ))}
                          </ul>
                          {object.notice && (
                            <div
                              data-slot='permission-object-notice'
                              className='flex min-w-0 items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground'
                            >
                              <InfoIcon
                                aria-hidden
                                className='mt-0.5 size-4 shrink-0'
                              />
                              <div className='min-w-0'>{object.notice}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      ))}
    </div>
  );

  const searchBox = (
    <InputGroup>
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
  );
  const shownObjects = onlyEnabled
    ? filtered.filter((object) => objectStatus(object, value.grants).enabled)
    : filtered;
  const groups = [...new Set(shownObjects.map((object) => object.group ?? ''))];
  const objectsPanel = (
    <div className='grid min-w-0 gap-3 p-4'>
      {objects.length > 0 && (
        <p
          data-slot='permission-objects-hint'
          className='flex min-w-0 items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground'
        >
          <InfoIcon aria-hidden className='mt-0.5 size-3.5 shrink-0' />
          <span className='min-w-0'>{words.objectsHint}</span>
        </p>
      )}
      {objects.length > 0 && (
        <div className='flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2'>
          <div className='w-full @min-[44rem]/permissions:w-72'>
            {searchBox}
          </div>
          <label className='inline-flex cursor-pointer items-center gap-2 text-sm'>
            <Switch
              size='sm'
              checked={onlyEnabled}
              onCheckedChange={(on: boolean) => setOnlyEnabled(on)}
            />
            {words.onlyEnabled}
          </label>
        </div>
      )}
      {readOnly && (
        <p className='text-xs text-muted-foreground'>{words.readOnly}</p>
      )}
      {messages}
      {shownObjects.length ? (
        <nav aria-label={words.objects} className='grid min-w-0 gap-3'>
          {groups.map((group) => {
            const members = objects.filter(
              (object) => (object.group ?? '') === group,
            );
            const shown = shownObjects.filter(
              (object) => (object.group ?? '') === group,
            );
            const levels = new Set(
              members.map((object) => quickSetLevel(object, value.grants)),
            );
            const groupLevel =
              levels.size === 1 ? [...levels][0] : ('custom' as const);
            const enabled = members.filter(
              (object) => objectStatus(object, value.grants).enabled,
            ).length;
            return (
              <div
                key={group}
                data-slot='permission-object-group'
                className='min-w-0 overflow-hidden rounded-lg border'
              >
                {grouped && group && (
                  <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 bg-muted/40 px-3 py-2'>
                    <h2 className='text-sm font-semibold'>{group}</h2>
                    <span className='mr-auto text-xs text-muted-foreground tabular-nums'>
                      {words.groupEnabled(enabled, members.length)}
                    </span>
                    {!readOnly && (
                      <div className='flex w-full items-center gap-2 @min-[44rem]/permissions:w-auto [&>[data-slot=permission-quick-set]]:flex-1'>
                        <span className='text-xs text-muted-foreground'>
                          {words.groupQuick}
                        </span>
                        {quickControl(
                          words.groupQuickLevel(group),
                          groupLevel === 'custom' ? undefined : groupLevel,
                          members.some((object) => viewActionOf(object)),
                          (mode) => quickMany(members, mode, group),
                          'xs',
                        )}
                      </div>
                    )}
                  </div>
                )}
                {shown.map(objectCard)}
              </div>
            );
          })}
        </nav>
      ) : (
        <p role='status' className='px-2 py-3 text-sm text-muted-foreground'>
          {objects.length ? words.noResults : words.empty}
        </p>
      )}
    </div>
  );

  return (
    <div
      data-slot='permission-editor'
      className={cn(
        '@container/permissions min-w-0 rounded-lg border bg-card text-card-foreground',
        className,
      )}
    >
      {header && <div className='px-4 pt-3 pb-1'>{header}</div>}
      <Tabs
        value={tab}
        onValueChange={(next: string) => {
          setTab(next);
          setNotices([]);
          setPending(undefined);
          setFlash(undefined);
        }}
      >
        <div className='border-b px-4'>
          {/* Below 44rem the tabs share the width, each name above its count and wrapping, so all three stay readable. */}
          <TabsList
            variant='line'
            className='grid w-full auto-cols-fr grid-flow-col gap-1 pt-2 pb-1 group-data-horizontal/tabs:h-auto @min-[44rem]/permissions:flex @min-[44rem]/permissions:w-fit @min-[44rem]/permissions:gap-3 @min-[44rem]/permissions:py-0 @min-[44rem]/permissions:group-data-horizontal/tabs:h-10'
          >
            <TabsTrigger value='menus' className={TAB_TRIGGER}>
              {words.menusTab}
              <span className='text-xs font-normal text-muted-foreground tabular-nums'>
                {words.tabCount(menuTotals.checked, menuTotals.total)}
              </span>
              <TabBadge count={tabBadges?.menus} labels={words} />
            </TabsTrigger>
            <TabsTrigger value='objects' className={TAB_TRIGGER}>
              {words.objectsTab}
              <span className='text-xs font-normal text-muted-foreground tabular-nums'>
                {words.tabCount(objectTotals.enabled, objectTotals.total)}
              </span>
              <TabBadge count={tabBadges?.objects} labels={words} />
            </TabsTrigger>
            {settings.length > 0 && (
              <TabsTrigger value='settings' className={TAB_TRIGGER}>
                {words.settingsTab}
                <span className='text-xs font-normal text-muted-foreground tabular-nums'>
                  {words.tabCount(settingsTotals.enabled, settingsTotals.total)}
                </span>
                <TabBadge count={tabBadges?.settings} labels={words} />
              </TabsTrigger>
            )}
            {extraTabs.map((extra) => (
              <TabsTrigger
                key={extra.value}
                value={extra.value}
                className={TAB_TRIGGER}
              >
                {extra.label}
                <TabBadge count={tabBadges?.[extra.value]} labels={words} />
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      {extraTabs.some((extra) => extra.value === tab) ? (
        <div className='min-w-0 px-4 py-4'>
          {extraTabs.find((extra) => extra.value === tab)?.content}
        </div>
      ) : tab === 'menus' ? (
        menusPanel
      ) : tab === 'settings' && settings.length ? (
        settingsPanel
      ) : (
        objectsPanel
      )}
      {saveBar}
    </div>
  );
}
