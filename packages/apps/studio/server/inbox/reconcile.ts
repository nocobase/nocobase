/** Explicit, paged reconciliation of obsolete issue decisions; never runs on inbox reads or polls. */
import type { DatabaseConnection } from '@nocobase/db';
import type { StudioInboxPort } from './port.js';

export interface DecisionRepair {
  readonly issueId: string;
  readonly identifier: string;
  readonly source: string;
  readonly type: string;
  readonly decisionKey: string;
  readonly outcome: string;
  readonly count: number;
}

export interface RepairPage {
  readonly data: DecisionRepair[];
  readonly meta: {
    readonly scanned: number;
    readonly execute: boolean;
    readonly failed: number;
    readonly nextPageToken?: string;
  };
}

interface Candidate {
  id: string;
  subjectId: string;
  identifier: string;
  source: string;
  type: string;
  decisionKey: string;
  data: unknown;
  createdAt: string | Date;
  executorType: unknown;
  executorId: unknown;
  ownerUserId: string;
}

const terminal = ['done', 'cancelled'];
const object = (value: unknown): Record<string, unknown> => {
  const data: unknown = typeof value === 'string' ? JSON.parse(value) : value;
  return data && typeof data === 'object' && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};
};
const time = (value: unknown) =>
  value == null ? 0 : new Date(value as string | Date).getTime();

