import type { ConfigInspectorSnapshot, InspectedSetting } from './snapshot.js';

/** The groups modules are listed in, in order. */
export const MODULE_GROUPS = [
  'basics',
  'accounts',
  'data',
  'storage',
  'apiLogging',
  'scaling',
  'other',
] as const;
export type ModuleGroup = (typeof MODULE_GROUPS)[number];

export interface ModuleDefinition {
  readonly key: string;
  readonly group: Exclude<ModuleGroup, 'other'>;
  /** The paths the module owns, a top-level section or a part of one; the longest match wins. */
  readonly prefixes: readonly string[];
  /** Off until configured: listed as not enabled while every value is a code default. */
  readonly optional?: boolean;
  /** Read only when the application is installed for the first time. */
  readonly firstStartOnly?: boolean;
}

/** The modules with a title and a description of their own; every other section is listed under `other`. */
export const MODULES: readonly ModuleDefinition[] = [
  { key: 'appearance', group: 'basics', prefixes: ['client', 'i18n'] },
  { key: 'access', group: 'basics', prefixes: ['app', 'server', 'spa'] },
  { key: 'mailers', group: 'accounts', prefixes: ['mailers'], optional: true },
  { key: 'notification', group: 'accounts', prefixes: ['notification'] },
  { key: 'auth', group: 'accounts', prefixes: ['auth', 'session'] },
  {
    key: 'initialAdmin',
    group: 'accounts',
    prefixes: ['users.initialAdmin'],
    firstStartOnly: true,
  },
  { key: 'secrets', group: 'accounts', prefixes: ['secrets'] },
  { key: 'mail', group: 'accounts', prefixes: ['mail'] },
  { key: 'database', group: 'data', prefixes: ['database'] },
  { key: 'snowflake', group: 'data', prefixes: ['snowflake'] },
  { key: 'storage', group: 'storage', prefixes: ['storage', 'file', 'drive'] },
  { key: 'logging', group: 'apiLogging', prefixes: ['logging'] },
  { key: 'api', group: 'apiLogging', prefixes: ['api'], optional: true },
  { key: 'jobs', group: 'scaling', prefixes: ['jobs'] },
  { key: 'cache', group: 'scaling', prefixes: ['cache', 'caching'] },
  { key: 'concurrency', group: 'scaling', prefixes: ['concurrency', 'lock'] },
  { key: 'queue', group: 'scaling', prefixes: ['queue'] },
  { key: 'realtime', group: 'scaling', prefixes: ['realtime'] },
];

export interface ModuleView {
  readonly key: string;
  readonly group: ModuleGroup;
  /** A module of {@link MODULES}; otherwise a section listed under its own name. */
  readonly definition?: ModuleDefinition;
  /** The example's comment on a section listed under its own name. */
  readonly comment?: string;
  readonly settings: readonly InspectedSetting[];
  /** Optional and nothing set: not enabled. */
  readonly off: boolean;
  /** No value at all, neither configured nor a code default. */
  readonly empty: boolean;
  readonly customized: number;
  readonly fromEnvironment: number;
  readonly firstStartOnly: boolean;
}

function owner(path: string): { module?: ModuleDefinition; section: string } {
  let best: { module: ModuleDefinition; length: number } | undefined;
  for (const module of MODULES)
    for (const prefix of module.prefixes)
      if (
        (path === prefix || path.startsWith(`${prefix}.`)) &&
        prefix.length > (best?.length ?? -1)
      )
        best = { module, length: prefix.length };
  return { module: best?.module, section: path.split('.')[0] };
}

/** Every module of a snapshot, curated ones first in catalog order, then the other sections in file order. */
export function buildModules(snapshot: ConfigInspectorSnapshot): ModuleView[] {
  const curated = new Map(
    MODULES.map((module) => [module.key, [] as InspectedSetting[]]),
  );
  const other = new Map<string, InspectedSetting[]>();
  for (const section of snapshot.sections)
    if (!MODULES.some((module) => module.prefixes.includes(section.key)))
      other.set(section.key, []);
  for (const setting of snapshot.settings) {
    const { module, section } = owner(setting.path);
    if (module) curated.get(module.key)!.push(setting);
    else {
      const list = other.get(section) ?? [];
      list.push(setting);
      other.set(section, list);
    }
  }
  const view = (
    key: string,
    group: ModuleGroup,
    settings: InspectedSetting[],
    definition?: ModuleDefinition,
  ): ModuleView => {
    const comment = snapshot.sections.find(
      (section) => section.key === key,
    )?.comment;
    return {
      key,
      group,
      ...(definition ? { definition } : {}),
      ...(!definition && comment ? { comment } : {}),
      settings,
      off:
        !!definition?.optional &&
        settings.every((setting) => setting.source === 'default'),
      empty: settings.length === 0,
      customized: settings.filter((setting) => setting.customized).length,
      fromEnvironment: settings.filter(
        (setting) => setting.source === 'environment',
      ).length,
      firstStartOnly:
        !!definition?.firstStartOnly ||
        (settings.length > 0 &&
          settings.every((setting) => setting.firstStartOnly)),
    };
  };
  return [
    ...MODULES.map((module) =>
      view(module.key, module.group, curated.get(module.key)!, module),
    ),
    ...[...other].map(([key, settings]) => view(key, 'other', settings)),
  ];
}

/** Whether a module or one of its settings matches a search, by title, description, path, value or variable. */
export function matchesSearch(
  query: string,
  texts: readonly (string | undefined)[],
): boolean {
  const needle = query.trim().toLowerCase();
  return !needle || texts.some((text) => text?.toLowerCase().includes(needle));
}
