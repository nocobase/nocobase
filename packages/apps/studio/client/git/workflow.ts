/**
 * What Studio's pull requests add to the projects plugin's statuses: the title of the status event `studio.merged`,
 * which moves an issue to done once its pull requests are merged. The server registers the same key
 * (`server/git/workflow.ts`).
 */
import type { StatusEventUI } from '@nocobase/app-plugin-projects/client/kit';

import { STUDIO_NAMESPACE } from '../../shared/access.js';
import { MERGED_EVENT } from '../../shared/git.js';

export const GIT_STATUS_EVENTS: readonly StatusEventUI[] = [
  {
    key: MERGED_EVENT,
    title: { key: 'studioGit.event.title', ns: STUDIO_NAMESPACE },
  },
];
