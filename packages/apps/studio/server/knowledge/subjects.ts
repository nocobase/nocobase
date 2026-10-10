/**
 * Who a folder's or an article's permissions may name in Studio (the knowledge plugin's `KnowledgeSubjectProvider`,
 * `docs/permissions.md` there): a person (`user`), a Studio role (`role`), the members or the lead of the space's
 * project (`project`: `members`, `lead`), or an agent (`agent`). Each says which of its subjects a person or an agent
 * belongs to when access is checked, so a change of role, of project membership or of lead takes effect at once.
 *
 * Another type is one more provider here and nothing else: a `department` type, say, offering the departments (and
 * `<id>/*` for "with its sub-departments") and answering a person's own department and `<ancestor>/*` for each
 * department above it.
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { KnowledgeSubjectProvider } from '@nocobase/app-plugin-knowledge/server/tokens';
import type {
  KnowledgeSubject,
  KnowledgeText,
} from '@nocobase/app-plugin-knowledge/shared/knowledge';
import type { KindRegistry } from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseManager } from '@nocobase/db';

import { STUDIO_NAMESPACE, type Permissions } from '../../shared/access.js';
import { PROJECT_SCOPE } from '../../shared/knowledge.js';
import type { AccessViewer, StudioAccess } from '../access/service.js';
import type { KnowledgeDirectory } from './access.js';

const text = (key: string): KnowledgeText => ({ key, ns: STUDIO_NAMESPACE });

/** Reads Studio's roles to offer them, whoever manages a node. */
const ROLE_READER: AccessViewer = {
  userId: 'studio-knowledge',
  permissions: {
    scopes: {},
    settings: { 'pm.members/read': true },
  } satisfies Permissions,
};

const matches = (needle: string, ...values: (string | null | undefined)[]) =>
  !needle ||
  values.some((value) => (value ?? '').toLowerCase().includes(needle));

export interface StudioSubjectDeps {
  readonly database: Pick<DatabaseManager, 'connection'>;
  readonly kinds: () => Pick<KindRegistry, 'get' | 'names'> | undefined;
  readonly access: () =>
    Pick<StudioAccess, 'roles' | 'rolesOfUser'> | undefined;
  readonly directory: Pick<KnowledgeDirectory, 'project'>;
  readonly agents: () => Pick<Agents, 'agents'> | undefined;
}

/** People, by the projects plugin's user kind. */
export function userSubjects(
  deps: StudioSubjectDeps,
): KnowledgeSubjectProvider {
  return {
    type: 'user',
    title: text('knowledge.subjects.types.user'),
    icon: 'user',
    async search(q, { limit }) {
      const mention = deps.kinds()?.get('user')?.mention;
      if (!mention) return [];
      const found = await mention.candidates(deps.database.connection(), {
        userId: '',
        issueId: null,
        q,
        limit,
      });
      return found.map((person) => ({
        type: 'user',
        id: person.id,
        label: person.name,
        ...(person.hint ? { hint: person.hint } : {}),
      }));
    },
    async describe(ids) {
      const kinds = deps.kinds();
      if (!kinds) return [];
      const names = await kinds.names(deps.database.connection(), 'user', ids);
      return [...names].map(([id, name]) => ({
        type: 'user',
        id,
        label: name,
      }));
    },
    subjectsOf: (principal) =>
      Promise.resolve(principal.kind === 'user' ? [principal.id] : []),
  };
}

