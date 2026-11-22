/**
 * How a plugin stands in an application, decided from facts alone. `plugin inspect` gathers the facts from the
 * application's files and the App Foundation plugins page from the running application; both classify them here, so
 * the command line and the page never disagree about a plugin.
 */

/** The three places a plugin can be wired into an application. */
export interface PluginRegistrationSurfaces {
  readonly client: boolean;
  readonly server: boolean;
  readonly cli: boolean;
}

export interface PluginRegistrationFacts {
  /** Where the application declares the plugin, if it does. */
  readonly dependencyField?: 'dependencies' | 'devDependencies';
  /** Whether the plugin package resolves from the application. */
  readonly installed: boolean;
  /** The entries the plugin package exports (`./client`, `./server`, `./cli`). */
  readonly entries: PluginRegistrationSurfaces;
  /** The composition roots that register the plugin. */
  readonly registered: PluginRegistrationSurfaces;
}

export type PluginRegistrationIssueCode =
  | 'PLUGIN_NOT_INSTALLED'
  | 'DEPENDENCY_MISSING'
  | 'REGISTERED_DEV_DEPENDENCY'
  | 'PARTIALLY_REGISTERED'
  | 'CLIENT_ENTRY_UNEXPECTED'
  | 'SERVER_ENTRY_UNEXPECTED'
  | 'CLI_ENTRY_UNEXPECTED';

export interface PluginRegistrationIssue {
  readonly code: PluginRegistrationIssueCode;
  /** Only errors make the registration `inconsistent`. */
  readonly severity: 'error' | 'warning';
}

export type PluginRegistrationStateName =
  'absent' | 'preinstalled' | 'registered' | 'unregistered' | 'inconsistent';

export interface PluginRegistrationState {
  readonly state: PluginRegistrationStateName;
  /** Whether any composition root registers the plugin. */
  readonly enabled: boolean;
  /**
   * The plugin exports no client, server or CLI entry: it ships only Agent Skills, so nothing ever registers it and
   * the application uses it by declaring it in `dependencies`.
   */
  readonly skillsOnly: boolean;
  readonly issues: readonly PluginRegistrationIssue[];
}

export function classifyPluginRegistration(
  facts: PluginRegistrationFacts,
): PluginRegistrationState {
  const { dependencyField, installed, entries, registered } = facts;
  const enabled = registered.client || registered.server || registered.cli;
  const skillsOnly =
    installed && !entries.client && !entries.server && !entries.cli;
  const issues: PluginRegistrationIssue[] = [];
  const error = (code: PluginRegistrationIssueCode) =>
    issues.push({ code, severity: 'error' });

  if (!installed) error('PLUGIN_NOT_INSTALLED');
  if (!dependencyField) error('DEPENDENCY_MISSING');
  if (enabled && dependencyField === 'devDependencies')
    error('REGISTERED_DEV_DEPENDENCY');
  // A plugin with both a page and an API, registered on one side only: the page opens but its data never loads, or
  // the API serves nobody. Registering it again writes the missing side.
  if (
    entries.client &&
    entries.server &&
    registered.client !== registered.server
  )
    error('PARTIALLY_REGISTERED');
  if (registered.client && !entries.client) error('CLIENT_ENTRY_UNEXPECTED');
  if (registered.server && !entries.server) error('SERVER_ENTRY_UNEXPECTED');
  if (registered.cli && !entries.cli) error('CLI_ENTRY_UNEXPECTED');

  const state: PluginRegistrationStateName =
    !installed && !dependencyField && !enabled
      ? 'absent'
      : issues.some((issue) => issue.severity === 'error')
        ? 'inconsistent'
        : enabled || (skillsOnly && dependencyField === 'dependencies')
          ? 'registered'
          : dependencyField === 'devDependencies'
            ? 'preinstalled'
            : 'unregistered';
  return { state, enabled, skillsOnly, issues };
}
