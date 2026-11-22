import type { LocalizedText } from '../authorization-client.js';
import type { PermissionRisk } from '#components/permission-editor';

/**
 * The business objects an application implements and the pages that use them, which the role editor lists. The
 * application passes it as the plugin's `workspace` option and updates it whenever it adds a business feature: give
 * each action a localized description, map each page's primary and related objects, and name additional scope slots
 * with registered collection titles.
 */
export interface PermissionWorkspaceSelection {
  /**
   * Business objects this application implements: one per resource, set once for every menu that uses it. Objects are
   * grouped by the catalog subsection that registers them unless `group` names another heading.
   */
  readonly business: readonly {
    readonly type: string;
    readonly id: string;
    readonly actions: readonly string[];
    readonly group?: LocalizedText;
    /** The action that reads the records and owns the data scope. Defaults to `view`, else `read`. */
    readonly view?: string;
    readonly actionDescriptions?: Readonly<Record<string, LocalizedText>>;
    /** Risky actions are never turned on automatically. */
    readonly risks?: Readonly<Record<string, PermissionRisk>>;
    /** Actions that must be on first, by action name of the same resource. Defaults to the view action. */
    readonly requires?: Readonly<Record<string, readonly string[]>>;
    /** Display order of record access keys, widest first; the catalog order otherwise. It implies no nesting. */
    readonly scopeOrder?: readonly string[];
    /**
     * Record access keys provably inside another, by the outer key. All records holds every key and every key holds
     * no records; other pairs are unrelated unless listed here, so Edit is never offered a scope View may not cover.
     */
    readonly scopeSubsets?: Readonly<Record<string, readonly string[]>>;
    readonly scopeTitles?: Readonly<Record<string, LocalizedText>>;
    readonly actionScopeTitles?: Readonly<
      Record<string, Readonly<Record<string, LocalizedText>>>
    >;
    /** UI-only omission; registered and stored scope values remain unchanged. */
    readonly hiddenActionScopes?: Readonly<Record<string, readonly string[]>>;
  }[];
  /**
   * The business objects each page uses, by application route name, as `business` ids. They are shown beside the menu
   * for reference and warn when a checked menu's primary object cannot be viewed; they never grant anything. A page
   * whose page resource id equals a business id uses that object as its primary object unless this route has an
   * explicit declaration. An empty declaration opts out of inference.
   */
  readonly pages?: Readonly<
    Record<
      string,
      {
        readonly primary?: readonly string[];
        readonly related?: readonly string[];
      }
    >
  >;
  readonly filterFieldTitles?: Readonly<
    Record<string, Readonly<Record<string, LocalizedText>>>
  >;
}
