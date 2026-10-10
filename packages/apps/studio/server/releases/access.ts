/**
 * Release management on Studio's roles (`releasesAccessToken`). The plugin declares its pages, settings items and the
 * `rel.apps` actions and registers them with the authorization plugin; Studio's role editor offers them from the catalog
 * (`../access/catalog.ts`), and this port reads them back from a caller's roles:
 *
 * - `permissionsOf` / `permissionsOfUser`: the release part of what the roles give, pages included;
 * - `actorKindOf`: an identity whose principal is an agent (Studio's `agent` kind) is an agent, which the plugin refuses
 *   `deploy-protected`, `configure` and `delete` whatever its grants (CLI runs are built as agents in `caller.ts`);
 *   an identity with a key scope (a scoped API key, an organization's API key) is a key, which the plugin decides itself;
 * - `relatedAppIds` / `isRelated`: the Apps linked to the repositories of projects the users lead or see
 *   (`links.ts`), beyond the ones they created;
 * - `approversOf`: the environment's approvers (`lead`, `admins`, or people by ID, username or email); with none,
 *   the owners and administrators.
 */
import {
  BUSINESS_KEYS,
  PAGES,
  SETTINGS_KEYS,
  type BusinessKey,
  type Page,
  type ReleasesPermissions,
  type Scope,
  type SettingsKey,
} from '@nocobase/app-plugin-releases/shared/access';
import type { ReleasesAccess } from '@nocobase/app-plugin-releases/server/tokens';
import type { DatabaseManager, Row } from '@nocobase/db';

import { APPROVER_ADMINS, APPROVER_LEAD } from '../../shared/releases.js';
import type { RoleGrants } from '../access/grants.js';
import { isRunScope } from '../agents/run-principal.js';
import type { StudioAccess } from '../access/service.js';
import { AGENT_KIND } from '../agents/tx.js';
import type { RepositoryLinks } from './links.js';

/** The release part of what a role gives, its levels resolved (`scopes`, `StudioAccess.resolve`). */
export function releasesPermissionsOf(
  grants: Pick<RoleGrants, 'settings' | 'pages'>,
  resolved: Readonly<Record<string, Scope>>,
): ReleasesPermissions {
  const settings = grants.settings;
  return {
    scopes: Object.fromEntries(
      BUSINESS_KEYS.map(({ key }) => [key, resolved[key] ?? 'none']),
    ) as Record<BusinessKey, Scope>,
    settings: Object.fromEntries(
      SETTINGS_KEYS.map(({ key }) => [key, settings[key] === true]),
    ) as Record<SettingsKey, boolean>,
    pages: Object.fromEntries(
      PAGES.map((page) => [
        page,
        (grants.pages as readonly string[]).includes(page),
      ]),
    ) as Record<Page, boolean>,
  };
}

export interface StudioReleasesAccessOptions {
  readonly access: () => Pick<
    StudioAccess,
    'grantsOf' | 'grantsOfUser' | 'resolve' | 'projects'
  >;
  readonly links: () => RepositoryLinks;
  readonly database: Pick<DatabaseManager, 'connection'>;
}

export function createStudioReleasesAccess(
  options: StudioReleasesAccessOptions,
): ReleasesAccess {
  async function people(refs: readonly string[]): Promise<string[]> {
    if (refs.length === 0) return [];
    const rows = await options.database
      .connection()
      .query.selectFrom('user')
      .select('id')
      .where((eb) =>
        eb.or([
          eb('id', 'in', refs),
          eb(
            'username',
            'in',
            refs.map((ref) => ref.toLowerCase()),
          ),
          eb(
            'email',
            'in',
            refs.map((ref) => ref.toLowerCase()),
          ),
        ]),
      )
      .where('disabledAt', 'is', null)
      .where('deletedAt', 'is', null)
      // Approvers are people: an API key never decides a deployment request.
      .where('kind', '<>', 'service')
      .execute<Row>();
    return rows.map((row) => String(row.id));
  }

  const administrators = () =>
    options
      .access()
      .projects.administrators(options.database.connection())
      .then((ids) => [...ids]);

  async function permissionsOf(
    grants: RoleGrants,
    userId: string,
  ): Promise<ReleasesPermissions> {
    const { scopes } = await options.access().resolve(grants, userId);
    return releasesPermissionsOf(grants, scopes);
  }

  return {
    permissionsOf: async (identity) =>
      permissionsOf(
        await options.access().grantsOf(identity),
        identity.principal.id,
      ),
    permissionsOfUser: async (userId) =>
      permissionsOf(await options.access().grantsOfUser(userId), userId),
    // An agent itself, or an agent's run acting for the person who woke it (its scope says so).
    actorKindOf: (identity) =>
      identity.principal.type === AGENT_KIND || isRunScope(identity.keyScope)
        ? 'agent'
        : 'human',
    relatedAppIds: (userIds, action) =>
      options.links().relatedAppIds(userIds, action),
    isRelated: (appId, userIds, action) =>
      options.links().isRelated(appId, userIds, action),
    async approversOf(environment, request) {
      const refs = environment.approvers
        .map((ref) => ref.trim())
        .filter(Boolean);
      if (refs.length === 0) return administrators();
      const ids = new Set<string>();
      if (refs.includes(APPROVER_LEAD))
        for (const id of await options.links().leadsOf(request.appId))
          ids.add(id);
      if (refs.includes(APPROVER_ADMINS))
        for (const id of await administrators()) ids.add(id);
      for (const id of await people(
        refs.filter((ref) => ref !== APPROVER_LEAD && ref !== APPROVER_ADMINS),
      ))
        ids.add(id);
      return [...ids];
    },
  };
}
