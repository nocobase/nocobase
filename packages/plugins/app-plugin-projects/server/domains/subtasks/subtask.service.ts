/**
 * Sub-issues and dependencies. People link issues on the issue page: an issue can wait for others (`blockedBy`) or be
 * linked to them (`relatedTo`), and sub-issues with a stage wait for the earlier stages. Linking needs `pm.issues/edit`
 * and both issues visible; the "blocks" side is read-only (the link belongs to the issue that waits).
 *
 * Toward the issues domain this implements `IssueRelations` (linking on create, cycle checks, release and join), the
 * extras the issue page and list show, and the checks the `subtasksDone` and `blockersDone` workflow rules make.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { Issue, IssueDetail } from '../../../shared/issues.js';
import {
  DEPENDENCY_TYPES,
  type AddDependencyRequest,
  type Blocker,
  type DependencyType,
  type IssueDependency,
  type SubtaskSummary,
} from '../../../shared/subtasks.js';
import type { Viewer } from '../../access/viewer.js';
import type { ActivityRecorder } from '../../kernel/activity.js';
import type { Actor } from '../../kernel/actor.js';
import { isUniqueViolation } from '../../kernel/db.js';
import { conflict, invalid, notFound } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import {
  canSee,
  childCounts,
  findIssue,
  findIssues,
  liveChildren,
  requireEditor,
  requireVisible,
  type IssueExtras,
  type IssueRelations,
} from '../issues/index.js';
import type { RelationChecks } from '../workflows/index.js';
import {
  blockedCounts,
  blockersOf,
  blockersOfMany,
  catalogsFor,
  type Catalogs,
} from './subtask.blocking.js';
import { assertNoCycleThrough } from './subtask.graph.js';
import {
  onTerminal,
  releaseIfFree,
  type ReleaseDeps,
} from './subtask.release.js';
import {
  deleteDependency,
  findDependency,
  findDependencyBetween,
  incoming,
  insertDependency,
  outgoing,
  type DependencyRecord,
} from './subtask.store.js';

export interface SubtaskService {
  addDependency(
    viewer: Viewer,
    idOrKey: string,
    input: AddDependencyRequest,
  ): Promise<IssueDependency>;
  removeDependency(
    viewer: Viewer,
    idOrKey: string,
    dependencyId: string,
  ): Promise<void>;
  /** By the other issue and type (`blockedBy` when left out). */
  removeDependencyTo(
    viewer: Viewer,
    idOrKey: string,
    dependsOnIssueId: string,
    type?: string,
  ): Promise<void>;
  /** What holds the issue now, visible or not; for other plugins (an executor's work waits on it). */
  blockersOf(conn: DatabaseConnection, issue: Issue): Promise<Blocker[]>;
  /**
   * What holds each of the issues the viewer sees among `issueIds` now, leaving out the blockers they may not see, in a
   * fixed number of reads; for another plugin's board (what an agent's work waits for). Issues they may not see, and
   * issues nothing holds, are not in the map.
   */
  visibleBlockers(
    viewer: Viewer,
    issueIds: readonly string[],
  ): Promise<Map<string, Blocker[]>>;
  readonly relations: IssueRelations;
  readonly checks: RelationChecks;
  readonly extras: Pick<IssueExtras, 'relations' | 'listCounts'>;
}

export interface SubtaskDeps extends ReleaseDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly activity: ActivityRecorder;
  readonly kinds: KindRegistry;
}

function dependencyType(value: unknown): DependencyType {
  if (value === undefined) return 'blockedBy';
  if (!DEPENDENCY_TYPES.includes(value as DependencyType))
    throw invalid(
      'INVALID_DEPENDENCY',
      `type is one of ${DEPENDENCY_TYPES.join(', ')}.`,
    );
  return value as DependencyType;
}

