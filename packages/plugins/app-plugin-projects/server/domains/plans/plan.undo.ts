/**
 * The rows that undo an executed plan, newest first, and the rows of it they leave alone (`PlanUndoSkip`):
 *
 * - an issue it created is retracted (soft-deleted) unless someone changed it since (its revision moved on);
 * - fields it changed get their baseline back unless they no longer hold what the plan left (and not on an issue that
 *   is retracted anyway);
 * - a comment it wrote is deleted unless it was edited or deleted since;
 * - a dependency it added is removed, one it removed is added back, unless that changed since;
 * - a project it created is deleted unless it changed since or holds issues other than the ones retracted here.
 *
 * Whether each row can still run is then up to the rehearsal of these rows (`PlanService.previewUndo` and `undo`).
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { PlanUndoSkip } from '../../../shared/plans.js';
import type { DependencyType } from '../../../shared/subtasks.js';
import type { Tx } from '../../kernel/tx.js';
import { findComment } from '../comments/index.js';
import { findIssue } from '../issues/index.js';
import { findProject } from '../projects/index.js';
import type { EngineRow } from './plan.engine.js';
import { dependencyExists, issueFields } from './plan.ops.js';
import type { PlanRowRecord } from './plan.store.js';

export interface UndoRow extends EngineRow {
  readonly undoesRowId: string;
}

interface LiveIssueCount {
  liveIssueIds(conn: DatabaseConnection, projectId: string): Promise<string[]>;
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export async function buildUndo(
  tx: Tx,
  rows: readonly PlanRowRecord[],
  projects: LiveIssueCount,
): Promise<{
  readonly rows: UndoRow[];
  readonly skipped: PlanUndoSkip[];
}> {
  const conn = tx.conn;
  const undo: UndoRow[] = [];
  const skipped: PlanUndoSkip[] = [];
  const skip = (
    row: PlanRowRecord,
    reason: PlanUndoSkip['reason'],
    message: string,
  ) => skipped.push({ rowId: row.id, position: row.position, reason, message });

  // The issues the plan created and nobody changed since: retracted, so nothing else needs undoing on them.
  const retracted = new Set<string>();
  for (const row of rows) {
    const result = row.result;
    if (row.op !== 'issue.create' || !result?.created?.id) continue;
    const issue = await findIssue(conn, result.created.id);
    if (issue && !issue.deletedAt && issue.revision === result.revision)
      retracted.add(issue.id);
  }

  for (const row of [...rows].reverse()) {
    const result = row.result;
    if (!result) continue;
    const add = (op: UndoRow['op'], params: unknown) =>
      undo.push({ op, params, ref: null, undoesRowId: row.id });
    switch (row.op) {
      case 'issue.create': {
        const id = result.created?.id;
        if (id && retracted.has(id)) add('issue.retract', { id });
        else {
          const issue = id ? await findIssue(conn, id) : undefined;
          if (!issue || issue.deletedAt)
            skip(row, 'gone', 'The issue no longer exists.');
          else skip(row, 'changed', 'The issue was changed since.');
        }
        break;
      }
      case 'issue.update': {
        const id = result.target?.id;
        if (!id || retracted.has(id)) break;
        const issue = await findIssue(conn, id);
        if (!issue || issue.deletedAt) {
          skip(row, 'gone', 'The issue no longer exists.');
          break;
        }
        const fields = Object.keys(result.after ?? {});
        const now = await issueFields({ tx }, issue, fields);
        if (!same(now, result.after)) {
          skip(row, 'changed', 'The issue was changed since.');
          break;
        }
        const baseline = row.check?.baseline?.fields;
        if (!baseline) {
          skip(row, 'notReversible', 'Nothing records what it was before.');
          break;
        }
        add('issue.update', { issue: id, set: baseline });
        break;
      }
      case 'comment.create': {
        const id = result.created?.id;
        const comment = id ? await findComment(conn, id) : undefined;
        if (!comment || comment.deletedAt)
          skip(row, 'gone', 'The comment no longer exists.');
        else if (comment.editedAt)
          skip(row, 'changed', 'The comment was edited since.');
        else add('comment.retract', { id: comment.id });
        break;
      }
      case 'dependency': {
        const after = result.after as {
          readonly exists: boolean;
          readonly issueId: string;
          readonly dependsOnIssueId: string;
          readonly type: DependencyType;
        } | null;
        if (!after) {
          skip(row, 'notReversible', 'Nothing records the link.');
          break;
        }
        const exists = await dependencyExists(tx, {
          id: result.created?.id ?? null,
          ...after,
        });
        if (exists !== after.exists) {
          skip(row, 'changed', 'The link was changed since.');
          break;
        }
        add('dependency', {
          action: after.exists ? 'remove' : 'add',
          issue: after.issueId,
          dependsOn: after.dependsOnIssueId,
          type: after.type,
        });
        break;
      }
      case 'project.create': {
        const id = result.created?.id;
        const project = id ? await findProject(conn, id) : undefined;
        if (!project) {
          skip(row, 'gone', 'The project no longer exists.');
          break;
        }
        const left = (await projects.liveIssueIds(conn, project.id)).filter(
          (issueId) => !retracted.has(issueId),
        );
        if (
          left.length > 0 ||
          new Date(project.updatedAt).toISOString() !==
            (result.after as { updatedAt?: string } | null)?.updatedAt
        ) {
          skip(
            row,
            'changed',
            'The project was changed or holds other issues.',
          );
          break;
        }
        add('project.retract', { id: project.id });
        break;
      }
      default:
        skip(row, 'notReversible', 'This row cannot be undone.');
    }
  }
  return { rows: undo, skipped };
}
