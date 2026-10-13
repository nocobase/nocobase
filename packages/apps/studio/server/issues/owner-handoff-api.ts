import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import { createAgentWork } from '../agents/work.js';
import { studioError } from '../http/errors.js';
import { decideOwnerHandoff, readOwnerHandoff } from './owner-handoff.js';
import { announceOwnerHandoff } from './owner-handoff-notices.js';

export function createOwnerHandoffApi(projects: Projects, agents: Agents) {
  const work = createAgentWork({ agents, projects: () => projects });
  return {
    async read(viewer: Viewer, key: string, personUserId: string | null) {
      const issue = await projects.issueQueries.detail(viewer, key);
      const handoff = await readOwnerHandoff(projects.tx.read(), issue.id);
      const canClaim = Boolean(
        handoff?.waiting &&
        handoff.ownerUserId === issue.ownerUserId &&
        personUserId === issue.ownerUserId &&
        viewer.permissions.scopes['pm.issues/edit'] !== 'none',
      );
      return {
        handoff,
        canClaim,
        canDecide: Boolean(
          handoff?.waiting &&
          !handoff.rejectedAt &&
          handoff.ownerUserId === issue.ownerUserId &&
          personUserId === issue.ownerUserId &&
          viewer.permissions.scopes['pm.issues/edit'] !== 'none',
        ),
      };
    },
    async decide(
      viewer: Viewer,
      key: string,
      personUserId: string | null,
      notificationKey: string,
      decision: 'accept' | 'reject',
    ) {
      if (
        !personUserId ||
        viewer.actor.type !== 'user' ||
        viewer.permissions.scopes['pm.issues/edit'] === 'none'
      )
        throw studioError(
          'PERMISSION_DENIED',
          'ISSUE_OWNER_HANDOFF_REQUIRED',
          'Only a person with issue editing permission may decide this handoff.',
        );
      return projects.tx.unit(async (tx) => {
        const issue = await projects.issueQueries.detail(viewer, key);
        const handoff = await decideOwnerHandoff(tx.conn, {
          issue,
          authenticatedPersonUserId: personUserId,
          notificationKey,
          decision,
        });
        await projects.activity.record(tx.conn, {
          issueId: issue.id,
          actor: viewer.actor,
          action:
            decision === 'accept'
              ? 'studio_owner_accepted'
              : 'studio_owner_rejected',
          details: { ownerUserId: issue.ownerUserId },
        });
        announceOwnerHandoff(tx, issue, handoff, undefined, decision);
        const run =
          decision === 'accept'
            ? await work.takeOver(tx, issue, viewer.actor, viewer)
            : null;
        tx.emit({ type: 'issue.changed', issueId: issue.id });
        return { handoff, runId: run?.runId ?? null };
      });
    },
  };
}
