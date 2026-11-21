/**
 * A controlled role editor. Page access: a tree of checkboxes that decides which pages a role opens, with the number
 * of operations each page's objects allow and the operations a page turns on by default. Operations: a list of
 * objects beside the selected object's actions, where each action and its data scope is set once for every page that
 * uses the object. System settings: None, View or Manage per settings page, or action by action. Hosts add tabs of
 * their own, such as Members. The host owns the catalog, loading, Save and persistence; this component only edits the
 * draft it is given.
 */
import {
  ChevronDownIcon,
  InfoIcon,
  SearchIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';
import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from 'cn';
import { Button } from '#components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { Checkbox } from '#components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '#components/ui/popover';
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
  quickSelection,
  quickSetManyRemovals,
  enableDefaults,
  menuActionCount,
  menuLeaves,
  pageAccessGaps,
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
  /** The column titles of the Operations table. */
  readonly objectColumn: string;
  readonly viewColumn: string;
  readonly operationsColumn: string;
  /** The checkbox of an object, a group or every object: on turns every operation but risky ones on, off turns all off. */
  readonly selectObject: (object: string) => string;
  readonly selectGroup: (group: string) => string;
  readonly selectAll: string;
  readonly quickAllHint: string;
  /** A follower's scope tag while it follows View. */
  readonly sameAsViewShort: string;
  readonly groupEnabled: (enabled: number, total: number) => string;
  readonly objectsHint: string;
  readonly onlyEnabled: string;
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
  readonly confirmDisableTitle: string;
  /** Before turning on a high-risk action; its warning follows. */
  readonly confirmRisky: (action: string) => string;
  readonly confirmRiskyTitle: string;
  readonly confirmRiskyAction: string;
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
  /** The column titles of the System settings table. */
  readonly settingsPageColumn: string;
  readonly settingsEntryColumn: string;
  readonly settingsActionsColumn: string;
  readonly searchSettings: string;
  /** Beside a settings group: how many of its pages this role sees. */
  readonly settingsGroupEnabled: (enabled: number, total: number) => string;
  /** Above the settings pages: the ones this role sees in System settings. */
  readonly settingsVisible: (pages: readonly string[]) => string;
  readonly settingsNoneVisible: string;
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
  /** The tag of an action only a person may take, in an editor of what a credential may do. */
  readonly humanOnly: string;
  /** The tag of an action no longer in effect. */
  readonly lapsed: string;
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
   * The built-in tabs shown, in their order; defaults to all three. An editor of what a credential may do leaves out
   * page access, which only a role has.
   */
  readonly builtInTabs?: readonly PermissionEditorTab[] | undefined;
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
const ALL_TABS: readonly PermissionEditorTab[] = ['menus', 'objects', 'settings'];
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
  objectColumn: 'Object',
  viewColumn: 'View · data scope',
  operationsColumn: 'Operations',
  selectObject: (object) => `All operations on ${object}`,
  selectGroup: (group) => `All operations in ${group}`,
  selectAll: 'All operations',
  quickAllHint: 'Turns on every operation except high-risk ones',
  sameAsViewShort: 'Same as view',
  groupEnabled: (enabled, total) => `${enabled} of ${total} objects on`,
  objectsHint:
    'Checking a page turns on the operations it uses; adjust them here. A check takes effect at once; click a scope tag to change the data scope, and a dashed tag means it is the same as view.',
  onlyEnabled: 'Only show enabled',
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
  confirmDisableTitle: 'Turn these off too?',
  confirmRisky: (action) => `“${action}” is a high-risk operation.`,
  confirmRiskyTitle: 'Turn on a high-risk operation?',
  confirmRiskyAction: 'Turn on',
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
  settingsPageColumn: 'Settings page',
  settingsEntryColumn: 'Open page',
  settingsActionsColumn: 'Manage',
  searchSettings: 'Search settings pages or operations',
  settingsGroupEnabled: (enabled, total) => `${enabled} of ${total} pages open`,
  settingsVisible: (pages) =>
    `This role sees in System settings: ${list(pages)}.`,
  settingsNoneVisible: 'This role sees no System settings pages.',
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
  humanOnly: 'People only',
  lapsed: 'Lapsed',
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
  readonly options: readonly {
    value: string;
    label: string;
    disabled?: boolean | undefined;
  }[];
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
              disabled={option.disabled}
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

/** The columns of the Operations table: the object's checkbox, the object, View with its scope, the other operations. */
const OBJECT_ROW =
  'grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-x-2 gap-y-2 px-2 @min-[44rem]/permissions:grid-cols-[2rem_minmax(8rem,13rem)_minmax(10rem,15rem)_minmax(0,1fr)] @min-[44rem]/permissions:gap-x-4';
const SELECT_BOX =
  'data-disabled:cursor-not-allowed data-disabled:opacity-50 data-indeterminate:border-primary data-indeterminate:bg-primary/60';

interface ScopeSummary {
  readonly text: string;
  /** Follows View, shown as a dashed tag. */
  readonly following: boolean;
  /** Follows another object's View that is off: kept as it is until that View is on. */
  readonly blocked: boolean;
  /** There is something to pick, so the tag opens the scope's controls. */
  readonly choosable: boolean;
}

/** What one scope slot of an action is set to, in a word or two, mirroring what {@link ScopeControl} offers. */
function slotSummary(
  object: PermissionObject,
  objects: readonly PermissionObject[],
  action: PermissionAction,
  slot: PermissionScopeSlot,
  grants: PermissionGrants,
  labels: PermissionEditorLabels,
): ScopeSummary | undefined {
  const options = slotOptions(object, slot, objects);
  const labelOf = (value: string): string =>
    options.find((option) => option.value === value)?.label ?? value;
  const configurable = Boolean(slot.configuration);
  const blocked = blockedLeaderObject(object, slot, objects, grants);
  const own = ownScopeValue(object, grants, action, slot, objects);
  // The value it keeps, read-only in the popover beside what turning it back on needs.
  if (blocked)
    return {
      text: own === undefined ? labels.needsView(blocked.label) : labelOf(own),
      following: false,
      blocked: true,
      choosable: true,
    };
  const viewValue = viewScopeValue(object, grants, slot, objects);
  if (slot.followsView && viewValue !== undefined) {
    const narrower = narrowerOptions(object, grants, slot, objects);
    const stored =
      own !== undefined &&
      own !== viewValue &&
      !narrower.some((option) => option.value === own);
    const picked =
      stored || narrower.some((option) => option.value === own)
        ? own
        : undefined;
    return picked === undefined
      ? {
          text: labels.sameAsViewShort,
          following: true,
          blocked: false,
          choosable: narrower.length > 0 || configurable,
        }
      : {
          text: labelOf(picked),
          following: false,
          blocked: false,
          choosable: true,
        };
  }
  if (!options.length) return undefined;
  const current = effectiveScopeValue(object, grants, action, slot, objects);
  return {
    text: current === undefined ? '' : labelOf(current),
    following: false,
    blocked: false,
    choosable: options.length > 1 || configurable,
  };
}

/**
 * An enabled action's data scope as a small tag beside it. A tag with something to pick opens the scope's controls in
 * a popover; a dashed tag follows View. A follower with nothing narrower to pick shows no tag.
 */
function ScopeTag({
  object,
  objects,
  action,
  grants,
  disabled,
  labels,
  onScope,
}: {
  readonly object: PermissionObject;
  readonly objects: readonly PermissionObject[];
  readonly action: PermissionAction;
  readonly grants: PermissionGrants;
  readonly disabled: boolean;
  readonly labels: PermissionEditorLabels;
  readonly onScope: (slotId: string, value: string | undefined) => void;
}): ReactElement | null {
  const slots = action.scopes ?? [];
  const parts = slots
    .map((slot) => slotSummary(object, objects, action, slot, grants, labels))
    .filter((part): part is ScopeSummary => Boolean(part?.text));
  const choosable = parts.some((part) => part.choosable);
  const following = parts.every((part) => part.following);
  const blocked = parts.some((part) => part.blocked);
  // Nothing to say: a follower that can only be the same as View.
  if (!parts.length || (following && !choosable)) return null;
  // Several scopes show the first one and how many more the popover holds; the accessible name lists them all.
  const text =
    parts.length > 1
      ? `${parts[0]?.text ?? ''} +${parts.length - 1}`
      : (parts[0]?.text ?? '');
  const fullText = parts.map((part) => part.text).join(' · ');
  const className = cn(
    'inline-flex max-w-full min-w-0 items-center gap-0.5 rounded-full border bg-background px-2 text-xs leading-5',
    following && 'border-dashed text-muted-foreground',
    blocked && 'border-amber-500/50 text-amber-700 dark:text-amber-400',
  );
  if (!choosable)
    return (
      <span data-slot='permission-scope-tag' className={className}>
        <span className='truncate'>{text}</span>
      </span>
    );
  const title = labels.scopeFor(action.label);
  return (
    <Popover>
      <PopoverTrigger
        data-slot='permission-scope-tag'
        aria-label={`${title}: ${fullText}`}
        className={cn(
          className,
          'cursor-pointer hover:border-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
        )}
      >
        <span className='truncate'>{text}</span>
        <ChevronDownIcon aria-hidden className='size-3 shrink-0' />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-80 max-w-[calc(100vw-2rem)]'>
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
        </PopoverHeader>
        {slots.map((slot) => (
          <div
            key={slot.id}
            data-slot='permission-scope'
            className='grid min-w-0 gap-1'
          >
            {slot.label && (
              <span className='text-xs text-muted-foreground'>
                {slot.label}
              </span>
            )}
            <ScopeControl
              object={object}
              objects={objects}
              action={action}
              slot={slot}
              grants={grants}
              disabled={disabled}
              labels={labels}
              onScope={onScope}
            />
            {slot.configuration && (
              <SlotConfiguration
                locked={disabled || configurationLocked(object, slot, objects)}
              >
                {slot.configuration}
              </SlotConfiguration>
            )}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** One action in the Operations table: a checkbox with its name, its risk and, while on, its data scope. */
function OperationItem({
  object,
  objects,
  action,
  grants,
  readOnly,
  labels,
  controlId,
  dimmed,
  scoped = true,
  onToggle,
  onScope,
}: {
  readonly object: PermissionObject;
  readonly objects: readonly PermissionObject[];
  readonly action: PermissionAction;
  readonly grants: PermissionGrants;
  readonly readOnly: boolean;
  readonly labels: PermissionEditorLabels;
  readonly controlId: string;
  readonly dimmed: boolean;
  /** Settings have no data scope: their actions show only the checkbox, whatever scopes they carry. */
  readonly scoped?: boolean;
  readonly onToggle: (action: PermissionAction, enabled: boolean) => void;
  readonly onScope: (
    action: PermissionAction,
    slotId: string,
    value: string | undefined,
  ) => void;
}): ReactElement {
  const enabled = Boolean(grants[action.id]);
  const locked = readOnly || Boolean(action.managed);
  const description = [
    action.description,
    action.humanOnly ?? (action.managed ? labels.managed : undefined),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <div
      data-slot='permission-action'
      data-enabled={enabled ? '' : undefined}
      className='flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1'
    >
      <Checkbox
        id={controlId}
        checked={enabled}
        disabled={locked}
        aria-describedby={description ? `${controlId}-description` : undefined}
        className='data-disabled:cursor-not-allowed data-disabled:opacity-50'
        onCheckedChange={(on: boolean) => onToggle(action, on)}
      />
      <label
        htmlFor={controlId}
        title={description || undefined}
        className={cn(
          'cursor-pointer text-sm leading-5 break-words',
          dimmed && 'text-muted-foreground',
          locked && 'cursor-default',
          action.humanOnly && 'text-muted-foreground',
          action.lapsed && 'text-muted-foreground line-through',
        )}
      >
        {action.label}
      </label>
      {description && (
        <span id={`${controlId}-description`} className='sr-only'>
          {description}
        </span>
      )}
      {action.humanOnly && (
        <span
          data-slot='permission-human-only'
          title={action.humanOnly}
          className='inline-flex rounded bg-muted px-1.5 text-xs leading-5 text-muted-foreground'
        >
          {labels.humanOnly}
        </span>
      )}
      {action.lapsed && (
        <span
          data-slot='permission-lapsed'
          className='inline-flex rounded bg-amber-500/10 px-1.5 text-xs leading-5 text-amber-800 dark:text-amber-300'
        >
          {labels.lapsed}
        </span>
      )}
      {action.risk && (
        <span
          data-slot='permission-risk'
          className={cn(
            'inline-flex rounded px-1.5 text-xs leading-5',
            action.risk === 'high'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
          )}
        >
          {action.risk === 'high' ? labels.highRisk : labels.sensitive}
        </span>
      )}
      {enabled && scoped && (
        <ScopeTag
          object={object}
          objects={objects}
          action={action}
          grants={grants}
          disabled={locked}
          labels={labels}
          onScope={(slotId, value) => onScope(action, slotId, value)}
        />
      )}
      {enabled && action.warning && (
        <p className='basis-full text-xs leading-5 text-destructive'>
          {action.warning}
        </p>
      )}
    </div>
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

interface PendingDisable {
  /** Turning on a high-risk action, rather than turning off what others need. */
  readonly risky?: boolean | undefined;
  readonly message: string;
  /** More about the risk, such as the notice of the action's object. */
  readonly detail?: ReactNode;
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
  builtInTabs = ALL_TABS,
}: PermissionEditorProps): ReactElement {
  const words: PermissionEditorLabels = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<string>(
    builtInTabs.includes(defaultTab) ? defaultTab : (builtInTabs[0] ?? 'objects'),
  );
  const [flash, setFlash] = useState<MenuFlash | undefined>();
  const [query, setQuery] = useState('');
  const [onlyEnabled, setOnlyEnabled] = useState(false);
  const [notices, setNotices] = useState<readonly PermissionNotice[]>([]);
  const [settingsQuery, setSettingsQuery] = useState('');
  const [settingsOnlyEnabled, setSettingsOnlyEnabled] = useState(false);
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
  const menuTotals = menuCount(menus, value);
  const objectTotals = objectCount(objects, value.grants);
  const settingsTotals = settingsCount(settings, value.grants);

  /** Shows an object in Operations, clearing what would hide it, before the focus moves to it. */
  const reveal = (): void => {
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
  // The object a host opens first, such as from a link to one of its rules, takes the focus once.
  useEffect(() => {
    if (!defaultObjectId || defaultTab !== 'objects') return;
    const title = document.getElementById(`${id}-object-${defaultObjectId}`);
    title?.focus();
    title?.scrollIntoView?.({ block: 'start' });
  }, [id, defaultObjectId, defaultTab]);
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
  const ask = (
    message: string,
    apply: PendingDisable['apply'],
    risky?: boolean,
    detail?: ReactNode,
  ): void => {
    setNotices([]);
    setPending({ message, apply, risky, detail });
  };
  const toggle = (action: PermissionAction, enabled: boolean): void => {
    if (readOnly) return;
    if (enabled) {
      // A high-risk action is turned on only after reading what it lets a person do.
      if (action.risk === 'high') {
        ask(
          [words.confirmRisky(action.label), action.warning]
            .filter(Boolean)
            .join(' '),
          (draft) => {
            const change = setActionEnabled(
              allObjects,
              draft.grants,
              action.id,
              true,
            );
            return {
              value: { menus: draft.menus, grants: change.grants },
              notices: change.notices,
            };
          },
          true,
          findAction(allObjects, action.id)?.object.notice,
        );
        return;
      }
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
    reveal();
    setTab('objects');
    setFlash(undefined);
    focusObject(objectId);
  };
  const openAction = (actionId: string): void => {
    const found = findAction(allObjects, actionId);
    if (!found) return;
    reveal();
    setTab('objects');
    focusObject(found.object.id);
  };
  const openView = (warning: PermissionMenuWarning): void => {
    reveal();
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
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open: boolean) => {
          if (!open) setPending(undefined);
        }}
      >
        <AlertDialogContent size='sm'>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.risky
                ? words.confirmRiskyTitle
                : words.confirmDisableTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>{pending?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          {pending?.detail && (
            <div className='rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
              {pending.detail}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{words.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                if (readOnly || !pending) return;
                const change = pending.apply(value);
                commitValue(change.value, change.notices);
              }}
            >
              {pending?.risky ? words.confirmRiskyAction : words.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

  const objectRow = (object: PermissionObject): ReactElement => {
    const titleId = `${id}-object-${object.id}`;
    const view = viewActionOf(object);
    const { basic, business } = orderedActions(object);
    const others = [...basic, ...business].filter((action) => !action.view);
    const viewOn = Boolean(view && value.grants[view.id]);
    const status = objectStatus(object, value.grants);
    const selection = quickSelection([object], value.grants);
    const settable = object.actions.some(
      (action) => !action.risk && !action.managed,
    );
    const gap = gaps.find(
      (item: PermissionPageGap) => item.object.id === object.id,
    );
    // The pages that list this object.
    const usedBy = menuLeaves(menus)
      .filter(
        (menu) =>
          menu.uses?.primary?.includes(object.id) ||
          menu.uses?.related?.includes(object.id),
      )
      .map((menu) => menu.label);
    const pages = usedBy.length ? usedBy : (object.usedOn ?? []);
    const item = (action: PermissionAction): ReactElement => (
      <OperationItem
        key={action.id}
        object={object}
        objects={allObjects}
        action={action}
        grants={value.grants}
        readOnly={readOnly}
        labels={words}
        controlId={`${id}-${action.id}`}
        // Operations need View: while it is off they read as unavailable, and checking one turns View on.
        dimmed={Boolean(view) && !action.view && !viewOn}
        onToggle={toggle}
        onScope={(target, slotId, scope) =>
          commit(
            setScopeValue(allObjects, value.grants, target.id, slotId, scope),
          )
        }
      />
    );
    return (
      <section
        key={object.id}
        aria-labelledby={titleId}
        data-slot='permission-object'
        data-state={status.state}
        className={cn(OBJECT_ROW, 'border-t py-2.5')}
      >
        <div className='flex justify-center pt-0.5'>
          <Checkbox
            aria-label={words.selectObject(object.label)}
            title={words.quickAllHint}
            checked={selection === 'all'}
            indeterminate={selection === 'some'}
            disabled={readOnly || !settable}
            className={SELECT_BOX}
            onCheckedChange={() =>
              quick(object, selection === 'all' ? 'none' : 'all')
            }
          />
        </div>
        <div className='grid min-w-0 content-start gap-0.5'>
          <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
            <h3
              id={titleId}
              tabIndex={-1}
              title={object.description}
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
          </div>
          {gap ? (
            <p
              role='note'
              data-slot='permission-object-page-gap'
              className='flex min-w-0 items-start gap-1 text-xs text-amber-700 dark:text-amber-400'
            >
              <TriangleAlertIcon
                aria-hidden
                className='mt-0.5 size-3 shrink-0'
              />
              <span className='min-w-0'>
                {words.missingPage(gap.menus.map((menu) => menu.label))}
              </span>
            </p>
          ) : (
            <p
              data-slot='permission-object-used-on'
              className='text-xs break-words text-muted-foreground'
            >
              {pages.length ? words.usedOn(pages) : words.notOnPage}
            </p>
          )}
        </div>
        <div className='col-start-2 min-w-0 @min-[44rem]/permissions:col-start-auto'>
          {view ? (
            item(view)
          ) : (
            <span
              aria-hidden
              className='hidden text-muted-foreground/50 @min-[44rem]/permissions:inline'
            >
              —
            </span>
          )}
        </div>
        <div className='col-start-2 min-w-0 @min-[44rem]/permissions:col-start-auto'>
          {others.length ? (
            <ul
              data-slot='permission-actions'
              className='flex min-w-0 flex-wrap gap-x-5 gap-y-2'
            >
              {others.map((action) => (
                <li key={action.id} className='min-w-0'>
                  {item(action)}
                </li>
              ))}
            </ul>
          ) : (
            <span
              aria-hidden
              className='hidden text-muted-foreground/50 @min-[44rem]/permissions:inline'
            >
              —
            </span>
          )}
        </div>
        {object.notice && (
          <div
            data-slot='permission-object-notice'
            className='col-span-full col-start-2 flex min-w-0 items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'
          >
            <InfoIcon aria-hidden className='mt-0.5 size-4 shrink-0' />
            <div className='min-w-0'>{object.notice}</div>
          </div>
        )}
        {object.footnote && (
          <p
            data-slot='permission-object-footnote'
            className='col-span-full col-start-2 min-w-0 text-xs text-muted-foreground'
          >
            {object.footnote}
          </p>
        )}
      </section>
    );
  };

  const settingsSearch = settingsQuery.trim().toLocaleLowerCase();
  const shownSettings = settings.filter(
    (page) =>
      (!settingsSearch ||
        page.label.toLocaleLowerCase().includes(settingsSearch) ||
        page.objects.some((object) =>
          object.actions.some((action) =>
            action.label.toLocaleLowerCase().includes(settingsSearch),
          ),
        )) &&
      (!settingsOnlyEnabled || settingsLevel(page, value.grants) !== 'none'),
  );
  const settingsGroups = [
    ...new Set(shownSettings.map((page) => page.group ?? '')),
  ];
  const settingsGrouped =
    new Set(settings.map((page) => page.group ?? '')).size > 1;
  const visibleSettings = settings.filter(
    (page) => settingsLevel(page, value.grants) !== 'none',
  );
  /** The action that opens a settings page: its first object's View, or that object's first action. */
  const entryOf = (
    page: PermissionSettingsPage,
  ): PermissionAction | undefined => {
    const first = page.objects[0];
    return first ? (viewActionOf(first) ?? first.actions[0]) : undefined;
  };
  const settingsItem = (
    object: PermissionObject,
    action: PermissionAction,
    dimmed: boolean,
  ): ReactElement => (
    <OperationItem
      key={action.id}
      object={object}
      objects={allObjects}
      action={action}
      grants={value.grants}
      readOnly={readOnly}
      labels={words}
      controlId={`${id}-${action.id}`}
      dimmed={dimmed}
      scoped={false}
      onToggle={toggle}
      onScope={() => undefined}
    />
  );
  // A settings object's notice explains what its actions allow: it shows once any of them is on, and before turning on
  // a high-risk one.
  const noticeShown = (object: PermissionObject): boolean =>
    object.actions.some((action) => value.grants[action.id]);
  const settingsRow = (page: PermissionSettingsPage): ReactElement => {
    const titleId = `${id}-settings-${page.id}`;
    const entry = entryOf(page);
    const entryObject = page.objects[0];
    const entryOn = Boolean(entry && value.grants[entry.id]);
    const status = objectStatus(settingsPageObject(page), value.grants);
    const selection = quickSelection(page.objects, value.grants);
    const settable = page.objects.some((object) =>
      object.actions.some((action) => !action.risk && !action.managed),
    );
    // The page's other actions, object by object; an object's label shows when the page holds several.
    const lines = page.objects
      .map((object) => ({
        object,
        actions: [
          ...orderedActions(object).basic,
          ...orderedActions(object).business,
        ].filter((action) => action.id !== entry?.id),
      }))
      .filter((line) => line.actions.length > 0);
    return (
      <section
        key={page.id}
        aria-labelledby={titleId}
        data-slot='permission-settings-page'
        data-state={status.state}
        className={cn(OBJECT_ROW, 'border-t py-2.5')}
      >
        <div className='flex justify-center pt-0.5'>
          <Checkbox
            aria-label={words.selectObject(page.label)}
            title={words.quickAllHint}
            checked={selection === 'all'}
            indeterminate={selection === 'some'}
            disabled={readOnly || !settable}
            className={SELECT_BOX}
            onCheckedChange={() =>
              quickMany(
                page.objects,
                selection === 'all' ? 'none' : 'all',
                page.label,
              )
            }
          />
        </div>
        <div className='grid min-w-0 content-start gap-0.5'>
          <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
            <h3
              id={titleId}
              title={page.description}
              className='text-sm font-semibold'
            >
              {page.label}
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
          </div>
        </div>
        <div className='col-start-2 min-w-0 @min-[44rem]/permissions:col-start-auto'>
          {entry && entryObject && settingsItem(entryObject, entry, false)}
        </div>
        <div className='col-start-2 grid min-w-0 gap-2 @min-[44rem]/permissions:col-start-auto'>
          {lines.length ? (
            lines.map(({ object, actions }) => (
              <div
                key={object.id}
                className='flex min-w-0 flex-wrap items-start gap-x-5 gap-y-2'
              >
                {page.objects.length > 1 && (
                  <span className='w-full text-xs leading-5 text-muted-foreground @min-[44rem]/permissions:w-24 @min-[44rem]/permissions:shrink-0'>
                    {object.label}
                  </span>
                )}
                <ul
                  data-slot='permission-actions'
                  className='flex min-w-0 flex-1 flex-wrap gap-x-5 gap-y-2'
                >
                  {actions.map((action) => (
                    <li key={action.id} className='min-w-0'>
                      {settingsItem(
                        object,
                        action,
                        object === entryObject && !entryOn,
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <span
              aria-hidden
              className='hidden text-muted-foreground/50 @min-[44rem]/permissions:inline'
            >
              —
            </span>
          )}
        </div>
        {page.objects.map(
          (object) =>
            noticeShown(object) &&
            object.notice && (
              <div
                key={object.id}
                data-slot='permission-object-notice'
                className='col-span-full col-start-2 flex min-w-0 items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground'
              >
                <InfoIcon aria-hidden className='mt-0.5 size-4 shrink-0' />
                <div className='min-w-0'>{object.notice}</div>
              </div>
            ),
        )}
        {page.objects.map(
          (object) =>
            object.footnote && (
              <p
                key={`${object.id}-footnote`}
                data-slot='permission-object-footnote'
                className='col-span-full col-start-2 min-w-0 text-xs text-muted-foreground'
              >
                {object.footnote}
              </p>
            ),
        )}
      </section>
    );
  };
  const settingsPanel = (
    <div className='grid min-w-0 gap-3 p-4'>
      {readOnly && (
        <p className='text-xs text-muted-foreground'>{words.readOnly}</p>
      )}
      <p
        data-slot='permission-settings-summary'
        className='rounded-lg bg-muted/50 px-3 py-2 text-sm'
      >
        {visibleSettings.length
          ? words.settingsVisible(visibleSettings.map((page) => page.label))
          : words.settingsNoneVisible}
      </p>
      <div className='flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2'>
        <div className='w-full @min-[44rem]/permissions:w-72'>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              value={settingsQuery}
              aria-label={words.searchSettings}
              placeholder={words.searchSettings}
              onChange={(event) => setSettingsQuery(event.target.value)}
            />
            {settingsQuery && (
              <InputGroupAddon align='inline-end'>
                <InputGroupButton
                  type='button'
                  size='icon-xs'
                  aria-label={words.clearSearch}
                  onClick={() => setSettingsQuery('')}
                >
                  <XIcon aria-hidden />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>
        <label className='inline-flex cursor-pointer items-center gap-2 text-sm'>
          <Switch
            size='sm'
            checked={settingsOnlyEnabled}
            onCheckedChange={(on: boolean) => setSettingsOnlyEnabled(on)}
          />
          {words.onlyEnabled}
        </label>
      </div>
      {messages}
      {shownSettings.length ? (
        <div
          data-slot='permission-settings-table'
          className='min-w-0 overflow-hidden rounded-lg border'
        >
          <div
            aria-hidden
            className={cn(
              OBJECT_ROW,
              'hidden bg-muted/40 py-2 text-xs font-medium text-muted-foreground @min-[44rem]/permissions:grid',
            )}
          >
            <span />
            <span>{words.settingsPageColumn}</span>
            <span>{words.settingsEntryColumn}</span>
            <span>{words.settingsActionsColumn}</span>
          </div>
          {settingsGroups.map((group) => {
            const members = settings.filter(
              (page) => (page.group ?? '') === group,
            );
            const targets = members.flatMap((page) => page.objects);
            const selection = quickSelection(targets, value.grants);
            const opened = members.filter(
              (page) => settingsLevel(page, value.grants) !== 'none',
            ).length;
            return (
              <div
                key={group}
                role='group'
                aria-label={group || undefined}
                data-slot='permission-settings-group'
                className='min-w-0'
              >
                {settingsGrouped && group && (
                  <div
                    className={cn(
                      OBJECT_ROW,
                      'items-center border-t bg-muted/60 py-2',
                    )}
                  >
                    <div className='flex justify-center'>
                      <Checkbox
                        aria-label={words.selectGroup(group)}
                        title={words.quickAllHint}
                        checked={selection === 'all'}
                        indeterminate={selection === 'some'}
                        disabled={readOnly}
                        className={SELECT_BOX}
                        onCheckedChange={() =>
                          quickMany(
                            targets,
                            selection === 'all' ? 'none' : 'all',
                            group,
                          )
                        }
                      />
                    </div>
                    <div className='col-span-full col-start-2 flex min-w-0 flex-wrap items-baseline gap-x-2'>
                      <h2 className='text-sm font-semibold'>{group}</h2>
                      <span className='text-xs text-muted-foreground tabular-nums'>
                        {words.settingsGroupEnabled(opened, members.length)}
                      </span>
                    </div>
                  </div>
                )}
                {shownSettings
                  .filter((page) => (page.group ?? '') === group)
                  .map(settingsRow)}
              </div>
            );
          })}
        </div>
      ) : (
        <p role='status' className='px-2 py-3 text-sm text-muted-foreground'>
          {words.noResults}
        </p>
      )}
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
        <nav
          aria-label={words.objects}
          data-slot='permission-object-table'
          className='min-w-0 overflow-hidden rounded-lg border'
        >
          <div
            aria-hidden={grouped}
            className={cn(
              OBJECT_ROW,
              'bg-muted/40 py-2 text-xs font-medium text-muted-foreground',
              grouped && 'hidden @min-[44rem]/permissions:grid',
            )}
          >
            <div className='flex justify-center'>
              {!grouped && (
                <Checkbox
                  aria-label={words.selectAll}
                  title={words.quickAllHint}
                  checked={quickSelection(objects, value.grants) === 'all'}
                  indeterminate={
                    quickSelection(objects, value.grants) === 'some'
                  }
                  disabled={readOnly}
                  className={SELECT_BOX}
                  onCheckedChange={() =>
                    quickMany(
                      objects,
                      quickSelection(objects, value.grants) === 'all'
                        ? 'none'
                        : 'all',
                      words.selectAll,
                    )
                  }
                />
              )}
            </div>
            <span className={cn(!grouped && 'self-center')}>
              {words.objectColumn}
            </span>
            <span className='hidden @min-[44rem]/permissions:inline'>
              {words.viewColumn}
            </span>
            <span className='hidden @min-[44rem]/permissions:inline'>
              {words.operationsColumn}
            </span>
          </div>
          {groups.map((group) => {
            const members = objects.filter(
              (object) => (object.group ?? '') === group,
            );
            const shown = shownObjects.filter(
              (object) => (object.group ?? '') === group,
            );
            const selection = quickSelection(members, value.grants);
            const enabled = members.filter(
              (object) => objectStatus(object, value.grants).enabled,
            ).length;
            return (
              <div
                key={group}
                role='group'
                aria-label={group || undefined}
                data-slot='permission-object-group'
                className='min-w-0'
              >
                {grouped && group && (
                  <div
                    className={cn(
                      OBJECT_ROW,
                      'items-center border-t bg-muted/60 py-2',
                    )}
                  >
                    <div className='flex justify-center'>
                      <Checkbox
                        aria-label={words.selectGroup(group)}
                        title={words.quickAllHint}
                        checked={selection === 'all'}
                        indeterminate={selection === 'some'}
                        disabled={readOnly}
                        className={SELECT_BOX}
                        onCheckedChange={() =>
                          quickMany(
                            members,
                            selection === 'all' ? 'none' : 'all',
                            group,
                          )
                        }
                      />
                    </div>
                    <div className='col-span-full col-start-2 flex min-w-0 flex-wrap items-baseline gap-x-2'>
                      <h2 className='text-sm font-semibold'>{group}</h2>
                      <span className='text-xs text-muted-foreground tabular-nums'>
                        {words.groupEnabled(enabled, members.length)}
                      </span>
                    </div>
                  </div>
                )}
                {shown.map(objectRow)}
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
            {builtInTabs.includes('menus') && (
              <TabsTrigger value='menus' className={TAB_TRIGGER}>
                {words.menusTab}
                <span className='text-xs font-normal text-muted-foreground tabular-nums'>
                  {words.tabCount(menuTotals.checked, menuTotals.total)}
                </span>
                <TabBadge count={tabBadges?.menus} labels={words} />
              </TabsTrigger>
            )}
            <TabsTrigger value='objects' className={TAB_TRIGGER}>
              {words.objectsTab}
              <span className='text-xs font-normal text-muted-foreground tabular-nums'>
                {words.tabCount(objectTotals.enabled, objectTotals.total)}
              </span>
              <TabBadge count={tabBadges?.objects} labels={words} />
            </TabsTrigger>
            {settings.length > 0 && builtInTabs.includes('settings') && (
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
      ) : tab === 'menus' && builtInTabs.includes('menus') ? (
        menusPanel
      ) : tab === 'settings' &&
        settings.length &&
        builtInTabs.includes('settings') ? (
        settingsPanel
      ) : (
        objectsPanel
      )}
      {saveBar}
    </div>
  );
}
