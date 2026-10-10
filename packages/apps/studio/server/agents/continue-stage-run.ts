/** An editor of the issue continues a suppressed stage action; consuming its token and resetting its count are atomic. */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { businessKey } from '@nocobase/app-plugin-projects/shared/access';

import { studioError } from '../http/errors.js';
import { createStageRules, RUN_AGENT } from './stage-rules.js';
import { stageGuardId, stageGuards } from './stage-run-guard.js';

/** A person who may change the issue; `detail` has already answered 404 when they may not see it. */
const mayContinue = (viewer: Viewer): boolean =>
  viewer.actor.type === 'user' &&
  viewer.permissions.scopes[businessKey('pm.issues', 'edit')] !== 'none';

const sameConfig = (
  a: Readonly<Record<string, unknown>>,
  b: Readonly<Record<string, unknown>>,
) =>
  JSON.stringify(Object.entries(a).sort(([x], [y]) => x.localeCompare(y))) ===
  JSON.stringify(Object.entries(b).sort(([x], [y]) => x.localeCompare(y)));

export async function pendingStageRun(
  projects: Projects,
  viewer: Viewer,
  issueId: string,
) {
  const issue = await projects.issueQueries.detail(viewer, issueId);
  if (!mayContinue(viewer)) return null;
  const guard = await stageGuards(projects.tx.read()).findOne({
    filter: { id: stageGuardId(issue.id, issue.statusKey) },
  });
  if (!guard?.pendingToken) return null;
  const catalog = await projects.workflows.catalogs.forProject(
    projects.tx.read(),
    issue.projectId,
  );
  const rule = catalog.machine.states
    .find((state) => state.key === issue.statusKey)
    ?.rules?.find((item) => item.type === RUN_AGENT);
  if (!rule || !sameConfig(rule.config ?? {}, guard.ruleConfig ?? {}))
    return null;
  const configured = rule.config?.agentId;
  const agentId =
    typeof configured === 'string' && configured.trim()
      ? configured.trim()
      : issue.executor?.type === 'agent'
        ? issue.executor.id
        : null;
  if (agentId !== guard.agentId) return null;
  return {
    token: guard.pendingToken,
    statusKey: guard.statusKey,
    maxRuns: Number(guard.ruleConfig?.maxRuns ?? 3),
    windowHours: Number(guard.ruleConfig?.windowHours ?? 24),
  };
}

export async function continueStageRun(
  projects: Projects,
  agents: Agents,
  viewer: Viewer,
  issueId: string,
  token: string,
) {
  return projects.tx.unit(async (tx) => {
    const issue = await projects.issueQueries.detail(viewer, issueId);
    if (!mayContinue(viewer))
      throw studioError(
        'PERMISSION_DENIED',
        'STAGE_CONTINUE_FORBIDDEN',
        'Only a person who may edit the issue may continue this stage action.',
      );
    const id = stageGuardId(issue.id, issue.statusKey);
    const guard = await stageGuards(tx.conn).findOne({ filter: { id } });
    const stale = () =>
      studioError(
        'FAILED_PRECONDITION',
        'STAGE_CONTINUE_STALE',
        'This stage action no longer waits to continue.',
      );
    if (!guard || guard.pendingToken !== token) throw stale();
    const catalog = await projects.workflows.catalogs.forProject(
      tx.conn,
      issue.projectId,
    );
    const status = catalog.machine.states.find(
      (state) => state.key === issue.statusKey,
    );
    const rule = status?.rules?.find((item) => item.type === RUN_AGENT);
    const config = rule?.config ?? {};
    const actualAgentId =
      typeof config.agentId === 'string' && config.agentId.trim()
        ? config.agentId.trim()
        : issue.executor?.type === 'agent'
          ? issue.executor.id
          : null;
    if (
      !status ||
      (status.category !== 'unstarted' && status.category !== 'started') ||
      !rule ||
      actualAgentId !== guard.agentId ||
      !sameConfig(config, guard.ruleConfig ?? {})
    )
      throw stale();
    const consumed = await stageGuards(tx.conn).updateMany({
      filter: { id, pendingToken: token },
      values: { pendingToken: null, resetAt: new Date().toISOString() },
    });
    if (consumed.updatedCount !== 1) throw stale();
    let current: Issue = issue;
    const runRule = createStageRules({
      agents,
      projects: () => projects,
      continuedFrom: token,
    }).find((item) => item.type === RUN_AGENT)!;
    const outcome = await runRule.entered!(
      {
        tx,
        get issue() {
          return current;
        },
        from: guard.fromStatus ?? issue.statusKey,
        status: {
          key: status.key,
          name: status.name,
          category: status.category,
        },
        actor: viewer.actor,
        async setExecutor(executor) {
          current = await projects.issues.update(viewer, current.id, {
            revision: current.revision,
            executor,
            start: false,
          });
          return current;
        },
      },
      config,
    );
    if (outcome?.status !== 'applied')
      throw studioError(
        'FAILED_PRECONDITION',
        'STAGE_CONTINUE_UNAVAILABLE',
        'The stage action cannot run now.',
        {
          metadata: {
            reason:
              outcome?.status === 'skipped' ? outcome.reason : 'unavailable',
          },
        },
      );
    tx.emit({ type: 'issue.changed', issueId: issue.id });
    return {
      runId: String(outcome.details?.runId),
      statusKey: issue.statusKey,
    };
  });
}
