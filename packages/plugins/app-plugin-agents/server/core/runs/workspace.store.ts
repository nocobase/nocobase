/**
 * What a claim keeps besides the run: the brief it was given (`agRunBriefs`, one per run, the latest attempt's), and
 * the requests to start a subject's work from a fresh working directory (`agWorkspaceResets`).
 */
import type { DatabaseConnection, Repository } from '@nocobase/db';

import type { RunBrief } from '../../../shared/briefs.js';
import { sessionsRepo } from './run.store.js';

interface BriefRecord {
  readonly id: string;
  readonly runId: string;
  readonly attempt: number;
  readonly system: string;
  readonly task: string;
  readonly context: string;
  readonly agent: string;
  readonly turn: string;
  readonly prompt: string;
  readonly createdAt: string;
}

interface ResetRecord {
  readonly id: string;
  readonly subjectKind: string;
  readonly subjectId: string;
  readonly requestedById: string | null;
  readonly requestedAt: string;
  readonly consumedByRunId: string | null;
  readonly consumedAt: string | null;
}

function briefsRepo(conn: DatabaseConnection): Repository<BriefRecord> {
  return conn.repository<BriefRecord>('agRunBriefs');
}

function resetsRepo(conn: DatabaseConnection): Repository<ResetRecord> {
  return conn.repository<ResetRecord>('agWorkspaceResets');
}

/** Keeps `brief` as the run's, replacing an earlier attempt's. */
export async function saveBrief(
  conn: DatabaseConnection,
  id: () => string,
  brief: RunBrief,
): Promise<void> {
  await briefsRepo(conn).deleteMany({ filter: { runId: brief.runId } });
  await briefsRepo(conn).createOne({
    values: {
      id: id(),
      runId: brief.runId,
      attempt: brief.attempt,
      system: brief.layers.system,
      task: brief.layers.task,
      context: brief.layers.context,
      agent: brief.layers.agent,
      turn: brief.turn,
      prompt: brief.prompt,
      createdAt: brief.createdAt,
    },
  });
}

export async function findBrief(
  conn: DatabaseConnection,
  runId: string,
): Promise<RunBrief | null> {
  const record = await briefsRepo(conn).findOne({ filter: { runId } });
  if (!record) return null;
  return {
    runId: record.runId,
    attempt: Number(record.attempt),
    layers: {
      system: record.system,
      task: record.task,
      context: record.context,
      agent: record.agent,
    },
    turn: record.turn,
    prompt: record.prompt,
    createdAt: record.createdAt,
  };
}

/**
 * Asks for the subject's next run to start from a fresh working directory, and forgets the sessions on it, which
 * lived in the old one.
 */
export async function requestReset(
  conn: DatabaseConnection,
  id: () => string,
  subject: { readonly kind: string; readonly id: string },
  userId: string | null,
  now: string,
): Promise<void> {
  await resetsRepo(conn).createOne({
    values: {
      id: id(),
      subjectKind: subject.kind,
      subjectId: subject.id,
      requestedById: userId,
      requestedAt: now,
      consumedByRunId: null,
      consumedAt: null,
    },
  });
  await sessionsRepo(conn).updateMany({
    filter: { subjectKind: subject.kind, subjectId: subject.id },
    values: { poisoned: true, updatedAt: now },
  });
}

/** Whether a reset waits for the subject; marks every waiting one delivered to `runId`. */
export async function consumeReset(
  conn: DatabaseConnection,
  subject: { readonly kind: string; readonly id: string },
  runId: string,
  now: string,
): Promise<boolean> {
  const result = await resetsRepo(conn).updateMany({
    filter: (f) =>
      f.and([
        f.string('subjectKind').eq(subject.kind),
        f.string('subjectId').eq(subject.id),
        f.date('consumedAt').empty(),
      ]),
    values: { consumedByRunId: runId, consumedAt: now },
  });
  return result.updatedCount > 0;
}
