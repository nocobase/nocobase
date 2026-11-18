/**
 * A controlled permission editor with two tabs. Menus: a tree of checkboxes that only decides what a role sees in the
 * sidebar, with the objects each page uses as reference tags. Business objects: a list of objects beside the selected
 * object's actions, where each action and its data scope is set once for every menu that uses the object.
 * The host owns the catalog, loading, Save and persistence; this component only edits the draft it is given.
 */
import {
  InfoIcon,
  SearchIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Switch } from '#components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import {
  applyQuickSet,
  canViewObject,
  dependentsOf,
  effectiveScopeValue,
  followedObject,
  filterObjects,
  findAction,
  isMenuToggleable,
  menuCheckState,
  menuCount,
  menusUsing,
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
  slotOptions,
  viewActionOf,
  viewScopeLabel,
  viewScopeOptions,
  viewScopeValue,
  type PermissionAction,
  type PermissionChange,
  type PermissionGrants,
  type PermissionMenuNode,
  type PermissionMenuWarning,
  type PermissionNotice,
  type PermissionObject,
  type PermissionQuickSet,
  type PermissionScopeSlot,
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
  PermissionValue,
} from './permission-editor-model.js';

export type PermissionEditorTab = 'menus' | 'objects';

export interface PermissionEditorLabels {
  readonly menusTab: string;
  readonly objectsTab: string;
  readonly tabCount: (count: number, total: number) => string;
  readonly menusIntro: string;
  readonly menuColumn: string;
  readonly usesColumn: string;
  readonly public: string;
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
  readonly noScope: string;
  readonly usedBy: string;
  readonly usedByNote: string;
  readonly enableAll: string;
  readonly viewOnly: string;
  readonly disableAll: string;
  readonly sameAsView: (scope: string) => string;
  /** A slot following another object's View, such as the customers a Contacts action reads. */
  readonly sameAsObjectView: (object: string, scope: string) => string;
  readonly scopeFor: (action: string, scope?: string) => string;
  readonly scopeNote: (options: readonly string[]) => string;
  readonly followHint: string;
  readonly managed: string;
  readonly appliesEverywhere: string;
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
}

export interface PermissionEditorProps {
  /** The sidebar's menus. Groups hold menus; a public menu shows as fixed. */
  readonly menus: readonly PermissionMenuNode[];
  /** Business objects with their actions, each set once whichever menus use it. */
  readonly objects: readonly PermissionObject[];
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
  /** The object opened first; defaults to the first one. */
  readonly defaultObjectId?: string | undefined;
  readonly labels?: Partial<PermissionEditorLabels> | undefined;
  readonly className?: string | undefined;
}

const list = (items: readonly string[]): string =>
  new Intl.ListFormat('en', { type: 'conjunction' }).format(items);

