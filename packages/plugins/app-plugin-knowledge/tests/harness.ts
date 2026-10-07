/**
 * The knowledge base over a real database (the test dialect, the plugin's migration applied), with an access resolver
 * the test controls, shaped like an application's: a system space (`system`, key empty) every project's space (`project`,
 * its id) inherits; each person's levels for reading, proposing and editing (`related` reaching the projects they see,
 * or for editing the projects they lead); which projects they see and who leads each. Files are stored for real: the
 * file plugin's repository on a Drive disk in a temporary directory, their text extracted in worker threads.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { ServerFileRepositoryManager } from '@nocobase/app-plugin-file/server';
import { createTestDatabase } from '@nocobase/app-testing/server';
import type { DatabaseManager } from '@nocobase/db';
import { createDriveManager } from '@nocobase/drive';

import type { KnowledgeAccess, SpaceRef } from '../shared/knowledge.js';
import type {
  KnowledgeAccessResolver,
  KnowledgeReader,
} from '../server/services/access.js';
import type { KnowledgeEvent } from '../server/services/context.js';
import {
  createKnowledge,
  type Knowledge,
} from '../server/services/knowledge.js';
import { createFileStore } from '../server/services/storage.js';

export type Level = 'all' | 'related' | 'none';

/** A person's levels as their roles hold them. */
export interface Levels {
  readonly read: Level;
  readonly propose: Level;
  readonly edit: Level;
  readonly manage: Level;
}

export const CONTRIBUTOR: Levels = {
  read: 'related',
  propose: 'related',
  edit: 'related',
  manage: 'related',
};
export const ADMIN: Levels = {
  read: 'all',
  propose: 'all',
  edit: 'all',
  manage: 'all',
};
export const READER: Levels = {
  read: 'related',
  propose: 'none',
  edit: 'none',
  manage: 'none',
};

export interface ProjectFacts {
  readonly id: string;
  readonly name: string;
  readonly leadUserId: string | null;
  /** Who sees it; everyone when absent. */
  readonly seenBy?: readonly string[];
}

export const SYSTEM: SpaceRef = { scope: 'system', scopeId: '' };

export interface KnowledgeHarness {
  readonly database: DatabaseManager;
  readonly knowledge: Knowledge;
  /** Every event, in order, after its change committed. */
  readonly events: KnowledgeEvent[];
  /** Each person's levels; a contributor's when absent. */
  readonly levels: Map<string, Levels>;
  /** Each person's roles, the `role` subjects they belong to. */
  readonly roles: Map<string, string[]>;
  readonly projects: Map<string, ProjectFacts>;
  advance(ms: number): void;
  user(userId: string): KnowledgeReader;
  agent(userId: string, agentId: string, runId?: string): KnowledgeReader;
  /** Where the stored files' bytes are. */
  readonly storage: string;
  close(): Promise<void>;
}

export interface HarnessOptions {
  /** The largest file stored. */
  readonly maxBytes?: number;
  /** What a reported failure does; it fails the test by default. */
  readonly onError?: (message: string, error: unknown) => void;
}

const NONE: KnowledgeAccess = {
  read: false,
  propose: false,
  edit: false,
  manage: false,
};

