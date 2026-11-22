import type { ComponentType } from 'react';

import type {
  AuthorizationRequirement,
  LocalizedText,
  PermissionGrant,
  PermissionSet,
} from '../authorization-client.js';
import {
  defaultPermissionPageCatalog,
  type PermissionPageCatalogSource,
} from './page-catalog.js';
import type { PagePermissionTitles } from './page-permissions.js';
import type { PermissionWorkspaceSelection } from './workspace-selection.js';

interface RegisteredTab {
  /** Stable within its registry: it names the tab in the page address. */
  readonly key: string;
  readonly title: LocalizedText;
  /** Lower first; tabs of the same order keep registration order. Defaults to 0. */
  readonly order?: number;
}

/**
 * A top tab of the Roles and permissions page. Each one is a System settings page of its own, which its package
 * registers with `defineSystemSettingsRoutes` under the `permissionManagement` module and renders inside
 * `AuthorizationPage`, so a link, Back and a reload keep the tab.
 */
export interface AuthorizationPageTab extends RegisteredTab {
  /** The page's path under the System settings, such as `/roles`. */
  readonly path: string;
  /** What the person needs to see the tab: the page's own `authz`. */
  readonly authz: AuthorizationRequirement;
}

/** What a permission tab edits: a role's permissions, or what an API key may do. */
export type AuthorizationTabTarget = 'role' | 'apiKey';

/** A tab rendered inside another page, loaded only while it is open. */
export interface AuthorizationContentTab<TProps> extends RegisteredTab {
  /** What the person needs to see the tab. Without one the tab shows wherever its page does. */
  readonly authz?: AuthorizationRequirement;
  /**
   * Role tabs only: what the tab shows for, roles unless it says otherwise. A tab for `apiKey` too shows in the
   * permission table of a key, and declares `resourceTypes`.
   */
  readonly targets?: readonly AuthorizationTabTarget[];
  /**
   * Role tabs only: the resource types whose grants the tab edits. It receives them as `value` and gives back their
   * new grants through `onChange`; a role saves them with the rest of its draft, a key holds them like any other.
   */
  readonly resourceTypes?: readonly string[];
  readonly component: () => Promise<{
    readonly default: ComponentType<TProps>;
  }>;
}

/** Ordered tabs by key; adding a key twice is a mistake that names itself. */
export class AuthorizationTabRegistry<TTab extends RegisteredTab> {
  private readonly tabs = new Map<string, TTab>();
  private readonly listeners = new Set<() => void>();
  private snapshot: readonly TTab[] = [];

  public constructor(private readonly label: string) {}

  public add(tab: TTab): () => void {
    if (this.tabs.has(tab.key))
      throw new Error(`The ${this.label} tab "${tab.key}" is added twice.`);
    this.tabs.set(tab.key, tab);
    this.changed();
    return () => {
      if (this.tabs.get(tab.key) !== tab) return;
      this.tabs.delete(tab.key);
      this.changed();
    };
  }

  /** The tabs in display order; the same array until a tab is added or removed, for `useSyncExternalStore`. */
  public list = (): readonly TTab[] => this.snapshot;

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private changed(): void {
    // A stable sort keeps registration order among tabs of the same order.
    this.snapshot = Object.freeze(
      [...this.tabs.values()].sort(
        (left, right) => (left.order ?? 0) - (right.order ?? 0),
      ),
    );
    for (const listener of this.listeners) listener();
  }
}

/**
 * A kind of subject Permission check can check besides a member, such as an API key: the inspector's subject type it
 * stands for (`authz.inspector.identities`) and the picker that chooses one by id.
 */
export interface AuthorizationCheckSubject extends RegisteredTab {
  /** The inspector's subject type, such as `apiKey`. */
  readonly type: string;
  readonly picker: () => Promise<{
    readonly default: ComponentType<AuthorizationCheckSubjectPickerProps>;
  }>;
}

/** What a picker of a kind of subject receives: the chosen id, and a way to choose. */
export interface AuthorizationCheckSubjectPickerProps {
  readonly value: string;
  readonly onChange: (id: string | undefined) => void;
}

/** What a data rule tab receives; it renders one kind of rule, such as sharing rules. */
export type AuthorizationRuleTabProps = Record<string, never>;

/**
 * What a role tab receives. Every tab gets whether it may edit and, when it declares `resourceTypes`, their grants
 * (`value`) and a way to change them (`onChange`): for a role they join its draft and are saved with it; for an API key
 * they are part of what it may do, bounded by `ceiling`, what the person giving the key holds of those types.
 */
export interface AuthorizationRoleTabProps {
  readonly target: AuthorizationTabTarget;
  /** The role being edited; only for a role. */
  readonly permissionSet?: PermissionSet;
  /** Whether the person may change it. */
  readonly editable: boolean;
  /** The grants of the tab's `resourceTypes`. */
  readonly value: readonly PermissionGrant[];
  readonly onChange: (next: readonly PermissionGrant[]) => void;
  /** For an API key, what the person giving it holds of the tab's types: the tab lists no more. Null for a role. */
  readonly ceiling: readonly PermissionGrant[] | null;
}

export interface AuthorizationSettingsOptions {
  /** How the role editor lists the application's pages; the registered routes are read directly without one. */
  readonly pageCatalog?: PermissionPageCatalogSource;
  /** The business objects this application implements and the pages that use them. */
  readonly workspace?: PermissionWorkspaceSelection;
  /** Titles of application pages that declare no navigation or breadcrumb title, by route name. */
  readonly pageTitles?: PagePermissionTitles;
}

/**
 * The Roles and permissions page and its extension points. `pageTabs` are the page's top tabs, `ruleTabs` the kinds
 * of data rules, one per rule plugin, and `roleTabs` the tabs of a role's detail.
 */
export class AuthorizationSettings {
  public readonly pageTabs: AuthorizationTabRegistry<AuthorizationPageTab> =
    new AuthorizationTabRegistry('page');
  public readonly ruleTabs: AuthorizationTabRegistry<
    AuthorizationContentTab<AuthorizationRuleTabProps>
  > = new AuthorizationTabRegistry('data rule');
  public readonly roleTabs: AuthorizationTabRegistry<
    AuthorizationContentTab<AuthorizationRoleTabProps>
  > = new AuthorizationTabRegistry('role');
  /** Kinds of subject Permission check offers besides members, such as API keys. */
  public readonly checkSubjects: AuthorizationTabRegistry<AuthorizationCheckSubject> =
    new AuthorizationTabRegistry('permission check subject');
  public readonly pageCatalog: PermissionPageCatalogSource;
  public readonly workspace: PermissionWorkspaceSelection;
  public readonly pageTitles: PagePermissionTitles;

  public constructor(options: AuthorizationSettingsOptions = {}) {
    this.pageCatalog = options.pageCatalog ?? defaultPermissionPageCatalog;
    this.workspace = options.workspace ?? { business: [] };
    this.pageTitles = options.pageTitles ?? {};
  }
}
