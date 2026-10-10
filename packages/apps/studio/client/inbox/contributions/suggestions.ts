/**
 * The decision card of a suggested executor (`executor_suggested`, sent by `server/agents/stage-rules.ts` through the
 * projects plugin's notices, so source `projects`): a workflow status suggests an agent for the issue, and its owner
 * accepts in one click or dismisses it. The change behind the
 * card is a one-row operation plan of the projects plugin (`data.planId`): Accept executes it (checking it again
 * first when it went out of date), Dismiss voids it, through the plugin's own API. The server settles every
 * recipient's card once the plan is no longer open (`settleSuggestions`).
 */
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
import { projectsParts, type ProjectsModel } from './projects.js';
import { paramsOf } from './projects-wording.js';
import { SuggestionActions } from './suggestions-parts.js';
import { useSuggestionPlan } from './suggestions-plan.js';

export const EXECUTOR_SUGGESTED_TYPE = 'executor_suggested';

/** Plan states in which the suggestion can still be accepted. */
const OPEN: ReadonlySet<string> = new Set(['pending', 'failed', 'stale']);

function useSuggestionCanAct(
  entry: InboxEntry,
  model: ProjectsModel,
): InboxCanAct {
  const { t } = useTranslation();
  const viewer = useViewer();
  const plan = useSuggestionPlan(entry);
  if (
    kindOf(entry) !== 'decision' ||
    isSettled(entry) ||
    !paramsOf(entry).planId
  )
    return { state: 'none' };
  if (plan.isPending || !viewer) return { state: 'loading' };
  if (!plan.data || !OPEN.has(plan.data.status))
    return { state: 'no', reason: t('inbox.suggestion.gone') };
  return plan.data.deciderUserId === viewer.userId ||
    model.detail.data?.ownerUserId === viewer.userId
    ? { state: 'yes' }
    : { state: 'no', reason: t('inbox.suggestion.forbidden') };
}

/** The card, as the projects plugin's issue cards read, with its own decision. Listed before `projectsRenderer`. */
export const suggestionRenderer = defineInboxRenderer<ProjectsModel>({
  ...projectsParts,
  types: [EXECUTOR_SUGGESTED_TYPE],
  useCanAct: useSuggestionCanAct,
  Actions: SuggestionActions,
});
