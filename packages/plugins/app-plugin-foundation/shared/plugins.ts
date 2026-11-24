import type {
  PluginRegistrationIssueCode,
  PluginRegistrationStateName,
} from '@nocobase/app-server/plugins';

/**
 * Text a plugin declares in its `package.json` under `nocobase`: one string, or one per locale
 * (`{ "en-US": "Mail", "zh-CN": "邮件" }`).
 */
export type FoundationLocalizedText = string | Readonly<Record<string, string>>;

/** What a plugin's `package.json` declares under `nocobase` for people to read. */
export interface FoundationPluginMetadata {
  readonly title?: FoundationLocalizedText;
  readonly description?: FoundationLocalizedText;
  readonly docs?: FoundationLocalizedText;
}

/** One plugin the application declares or registers, as `GET /api/foundation/plugins` returns it. */
export interface FoundationPluginView extends FoundationPluginMetadata {
  readonly packageName: string;
  /** The name `pnpm nocobase plugin …` takes: the short name of an official plugin, the package name otherwise. */
  readonly name: string;
  /** The installed version in the source project or deployment, when available. */
  readonly version?: string;
  readonly dependencyField?: 'dependencies' | 'devDependencies';
  /** Whether the running application registers it. */
  readonly enabled: boolean;
  /** The same state `pnpm nocobase plugin inspect` reports. */
  readonly state: PluginRegistrationStateName;
  readonly skillsOnly: boolean;
  /**
   * Only the application's CLI could register it, and this deployment was built before `pnpm build` recorded what
   * the CLI registers, so whether it is enabled cannot be told until the application is rebuilt.
   */
  readonly registrationUnknown: boolean;
  readonly issues: readonly PluginRegistrationIssueCode[];
  /** The application plugins this one builds on: the `app-plugin-*` and `app-portal-*` packages among its `peerDependencies`. */
  readonly requires: readonly string[];
  /** Those of `requires` its manifest marks optional: it starts without them and loses only the features that need them. */
  readonly optionalRequires: readonly string[];
  /**
   * Those of `requires` the application has not enabled. For a plugin that is enabled, only those it cannot work
   * without; the ones its manifest marks optional are left out. One whose registration cannot be told
   * (`registrationUnknown`) is not counted as missing.
   */
  readonly missingRequires: readonly string[];
}

export interface FoundationPluginsMeta {
  /** The application runs from a build (`pnpm build`), which installs only `dependencies`. */
  readonly deployed: boolean;
}

/**
 * Whether a name is an application plugin or portal package, official or third-party: the same rule
 * `pnpm nocobase plugin` applies (`isPluginPackageName` in `@nocobase/app-cli`), so the page lists exactly the packages
 * the command line accepts.
 */
export function isPluginPackageName(packageName: string): boolean {
  return /^@[a-z0-9][a-z0-9-]*\/app-(?:plugin|portal)-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(
    packageName,
  );
}

const OFFICIAL_PREFIX = '@nocobase/app-plugin-';

/** The name `pnpm nocobase plugin register` accepts, the same short name `plugin inspect` uses. */
export function pluginCommandName(packageName: string): string {
  return packageName.startsWith(OFFICIAL_PREFIX)
    ? packageName.slice(OFFICIAL_PREFIX.length)
    : packageName;
}
