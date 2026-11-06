export const PACKAGE_PREFIX = '@nocobase/app-plugin-';
export const DIRECTORY_PREFIX = 'app-plugin-';

const pluginNamePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const MAX_SKILL_NAME_LENGTH = 64;

export interface PluginNames {
  readonly collectionName: string;
  readonly directoryName: string;
  readonly moduleName: string;
  readonly packageName: string;
  readonly shortName: string;
  readonly symbolName: string;
}

export function normalizePluginName(value: string | undefined): string {
  if (typeof value !== 'string') {
    throw new Error('A plugin name is required.');
  }

  let shortName = value.trim();
  const scoped = /^@[a-z0-9][a-z0-9-]*\/app-plugin-(.+)$/u.exec(shortName);
  if (scoped) {
    shortName = scoped[1]!;
  } else if (shortName.startsWith(DIRECTORY_PREFIX)) {
    shortName = shortName.slice(DIRECTORY_PREFIX.length);
  }

  if (!pluginNamePattern.test(shortName)) {
    throw new Error(
      'Plugin name must start with a lowercase letter and contain only lowercase letters, numbers, and single hyphens.',
    );
  }
  const skillName = scoped
    ? value.trim().slice(1).replace('/', '-')
    : `nocobase-app-plugin-${shortName}`;
  if (skillName.length > MAX_SKILL_NAME_LENGTH) {
    throw new Error(
      `Plugin name is too long: the generated Agent Skill name must not exceed ${MAX_SKILL_NAME_LENGTH} characters.`,
    );
  }

  return shortName;
}

export function toTitleCase(value: string): string {
  return value
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function toPascalCase(value: string): string {
  return value
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
}

export function createPluginNames(value: string): PluginNames {
  const shortName = normalizePluginName(value);
  const symbolName = toPascalCase(shortName);

  return {
    collectionName: `appPlugin${symbolName}Records`,
    directoryName: `${DIRECTORY_PREFIX}${shortName}`,
    moduleName: symbolName[0].toLowerCase() + symbolName.slice(1),
    packageName: value.trim().startsWith('@')
      ? value.trim()
      : `${PACKAGE_PREFIX}${shortName}`,
    shortName,
    symbolName,
  };
}
