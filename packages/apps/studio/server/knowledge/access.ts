/**
 * Studio's spaces in the knowledge plugin and who may do what in each (`knowledgeAccessToken`), from Studio's roles (the
 * plugin's `kb.knowledge` actions) and the projects plugin's projects:
 *
 * | space     | read                      | propose                      | edit and decide                  | manage                             |
 * | --------- | ------------------------- | ---------------------------- | -------------------------------- | ---------------------------------- |
 * | `system`  | `read` held               | `propose` held               | `edit` all                       | `manage` all                       |
 * | `project` | `read` held, project seen | `propose` held, project seen | `edit` all, or reaching its lead | `manage` all, or reaching its lead |
 *
 * Managing implies editing. Whoever manages a space manages every folder and article in it, whatever their
 * permissions say; below the space, each node's entries name Studio's subjects (`subjects.ts`).
 *
 * A project's space inherits the system's: whoever reads it reads the system documents too, each space checked on its
 * own. An agent never edits or decides (the plugin holds to that too): it reads and proposes within the person who
 * woke it, and only with the actions its agent is configured with (the command gate checks those).
 *
 * The decision cards of a proposal go to the project's lead when they may edit there, and otherwise, as for the
 * system space, to the administrators (`decidersOf`, for the inbox).
 */
import type {
  KnowledgeAccessResolver,
  KnowledgeReader,
} from '@nocobase/app-plugin-knowledge/server/tokens';
import type {
  KnowledgeAccess,
  SpaceRef,
} from '@nocobase/app-plugin-knowledge/shared/knowledge';

import {
  PROJECT_SCOPE,
  SYSTEM_SCOPE,
  SYSTEM_SPACE,
} from '../../shared/knowledge.js';
import { reaches, type Scope } from '../../shared/access.js';

/** What a person's roles give them in the knowledge base, each level resolved to the users it reaches for them. */
export interface KnowledgeLevels {
  readonly read: Scope;
  readonly propose: Scope;
  readonly edit: Scope;
  readonly manage: Scope;
}

export const NO_LEVELS: KnowledgeLevels = {
  read: 'none',
  propose: 'none',
  edit: 'none',
  manage: 'none',
};

export interface ProjectFacts {
  readonly id: string;
  readonly name: string;
  readonly leadUserId: string | null;
  /** Its members, the lead among them. */
  readonly memberIds: readonly string[];
}

/** What Studio reads of people and projects for the knowledge base; `directory.ts` answers from the plugins. */
export interface KnowledgeDirectory {
  levelsOf(userId: string): Promise<KnowledgeLevels>;
  /** The project as `userId` sees it; null when it does not exist or they may not see it. */
  visibleProject(
    userId: string,
    projectId: string,
  ): Promise<ProjectFacts | null>;
  /** The project whoever looks; null when it is gone. */
  project(projectId: string): Promise<ProjectFacts | null>;
  /** The owners and administrators: who decides when no lead may. */
  administrators(): Promise<readonly string[]>;
  /** Names of people (`user`) and agents (`agent`), by `kind:id`. */
  names(
    refs: readonly { readonly kind: string; readonly id: string }[],
  ): Promise<ReadonlyMap<string, string>>;
}

const NONE: KnowledgeAccess = {
  read: false,
  propose: false,
  edit: false,
  manage: false,
};

/** What `levels` give in a space, the project being what the reader sees of it (null: they do not). */
export function accessIn(
  reader: KnowledgeReader,
  space: SpaceRef,
  levels: KnowledgeLevels,
  project: ProjectFacts | null,
): KnowledgeAccess {
  const human = !reader.actor;
  if (space.scope === SYSTEM_SCOPE) {
    const manage = human && levels.manage === 'all';
    return {
      read: levels.read !== 'none',
      propose: levels.propose !== 'none',
      edit: manage || (human && levels.edit === 'all'),
      manage,
    };
  }
  if (!project) return NONE;
  const read = levels.read !== 'none';
  const manage = human && read && reaches(levels.manage, project.leadUserId);
  return {
    read,
    propose: read && levels.propose !== 'none',
    edit: manage || (human && read && reaches(levels.edit, project.leadUserId)),
    manage,
  };
}

/** Studio's spaces for the knowledge plugin: the system's and one per project, each project's inheriting the system's. */
export function studioKnowledgeAccess(
  directory: KnowledgeDirectory,
): KnowledgeAccessResolver {
  return {
    space(space) {
      if (space.scope === SYSTEM_SCOPE) return SYSTEM_SPACE;
      if (space.scope === PROJECT_SCOPE && space.scopeId) return space;
      return null;
    },
    inherits: (space) => (space.scope === PROJECT_SCOPE ? [SYSTEM_SPACE] : []),
    forReader(reader) {
      // Read once per reader and request: their levels, and each project as they see it.
      let levels: Promise<KnowledgeLevels> | undefined;
      const projects = new Map<string, Promise<ProjectFacts | null>>();
      const projectOf = (projectId: string) => {
        let found = projects.get(projectId);
        if (!found) {
          found = directory.visibleProject(reader.userId, projectId);
          projects.set(projectId, found);
        }
        return found;
      };
      return {
        async access(space) {
          const project =
            space.scope === PROJECT_SCOPE
              ? await projectOf(space.scopeId)
              : null;
          if (space.scope !== SYSTEM_SCOPE && space.scope !== PROJECT_SCOPE)
            return NONE;
          return accessIn(
            reader,
            space,
            await (levels ??= directory.levelsOf(reader.userId)),
            project,
          );
        },
      };
    },
    async title(space) {
      return space.scope === PROJECT_SCOPE
        ? ((await directory.project(space.scopeId))?.name ?? null)
        : null;
    },
    names: (refs) => directory.names(refs),
  };
}

/** Who gets the decision card of a proposal in `space`. */
export async function decidersOf(
  directory: KnowledgeDirectory,
  space: SpaceRef,
): Promise<string[]> {
  if (space.scope === PROJECT_SCOPE) {
    const project = await directory.project(space.scopeId);
    const lead = project?.leadUserId;
    if (lead) {
      const levels = await directory.levelsOf(lead);
      if (levels.read !== 'none' && reaches(levels.edit, lead)) return [lead];
    }
  }
  return [...(await directory.administrators())];
}
