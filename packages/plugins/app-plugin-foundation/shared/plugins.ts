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
  /** The installed version, absent when the package does not resolve. */
  readonly version?: string;
  readonly dependencyField?: 'dependencies' | 'devDependencies';
  /** Whether the running application registers it. */
  readonly enabled: boolean;
  /** The same state `pnpm nocobase plugin inspect` reports. */
  readonly state: PluginRegistrationStateName;
  readonly skillsOnly: boolean;
  readonly issues: readonly PluginRegistrationIssueCode[];
  /** The application plugins this one builds on, from its required `peerDependencies`. */
  readonly requires: readonly string[];
  /** Those of `requires` the application has not enabled. */
  readonly missingRequires: readonly string[];
}

export interface FoundationPluginsMeta {
  /** The application runs from a build (`pnpm build`), which installs only `dependencies`. */
  readonly deployed: boolean;
}

/** Package names the plugins page lists: official and third-party application plugins and portals. */
export const PLUGIN_PACKAGE_PATTERN: RegExp =
  /^(@[^/]+\/)?app-(plugin|portal)-/;

const OFFICIAL_PREFIX = '@nocobase/app-plugin-';

/** The name `pnpm nocobase plugin register` accepts, the same short name `plugin inspect` uses. */
export function pluginCommandName(packageName: string): string {
  return packageName.startsWith(OFFICIAL_PREFIX)
    ? packageName.slice(OFFICIAL_PREFIX.length)
    : packageName;
}