/** Studio's roles: whoever holds one directly. */
export function roleSubjects(
  deps: StudioSubjectDeps,
): KnowledgeSubjectProvider {
  const roles = async (): Promise<KnowledgeSubject[]> => {
    const access = deps.access();
    if (!access) return [];
    return (await access.roles.list(ROLE_READER)).map((role) => ({
      type: 'role',
      id: role.key,
      label: role.title ?? role.key,
    }));
  };
  return {
    type: 'role',
    title: text('knowledge.subjects.types.role'),
    icon: 'role',
    async search(q, { limit }) {
      const needle = q.trim().toLowerCase();
      return (await roles())
        .filter((role) =>
          matches(
            needle,
            role.id,
            typeof role.label === 'string' ? role.label : null,
          ),
        )
        .slice(0, limit);
    },
    async describe(ids) {
      return (await roles()).filter((role) => ids.includes(role.id));
    },
    async subjectsOf(principal) {
      const access = deps.access();
      if (principal.kind !== 'user' || !access) return [];
      return (await access.rolesOfUser(principal.id)).roles.map(
        (role) => role.key,
      );
    },
  };
}

const RELATIONS = [
  {
    id: 'members',
    label: text('knowledge.subjects.projectMembers'),
    words: ['project members', 'members', '项目成员', '成员'],
  },
  {
    id: 'lead',
    label: text('knowledge.subjects.projectLead'),
    words: ['project lead', 'lead', '项目负责人', '负责人'],
  },
] as const;

/** The members and the lead of a project's space's project, whoever they are when access is checked. */
export function projectSubjects(
  deps: StudioSubjectDeps,
): KnowledgeSubjectProvider {
  const subject = (relation: (typeof RELATIONS)[number]): KnowledgeSubject => ({
    type: 'project',
    id: relation.id,
    label: relation.label,
  });
  return {
    type: 'project',
    title: text('knowledge.subjects.types.project'),
    icon: 'group',
    search(q, { space }) {
      if (space.scope !== PROJECT_SCOPE) return Promise.resolve([]);
      const needle = q.trim().toLowerCase();
      return Promise.resolve(
        RELATIONS.filter((relation) => matches(needle, ...relation.words)).map(
          subject,
        ),
      );
    },
    describe(ids) {
      return Promise.resolve(
        RELATIONS.filter((relation) => ids.includes(relation.id)).map(subject),
      );
    },
    async subjectsOf(principal, { space }) {
      if (principal.kind !== 'user' || space.scope !== PROJECT_SCOPE) return [];
      const project = await deps.directory.project(space.scopeId);
      if (!project) return [];
      return [
        ...(project.memberIds.includes(principal.id) ? ['members'] : []),
        ...(project.leadUserId === principal.id ? ['lead'] : []),
      ];
    },
  };
}

/** Agents, by the agents plugin: an agent reads what it is granted, within what the person it acts for may. */
export function agentSubjects(
  deps: StudioSubjectDeps,
): KnowledgeSubjectProvider {
  return {
    type: 'agent',
    title: text('knowledge.subjects.types.agent'),
    icon: 'agent',
    async search(q, { limit }) {
      const agents = deps.agents();
      if (!agents) return [];
      const needle = q.trim().toLowerCase();
      return (await agents.agents.listActive(deps.database.connection()))
        .filter((agent) => matches(needle, agent.name))
        .slice(0, limit)
        .map((agent) => ({
          type: 'agent',
          id: agent.id,
          label: agent.name,
          ...(agent.description ? { hint: agent.description } : {}),
        }));
    },
    async describe(ids) {
      const agents = deps.agents();
      if (!agents) return [];
      const conn = deps.database.connection();
      const found: KnowledgeSubject[] = [];
      for (const id of ids) {
        const agent = await agents.agents.find(conn, id);
        if (agent) found.push({ type: 'agent', id, label: agent.name });
      }
      return found;
    },
    subjectsOf: (principal) =>
      Promise.resolve(principal.kind === 'agent' ? [principal.id] : []),
  };
}

/** Studio's subjects, in the order the picker groups them. */
export function studioSubjects(
  deps: StudioSubjectDeps,
): KnowledgeSubjectProvider[] {
  return [
    userSubjects(deps),
    roleSubjects(deps),
    projectSubjects(deps),
    ...(deps.agents() ? [agentSubjects(deps)] : []),
  ];
}
