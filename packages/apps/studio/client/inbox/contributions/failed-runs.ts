/**
 * The decision card of a run that failed for good (`run_failed_final`, sent by `server/agents/notices.ts` through the
 * projects plugin's notices, so source `projects`): reads like the plugin's other issue cards, and offers what the
 * card asks: retry the run, give the issue to a person, or let it be. The answer goes to
 * `POST /api/failedRuns/:runId/decide` (`server/agents/failed-runs.ts`), which carries it out with the
 * agents and projects plugins' own services and settles every recipient's card through Studio's inbox.
 *
 * Whoever owns the issue or may edit it decides; anyone else sees why not.
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
import { FailedRunActions } from './failed-runs-parts.js';
import { projectsParts, type ProjectsModel } from './projects.js';
import { paramsOf } from './projects-wording.js';

export const RUN_FAILED_TYPE = 'run_failed_final';

/** Whether the viewer may answer: the issue's owner, or someone who may edit issues and sees this one. */
function useFailedRunCanAct(
  entry: InboxEntry,
  model: ProjectsModel,
): InboxCanAct {
  const { t } = useTranslation();
  const viewer = useViewer();
  if (kindOf(entry) !== 'decision' || isSettled(entry))
    return { state: 'none' };
  if (!paramsOf(entry).runId) return { state: 'none' };
  if (model.detail.isPending || !viewer) return { state: 'loading' };
  if (
    model.detail.error instanceof ApiClientError &&
    [403, 404].includes(model.detail.error.status)
  )
    return { state: 'no', reason: t('inbox.runFailed.forbidden') };
  const owner = model.detail.data?.ownerUserId === viewer.userId;
  const editor = viewer.permissions.scopes['pm.issues/edit'] !== 'none';
  return owner || editor
    ? { state: 'yes' }
    : { state: 'no', reason: t('inbox.runFailed.forbidden') };
}

/** The card, as the projects plugin's issue cards read, with its own decision. Listed before `projectsRenderer`. */
export const failedRunRenderer = defineInboxRenderer<ProjectsModel>({
  ...projectsParts,
  types: [RUN_FAILED_TYPE],
  useCanAct: useFailedRunCanAct,
  Actions: FailedRunActions,
});
