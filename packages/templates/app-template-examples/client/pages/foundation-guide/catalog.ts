import applicationManifest from '../../../package.json';
import { additionalPlugins } from './plugin-catalog.js';

export type PackageKind = 'kernel' | 'plugins';
export type GuideFilter = 'all' | PackageKind;
export interface GuideSearchContext {
  readonly query: string;
  readonly setQuery: (query: string) => void;
}
export interface GuidePackage {
  readonly id: string;
  readonly kind: PackageKind;
  readonly group: string;
  readonly name: string;
  readonly path?: string;
  readonly docs?: string;
  readonly related: readonly string[];
  readonly demo?: string;
  readonly category?: 'example' | 'skill';
  readonly copyKey?: string;
  readonly core?: {
    readonly name: string;
    readonly docs: string;
  };
}

// Source links point to the revision used to prepare this preview's guide.
export const SOURCE_REVISION = 'faa534fc574e203f9c2b8a6b9b139b9baa6b1d06';
export const sourceUrl = (path: string): string =>
  `https://github.com/nocobase/nocobase/blob/${SOURCE_REVISION}/${path}`;
const packageGuides: readonly GuidePackage[] = [
  {
    id: 'db',
    kind: 'kernel',
    group: 'data',
    name: '@nocobase/db',
    path: 'packages/libs/db',
    docs: 'packages/libs/db/skills/nocobase-db/SKILL.md',
    related: ['app-plugin-file'],
  },
  {
    id: 'lifecycle',
    kind: 'kernel',
    group: 'automation',
    name: '@nocobase/lifecycle',
    path: 'packages/libs/lifecycle',
    docs: 'packages/libs/lifecycle/README.md',
    related: ['db', 'jobs', 'app-plugin-scheduler'],
    demo: '/lifecycle-example/tickets',
  },
  {
    id: 'jobs',
    kind: 'kernel',
    group: 'automation',
    name: '@nocobase/jobs',
    path: 'packages/libs/jobs',
    docs: 'packages/libs/jobs/README.md',
    related: ['lifecycle', 'app-plugin-scheduler'],
    demo: '/jobs-example/jobs',
  },
  {
    id: 'queue',
    kind: 'kernel',
    group: 'automation',
    name: '@nocobase/queue',
    path: 'packages/libs/queue',
    docs: 'packages/libs/queue/README.md',
    related: ['jobs'],
  },
  {
    id: 'concurrency',
    kind: 'kernel',
    group: 'automation',
    name: '@nocobase/concurrency',
    path: 'packages/libs/concurrency',
    docs: 'packages/libs/concurrency/README.md',
    related: ['jobs'],
  },
  {
    id: 'realtime',
    kind: 'kernel',
    group: 'interface',
    name: '@nocobase/realtime',
    path: 'packages/libs/realtime',
    docs: 'packages/libs/realtime/README.md',
    related: [],
  },
  {
    id: 'i18n',
    kind: 'kernel',
    group: 'interface',
    name: '@nocobase/i18n',
    path: 'packages/libs/i18n',
    docs: 'packages/libs/i18n/README.md',
    related: [],
  },
  {
    id: 'app-plugin-file',
    kind: 'plugins',
    group: 'data',
    name: '@nocobase/app-plugin-file',
    path: 'packages/plugins/app-plugin-file',
    docs: 'packages/plugins/app-plugin-file/README.md',
    core: {
      name: '@nocobase/drive',
      docs: 'packages/libs/drive/skills/nocobase-drive/SKILL.md',
    },
    related: ['db', 'app-plugin-file-example'],
    demo: '/file-repository',
  },
  {
    id: 'app-plugin-authentication',
    kind: 'plugins',
    group: 'security',
    name: '@nocobase/app-plugin-authentication',
    path: 'packages/plugins/app-plugin-authentication',
    docs: 'packages/plugins/app-plugin-authentication/skills/nocobase-app-plugin-authentication/SKILL.md',
    related: ['app-plugin-users', 'app-plugin-authorization'],
  },
  {
    id: 'app-plugin-users',
    kind: 'plugins',
    group: 'security',
    name: '@nocobase/app-plugin-users',
    path: 'packages/plugins/app-plugin-users',
    docs: 'packages/plugins/app-plugin-users/README.md',
    related: ['app-plugin-authentication', 'app-plugin-authorization'],
  },
  {
    id: 'app-plugin-authorization',
    kind: 'plugins',
    group: 'security',
    name: '@nocobase/app-plugin-authorization',
    path: 'packages/plugins/app-plugin-authorization',
    docs: 'packages/plugins/app-plugin-authorization/README.md',
    core: {
      name: '@nocobase/authorization',
      docs: 'packages/libs/authorization/README.md',
    },
    related: [
      'app-plugin-authentication',
      'app-plugin-authorization-example',
      'app-plugin-authz-default-access',
      'app-plugin-authz-sharing-rules',
      'app-plugin-authz-restriction-rules',
    ],
  },
  {
    id: 'app-plugin-mail',
    kind: 'plugins',
    group: 'integration',
    name: '@nocobase/app-plugin-mail',
    path: 'packages/plugins/app-plugin-mail',
    docs: 'packages/plugins/app-plugin-mail/README.md',
    related: ['app-plugin-authentication', 'app-plugin-file'],
  },
  {
    id: 'app-plugin-notification',
    kind: 'plugins',
    group: 'integration',
    name: '@nocobase/app-plugin-notification',
    path: 'packages/plugins/app-plugin-notification',
    docs: 'packages/plugins/app-plugin-notification/README.md',
    related: ['jobs', 'app-plugin-authentication'],
    demo: '/notification-example',
  },
  {
    id: 'app-plugin-knowledge',
    kind: 'plugins',
    group: 'intelligence',
    name: '@nocobase/app-plugin-knowledge',
    path: 'packages/plugins/app-plugin-knowledge',
    docs: 'packages/plugins/app-plugin-knowledge/README.md',
    related: ['app-plugin-file', 'app-plugin-agents'],
    demo: '/knowledge',
  },
  {
    id: 'app-plugin-agents',
    kind: 'plugins',
    group: 'intelligence',
    name: '@nocobase/app-plugin-agents',
    path: 'packages/plugins/app-plugin-agents',
    docs: 'packages/plugins/app-plugin-agents/skills/nocobase-app-plugin-agents/SKILL.md',
    related: ['app-plugin-knowledge', 'app-plugin-authentication'],
    demo: '/agents',
  },
  {
    id: 'app-plugin-api-keys',
    kind: 'plugins',
    group: 'integration',
    name: '@nocobase/app-plugin-api-keys',
    path: 'packages/plugins/app-plugin-api-keys',
    docs: 'packages/plugins/app-plugin-api-keys/README.md',
    related: ['app-plugin-authentication', 'app-plugin-authorization'],
  },
  {
    id: 'app-plugin-scheduler',
    kind: 'plugins',
    group: 'automation',
    name: '@nocobase/app-plugin-scheduler',
    path: 'packages/plugins/app-plugin-scheduler',
    docs: 'packages/plugins/app-plugin-scheduler/README.md',
    related: ['jobs', 'lifecycle'],
  },
];

interface DependencyManifest {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly optionalDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
}

/** Dependency declarations define inclusion; editorial guides only enrich the entries. */
export function createPackageCatalog(
  manifest: DependencyManifest,
): readonly GuidePackage[] {
  const declared = new Set(
    [
      manifest.dependencies,
      manifest.devDependencies,
      manifest.optionalDependencies,
      manifest.peerDependencies,
    ]
      .flatMap((section) => Object.keys(section ?? {}))
      .filter((name) => /^(?:@[^/]+\/)?app-plugin-/.test(name)),
  );
  const guides = [...packageGuides, ...additionalPlugins];
  const known = guides.filter(
    (entry) => entry.kind === 'kernel' || declared.has(entry.name),
  );
  const documented = new Set(known.map((entry) => entry.name));
  return [
    ...known,
    ...[...declared]
      .filter((name) => !documented.has(name))
      .sort()
      .map((name): GuidePackage => ({
        id: name.replaceAll('/', '--'),
        kind: 'plugins',
        group: 'other',
        name,
        copyKey: 'unlistedPlugin',
        related: [],
      })),
  ];
}

export const packages = createPackageCatalog(applicationManifest);
