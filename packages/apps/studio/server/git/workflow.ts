/**
 * What Studio's pull requests add to the projects plugin's workflows, registered before any template that uses them is
 * installed (`StudioGitProvider` boots before `StudioAgentsProvider`, which adds the "Software development" template):
 *
 * - the workflow event `studio.merged` (`projectsWorkflowEventsToken`): every counted pull request of the issue is
 *   merged. A transition on it may leave a started status and enter a finished one; Studio fires it (`flow.ts`).
 * - the entry condition `prMerged` (`projectsStatusRulesToken`, a rule type with only `canEnter`): the issue enters the
 *   status only with at least `min` (1 by default) merged pull requests, whoever moves it; 409 `PR_NOT_MERGED`
 *   otherwise. The default template does not use it.
 */
import type {
  StatusRuleType,
  StatusRuleTypes,
  WorkflowEventTypes,
} from '@nocobase/app-plugin-projects/server/tokens';

import { MERGED_EVENT, PR_MERGED_RULE } from '../../shared/git.js';
import { pullRequestsOfIssue } from './store.js';

export const PR_MERGED_MIN_MAX = 20;

function minOf(config: Readonly<Record<string, unknown>>): number {
  return typeof config.min === 'number' ? config.min : 1;
}

export const prMergedRule: StatusRuleType = {
  type: PR_MERGED_RULE,
  categories: ['started', 'done'],
  validate: (config) => [
    ...Object.keys(config)
      .filter((field) => field !== 'min')
      .map((field) => ({ path: field, message: 'Unknown field.' })),
    ...(config.min === undefined ||
    (Number.isInteger(config.min) &&
      (config.min as number) >= 1 &&
      (config.min as number) <= PR_MERGED_MIN_MAX)
      ? []
      : [
          {
            path: 'min',
            message: `min is a whole number from 1 to ${PR_MERGED_MIN_MAX}.`,
          },
        ]),
  ],
  describe: (config) => ({
    summary: `Entered only with at least ${minOf(config)} merged pull request${minOf(config) === 1 ? '' : 's'}.`,
  }),
  async canEnter(check, config) {
    const required = minOf(config);
    const merged = (
      await pullRequestsOfIssue(check.tx.conn, check.issue.id)
    ).filter(({ pr }) => pr.state === 'merged').length;
    if (merged >= required) return null;
    return {
      code: 'PR_NOT_MERGED',
      message: `${check.issue.identifier} enters ${check.status.name} only with ${required} merged pull request${required === 1 ? '' : 's'}; it has ${merged}.`,
      details: { required, merged },
    };
  },
};

/** Registers the event and the condition; returns what removes them. */
export function registerGitWorkflow(deps: {
  readonly events?: WorkflowEventTypes;
  readonly statusRules?: StatusRuleTypes;
}): () => void {
  const releases: (() => void)[] = [];
  if (deps.events)
    releases.push(
      deps.events.add({
        key: MERGED_EVENT,
        from: ['started'],
        to: ['done'],
      }),
    );
  if (deps.statusRules) releases.push(deps.statusRules.add(prMergedRule));
  return () => {
    for (const release of releases.splice(0).reverse()) release();
  };
}
