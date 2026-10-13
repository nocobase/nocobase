/**
 * The decision card of an agent that reported itself blocked (`agent_blocked`, sent by `server/agents/blocked.ts`
 * through the projects plugin's notices, so source `projects`), titled "Agent blocked": the
 * agent's question, and what the owner may do about it — answer it with a comment (the agent hears it), unblock the
 * issue (back to the status it was blocked from), or give it to a person. Each goes through the projects plugin's own
 * API; the server settles the card once it is answered, unblocked or reassigned.
 *
 * Whoever owns the issue or may edit it acts; anyone else sees why not.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';

import {
  isSettled,
  kindOf,
  type InboxEntry,
} from '@/extensions/nocobase-inbox/model';
import {
  defineInboxRenderer,
  type InboxCanAct,
} from '@/extensions/nocobase-inbox/registry';
import { BlockedActions, BlockedBrief } from './blocked-parts.js';
import { projectsParts, type ProjectsModel } from './projects.js';

export const AGENT_BLOCKED_TYPE = 'agent_blocked';

function useBlockedCanAct(
  entry: InboxEntry,
  model: ProjectsModel,
): InboxCanAct {
  const { t } = useTranslation();
  const viewer = useViewer();
  if (kindOf(entry) !== 'decision' || isSettled(entry))
    return { state: 'none' };
  if (model.detail.isPending || !viewer) return { state: 'loading' };
  if (
    model.detail.error instanceof ApiClientError &&
    [403, 404].includes(model.detail.error.status)
  )
    return { state: 'no', reason: t('inbox.blocked.forbidden') };
  if (model.detail.data?.ownerUserId === viewer.userId) return { state: 'yes' };
  return viewer.permissions.scopes['pm.issues/edit'] !== 'none'
    ? { state: 'yes' }
    : { state: 'no', reason: t('inbox.blocked.forbidden') };
}

/** The card, as the projects plugin's issue cards read, with its own decision. Listed before `projectsRenderer`. */
export const blockedRenderer = defineInboxRenderer<ProjectsModel>({
  ...projectsParts,
  types: [AGENT_BLOCKED_TYPE],
  useCanAct: useBlockedCanAct,
  Actions: BlockedActions,
  // On the issue page, the agent's question under the card's title.
  Brief: BlockedBrief,
});