export function createSubtaskService(deps: SubtaskDeps): SubtaskService {
  const record = (
    tx: Tx,
    issueId: string,
    actor: Actor,
    action: string,
    details: Record<string, unknown>,
  ) => deps.activity.record(tx.conn, { issueId, actor, action, details });

  async function dependencyView(
    catalogs: Catalogs,
    dependency: DependencyRecord,
    other: Issue,
  ): Promise<IssueDependency> {
    return {
      dependencyId: dependency.id,
      issueId: other.id,
      identifier: other.identifier,
      title: other.title,
      status: await catalogs.status(other),
      type: dependency.type,
    };
  }

  /** The other end of a link the viewer names: an issue they can see, never the issue itself. */
  async function target(
    conn: DatabaseConnection,
    viewer: Viewer,
    issue: Issue,
    ref: unknown,
  ): Promise<Issue> {
    if (typeof ref !== 'string' || !ref)
      throw invalid('INVALID_DEPENDENCY', 'dependsOnIssueId is required.');
    const other = await requireVisible(conn, viewer, ref).catch(() => null);
    if (!other)
      throw invalid(
        'INVALID_DEPENDENCY',
        'dependsOnIssueId names no issue you can see.',
      );
    if (other.id === issue.id)
      throw invalid('INVALID_DEPENDENCY', 'An issue cannot depend on itself.');
    return other;
  }

  /** Inserts the link (409 when it exists) and records it on the issue that waits. */
  async function link(
    tx: Tx,
    issue: Issue,
    other: Issue,
    type: DependencyType,
    actor: Actor,
  ): Promise<DependencyRecord> {
    if (
      type === 'relatedTo' &&
      (await findDependencyBetween(tx.conn, other.id, issue.id, 'relatedTo'))
    )
      throw conflict('DEPENDENCY_EXISTS', 'The issues are linked already.');
    const dependency: DependencyRecord = {
      id: deps.ids.next(),
      issueId: issue.id,
      dependsOnIssueId: other.id,
      type,
      createdByType: actor.type,
      createdById: actor.id,
      createdAt: new Date().toISOString(),
    };
    try {
      // A savepoint, so a duplicate leaves the rest of the transaction usable.
      await tx.conn.transaction((conn) => insertDependency(conn, dependency));
    } catch (error) {
      if (isUniqueViolation(error))
        throw conflict('DEPENDENCY_EXISTS', 'The issues are linked already.');
      throw error;
    }
    await record(tx, issue.id, actor, 'dependency_added', {
      dependencyId: dependency.id,
      dependsOnIssueId: other.id,
      identifier: other.identifier,
      type,
    });
    tx.emit({ type: 'issue.changed', issueId: issue.id });
    tx.emit({ type: 'issue.changed', issueId: other.id });
    return dependency;
  }

  async function unlink(
    viewer: Viewer,
    idOrKey: string,
    find: (
      conn: DatabaseConnection,
      issue: Issue,
    ) => Promise<DependencyRecord | undefined>,
  ): Promise<void> {
    await deps.tx.run(async (tx) => {
      const issue = await requireVisible(tx.conn, viewer, idOrKey);
      requireEditor(viewer);
      const dependency = await find(tx.conn, issue);
      if (!dependency) throw notFound('Dependency');
      await deleteDependency(tx.conn, dependency.id);
      const ends = await findIssues(tx.conn, [
        dependency.issueId,
        dependency.dependsOnIssueId,
      ]);
      const waiting = ends.find((end) => end.id === dependency.issueId);
      const other = ends.find((end) => end.id === dependency.dependsOnIssueId);
      if (waiting)
        await record(tx, waiting.id, viewer.actor, 'dependency_removed', {
          dependencyId: dependency.id,
          dependsOnIssueId: dependency.dependsOnIssueId,
          identifier: other?.identifier ?? null,
          type: dependency.type,
        });
      for (const id of [dependency.issueId, dependency.dependsOnIssueId])
        tx.emit({ type: 'issue.changed', issueId: id });
      if (dependency.type === 'blockedBy' && waiting && other)
        await releaseIfFree(
          deps,
          tx,
          catalogsFor(deps.statuses, tx.conn),
          waiting,
          other,
          viewer.actor,
        );
    });
  }

  /** The link may be removed from this issue: it is the issue's own, or a `relatedTo` pointing at it. */
  const removable = (issue: Issue, dependency: DependencyRecord | undefined) =>
    dependency &&
    (dependency.issueId === issue.id ||
      (dependency.type === 'relatedTo' &&
        dependency.dependsOnIssueId === issue.id))
      ? dependency
      : undefined;

  const relations: IssueRelations = {
    async created(tx, issue, blockedBy, viewer) {
      const links = new Set<string>();
      for (const ref of blockedBy) {
        const other = await target(tx.conn, viewer, issue, ref);
        if (links.has(other.id)) continue;
        links.add(other.id);
        await link(tx, issue, other, 'blockedBy', viewer.actor);
      }
      if (links.size > 0 || issue.parentIssueId)
        await assertNoCycleThrough(tx.conn, issue.id);
    },
    placed: (tx, issue) => assertNoCycleThrough(tx.conn, issue.id),
    async changed(tx, { before, after, actor }) {
      const catalogs = catalogsFor(deps.statuses, tx.conn);
      if (
        !(await catalogs.terminal(before)) &&
        (await catalogs.terminal(after))
      )
        await onTerminal(deps, tx, after, actor);
    },
    removed: (tx, issue, actor) => onTerminal(deps, tx, issue, actor),
  };

  const checks: RelationChecks = {
    async openChildren(conn, issueId) {
      const catalogs = catalogsFor(deps.statuses, conn);
      const open: Issue[] = [];
      for (const child of await liveChildren(conn, [issueId]))
        if (!(await catalogs.terminal(child))) open.push(child);
      return open;
    },
    blockers: (conn, issue) =>
      blockersOf(conn, catalogsFor(deps.statuses, conn), issue),
  };

  return {
    async addDependency(viewer, idOrKey, input) {
      return deps.tx.run(async (tx) => {
        const issue = await requireVisible(tx.conn, viewer, idOrKey);
        requireEditor(viewer);
        const type = dependencyType(input?.type);
        const other = await target(
          tx.conn,
          viewer,
          issue,
          input?.dependsOnIssueId,
        );
        const dependency = await link(tx, issue, other, type, viewer.actor);
        const catalogs = catalogsFor(deps.statuses, tx.conn);
        if (type === 'blockedBy') {
          await assertNoCycleThrough(tx.conn, issue.id);
          const blockers = await blockersOf(tx.conn, catalogs, issue);
          if (blockers.length > 0)
            await deps.triggers().onBlocked?.(tx, { issue, blockers });
        }
        return dependencyView(catalogs, dependency, other);
      });
    },

    removeDependency: (viewer, idOrKey, dependencyId) =>
      unlink(viewer, idOrKey, async (conn, issue) =>
        removable(issue, await findDependency(conn, dependencyId)),
      ),

    async removeDependencyTo(viewer, idOrKey, dependsOnIssueId, type) {
      const kind = dependencyType(type);
      if (!dependsOnIssueId)
        throw invalid('INVALID_DEPENDENCY', 'dependsOnIssueId is required.');
      await unlink(viewer, idOrKey, async (conn, issue) => {
        const other = await findIssue(conn, dependsOnIssueId);
        if (!other) return undefined;
        return (
          (await findDependencyBetween(conn, issue.id, other.id, kind)) ??
          (kind === 'relatedTo'
            ? await findDependencyBetween(conn, other.id, issue.id, kind)
            : undefined)
        );
      });
    },

    blockersOf: (conn, issue) =>
      blockersOf(conn, catalogsFor(deps.statuses, conn), issue),

    async visibleBlockers(viewer, issueIds) {
      const result = new Map<string, Blocker[]>();
      if (issueIds.length === 0) return result;
      const conn = deps.tx.read();
      const catalogs = catalogsFor(deps.statuses, conn);
      // Whether the viewer sees an issue depends on its project only, so one answer per project serves them all.
      const byProject = new Map<string | null, Promise<boolean>>();
      const sees = (issue: Issue) => {
        if (issue.deletedAt) return Promise.resolve(false);
        let value = byProject.get(issue.projectId);
        if (!value) {
          value = canSee(conn, viewer, issue);
          byProject.set(issue.projectId, value);
        }
        return value;
      };
      const issues: Issue[] = [];
      for (const issue of await findIssues(conn, [...new Set(issueIds)]))
        if (await sees(issue)) issues.push(issue);
      const all = await blockersOfMany(conn, catalogs, issues);
      const others = new Map(
        (
          await findIssues(conn, [
            ...new Set(
              [...all.values()].flatMap((list) =>
                list.map((blocker) => blocker.issueId),
              ),
            ),
          ])
        ).map((other) => [other.id, other]),
      );
      for (const [issueId, blockers] of all) {
        const shown: Blocker[] = [];
        for (const blocker of blockers) {
          const other = others.get(blocker.issueId);
          if (other && (await sees(other))) shown.push(blocker);
        }
        if (shown.length > 0) result.set(issueId, shown);
      }
      return result;
    },

    relations,
    checks,

    extras: {
      async relations(conn, viewer, issue) {
        const catalogs = catalogsFor(deps.statuses, conn);
        const visible = new Map<string, boolean>();
        const sees = async (other: Issue) => {
          let value = visible.get(other.id);
          if (value === undefined) {
            value = await canSee(conn, viewer, other);
            visible.set(other.id, value);
          }
          return value;
        };

        const children = [];
        for (const child of await liveChildren(conn, [issue.id]))
          if (await sees(child)) children.push(child);
        const counts = await blockedCounts(conn, catalogs, children);
        const name = await deps.kinds.nameAll(
          conn,
          children.flatMap((child) => (child.executor ? [child.executor] : [])),
        );
        const subtasks: SubtaskSummary[] = [];
        for (const child of children)
          subtasks.push({
            id: child.id,
            identifier: child.identifier,
            title: child.title,
            status: await catalogs.status(child),
            stage: child.stage,
            executor: child.executor,
            executorName: child.executor
              ? name(child.executor.type, child.executor.id)
              : null,
            blockedCount: counts.get(child.id) ?? 0,
            terminal: await catalogs.terminal(child),
          });

        const out = await outgoing(conn, [issue.id]);
        const into = await incoming(conn, [issue.id]);
        const others = new Map(
          (
            await findIssues(conn, [
              ...out.map((dependency) => dependency.dependsOnIssueId),
              ...into.map((dependency) => dependency.issueId),
            ])
          ).map((other) => [other.id, other]),
        );
        const views = async (
          list: readonly DependencyRecord[],
          end: 'dependsOnIssueId' | 'issueId',
        ) => {
          const result: IssueDependency[] = [];
          for (const dependency of list) {
            const other = others.get(dependency[end]);
            if (other && (await sees(other)))
              result.push(await dependencyView(catalogs, dependency, other));
          }
          return result;
        };
        const blockers = await blockersOf(conn, catalogs, issue);
        const shown: Blocker[] = [];
        for (const blocker of blockers) {
          const other =
            others.get(blocker.issueId) ??
            children.find((child) => child.id === blocker.issueId) ??
            (await findIssues(conn, [blocker.issueId]))[0];
          if (other && (await sees(other))) shown.push(blocker);
        }
        return {
          subtasks,
          blockedBy: await views(
            out.filter((dependency) => dependency.type === 'blockedBy'),
            'dependsOnIssueId',
          ),
          blocks: await views(
            into.filter((dependency) => dependency.type === 'blockedBy'),
            'issueId',
          ),
          relatedTo: [
            ...(await views(
              out.filter((dependency) => dependency.type === 'relatedTo'),
              'dependsOnIssueId',
            )),
            ...(await views(
              into.filter((dependency) => dependency.type === 'relatedTo'),
              'issueId',
            )),
          ],
          blockers: shown,
          hiddenBlockerCount: blockers.length - shown.length,
        } satisfies Pick<
          IssueDetail,
          | 'subtasks'
          | 'blockedBy'
          | 'blocks'
          | 'relatedTo'
          | 'blockers'
          | 'hiddenBlockerCount'
        >;
      },

      async listCounts(conn, issues) {
        const catalogs = catalogsFor(deps.statuses, conn);
        const ids = issues.map((issue) => issue.id);
        const children = await childCounts(conn, ids);
        const blocked = await blockedCounts(conn, catalogs, issues);
        return new Map(
          ids.map((id) => [
            id,
            {
              subtaskCount: children.get(id) ?? 0,
              blockedCount: blocked.get(id) ?? 0,
            },
          ]),
        );
      },
    },
  };
}
