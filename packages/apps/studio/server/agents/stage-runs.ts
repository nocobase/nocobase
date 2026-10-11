import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { RunInput } from '@nocobase/agent-protocol';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import { ISSUE_SUBJECT } from './catalog/triggers.js';
import { jsonObject } from './values.js';
import { systemViewer } from '../previews/sources.js';

const STARTS = new Set([
  'stageEntered',
  'created',
  'assigned',
  'unblocked',
  'projectChanged',
  'ownerChanged',
  'subtasksFinished',
  'statusChange',
]);

/** Version fences refer to instructions, never to the person's comment body. Unmarked old input stays intact. */
export function obsoleteStageInput(
  input: RunInput,
  issueId: string,
  statusKey: string,
  revision: number,
): boolean {
  const payload = jsonObject(input.payload);
  const version = jsonObject(payload.stageInputVersion);
  return (
    version.issueId === issueId &&
    version.statusKey === statusKey &&
    typeof version.revision === 'number' &&
    version.revision < revision
  );
}

export function bindStageRuns(
  projects: Pick<Projects, 'events' | 'tx' | 'issueQueries'>,
  agents: Pick<Agents, 'runs'>,
  onError: (error: unknown) => void,
): () => void {
  return projects.events.on('issue.updated', (event) => {
    const status = event.changes.status;
    if (!status) return;
    const reconcile = async () => {
      const subject = { kind: ISSUE_SUBJECT, id: event.issueId };
      const issue = await projects.issueQueries.detail(
        systemViewer(),
        event.issueId,
      );
      for (const run of await agents.runs.openOn(projects.tx.read(), subject)) {
        if (run.status !== 'queued') continue;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const inputs = await agents.runs.pendingInputs(
            projects.tx.read(),
            run.id,
          );
          const obsolete = inputs.filter((input) =>
            obsoleteStageInput(
              input,
              event.issueId,
              status.from,
              event.revision,
            ),
          );
          if (obsolete.length === 0) break;
          const onlyOldStarts =
            obsolete.length === inputs.length &&
            inputs.every((input) => {
              const payload = jsonObject(input.payload);
              return (
                input.type !== 'comment' &&
                STARTS.has(String(payload.trigger)) &&
                (payload.to === status.from || payload.status === status.from)
              );
            });
          const key = `${event.issueId}:${event.revision}:${run.id}`;
          if (
            inputs.some(
              (input) => jsonObject(input.payload).reconciliationKey === key,
            )
          )
            break;
          const result = await agents.runs.reconcileQueued({
            runId: run.id,
            expectedPendingInputIds: inputs.map((input) => input.id),
            operation: onlyOldStarts
              ? {
                  type: 'cancel',
                  byUserId:
                    event.actor.type === 'user' && event.actor.id
                      ? event.actor.id
                      : issue.ownerUserId,
                  detail: `The issue left ${status.from} at revision ${event.revision}.`,
                }
              : {
                  type: 'signal',
                  key,
                  input: {
                    type: 'signal',
                    actor: { kind: 'system', id: 'system', name: 'Studio' },
                    text: 'Ignore only the stage instructions in the listed obsolete inputs. Their comment bodies and all newer instructions still need handling.',
                    payload: {
                      trigger: 'stageLeft',
                      obsoleteInputIds: obsolete.map((input) => input.id),
                      from: status.from,
                      to: status.to,
                      revision: event.revision,
                    },
                  },
                },
          });
          if (result !== 'inputsChanged') break;
          await new Promise((resolve) =>
            setTimeout(resolve, 25 * 2 ** attempt),
          );
          // Reclassify a fresh snapshot. Under sustained contention leave work intact; never cancel unconditionally.
        }
      }
    };
    void reconcile().catch(onError);
  });
}