export function createDecisionReconciler(
  connection: () => DatabaseConnection,
  inbox: () => StudioInboxPort,
  onError: (error: unknown, decisionKey: string) => void,
) {
  function candidates(issueId?: string) {
    let query = connection()
      .query.selectFrom('studioInboxNotices as n')
      .innerJoin('pmIssues as i', 'i.id', 'n.subjectId')
      .where('n.subjectType', '=', 'issue')
      .where('n.kind', '=', 'decision')
      .where('n.resolvedAt', 'is', null)
      .where('i.statusKey', 'in', terminal)
      .where((eb) =>
        eb.or([
          eb.and([
            eb('n.source', '=', 'git'),
            eb('n.type', '=', 'pr_merge_requested'),
          ]),
          eb.and([
            eb('n.source', '=', 'projects'),
            eb('n.type', 'in', [
              'agent_blocked',
              'run_failed_final',
              'owner_handoff',
            ]),
          ]),
          eb.and([
            eb('n.source', '=', 'runners'),
            eb('n.type', '=', 'personal_runner_consent'),
          ]),
        ]),
      );
    if (issueId) query = query.where('n.subjectId', '=', issueId);
    return query;
  }

  async function read(
    keys: { source: string; decisionKey: string }[],
    issueId?: string,
  ): Promise<Candidate[]> {
    if (!keys.length) return [];
    return (await candidates(issueId)
      .select([
        'n.id',
        'n.subjectId',
        'i.identifier',
        'n.source',
        'n.type',
        'n.decisionKey',
        'n.data',
        'n.createdAt',
        'i.executorType',
        'i.executorId',
        'i.ownerUserId',
      ])
      .where((eb) =>
        eb.or(
          keys.map((key) =>
            eb.and([
              eb('n.source', '=', key.source),
              eb('n.decisionKey', '=', key.decisionKey),
            ]),
          ),
        ),
      )
      .execute()) as unknown as Candidate[];
  }

  async function plan(rows: Candidate[]): Promise<DecisionRepair[]> {
    if (!rows.length) return [];
    const conn = connection();
    const issueIds = [...new Set(rows.map((row) => row.subjectId))];
    const withData = rows.map((row) => ({ row, data: object(row.data) }));
    const idsOf = (type: string, field: string) => [
      ...new Set(
        withData.flatMap(({ row, data }) =>
          row.type === type && typeof data[field] === 'string'
            ? [data[field]]
            : [],
        ),
      ),
    ];
    const prIds = idsOf('pr_merge_requested', 'pullRequestId');
    const runIds = idsOf('run_failed_final', 'runId');
    const requestIds = idsOf('personal_runner_consent', 'requestId');
    const prs = prIds.length
      ? await conn.query
          .selectFrom('studioPullRequests')
          .select(['id', 'state'])
          .where('id', 'in', prIds)
          .execute()
      : [];
    const runs = runIds.length
      ? await conn.query
          .selectFrom('agRuns')
          .select(['id', 'createdAt'])
          .where('id', 'in', runIds)
          .execute()
      : [];
    const retries = runIds.length
      ? await conn.query
          .selectFrom('agRuns')
          .select('retryOfRunId')
          .where('retryOfRunId', 'in', runIds)
          .execute()
      : [];
    const retried = new Set(retries.map((row) => String(row.retryOfRunId)));
    const reviewInputs = runIds.length
      ? await conn.query
          .selectFrom('agRunInputs')
          .select('runId')
          .select((eb) => [eb.fn.max('createdAt').as('at')])
          .where('runId', 'in', runIds)
          .where('type', '=', 'comment')
          .groupBy('runId')
          .execute()
      : [];
    const requests = requestIds.length
      ? await conn.query
          .selectFrom('agRunRequests')
          .select(['id', 'status', 'createdAt', 'subjectKind', 'subjectId'])
          .where('id', 'in', requestIds)
          .execute()
      : [];
    const hasHandoffs = rows.some((row) => row.type === 'owner_handoff');
    const handoffs = hasHandoffs
      ? await conn.query
          .selectFrom('studioIssueOwnerHandoffs')
          .select([
            'issueId',
            'notificationKey',
            'ownerUserId',
            'waiting',
            'rejectedAt',
            'transferredAt',
          ])
          .where('issueId', 'in', issueIds)
          .execute()
      : [];
    const needsCutoff = rows.some((row) =>
      ['run_failed_final', 'owner_handoff', 'personal_runner_consent'].includes(
        row.type,
      ),
    );
    // The most recent status transition is necessarily terminal for the candidates selected above.
    const transitions = needsCutoff
      ? await conn.query
          .selectFrom('pmActivities')
          .select('issueId')
          .select((eb) => [eb.fn.max('createdAt').as('at')])
          .where('issueId', 'in', issueIds)
          .where('action', '=', 'status_changed')
          .groupBy('issueId')
          .execute()
      : [];
    const cutoff = new Map(
      transitions.map((row) => [String(row.issueId), time(row.at)]),
    );
    const states = new Map(
      prs.map((row) => [String(row.id), String(row.state)]),
    );
    const runTimes = new Map(
      runs.map((row) => [String(row.id), time(row.createdAt)]),
    );
    for (const input of reviewInputs) {
      const id = String(input.runId);
      runTimes.set(id, Math.max(runTimes.get(id) ?? 0, time(input.at)));
    }
    const requestById = new Map(requests.map((row) => [String(row.id), row]));
    const handoffByIssue = new Map(
      handoffs.map((row) => [String(row.issueId), row]),
    );
    const repairs = new Map<string, DecisionRepair>();
    for (const { row, data } of withData) {
      let outcome: string;
      switch (row.type) {
        case 'pr_merge_requested': {
          const state = states.get(String(data.pullRequestId));
          outcome =
            state === 'merged' || state === 'closed' ? state : 'withdrawn';
          break;
        }
        case 'agent_blocked':
          outcome = 'unblocked';
          break;
        case 'run_failed_final':
          if (retried.has(String(data.runId))) {
            outcome = 'retried';
            break;
          }
          if (
            typeof data.executorType === 'string' &&
            typeof data.executorId === 'string' &&
            (data.executorType !== (row.executorType ?? '') ||
              data.executorId !== (row.executorId ?? ''))
          ) {
            outcome = 'issueReassigned';
            break;
          }
          // New review work after completion is still a real decision, including a comment steered into an existing run.
          if (
            (runTimes.get(String(data.runId)) ?? time(row.createdAt)) >
            (cutoff.get(row.subjectId) ?? 0)
          )
            continue;
          outcome = 'issueMoved';
          break;
        case 'owner_handoff': {
          const handoff = handoffByIssue.get(row.subjectId);
          if (
            handoff &&
            data.notificationKey === handoff.notificationKey &&
            handoff.ownerUserId === row.ownerUserId
          ) {
            if (handoff.rejectedAt) outcome = 'rejected';
            else if (!handoff.waiting) outcome = 'accepted';
            else if (
              time(handoff.transferredAt) > (cutoff.get(row.subjectId) ?? 0)
            )
              continue;
            else outcome = 'withdrawn';
          } else outcome = 'withdrawn';
          break;
        }
        case 'personal_runner_consent': {
          const request = requestById.get(String(data.requestId));
          if (
            request &&
            request.subjectKind === 'issue' &&
            request.subjectId === row.subjectId
          ) {
            if (request.status !== 'pending') outcome = String(request.status);
            else if (time(request.createdAt) > (cutoff.get(row.subjectId) ?? 0))
              continue;
            else outcome = 'withdrawn';
          } else outcome = 'withdrawn';
          break;
        }
        default:
          continue;
      }
      const key = `${row.source}:${row.decisionKey}`;
      const previous = repairs.get(key);
      repairs.set(key, {
        issueId: row.subjectId,
        identifier: row.identifier,
        source: row.source,
        type: row.type,
        decisionKey: row.decisionKey,
        outcome,
        count: (previous?.count ?? 0) + 1,
      });
    }
    return [...repairs.values()];
  }

  async function page(
    options: {
      execute?: boolean;
      pageToken?: string;
      pageSize?: number;
      issueId?: string;
    } = {},
  ): Promise<RepairPage> {
    const limit = Math.max(1, Math.min(options.pageSize ?? 100, 500));
    let query = candidates(options.issueId)
      .select(['n.source', 'n.decisionKey'])
      .distinct();
    if (options.pageToken) {
      const at = options.pageToken.indexOf(':');
      const source = options.pageToken.slice(0, at);
      const key = options.pageToken.slice(at + 1);
      query = query.where((eb) =>
        eb.or([
          eb('n.source', '>', source),
          eb.and([eb('n.source', '=', source), eb('n.decisionKey', '>', key)]),
        ]),
      );
    }
    const keys = await query
      .orderBy('n.source', 'asc')
      .orderBy('n.decisionKey', 'asc')
      .limit(limit + 1)
      .execute();
    const selected = keys.slice(0, limit).map((key) => ({
      source: String(key.source),
      decisionKey: String(key.decisionKey),
    }));
    let data = await plan(await read(selected, options.issueId));
    let failed = 0;
    if (options.execute && selected.length) {
      // Re-read committed issue and contributor state immediately before applying this page.
      data = await plan(await read(selected, options.issueId));
      const succeeded: DecisionRepair[] = [];
      for (const repair of data) {
        try {
          await inbox().resolve({
            source: repair.source,
            decisionKey: repair.decisionKey,
            outcome: repair.outcome,
          });
          succeeded.push(repair);
        } catch (error) {
          failed++;
          onError(error, repair.decisionKey);
        }
      }
      data = succeeded;
    }
    return {
      data,
      meta: {
        scanned: selected.length,
        execute: options.execute === true,
        failed,
        ...(keys.length > limit
          ? {
              nextPageToken: `${selected.at(-1)!.source}:${selected.at(-1)!.decisionKey}`,
            }
          : {}),
      },
    };
  }

  return {
    page,
    async issue(issueId: string): Promise<void> {
      let pageToken: string | undefined;
      do {
        const result = await page({
          execute: true,
          issueId,
          ...(pageToken ? { pageToken } : {}),
        });
        pageToken = result.meta.nextPageToken;
      } while (pageToken);
    },
  };
}

export type DecisionReconciler = ReturnType<typeof createDecisionReconciler>;

/** Only terminal transitions schedule cleanup; ordinary issue updates add no database work. */
export function bindDecisionCleanup(
  projects: Pick<
    import('@nocobase/app-plugin-projects/server/tokens').Projects,
    'events'
  >,
  reconciler: DecisionReconciler,
  onError: (error: unknown) => void,
): () => void {
  return projects.events.on('issue.updated', (event) => {
    if (!terminal.includes(event.changes.status?.to ?? '')) return;
    void reconciler.issue(event.issueId).catch(onError);
  });
}