export async function createKnowledgeHarness(
  options: HarnessOptions = {},
): Promise<KnowledgeHarness> {
  const testDatabase = await createTestDatabase();
  const database = testDatabase.database;
  await database
    .createMigrator({
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
      packageName: '@nocobase/app-plugin-knowledge',
    })
    .latest();
  const levels = new Map<string, Levels>();
  const roles = new Map<string, string[]>();
  const projects = new Map<string, ProjectFacts>();
  const sees = (userId: string, project: ProjectFacts) =>
    !project.seenBy || project.seenBy.includes(userId);
  const access: KnowledgeAccessResolver = {
    space: (space) =>
      space.scope === 'system'
        ? SYSTEM
        : space.scope === 'project' && space.scopeId
          ? space
          : null,
    inherits: (space) => (space.scope === 'project' ? [SYSTEM] : []),
    forReader: (reader) => ({
      access(space) {
        const held = levels.get(reader.userId) ?? CONTRIBUTOR;
        if (space.scope === 'system')
          return Promise.resolve({
            read: held.read !== 'none',
            propose: held.propose !== 'none',
            edit: held.edit === 'all',
            manage: held.manage === 'all',
          });
        const project = projects.get(space.scopeId);
        if (!project || !sees(reader.userId, project))
          return Promise.resolve(NONE);
        const read = held.read !== 'none';
        const reaches = (level: Level) =>
          level === 'all' ||
          (level === 'related' && project.leadUserId === reader.userId);
        return Promise.resolve({
          read,
          propose: read && held.propose !== 'none',
          edit: read && reaches(held.edit),
          manage: read && reaches(held.manage),
        });
      },
    }),
    title: (space) =>
      Promise.resolve(
        space.scope === 'project'
          ? (projects.get(space.scopeId)?.name ?? null)
          : null,
      ),
    names: (refs) =>
      Promise.resolve(
        new Map(
          refs.map((ref) => [`${ref.kind}:${ref.id}`, `${ref.kind} ${ref.id}`]),
        ),
      ),
  };
  let clock = Date.parse('2026-10-02T08:00:00.000Z');
  let next = 0;
  const events: KnowledgeEvent[] = [];
  const storage = await mkdtemp(path.join(tmpdir(), 'kb-files-'));
  const drive = createDriveManager({
    default: 'local',
    disks: {
      local: { driver: 'fs', location: storage, visibility: 'private' },
    },
  });
  const files = new ServerFileRepositoryManager(database, drive);
  const knowledge = createKnowledge({
    database,
    access,
    newId: () => `k${String((next += 1)).padStart(5, '0')}`,
    now: () => new Date(clock),
    basePath: () => '/app',
    files: {
      store: () =>
        createFileStore({
          uploader: () => files,
          disks: () => drive,
          disk: () => 'local',
        }),
      ...(options.maxBytes ? { maxBytes: options.maxBytes } : {}),
    },
    onError:
      options.onError ??
      ((message, error) => {
        throw new Error(`${message} ${String(error)}`);
      }),
  });
  knowledge.events.on((event) => {
    events.push(event);
  });
  // The subjects entries name: people by id, roles people hold, agents by id.
  const people = () => [
    ...new Set([
      ...levels.keys(),
      ...roles.keys(),
      'lead',
      'member',
      'outsider',
      'admin',
    ]),
  ];
  const subject = (type: string, id: string) => ({
    type,
    id,
    label: `${type} ${id}`,
  });
  knowledge.registerSubjectProvider({
    type: 'user',
    title: 'People',
    icon: 'user',
    search: (q, { limit }) =>
      Promise.resolve(
        people()
          .filter((id) => id.includes(q))
          .slice(0, limit)
          .map((id) => subject('user', id)),
      ),
    describe: (ids) =>
      Promise.resolve(
        ids.filter((id) => id !== 'gone').map((id) => subject('user', id)),
      ),
    subjectsOf: (principal) =>
      Promise.resolve(principal.kind === 'user' ? [principal.id] : []),
  });
  knowledge.registerSubjectProvider({
    type: 'role',
    title: 'Roles',
    icon: 'role',
    search: (q, { limit }) =>
      Promise.resolve(
        [...new Set([...roles.values()].flat())]
          .filter((id) => id.includes(q))
          .slice(0, limit)
          .map((id) => subject('role', id)),
      ),
    describe: (ids) => Promise.resolve(ids.map((id) => subject('role', id))),
    subjectsOf: (principal) =>
      Promise.resolve(
        principal.kind === 'user' ? (roles.get(principal.id) ?? []) : [],
      ),
  });
  knowledge.registerSubjectProvider({
    type: 'agent',
    title: 'Agents',
    icon: 'agent',
    search: () => Promise.resolve([subject('agent', 'a1')]),
    describe: (ids) => Promise.resolve(ids.map((id) => subject('agent', id))),
    subjectsOf: (principal) =>
      Promise.resolve(principal.kind === 'agent' ? [principal.id] : []),
  });
  return {
    database,
    knowledge,
    events,
    levels,
    roles,
    projects,
    advance(ms: number) {
      clock += ms;
    },
    user: (userId) => ({ userId }),
    agent: (userId, agentId, runId) => ({
      userId,
      actor: { kind: 'agent', id: agentId, ...(runId ? { runId } : {}) },
    }),
    storage,
    async close() {
      await knowledge.files.idle();
      await testDatabase.destroy();
      await rm(storage, { recursive: true, force: true });
    },
  };
}
