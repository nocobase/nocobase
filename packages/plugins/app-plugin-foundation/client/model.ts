import {
  pluginCommandName,
  type FoundationLocalizedText,
  type FoundationPluginView,
} from '../shared/plugins.js';

/** Why a plugin is listed first, in words a person can act on. */
export type PluginAttention =
  | { readonly kind: 'partial' }
  | { readonly kind: 'devDependency' }
  | { readonly kind: 'missingRequires'; readonly packages: readonly string[] }
  | { readonly kind: 'other' };

export type PluginStatus =
  | 'enabled'
  | 'skillsOnly'
  | 'enabledAttention'
  | 'disabled'
  | 'disabledAttention'
  /** Only the CLI could register it, and this deployment was built before it recorded what the CLI registers. */
  | 'unknown';

export interface PluginRow {
  readonly plugin: FoundationPluginView;
  /** The plugin's own title in the current language, or its short name. */
  readonly title: string;
  readonly description?: string;
  readonly enabled: boolean;
  readonly status: PluginStatus;
  readonly attention: readonly PluginAttention[];
}

/**
 * Picks the text for `locale` from what a plugin declares: the exact locale, then the same language in another
 * region, then English, then whatever there is.
 */
export function localize(
  text: FoundationLocalizedText | undefined,
  locale: string,
): string | undefined {
  if (text === undefined || typeof text === 'string') return text;
  const language = locale.split('-')[0];
  return (
    text[locale] ??
    Object.entries(text).find(([key]) => key.split('-')[0] === language)?.[1] ??
    text['en-US'] ??
    text.en ??
    Object.values(text)[0]
  );
}

function attentionOf(plugin: FoundationPluginView): PluginAttention[] {
  const reasons: PluginAttention[] = [];
  if (plugin.issues.includes('PARTIALLY_REGISTERED'))
    reasons.push({ kind: 'partial' });
  if (plugin.issues.includes('REGISTERED_DEV_DEPENDENCY'))
    reasons.push({ kind: 'devDependency' });
  if (
    plugin.issues.some(
      (code) =>
        code !== 'PARTIALLY_REGISTERED' && code !== 'REGISTERED_DEV_DEPENDENCY',
    )
  )
    reasons.push({ kind: 'other' });
  // A plugin that is not enabled lists what it needs as the first step of enabling it, not as a problem.
  if (plugin.enabled && plugin.missingRequires.length > 0)
    reasons.push({ kind: 'missingRequires', packages: plugin.missingRequires });
  return reasons;
}

function statusOf(
  plugin: FoundationPluginView,
  attention: readonly PluginAttention[],
): PluginStatus {
  if (plugin.enabled)
    return attention.length > 0
      ? 'enabledAttention'
      : plugin.skillsOnly
        ? 'skillsOnly'
        : 'enabled';
  if (attention.length > 0) return 'disabledAttention';
  if (plugin.registrationUnknown) return 'unknown';
  return 'disabled';
}

/** The rows in display order: enabled plugins, then the others, each with the ones needing attention first. */
export function pluginRows(
  plugins: readonly FoundationPluginView[],
  locale: string,
): PluginRow[] {
  const rows = plugins.map((plugin): PluginRow => {
    const attention = attentionOf(plugin);
    const description = localize(plugin.description, locale);
    return {
      plugin,
      title: localize(plugin.title, locale) ?? plugin.name,
      ...(description ? { description } : {}),
      enabled: plugin.enabled,
      status: statusOf(plugin, attention),
      attention,
    };
  });
  const rank = (row: PluginRow) =>
    (row.enabled ? 0 : 2) + (row.attention.length > 0 ? 0 : 1);
  return rows
    .map((row, index) => ({ row, index }))
    .sort(
      (left, right) =>
        rank(left.row) - rank(right.row) || left.index - right.index,
    )
    .map(({ row }) => row);
}

/** A plugin's title as the list shows it, also for a plugin the list does not hold. */
export function titleOf(
  packageName: string,
  rows: readonly PluginRow[],
): string {
  return (
    rows.find((row) => row.plugin.packageName === packageName)?.title ??
    pluginCommandName(packageName)
  );
}

/**
 * The plugins `plugin register` has to name to enable `row`: the plugins it needs that are not enabled, each after
 * the ones it needs in turn, and the plugin itself last.
 */
export function registrationOrder(
  row: PluginRow,
  rows: readonly PluginRow[],
): string[] {
  const byPackage = new Map(
    rows.map((item) => [item.plugin.packageName, item]),
  );
  const order: string[] = [];
  const visiting = new Set<string>();
  const visit = (packageName: string) => {
    if (order.includes(packageName) || visiting.has(packageName)) return;
    visiting.add(packageName);
    for (const required of byPackage.get(packageName)?.plugin.missingRequires ??
      [])
      visit(required);
    order.push(packageName);
  };
  visit(row.plugin.packageName);
  return order;
}

/** `pnpm nocobase plugin register …` for the packages given, in that order. */
export function registerCommand(packages: readonly string[]): string {
  return `pnpm nocobase plugin register ${packages.map(pluginCommandName).join(' ')}`;
}

/**
 * The enabled plugins that build on `row`: `required` ones cannot start without it and have to be disabled with it;
 * `optional` ones keep working without it and only lose the features that need it.
 */
export function dependentsOf(
  row: PluginRow,
  rows: readonly PluginRow[],
): { readonly required: PluginRow[]; readonly optional: PluginRow[] } {
  const { packageName } = row.plugin;
  const dependents = rows.filter(
    (item) => item.enabled && item.plugin.requires.includes(packageName),
  );
  return {
    required: dependents.filter(
      (item) => !item.plugin.optionalRequires.includes(packageName),
    ),
    optional: dependents.filter((item) =>
      item.plugin.optionalRequires.includes(packageName),
    ),
  };
}

/** Whether a row matches the search text, by title or package name. */
export function matchesSearch(row: PluginRow, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [row.title, row.plugin.packageName, row.plugin.name].some((value) =>
    value.toLowerCase().includes(needle),
  );
}
