/** Manager-created delegations are identified by the immutable first input, never a later appended mention. */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  Run,
  ModelSelectionWait,
} from '@nocobase/app-plugin-agents/shared/runs';
import type { DatabaseConnection } from '@nocobase/db';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { readManagerSettings } from './manager/settings.js';
import { jsonObject } from './values.js';

export interface DispatchInput {
  readonly id: string;
  readonly runId: string;
  readonly text: string;
  readonly actorKind: string;
  readonly actorId: string;
  readonly payload: unknown;
}
export async function firstDispatch(
  conn: DatabaseConnection,
  runId: string,
): Promise<DispatchInput | null> {
  return (
    (await conn.repository<DispatchInput>('agRunInputs').findOne({
      filter: { runId },
      sort: (s) => [s.field('createdAt').asc(), s.field('id').asc()],
    })) ?? null
  );
}
/** The marker belongs only to the input that created the run, independent of clock skew and input sort order. */
export async function managerDispatchInput(
  conn: DatabaseConnection,
  runId: string,
): Promise<DispatchInput | null> {
  const inputs = await conn
    .repository<DispatchInput>('agRunInputs')
    .findMany({ filter: { runId } });
  return (
    inputs.find((input) => {
      const payload = jsonObject(input.payload);
      const source = jsonObject(payload.managerDelegation);
      return (
        input.actorKind === 'agent' &&
        input.actorId === PROJECT_MANAGER_ID &&
        payload.trigger === 'mention' &&
        source.delegatedBy === PROJECT_MANAGER_ID &&
        source.inputId === input.id &&
        typeof source.commentId === 'string'
      );
    }) ?? null
  );
}
export async function managerDelegation(
  conn: DatabaseConnection,
  run: Run,
): Promise<{ readonly commentId: string } | null> {
  type SourceRun = Pick<
    Run,
    'id' | 'subject' | 'agentId' | 'actorUserId' | 'retryOfRunId'
  >;
  let current: SourceRun = run;
  const seen = new Set<string>();
  while (!seen.has(current.id)) {
    seen.add(current.id);
    if (
      current.subject.kind !== 'issue' ||
      current.agentId === PROJECT_MANAGER_ID
    )
      return null;
    const input = await managerDispatchInput(conn, current.id);
    if (input) {
      const payload = jsonObject(input.payload);
      const source = jsonObject(payload.managerDelegation);
      if (
        source.actorUserId === current.actorUserId &&
        typeof source.commentId === 'string'
      )
        return { commentId: source.commentId };
    }
    if (!current.retryOfRunId) return null;
    // A retry's server-owned lineage can inherit the original dispatch, while copied inputs retain their old IDs.
    const previous = await conn
      .repository<{
        id: string;
        subjectKind: string;
        subjectId: string;
        agentId: string;
        actorUserId: string;
        retryOfRunId: string | null;
      }>('agRuns')
      .findOne({ filter: { id: current.retryOfRunId } });
    if (
      !previous ||
      previous.subjectKind !== current.subject.kind ||
      previous.subjectId !== current.subject.id ||
      previous.agentId !== current.agentId
    )
      return null;
    current = {
      ...previous,
      subject: { kind: previous.subjectKind, id: previous.subjectId },
    };
  }
  return null;
}
const REASONS: Readonly<Record<string, string>> = {
  ready: 'waiting for the next claim poll',
  busy: 'compatible runners are full',
  noSharedRunner: 'only other people’s personal runners are connected',
  toolNotInstalled: 'no connected runner has this tool installed',
  toolUnavailable:
    'the tool is not signed in, enabled, or able to use this model',
  incompatible:
    'connected runners do not support this workload; upgrade required',
  offline: 'runners are offline',
  restricted: 'runner policy, directory, or variable restrictions',
  concurrencyFull: 'agent concurrency limit reached',
  sameWorkActive: 'another run holds this step’s workspace',
  delayed: 'waiting for the scheduled time',
  unknown: 'workload eligibility could not be established',
};
const REASONS_ZH: Readonly<Record<string, string>> = {
  ready: '等待下一次领取轮询',
  busy: '可承接的执行机满载',
  noSharedRunner: '仅他人的个人执行机在线',
  toolNotInstalled: '在线执行机未安装工具',
  toolUnavailable: '工具未登录、被禁用或模型不可用',
  incompatible: '执行机不支持本次负载，需要升级',
  offline: '执行机离线',
  restricted: '执行机策略、目录或变量限制',
  concurrencyFull: 'agent 并发达到上限',
  sameWorkActive: '同一步骤仍有运行占用工作目录',
  delayed: '等待计划执行时间',
  unknown: '尚不能确认本次负载的可承接条件',
};
export function timeoutDetail(
  wait: ModelSelectionWait | null,
  waitedSeconds: number,
  sampledAt: string,
  actorUserId: string,
  chinese = false,
): string {
  const words = chinese ? REASONS_ZH : REASONS;
  const reasons =
    wait?.entries
      .map((entry) => {
        // Public issue comments do not disclose other people's machines, even if the acting user manages runners.
        const loads = entry.runners
          .filter((runner) => runner.ownerUserId === actorUserId)
          .map((runner) =>
            runner.used === undefined
              ? `${runner.name}: ${words[runner.reason ?? 'unknown']}`
              : `${runner.name}: ${chinese ? '总槽位' : 'slots'} ${runner.used}/${runner.limit}, ${entry.tool} ${runner.toolUsed}/${runner.toolLimit}${runner.reportedFree === 0 || runner.reportedTotalFree === 0 ? (chinese ? '，执行机报告无空闲容量' : ', runner reports no free capacity') : ''}`,
          );
        const capacity = entry.runners.filter(
          (runner) => runner.used !== undefined,
        );
        const reported = capacity
          .map((runner) => String(runner.reportedTotalFree ?? '—'))
          .join(', ');
        const aggregate = capacity.length
          ? ` [${chinese ? '总槽位' : 'slots'} ${capacity.reduce((n, runner) => n + (runner.used ?? 0), 0)}/${capacity.reduce((n, runner) => n + (runner.limit ?? 0), 0)}; ${entry.tool} ${capacity.reduce((n, runner) => n + (runner.toolUsed ?? 0), 0)}/${capacity.reduce((n, runner) => n + (runner.toolLimit ?? 0), 0)}; ${chinese ? '跨应用报告空位' : 'reported free across apps'} ${reported}]`
          : '';
        return `${entry.tool}${entry.model ? ` · ${entry.model}` : ''}: ${[...new Set([entry.reason, ...(entry.blockers ?? [])])].map((reason) => words[reason] ?? reason).join(', ')}${aggregate}${loads.length ? ` (${loads.join('; ')})` : ''}`;
      })
      .join('; ') ?? words.unknown;
  if (chinese)
    return `排队 ${Math.floor(waitedSeconds)} 秒未被领取，运行已撤回。${reasons}。采样时间：${sampledAt}。这不计作实现失败。`;
  return `Queued for ${Math.floor(waitedSeconds)} seconds without being claimed; the run has been withdrawn. ${reasons}. Sampled at ${sampledAt}. This is not an implementation failure.`;
}
export function delegationTimeout(agents: Pick<Agents, 'claims' | 'agents'>): (
  conn: DatabaseConnection,
  run: Run,
  now: Date,
) => Promise<{
  readonly reason: 'delegatedQueueTimeout';
  readonly detail: string;
} | null> {
  return async (conn, run, sampledAt) => {
    if (!(await managerDelegation(conn, run))) return null;
    const settings = await readManagerSettings(conn);
    const now = sampledAt.getTime();
    const start = Math.max(
      Date.parse(run.queueEnteredAt ?? run.createdAt),
      run.availableAt ? Date.parse(run.availableAt) : 0,
    );
    const elapsed = (now - start) / 1000;
    if (elapsed < settings.delegationQueueTimeoutSeconds) return null;
    const agent = await agents.agents.findWorkable(conn, run.agentId);
    const wait = agent ? await agents.claims.diagnose(conn, run, agent) : null;
    return {
      reason: 'delegatedQueueTimeout',
      detail: timeoutDetail(
        wait,
        elapsed,
        new Date(now).toISOString(),
        run.actorUserId,
        /\p{Script=Han}/u.test(
          (await managerDispatchInput(conn, run.id))?.text ?? '',
        ),
      ),
    };
  };
}
