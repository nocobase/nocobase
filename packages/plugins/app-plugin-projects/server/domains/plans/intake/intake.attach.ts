/**
 * An intake's files after its plan is executed: each file becomes the files of the issue made from its own text
 * (`IntakeSourceData.fileRefs`), any other the plan's first created issue, recorded as `attachment_added` on each issue.
 * Files the person removed or attached elsewhere meanwhile are left out, never failing the execution. Until then the
 * purge keeps the files an open intake plan names.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { IntakeSourceData } from '../../../../shared/intake.js';
import { PLAN_OPEN_STATUSES } from '../../../../shared/plans.js';
import type { ActivityRecorder } from '../../../kernel/activity.js';
import type { AttachmentLinks } from '../../attachments/attachment.service.js';
import { findAttachments } from '../../attachments/attachment.store.js';
import { plansOfKind } from '../plan.store.js';
import type { PlanExecutedHook } from '../ports.js';

export const INTAKE_SOURCE = 'intake';

function dataOf(value: unknown): IntakeSourceData | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<IntakeSourceData>;
  if (!Array.isArray(data.fileIds)) return null;
  return {
    fileIds: data.fileIds.filter((id): id is string => typeof id === 'string'),
    projectId: typeof data.projectId === 'string' ? data.projectId : null,
    ...(data.fileRefs && typeof data.fileRefs === 'object'
      ? { fileRefs: data.fileRefs }
      : {}),
  };
}

export function intakeFilesHook(deps: {
  readonly links: AttachmentLinks;
  readonly activity: ActivityRecorder;
}): PlanExecutedHook {
  return async (tx, plan) => {
    const data = dataOf(plan.sourceData);
    if (!data || data.fileIds.length === 0) return;
    const issueOfRef = new Map<string, string>();
    let first: string | null = null;
    for (const row of plan.rows) {
      if (row.created?.type !== 'issue' || !row.created.id) continue;
      first ??= row.created.id;
      if (row.ref) issueOfRef.set(row.ref, row.created.id);
    }
    if (!first) return;
    const uploader = { type: 'user', id: plan.viewer.userId };
    const usable = new Set(
      (await findAttachments(tx.conn, data.fileIds))
        .filter(
          (row) =>
            row.issueId === null &&
            row.uploaderType === uploader.type &&
            row.uploaderId === uploader.id,
        )
        .map((row) => row.id),
    );
    const byIssue = new Map<string, string[]>();
    for (const fileId of data.fileIds) {
      if (!usable.has(fileId)) continue;
      const ref = data.fileRefs?.[fileId];
      const issueId = (ref ? issueOfRef.get(ref) : undefined) ?? first;
      byIssue.set(issueId, [...(byIssue.get(issueId) ?? []), fileId]);
    }
    for (const [issueId, ids] of byIssue) {
      const rows = await deps.links.attach(
        tx,
        uploader,
        { issueId, commentId: null },
        ids,
      );
      await deps.activity.record(tx.conn, {
        issueId,
        actor: plan.viewer.actor,
        action: 'attachment_added',
        details: {
          attachmentIds: ids,
          filenames: rows.map((row) => row.filename),
        },
      });
      tx.emit({ type: 'issue.changed', issueId });
    }
  };
}

/** The files open intake plans still name: the purge keeps them. */
export async function intakeFilesToKeep(
  conn: DatabaseConnection,
): Promise<ReadonlySet<string>> {
  const keep = new Set<string>();
  for (const plan of await plansOfKind(conn, INTAKE_SOURCE, PLAN_OPEN_STATUSES))
    for (const id of dataOf(plan.sourceData)?.fileIds ?? []) keep.add(id);
  return keep;
}
