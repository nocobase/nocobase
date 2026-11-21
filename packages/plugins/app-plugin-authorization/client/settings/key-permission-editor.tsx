/**
 * The permission table of a credential such as an API key: the role editor's Business data and System settings tabs,
 * limited to what the person giving it holds. It lists only resources and actions they hold, says which actions of a
 * listed object they do not hold, greys out actions only a person may take with the reason, and offers only record
 * scopes no wider than theirs. Page access belongs to roles and is not shown. Read-only, it shows a key's permissions,
 * the ones the key lost with its holder struck through.
 */
import { useClientApplication } from '@nocobase/app-client';
import { NamespaceScope, useTranslation } from '@nocobase/i18n/client';
import { useMemo, type ReactElement, type ReactNode } from 'react';

import {
  PermissionEditor,
  type PermissionAction,
  type PermissionObject,
  type PermissionScopeSlot,
  type PermissionSettingsPage,
  type PermissionValue,
} from '#components/permission-editor';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import type {
  AuthorizationOptionsResponse,
  LocalizedText,
  PermissionGrant,
} from '../authorization-client.js';
import { useSettingsData } from './hooks.js';
import { usePermissionEditorLabels } from './permission-editor-labels.js';
import { permissionWorkspace } from './permission-workspace.js';
import {
  draftFromGrants,
  grantsFromDraft,
  NO_SCOPE,
  type PermissionBinding,
  type PermissionWorkspace,
} from './permissions-model.js';
import { SettingsError, SettingsLoading } from './shared.js';
import { useAuthorizationSettings } from './use-authorization-settings.js';

/** One action the person giving a key holds, as `GET /api/apiKeys/grantable` lists it. */
export interface KeyPermissionCeilingAction {
  readonly action: string;
  /** Why no key may hold it; set, the action shows greyed out as a person's only. */
  readonly humanOnly: LocalizedText | null;
  /** The record access keys each data scope is held at; absent when every scope is open. */
  readonly scopes?: Readonly<Record<string, readonly string[]>>;
}

/** What the person giving a key holds: every action when `unrestricted`, otherwise `grants`. */
export interface KeyPermissionCeiling {
  readonly unrestricted: boolean;
  readonly grants: readonly {
    readonly resource: { readonly type: string; readonly id: string };
    readonly actions: readonly KeyPermissionCeilingAction[];
  }[];
}

export interface KeyPermissionEditorProps {
  /** The key's grants, as a Permission Set stores them. */
  readonly value: readonly PermissionGrant[];
  readonly onChange?: (grants: readonly PermissionGrant[]) => void;
  /** What the person giving the key holds; required unless `readOnly`. */
  readonly ceiling?: KeyPermissionCeiling;
  readonly readOnly?: boolean;
  /** The key's grants its holder no longer holds: shown struck through. */
  readonly lapsed?: readonly PermissionGrant[];
  /** Shown above the tabs, such as templates and quick settings. */
  readonly header?: ReactNode;
  /** A control under a business object's actions, such as the records a key is limited to, by its resource. */
  readonly objectExtra?: (resource: {
    readonly type: string;
    readonly id: string;
  }) => ReactNode;
  readonly className?: string;
}

const resourceKey = (resource: { type: string; id: string }): string =>
  `${resource.type}:${resource.id}`;

const ALL_RECORDS = 'allRecords';

function grantKeys(
  grants: readonly PermissionGrant[] | undefined,
): ReadonlySet<string> {
  return new Set(
    (grants ?? []).flatMap((grant) =>
      grant.actions.map(
        (entry) => `${resourceKey(grant.resource)}/${entry.action}`,
      ),
    ),
  );
}

/** A scope slot with the options wider than what is held disabled, and a default that is not one of them. */
function narrowSlot(
  slot: PermissionScopeSlot,
  held: readonly string[] | undefined,
): PermissionScopeSlot {
  if (!held || held.includes(ALL_RECORDS) || !slot.options) return slot;
  const allowed = (value: string): boolean =>
    value === NO_SCOPE || held.includes(value);
  const options = slot.options.map((option) =>
    allowed(option.value) ? option : { ...option, disabled: true },
  );
  const fallback = options.find((option) => !option.disabled)?.value;
  return {
    ...slot,
    options,
    ...(slot.defaultValue !== undefined &&
    !allowed(slot.defaultValue) &&
    fallback !== undefined
      ? { defaultValue: fallback }
      : {}),
  };
}

