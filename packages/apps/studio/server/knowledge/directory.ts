/**
 * What Studio reads of people and projects for the knowledge base (`KnowledgeDirectory`): a person's knowledge levels from Studio's roles, a
 * project as a person sees it from the projects plugin, the administrators, and the names of people and agents from
 * the projects plugin's kinds. Every read here goes through its own connection: the knowledge base calls it before its
 * transactions, never inside one.
 */
import {
  DomainError,
  type KindRegistry,
  type Projects,
  type ProjectsAccess,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  BUSINESS_KEYS,
  noSettings,
  type BusinessKey,
  type Scope,
} from '@nocobase/app-plugin-projects/shared/access';
import type { DatabaseManager } from '@nocobase/db';

import type { Permissions } from '../../shared/access.js';
import type { PermissionSource } from '../agents/commands/permissions.js';
import type {
  KnowledgeDirectory,
  KnowledgeLevels,
  ProjectFacts,
} from './access.js';
import { NO_LEVELS } from './access.js';

/** A person's knowledge levels, from what their roles give them. */
export function levelsFrom(
  permissions: Pick<Permissions, 'scopes'>,
): KnowledgeLevels {
  const scopes = permissions.scopes as Readonly<Record<string, Scope>>;
  const level = (action: string): Scope =>
    scopes[`kb.knowledge/${action}`] ?? 'none';
  return {
    read: level('read'),
    propose: level('propose'),
    edit: level('edit'),
    manage: level('manage'),
  };
}

/** Sees every project, to name a proposal's space and find its lead whoever asks. */
const EVERY_PROJECT: Viewer = {
  userId: 'studio-knowledge',
  actor: { type: 'system', id: null },
  permissions: {
    scopes: Object.fromEntries(
      BUSINESS_KEYS.map(({ key }) => [key, 'all']),
    ) as Record<BusinessKey, Scope>,
    settings: noSettings(),
  },
};

export interface StudioDirectoryDeps {
  readonly database: Pick<DatabaseManager, 'connection'>;
  readonly projects: () => Pick<Projects, 'projects'>;
  readonly kinds: () => Pick<KindRegistry, 'names'> | undefined;
  readonly access: () => Pick<ProjectsAccess, 'administrators'> | undefined;
  /** What a person may do; nothing without Studio's roles. */
  readonly permissionsOfUser: (
    userId: string,
  ) => Promise<Pick<Permissions, 'scopes'>>;
  readonly permissions: Pick<PermissionSource, 'viewerOf'>;
}

export function createStudioDirectory(
  deps: StudioDirectoryDeps,
): KnowledgeDirectory {
  async function projectAs(
    viewer: Viewer,
    projectId: string,
  ): Promise<ProjectFacts | null> {
    try {
      const project = await deps.projects().projects.get(viewer, projectId);
      return {
        id: project.id,
        name: project.name,
        leadUserId: project.leadUserId,
        memberIds: project.members.map((member) => member.id),
      };
    } catch (error) {
      if (error instanceof DomainError) return null;
      throw error;
    }
  }
  return {
    async levelsOf(userId) {
      try {
        return levelsFrom(await deps.permissionsOfUser(userId));
      } catch {
        return NO_LEVELS;
      }
    },
    async visibleProject(userId, projectId) {
      return projectAs(
        await deps.permissions.viewerOf({
          kind: 'user',
          userId,
          displayName: userId,
        }),
        projectId,
      );
    },
    project: (projectId) => projectAs(EVERY_PROJECT, projectId),
    async administrators() {
      const access = deps.access();
      return access ? access.administrators(deps.database.connection()) : [];
    },
    async names(refs) {
      const kinds = deps.kinds();
      const names = new Map<string, string>();
      if (!kinds) return names;
      const conn = deps.database.connection();
      for (const kind of ['user', 'agent']) {
        const ids = refs
          .filter((ref) => ref.kind === kind)
          .map((ref) => ref.id);
        if (ids.length === 0) continue;
        for (const [id, name] of await kinds.names(conn, kind, ids))
          names.set(`${kind}:${id}`, name);
      }
      return names;
    },
  };
}
