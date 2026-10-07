/**
 * Issue checklists. The workflow's `checklist` rule (`domains/workflows/workflow.registry.ts`) copies a status's items
 * to an issue when it enters the status, and refuses to let it leave (except to a closed status) while required items
 * are unchecked. Here people see the copies and check them: anyone who may see and edit the issue. Each change is an
 * activity (`checklist_item_checked` / `_unchecked`).
 */
import type { DatabaseConnection } from '@nocobase/db';

import type {
  ChecklistItem,
  IssueChecklist,
  UpdateChecklistItemRequest,
} from '../../../shared/checklists.js';
import type { Issue } from '../../../shared/issues.js';
import type { Viewer } from '../../access/viewer.js';
import type { ActivityRecorder } from '../../kernel/activity.js';
import { invalid, notFound } from '../../kernel/errors.js';
import type { TxRunner } from '../../kernel/tx.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import { requireEditor, requireVisible } from '../issues/issue.access.js';
import {
  findItems,
  setChecked,
  type ChecklistItemRecord,
} from './checklist.store.js';

export interface ChecklistService {
  /** Every checklist the issue has had, the current status's first. */
  list(viewer: Viewer, idOrKey: string): Promise<IssueChecklist[]>;
  set(
    viewer: Viewer,
    idOrKey: string,
    statusKey: string,
    itemKey: string,
    input: UpdateChecklistItemRequest,
  ): Promise<IssueChecklist>;
  /** The checklist of the issue's current status, or null; for the issue page. */
  current(
    conn: DatabaseConnection,
    issue: Pick<Issue, 'id' | 'statusKey'>,
  ): Promise<IssueChecklist | null>;
}

const iso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export function createChecklistService(deps: {
  readonly tx: TxRunner;
  readonly kinds: KindRegistry;
  readonly activity: ActivityRecorder;
}): ChecklistService {
  async function checklists(
    conn: DatabaseConnection,
    issue: Pick<Issue, 'id' | 'statusKey'>,
    statusKey?: string,
  ): Promise<IssueChecklist[]> {
    const rows = await findItems(conn, issue.id, statusKey);
    const name = await deps.kinds.nameAll(
      conn,
      rows.map((row) => ({ type: row.checkedByType, id: row.checkedById })),
    );
    const item = (row: ChecklistItemRecord): ChecklistItem => ({
      itemKey: row.itemKey,
      label: row.label,
      required: Boolean(row.required),
      checked: row.checkedAt !== null,
      checkedByType: row.checkedByType,
      checkedById: row.checkedById,
      checkedByName: name(row.checkedByType, row.checkedById),
      checkedAt: row.checkedAt === null ? null : iso(row.checkedAt),
    });
    const groups = new Map<string, ChecklistItem[]>();
    for (const row of rows)
      groups.set(row.statusKey, [
        ...(groups.get(row.statusKey) ?? []),
        item(row),
      ]);
    const lists = [...groups].map(([key, items]) => ({
      statusKey: key,
      current: key === issue.statusKey,
      complete: items.every((entry) => !entry.required || entry.checked),
      items,
    }));
    return [
      ...lists.filter((list) => list.current),
      ...lists.filter((list) => !list.current),
    ];
  }

  return {
    async list(viewer, idOrKey) {
      const conn = deps.tx.read();
      return checklists(conn, await requireVisible(conn, viewer, idOrKey));
    },

    set(viewer, idOrKey, statusKey, itemKey, input) {
      if (typeof input?.checked !== 'boolean')
        throw invalid('INVALID_FIELD', 'checked must be true or false.');
      const checked = input.checked;
      return deps.tx.run(async (tx) => {
        const issue = await requireVisible(tx.conn, viewer, idOrKey);
        requireEditor(viewer);
        const row = (await findItems(tx.conn, issue.id, statusKey)).find(
          (entry) => entry.itemKey === itemKey,
        );
        if (!row) throw notFound('Checklist item');
        if ((row.checkedAt !== null) !== checked) {
          await setChecked(
            tx.conn,
            row.id,
            checked && viewer.actor.id
              ? { type: viewer.actor.type, id: viewer.actor.id }
              : null,
          );
          await deps.activity.record(tx.conn, {
            issueId: issue.id,
            actor: viewer.actor,
            action: checked
              ? 'checklist_item_checked'
              : 'checklist_item_unchecked',
            details: {
              statusKey,
              itemKey,
              label: row.label,
              required: Boolean(row.required),
            },
          });
          tx.emit({ type: 'issue.changed', issueId: issue.id });
        }
        const [list] = await checklists(tx.conn, issue, statusKey);
        return list;
      });
    },

    async current(conn, issue) {
      const [list] = await checklists(conn, issue, issue.statusKey);
      return list ?? null;
    },
  };
}
