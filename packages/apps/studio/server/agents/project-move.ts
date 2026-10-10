/**
 * An issue moved to another project, as its agent is told (`work.ts`). A run's working directories are the issue's
 * project's at claim time, so a run claimed before the move still works in the previous project's: it is told to end
 * (and stopped, when someone else moved the issue), and once it has ended a run starts in the new project's
 * (`PROJECT_CHANGED`). The previous runs' commits stay on their branches in the previous project's repositories, which
 * the new run is pointed to.
 */
import type { ActorRef } from '@nocobase/agent-protocol';
import type { ProjectResourceBinding } from '@nocobase/app-plugin-projects/shared/projects';
import type { DatabaseConnection } from '@nocobase/db';

import { runBranches } from '../git/run-git.js';
import { jsonObject } from './values.js';

/** The trigger of the run that starts the work again in the issue's new project. */
export const PROJECT_CHANGED = 'projectChanged';

export interface ProjectRef {
  readonly id: string;
  readonly name: string;
}

export interface ProjectMove {
  readonly from: ProjectRef | null;
  readonly to: ProjectRef | null;
  /** The branches runs on the issue work on in the previous project's repositories. */
  readonly branches: readonly {
    readonly url: string;
    readonly branch: string;
  }[];
  /** Who moved it. */
  readonly by: ActorRef;
  /** The person the work acts for. */
  readonly byUserId: string;
}

type Row = Record<string, unknown>;

const text = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

async function projectRef(
  conn: DatabaseConnection,
  id: string | null,
): Promise<ProjectRef | null> {
  if (!id) return null;
  const row = await conn.query
    .selectFrom('pmProjects')
    .select(['id', 'name'])
    .where('id', '=', id)
    .executeTakeFirst<Row>();
  return { id, name: text(row?.name) ?? id };
}

/** The branches runs on issue `key` work on in project `projectId`'s repositories, as `run-git.ts` names them. */
async function branchesIn(
  conn: DatabaseConnection,
  projectId: string | null,
  key: string,
): Promise<ProjectMove['branches']> {
  if (!projectId) return [];
  const rows = await conn.query
    .selectFrom('pmProjectResources')
    .select([
      'id',
      'url',
      'bindingProvider',
      'bindingConnectionId',
      'bindingRepoId',
      'bindingFullName',
    ])
    .where('projectId', '=', projectId)
    .where('type', '=', 'gitRepo')
    .orderBy('position')
    .execute<Row>();
  const repos = rows.flatMap((row) => {
    const url = text(row.url);
    if (!url) return [];
    const connectionId = text(row.bindingConnectionId);
    const fullName = text(row.bindingFullName);
    const binding: ProjectResourceBinding | null =
      connectionId && fullName
        ? {
            provider: text(row.bindingProvider) ?? '',
            connectionId,
            repoId: text(row.bindingRepoId) ?? '',
            fullName,
          }
        : null;
    return [{ id: String(row.id), url, binding }];
  });
  const branches = await runBranches(conn, repos, key);
  return repos.map((repo) => ({
    url: repo.url,
    branch: branches.get(repo.id) ?? `agent/${key}`,
  }));
}

/** The move of issue `key` from project `fromId` to `toId`, read on `conn`. */
export async function describeMove(
  conn: DatabaseConnection,
  key: string,
  fromId: string | null,
  toId: string | null,
  by: { readonly userId: string; readonly ref: ActorRef },
): Promise<ProjectMove> {
  return {
    from: await projectRef(conn, fromId),
    to: await projectRef(conn, toId),
    branches: await branchesIn(conn, fromId, key),
    by: by.ref,
    byUserId: by.userId,
  };
}

const nameOf = (project: ProjectRef | null): string =>
  project ? `project ${project.name}` : 'no project';

/** What the run that starts in the new project is told. */
export function movedText(key: string, move: ProjectMove): string {
  const lines = [
    `${move.by.name} moved ${key} from ${nameOf(move.from)} to ${nameOf(move.to)}. Your working directories are now those of ${nameOf(move.to)}; earlier runs on ${key} worked in those of ${nameOf(move.from)}, and what they found is in the issue's comments.`,
  ];
  if (move.branches.length > 0)
    lines.push(
      `Commits earlier runs pushed stay on their branch in the previous repositories: ${move.branches
        .map((item) => `\`${item.branch}\` of ${item.url}`)
        .join(
          ', ',
        )}. Carry over what applies here rather than starting over, and do not push to those repositories.`,
    );
  return lines.join('\n\n');
}

/** What a run claimed before the move is told: it ends, and a run in the new project follows. */
export function stopText(
  key: string,
  move: ProjectMove,
  self: boolean,
): string {
  return self
    ? `You moved ${key} to ${nameOf(move.to)}. This run's working directories are those of ${nameOf(move.from)}: say in a comment where the work stands and end this run. A new run starts in the working directories of ${nameOf(move.to)} once it has ended.`
    : `${move.by.name} moved ${key} from ${nameOf(move.from)} to ${nameOf(move.to)}, so this run stops. A new run starts in the working directories of ${nameOf(move.to)} once it has ended.`;
}

/** The payload of the input telling run `runId` of the move: the mark its end looks for. */
export function stopPayload(
  move: ProjectMove,
  runId: string,
): Record<string, unknown> {
  return { trigger: PROJECT_CHANGED, restartAfter: runId, move };
}

/** The move an input of run `runId` marks it to be followed for, or null. */
export function moveOf(payload: unknown, runId: string): ProjectMove | null {
  const value = jsonObject(payload);
  if (value.trigger !== PROJECT_CHANGED || value.restartAfter !== runId)
    return null;
  const move = jsonObject(value.move);
  const by = jsonObject(move.by);
  if (typeof move.byUserId !== 'string' || typeof by.name !== 'string')
    return null;
  const ref = (item: unknown): ProjectRef | null => {
    const project = jsonObject(item);
    return typeof project.id === 'string' && typeof project.name === 'string'
      ? { id: project.id, name: project.name }
      : null;
  };
  return {
    from: ref(move.from),
    to: ref(move.to),
    branches: Array.isArray(move.branches)
      ? move.branches.flatMap((item) => {
          const branch = jsonObject(item);
          return typeof branch.url === 'string' &&
            typeof branch.branch === 'string'
            ? [{ url: branch.url, branch: branch.branch }]
            : [];
        })
      : [],
    by: {
      kind: by.kind === 'agent' || by.kind === 'system' ? by.kind : 'user',
      id: typeof by.id === 'string' ? by.id : 'system',
      name: by.name,
    },
    byUserId: move.byUserId,
  };
}
