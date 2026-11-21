import type { PermissionWorkspaceSelection } from '@nocobase/app-plugin-authorization/client/settings';

/**
 * Configure this selection whenever the app adds a business feature. Give each action a localized description,
 * map each page's primary and related objects, and name additional scope slots with registered collection titles.
 * The authorization plugin reads it through its `workspace` option in `client/plugins.ts`; see
 * .agents/skills/nocobase-app-development/references/authorization.md for the role editor example.
 */
export const permissionWorkspaceSelection: PermissionWorkspaceSelection = {
  business: [],
};
