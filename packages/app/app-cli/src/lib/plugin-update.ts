// Upgrades plugin packages and re-synchronizes the skills they ship.
//
// Skills are copied into the application rather than resolved from
// node_modules at run time, so an upgraded plugin leaves a stale copy behind
// until something re-runs the sync. Tying the two together means the upgrade
// path has no second step to forget.

import { detectPackageManager } from './package-manager.ts';
import { readAppPackage, resolveRegisteredPluginNames } from './skills-sync.ts';

export interface PluginUpdatePlan {
  readonly packageNames: readonly string[];
  readonly packageManager: string;
  readonly args: readonly string[];
}

const PACKAGE_SCOPE = '@nocobase/';
const PLUGIN_PREFIX = `${PACKAGE_SCOPE}app-plugin-`;

/**
 * Expands what the user typed into full package names. A short name is the
 * common case (`audit-log`), but a full package name has to keep working
 * because that is what the registry and error messages show.
 */
export function normalizePluginPackageNames(
  plugins: readonly string[],
): string[] {
  return plugins.map((plugin) => {
    const name = plugin.trim();
    if (name === '') {
      throw new Error('A plugin name cannot be empty.');
    }
    if (
      name.startsWith(PACKAGE_SCOPE) ||
      /^@[a-z0-9][a-z0-9-]*\/app-plugin-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name)
    ) {
      return name;
    }
    if (name.includes('/')) {
      throw new Error(
        `Plugin "${name}" must be a short name such as audit-log, or a full ${PLUGIN_PREFIX}* package name.`,
      );
    }
    return `${PLUGIN_PREFIX}${name}`;
  });
}

/**
 * Decides which packages to upgrade and how to invoke the package manager.
 * Without an explicit list every registered plugin is upgraded, which is what
 * "update my plugins" means when no plugin is named.
 */
export async function planPluginUpdate({
  appRoot,
  plugins = [],
}: {
  appRoot: string;
  plugins?: readonly string[];
}): Promise<PluginUpdatePlan> {
  const applicationPackage = await readAppPackage(appRoot);
  const registered = await resolveRegisteredPluginNames(appRoot);

  const packageNames =
    plugins.length > 0 ? normalizePluginPackageNames(plugins) : registered;

  if (packageNames.length === 0) {
    return { args: [], packageManager: '', packageNames: [] };
  }

  const unregistered = packageNames.filter(
    (packageName) => !registered.includes(packageName),
  );
  if (unregistered.length > 0) {
    throw new Error(
      `Not registered in this app: ${unregistered.join(', ')}. Registered plugins are: ${registered.join(', ') || '(none)'}.`,
    );
  }

  const packageManager = await detectPackageManager(
    appRoot,
    typeof applicationPackage.packageManager === 'string'
      ? applicationPackage.packageManager
      : undefined,
  );

  return {
    args: [packageManager === 'yarn' ? 'up' : 'update', ...packageNames],
    packageManager,
    packageNames,
  };
}
