/**
 * Which Collections the current NocoBase catalog recognizes as system data, by the package that creates them.
 * Remaining Collections are observed data, with no guarantee of business ownership.
 *
 * This is a version adapter: it names the Collections the NocoBase packages of this release create. A package that adds
 * a Collection under a new name must be added here to exclude it from the observed non-catalog statistics.
 */
interface SystemCollectionOwner {
  readonly packageName: string;
  readonly names?: readonly string[];
  /** Matches Collection names by their package's prefix. */
  readonly pattern?: RegExp;
}

const SYSTEM_COLLECTION_OWNERS: readonly SystemCollectionOwner[] = [
  {
    // Better Auth's own tables, under the names it gives them.
    packageName: '@nocobase/app-plugin-authentication',
    names: ['user', 'account', 'session', 'verification', 'deviceCode', 'jwks'],
  },
  {
    packageName: '@nocobase/app-plugin-api-keys',
    names: ['apikey'],
  },
  {
    packageName: '@nocobase/app-plugin-users',
    names: ['userInvitations', 'userPreferences'],
  },
  {
    packageName: '@nocobase/app-plugin-authorization',
    pattern: /^authorization[A-Z]/,
  },
  { packageName: '@nocobase/app-plugin-mail', pattern: /^mail[A-Z]/ },
  {
    packageName: '@nocobase/app-plugin-notification',
    pattern: /^notification[A-Z]/,
  },
  { packageName: '@nocobase/app-plugin-scheduler', pattern: /^schedule[A-Z]/ },
  {
    // The library ships no migration: the application that runs lifecycles creates these two under these names.
    packageName: '@nocobase/lifecycle',
    names: ['lifecycleTransitions', 'lifecycleEffectRuns'],
  },
  { packageName: '@nocobase/app-plugin-agents', pattern: /^ag[A-Z]/ },
  {
    packageName: '@nocobase/app-plugin-agent-sessions',
    pattern: /^agentSession/,
  },
  { packageName: '@nocobase/app-plugin-knowledge', pattern: /^kb[A-Z]/ },
  { packageName: '@nocobase/app-plugin-projects', pattern: /^pm[A-Z]/ },
  { packageName: '@nocobase/app-plugin-releases', pattern: /^rel[A-Z]/ },
];

/** The NocoBase package that keeps a Collection, or `undefined` when its ownership is not classified here. */
export function systemCollectionOwner(name: string): string | undefined {
  return SYSTEM_COLLECTION_OWNERS.find(
    (owner) =>
      owner.names?.includes(name) === true ||
      owner.pattern?.test(name) === true,
  )?.packageName;
}