/** The workspace's objects and settings pages limited to what may be shown, with the actions marked. */
function keyWorkspace(
  workspace: PermissionWorkspace,
  options: {
    readonly ceiling: KeyPermissionCeiling | undefined;
    readonly shown: ReadonlySet<string> | undefined;
    readonly lapsed: ReadonlySet<string>;
    readonly text: (value: LocalizedText) => string;
    readonly missing: (actions: readonly string[]) => string;
  },
): {
  readonly objects: readonly PermissionObject[];
  readonly settings: readonly PermissionSettingsPage[];
} {
  const held = new Map<string, KeyPermissionCeilingAction>();
  for (const grant of options.ceiling?.grants ?? [])
    for (const action of grant.actions)
      held.set(`${resourceKey(grant.resource)}/${action.action}`, action);
  const bindingOf = (action: PermissionAction): PermissionBinding | undefined =>
    workspace.bindings.get(action.id);
  const limit = (object: PermissionObject): PermissionObject | undefined => {
    const missing: string[] = [];
    const actions = object.actions.flatMap((action): PermissionAction[] => {
      const binding = bindingOf(action);
      if (!binding) return [];
      const key = `${resourceKey(binding.resource)}/${binding.action}`;
      // Read-only, a key shows the actions it has.
      if (options.shown) {
        if (!options.shown.has(key)) return [];
        return [options.lapsed.has(key) ? { ...action, lapsed: true } : action];
      }
      const entry = held.get(key);
      if (!entry && !options.ceiling?.unrestricted) {
        missing.push(action.label);
        return [];
      }
      if (entry?.humanOnly)
        return [
          {
            ...action,
            managed: true,
            humanOnly: options.text(entry.humanOnly),
          },
        ];
      return [
        action.scopes
          ? {
              ...action,
              scopes: action.scopes.map((slot) =>
                narrowSlot(slot, entry?.scopes?.[slot.id]),
              ),
            }
          : action,
      ];
    });
    if (!actions.length) return undefined;
    return {
      ...object,
      actions,
      ...(missing.length ? { footnote: options.missing(missing) } : {}),
    };
  };
  const objects = workspace.objects.flatMap((object) => {
    const kept = limit(object);
    return kept ? [kept] : [];
  });
  const settings = workspace.settings.flatMap((page) => {
    const kept = page.objects.flatMap((object) => {
      const limited = limit(object);
      return limited ? [limited] : [];
    });
    return kept.length ? [{ ...page, objects: kept }] : [];
  });
  return { objects, settings };
}

/**
 * Renders in this plugin's translations wherever it is placed, such as on a page of the API keys plugin; what a host
 * passes in (`header`, `objectExtra`) names its own namespace.
 */
export function KeyPermissionEditor(
  props: KeyPermissionEditorProps,
): ReactElement {
  return (
    <NamespaceScope ns={AUTHORIZATION_NAMESPACE}>
      <KeyPermissionTable {...props} />
    </NamespaceScope>
  );
}

function KeyPermissionTable({
  value,
  onChange,
  ceiling,
  readOnly = false,
  lapsed,
  header,
  objectExtra,
  className,
}: KeyPermissionEditorProps): ReactElement {
  const { t } = useTranslation();
  const app = useClientApplication();
  const settings = useAuthorizationSettings();
  const labels = usePermissionEditorLabels();
  const include = useMemo(
    () => [
      ...new Set((lapsed ?? []).map((grant) => resourceKey(grant.resource))),
    ],
    [lapsed],
  );
  const query = include.length
    ? `?${include.map((key) => `include=${encodeURIComponent(key)}`).join('&')}`
    : '';
  const options = useSettingsData<{ data: AuthorizationOptionsResponse }>(
    `authorization/permissionSets/grantableOptions${query}`,
  );
  const text = useMemo(
    () =>
      (item: LocalizedText): string =>
        typeof item === 'string'
          ? item
          : t(item.key, {
              ns: item.ns,
              defaultValue: item.defaultValue ?? item.key,
            }),
    [t],
  );
  const workspace = useMemo(
    () =>
      options.data
        ? permissionWorkspace(
            options.data.data,
            settings.pageCatalog(app.runtime.routes),
            settings.pageTitles,
            { text, t: (key, values) => t(key, values) },
            settings.workspace,
          )
        : undefined,
    [options.data, app, settings, t, text],
  );
  const shownKeys = useMemo(
    () => (readOnly ? grantKeys([...value, ...(lapsed ?? [])]) : undefined),
    [readOnly, value, lapsed],
  );
  const lapsedKeys = useMemo(() => grantKeys(lapsed), [lapsed]);
  const limited = useMemo(
    () =>
      workspace
        ? keyWorkspace(workspace, {
            ceiling,
            shown: shownKeys,
            lapsed: lapsedKeys,
            text,
            missing: (actions) =>
              t('settings.keyPermissions.missing', {
                actions: new Intl.ListFormat(undefined, {
                  type: 'conjunction',
                }).format(actions),
              }),
          })
        : undefined,
    [workspace, ceiling, shownKeys, lapsedKeys, text, t],
  );
  const shownGrants = useMemo(
    () => (readOnly ? [...value, ...(lapsed ?? [])] : value),
    [readOnly, value, lapsed],
  );
  const draft = useMemo(
    () => (workspace ? draftFromGrants(shownGrants, workspace) : undefined),
    [workspace, shownGrants],
  );
  const objects = useMemo(
    () =>
      limited && objectExtra
        ? limited.objects.map((object) => {
            const binding = object.actions
              .map((action) => workspace?.bindings.get(action.id))
              .find(Boolean);
            const extra = binding ? objectExtra(binding.resource) : undefined;
            return extra
              ? {
                  ...object,
                  footnote: (
                    <>
                      {extra}
                      {object.footnote ? (
                        <span className='block'>{object.footnote}</span>
                      ) : null}
                    </>
                  ),
                }
              : object;
          })
        : limited?.objects,
    [limited, objectExtra, workspace],
  );

  if (options.error) return <SettingsError error={options.error} />;
  if (!workspace || !limited || !draft || !objects) return <SettingsLoading />;

  const change = (next: PermissionValue): void => {
    if (readOnly || !onChange) return;
    onChange(grantsFromDraft(next, draft.filters, value, workspace));
  };

  return (
    <PermissionEditor
      menus={[]}
      objects={objects}
      settings={limited.settings}
      value={draft.draft}
      onChange={change}
      readOnly={readOnly}
      builtInTabs={['objects', 'settings']}
      defaultTab='objects'
      header={header}
      labels={labels}
      {...(className ? { className } : {})}
    />
  );
}

export default KeyPermissionEditor;