const DEFAULT_LABELS: PermissionEditorLabels = {
  menusTab: 'Menus',
  objectsTab: 'Business objects',
  tabCount: (count, total) => `${count} / ${total}`,
  menusIntro:
    'Only decides which menus this role sees in the sidebar. What data it can see and what it can do is set once per object under Business objects.',
  menuColumn: 'Menu',
  usesColumn: 'Business objects the page uses (for reference)',
  public: 'Visible to everyone',
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
  noScope: '—',
  usedBy: 'Used by menus',
  usedByNote: 'These settings apply in every menu.',
  enableAll: 'Enable all',
  viewOnly: 'View only',
  disableAll: 'Disable all',
  sameAsView: (scope) => `Same as view (${scope})`,
  sameAsObjectView: (object, scope) => `Same as ${object} view (${scope})`,
  scopeFor: (action, scope) =>
    scope ? `${action}: ${scope}` : `Data scope of ${action}`,
  scopeNote: (options) =>
    `Data scope: ${options.join(' / ')}. Other actions cannot be wider than View.`,
  followHint:
    'Other actions follow the view scope; they can be narrower, never wider.',
  managed: 'Managed by the application',
  appliesEverywhere: 'Changes apply to every menu that uses the object',
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
        className={cn(
          'w-full min-w-0',
          following === true && 'border-dashed text-muted-foreground',
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
  if (slot.followsView && viewValue !== undefined) {
    const viewLabel =
      viewScopeLabel(object, grants, slot, objects) ?? viewValue;
    const narrower = narrowerOptions(object, grants, slot, objects);
    const other = followedObject(object, slot, objects, grants);
    const same = other
      ? labels.sameAsObjectView(other.label, viewLabel)
      : labels.sameAsView(viewLabel);
    if (!narrower.length)
      return (
        <span className='flex min-h-7 items-center text-xs text-muted-foreground'>
          {same}
        </span>
      );
    return (
      <ScopeSelect
        label={accessibleName}
        options={[{ value: FOLLOW, label: same }, ...narrower]}
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
      value={effectiveScopeValue(object, grants, action, slot, objects) ?? ''}
      disabled={disabled}
      onChange={(next) => onScope(slot.id, next)}
    />
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
      className={cn(
        'grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-2.5 @min-[44rem]/permissions:grid-cols-[auto_minmax(0,1fr)_minmax(14rem,16rem)] @min-[44rem]/permissions:px-4',
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

function ObjectTags({
  ids,
  objects,
  grants,
}: {
  readonly ids: readonly string[];
  readonly objects: readonly PermissionObject[];
  readonly grants: PermissionGrants;
}): ReactElement | null {
  const used = ids.flatMap((id) => {
    const object = objects.find((item) => item.id === id);
    return object ? [object] : [];
  });
  if (!used.length) return null;
  return (
    <span className='flex min-w-0 flex-wrap gap-1'>
      {used.map((object) => {
        const viewable = canViewObject(object, grants);
        return (
          <span
            key={object.id}
            data-slot='permission-object-tag'
            data-viewable={viewable ? '' : undefined}
            className={cn(
              'rounded px-1.5 text-xs leading-5',
              viewable
                ? 'bg-muted text-muted-foreground'
                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
            )}
          >
            {object.label}
          </span>
        );
      })}
    </span>
  );
}

function MenuRows({
  nodes,
  depth,
  value,
  objects,
  readOnly,
  labels,
  idPrefix,
  onCheck,
  onOpenAction,
}: {
  readonly nodes: readonly PermissionMenuNode[];
  readonly depth: number;
  readonly value: PermissionValue;
  readonly objects: readonly PermissionObject[];
  readonly readOnly: boolean;
  readonly labels: PermissionEditorLabels;
  readonly idPrefix: string;
  readonly onCheck: (node: PermissionMenuNode, checked: boolean) => void;
  readonly onOpenAction: (actionId: string) => void;
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
        return (
          <Fragment key={node.id}>
            <li
              data-slot={group ? 'permission-menu-group' : 'permission-menu'}
              className={cn(
                'grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 border-t px-3 py-2 first:border-t-0 @min-[44rem]/permissions:grid-cols-[auto_minmax(0,1fr)_minmax(0,20rem)]',
                group && 'bg-muted/40',
              )}
            >
              <Checkbox
                id={controlId}
                checked={state === 'checked'}
                indeterminate={state === 'mixed'}
                disabled={
                  readOnly || Boolean(node.public) || !isMenuToggleable(node)
                }
                className='data-disabled:cursor-not-allowed data-disabled:opacity-50 data-indeterminate:border-primary data-indeterminate:bg-primary/60'
                onCheckedChange={(checked: boolean) =>
                  onCheck(node, state === 'mixed' ? true : checked)
                }
              />
              <label
                htmlFor={controlId}
                className={cn(
                  'min-w-0 text-sm break-words',
                  group ? 'font-semibold' : 'cursor-pointer',
                )}
                style={{ paddingInlineStart: `${depth * 1.25}rem` }}
              >
                {node.label}
                {node.public && (
                  <span className='text-xs text-muted-foreground'>
                    {' · '}
                    {typeof node.public === 'string'
                      ? node.public
                      : labels.public}
                  </span>
                )}
              </label>
              {!group && node.opensWith && (
                <Button
                  type='button'
                  variant='link'
                  size='xs'
                  className='col-start-2 h-auto justify-self-start p-0 text-xs'
                  onClick={() => onOpenAction(node.opensWith!)}
                >
                  {labels.opensWith(
                    findAction(objects, node.opensWith)?.action.label ??
                      node.opensWith,
                  )}
                </Button>
              )}
              {!group && uses.length > 0 && (
                <div className='col-start-2 min-w-0 @min-[44rem]/permissions:col-start-3 @min-[44rem]/permissions:row-start-1'>
                  <ObjectTags
                    ids={uses}
                    objects={objects}
                    grants={value.grants}
                  />
                </div>
              )}
            </li>
            {group && (
              <MenuRows
                nodes={node.children ?? []}
                depth={depth + 1}
                value={value}
                objects={objects}
                readOnly={readOnly}
                labels={labels}
                idPrefix={idPrefix}
                onCheck={onCheck}
                onOpenAction={onOpenAction}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

function ObjectList({
  objects,
  grants,
  selected,
  labels,
  onSelect,
}: {
  readonly objects: readonly PermissionObject[];
  readonly grants: PermissionGrants;
  readonly selected: string | undefined;
  readonly labels: PermissionEditorLabels;
  readonly onSelect: (id: string) => void;
}): ReactElement {
  return (
    <ul className='grid min-w-0 gap-0.5'>
      {objects.map((object, index) => {
        const status = objectStatus(object, grants);
        const heading =
          object.group && object.group !== objects[index - 1]?.group
            ? object.group
            : undefined;
        const view = viewActionOf(object);
        const scope =
          view && grants[view.id] ? viewScopeLabel(object, grants) : undefined;
        const active = object.id === selected;
        return (
          <Fragment key={object.id}>
            {heading && (
              <li
                aria-hidden
                className='px-2 pt-2 pb-0.5 text-xs text-muted-foreground'
              >
                {heading}
              </li>
            )}
            <li className='min-w-0'>
              <button
                type='button'
                data-slot='permission-object'
                data-state={status.state}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                  active && 'bg-muted',
                )}
                onClick={() => onSelect(object.id)}
              >
                <span className='grid min-w-0 flex-1'>
                  <span
                    className={cn(
                      'truncate text-sm',
                      active && 'font-semibold',
                    )}
                  >
                    {object.label}
                  </span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {status.enabled
                      ? labels.objectEnabled(status.enabled, status.total)
                      : labels.objectOff}
                  </span>
                </span>
                <span className='sr-only'>, </span>
                <span className='max-w-[45%] shrink-0 truncate text-xs text-muted-foreground'>
                  {scope ??
                    (status.enabled && !view?.scopes?.length
                      ? ''
                      : labels.noScope)}
                </span>
              </button>
            </li>
          </Fragment>
        );
      })}
    </ul>
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
  defaultTab = 'menus',
  defaultObjectId,
  labels,
  className,
}: PermissionEditorProps): ReactElement {
  const words: PermissionEditorLabels = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [tab, setTab] = useState<PermissionEditorTab>(defaultTab);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(
    defaultObjectId ?? objects[0]?.id,
  );
  const [notices, setNotices] = useState<readonly PermissionNotice[]>([]);
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
    }
  }
  const current =
    objects.find((object) => object.id === selectedId) ?? objects[0];
  const filtered = filterObjects(objects, query);
  const warnings = menuWarnings(menus, objects, value);
  const menuTotals = menuCount(menus, value);
  const objectTotals = objectCount(objects, value.grants);

  const select = (objectId: string): void => {
    setSelectedId(objectId);
    setNotices([]);
    setPending(undefined);
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
      commit(setActionEnabled(objects, value.grants, action.id, true));
      return;
    }
    const dependents = dependentsOf(objects, value.grants, [action.id]);
    // Managed dependents block the change; the model explains why.
    if (!dependents.length || dependents.some((item) => item.managed)) {
      commit(setActionEnabled(objects, value.grants, action.id, false));
      return;
    }
    ask(
      words.confirmDisable(
        [action.label],
        dependents.map((item) => item.label),
      ),
      (draft) => {
        const change = setActionEnabled(
          objects,
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
      objects,
      value.grants,
      object,
      mode,
    );
    if (
      !others.length ||
      dependentsOf(objects, value.grants, own).some((item) => item.managed)
    ) {
      commit(applyQuickSet(objects, value.grants, object, mode));
      return;
    }
    ask(
      words.confirmDisable(
        [object.label],
        others.map((item) => item.label),
      ),
      (draft) => {
        const change = applyQuickSet(objects, draft.grants, object, mode);
        return {
          value: { menus: draft.menus, grants: change.grants },
          notices: change.notices,
        };
      },
    );
  };
  const check = (node: PermissionMenuNode, checked: boolean): void => {
    if (readOnly || node.public || !isMenuToggleable(node)) return;
    commitValue(setMenuChecked(menus, value, node.id, checked), []);
  };
  const openAction = (actionId: string): void => {
    const found = findAction(objects, actionId);
    if (!found) return;
    select(found.object.id);
    setTab('objects');
    requestAnimationFrame(() => titleRef.current?.focus());
  };
  const openView = (warning: PermissionMenuWarning): void => {
    select(warning.object.id);
    setTab('objects');
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const status =
    tab === 'menus'
      ? warnings.length
        ? words.attention(warnings.length)
        : undefined
      : words.appliesEverywhere;
  const footerBar = (
    <div className='flex min-w-0 flex-wrap items-center gap-2 border-t px-4 py-3'>
      <span
        role='status'
        className='mr-auto inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'
      >
        {unrestricted ? null : (
          <>
            {status && <span>{status}</span>}
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

  const menusPanel = (
    <div className='grid min-w-0 gap-3 p-4'>
      <p className='text-sm text-muted-foreground'>{words.menusIntro}</p>
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
      {menus.length ? (
        <div className='min-w-0 overflow-hidden rounded-lg border'>
          <div
            aria-hidden
            className='hidden grid-cols-[auto_minmax(0,1fr)_minmax(0,20rem)] gap-x-3 border-b px-3 py-2 text-xs text-muted-foreground @min-[44rem]/permissions:grid'
          >
            <span className='size-4' />
            <span>{words.menuColumn}</span>
            <span>{words.usesColumn}</span>
          </div>
          <ul data-slot='permission-menus' className='min-w-0'>
            <MenuRows
              nodes={menus}
              depth={0}
              value={value}
              objects={objects}
              readOnly={readOnly}
              labels={words}
              idPrefix={`${id}-menu`}
              onCheck={check}
              onOpenAction={openAction}
            />
          </ul>
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>{words.noMenus}</p>
      )}
    </div>
  );

  const detail = (() => {
    if (!current) return null;
    const object = current;
    const titleId = `${id}-title`;
    const { basic, business } = orderedActions(object);
    const scopeOptions = viewScopeOptions(object);
    const hasFollowers = object.actions.some((action) =>
      action.scopes?.some((slot) => slot.followsView),
    );
    const usedBy = menusUsing(menus, object.id);
    const row = (action: PermissionAction): ReactElement => (
      <ActionRow
        key={action.id}
        object={object}
        objects={objects}
        action={action}
        grants={value.grants}
        readOnly={readOnly}
        labels={words}
        controlId={`${id}-${action.id}`}
        onToggle={toggle}
        onScope={(item, slotId, scope) =>
          commit(setScopeValue(objects, value.grants, item.id, slotId, scope))
        }
      />
    );
    return (
      <section
        aria-labelledby={titleId}
        className='grid min-w-0 content-start gap-3'
      >
        <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2'>
          <h2
            ref={titleRef}
            tabIndex={-1}
            id={titleId}
            className='text-lg font-semibold outline-none'
          >
            {object.label}
          </h2>
          {!readOnly && (
            <div className='flex flex-wrap gap-1.5 @min-[44rem]/permissions:ml-auto'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => quick(object, 'all')}
              >
                {words.enableAll}
              </Button>
              {viewActionOf(object) && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => quick(object, 'view')}
                >
                  {words.viewOnly}
                </Button>
              )}
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => quick(object, 'none')}
              >
                {words.disableAll}
              </Button>
            </div>
          )}
        </div>
        {object.description && (
          <p className='text-sm text-muted-foreground'>{object.description}</p>
        )}
        {usedBy.length > 0 && (
          <p
            data-slot='permission-used-by'
            className='flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground'
          >
            <span>{words.usedBy}</span>
            {usedBy.map((menu) => (
              <span
                key={menu.id}
                className='rounded bg-muted px-1.5 leading-5 text-foreground/80'
              >
                {menu.label}
              </span>
            ))}
            <span>· {words.usedByNote}</span>
          </p>
        )}
        {readOnly && (
          <p className='text-xs text-muted-foreground'>{words.readOnly}</p>
        )}
        {messages}
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
        {object.notice && (
          <div
            data-slot='permission-object-notice'
            className='flex min-w-0 items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'
          >
            <InfoIcon aria-hidden className='mt-0.5 size-4 shrink-0' />
            <div className='min-w-0'>{object.notice}</div>
          </div>
        )}
        {hasFollowers && (
          <p className='text-xs text-muted-foreground'>
            {scopeOptions.length
              ? words.scopeNote(scopeOptions.map((option) => option.label))
              : words.followHint}
          </p>
        )}
      </section>
    );
  })();

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
  const groups = [...new Set(filtered.map((object) => object.group ?? ''))];
  const objectsPanel = (
    <div className='grid min-w-0 @min-[44rem]/permissions:grid-cols-[15.5rem_minmax(0,1fr)]'>
      <nav
        aria-label={words.objects}
        className='grid min-w-0 content-start gap-2 border-b p-2 @min-[44rem]/permissions:border-r @min-[44rem]/permissions:border-b-0'
      >
        {searchBox}
        {/* On a phone the list collapses into a select of the same objects. */}
        <div className='@min-[44rem]/permissions:hidden'>
          {filtered.length > 0 && (
            <Select
              items={filtered.map((object) => ({
                value: object.id,
                label: object.label,
              }))}
              value={
                filtered.some((object) => object.id === current?.id)
                  ? current?.id
                  : null
              }
              onValueChange={(next: string | null) => {
                if (next) select(next);
              }}
            >
              <SelectTrigger aria-label={words.objects} className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectGroup key={group}>
                    {group && <SelectLabel>{group}</SelectLabel>}
                    {filtered
                      .filter((object) => (object.group ?? '') === group)
                      .map((object) => {
                        const status = objectStatus(object, value.grants);
                        return (
                          <SelectItem key={object.id} value={object.id}>
                            {object.label}
                            <span className='ml-auto pl-3 text-xs text-muted-foreground'>
                              {status.enabled
                                ? words.objectEnabled(
                                    status.enabled,
                                    status.total,
                                  )
                                : words.objectOff}
                            </span>
                          </SelectItem>
                        );
                      })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className='hidden max-h-[min(70dvh,48rem)] min-w-0 overflow-y-auto @min-[44rem]/permissions:block'>
          {filtered.length > 0 && (
            <ObjectList
              objects={filtered}
              grants={value.grants}
              selected={current?.id}
              labels={words}
              onSelect={select}
            />
          )}
        </div>
        {!filtered.length && (
          <p role='status' className='px-2 py-3 text-sm text-muted-foreground'>
            {objects.length ? words.noResults : words.empty}
          </p>
        )}
      </nav>
      <div className='min-w-0 p-4 @min-[44rem]/permissions:px-6 @min-[44rem]/permissions:py-5'>
        {detail ?? (
          <p className='text-sm text-muted-foreground'>{words.empty}</p>
        )}
      </div>
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
        onValueChange={(next: PermissionEditorTab) => {
          setTab(next);
          setNotices([]);
          setPending(undefined);
        }}
      >
        <div className='border-b px-4'>
          <TabsList variant='line' className='h-10 gap-3'>
            <TabsTrigger value='menus' className='flex-none px-1'>
              {`① ${words.menusTab}`}
              <span className='text-xs font-normal text-muted-foreground tabular-nums'>
                {words.tabCount(menuTotals.checked, menuTotals.total)}
              </span>
            </TabsTrigger>
            <TabsTrigger value='objects' className='flex-none px-1'>
              {`② ${words.objectsTab}`}
              <span className='text-xs font-normal text-muted-foreground tabular-nums'>
                {words.tabCount(objectTotals.enabled, objectTotals.total)}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      {tab === 'menus' ? menusPanel : objectsPanel}
      {footerBar}
    </div>
  );
}
