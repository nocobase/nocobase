/** Personal runner decisions use Studio's inbox and open the issue's single decision card. */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import { agentsTx } from './tx.js';
import type { StudioInboxPort } from '../inbox/port.js';

export function bindCommentConsentInbox(
  agents: Pick<Agents, 'events' | 'runs' | 'claims'>,
  projects: () => Pick<Projects, 'tx' | 'issueContext'>,
  port: () => StudioInboxPort | undefined,
  onError: (error: unknown) => void,
): () => void {
  return agents.events.onAny((event) => {
    if (event.type === 'run.changed' && event.status !== 'queued') {
      void agents.runs
        .get(event.runId)
        .then(async (run) => {
          if (run.commentRootRunId)
            await projects().tx.run((tx) =>
              agents.claims.reconcileCommentConsent(agentsTx(tx), event.runId),
            );
        })
        .catch(onError);
      return;
    }
    if (
      !('request' in event) ||
      event.request.purpose !== 'personalRunner' ||
      event.request.subject.kind !== 'issue'
    )
      return;
    const request = event.request;
    void (async () => {
      await projects().tx.run(async (tx) => {
        tx.emit({ type: 'issue.changed', issueId: request.subject.id });
      });
      const inbox = port();
      if (!inbox) return;
      const decisionKey = `personal-runner:${request.id}`;
      if (event.type === 'runRequest.created') {
        const current = await agents.runs.requests.get(request.id);
        if (current.status !== 'pending') return;
        const origin = await projects().tx.run(async (tx) => ({
          issue: await projects().issueContext.contextFor(
            tx.conn,
            request.subject.id,
            { kind: 'agent' },
          ),
          run: await agents.runs.identityInputs(
            tx.conn,
            request.commentRootRunId!,
          ),
        }));
        if (!origin.issue) return;
        const comment =
          origin.run?.inputs.find(
            (input) =>
              input.type === 'comment' &&
              (input.payload as Record<string, unknown> | null)
                ?.commentSourceSnapshot === true,
          ) ?? origin.run?.inputs.find((input) => input.type === 'comment');
        await inbox.send({
          key: decisionKey,
          source: 'runners',
          kind: 'decision',
          type: 'personal_runner_consent',
          decisionKey,
          userIds: [request.responsibleUserId],
          title: `${current.requestedByName ?? comment?.actor.name ?? 'A commenter'} requests your personal runner`,
          body: comment?.text ?? request.input.text,
          path: origin.issue.url,
          subject: {
            type: 'issue',
            id: origin.issue.id,
            label: origin.issue.identifier,
          },
          data: { requestId: request.id },
        });
        const latest = await agents.runs.requests.get(request.id);
        if (latest.status !== 'pending')
          await inbox.resolve({
            source: 'runners',
            decisionKey,
            outcome: latest.status,
          });
      } else {
        await inbox.resolve({
          source: 'runners',
          decisionKey,
          outcome: request.status,
        });
        if (event.type === 'runRequest.rejected') {
          const issue = await projects().tx.run((tx) =>
            projects().issueContext.contextFor(tx.conn, request.subject.id, {
              kind: 'agent',
            }),
          );
          if (issue)
            await inbox.send({
              key: `${decisionKey}:rejected`,
              source: 'runners',
              kind: 'info',
              type: 'personal_runner_rejected',
              userIds: [request.requestedByUserId],
              title: `Personal runner request rejected: ${issue.identifier}`,
              body: 'The owner declined this comment run. You can run it as yourself on the issue.',
              path: issue.url,
              subject: { type: 'issue', id: issue.id, label: issue.identifier },
              data: { requestId: request.id },
            });
        }
      }
    })().catch(onError);
  });
}
