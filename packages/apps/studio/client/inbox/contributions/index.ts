/**
 * Studio's own inbox contributors: the projects plugin's notices (with a failed run's decision card, `failed-runs.ts`,
 * a blocked agent's, `blocked.ts`,
 * a suggested executor's, `suggestions.ts`, and a design proposal's, `design.ts`), release management's deployment requests and failed deployments (`releases.ts`), Studio's pull
 * requests (`client/git/inbox.tsx`), issue previews and releases waiting (`previews.ts`), reopening what a deployment no longer runs (`reopen.ts`), the agents plugin's
 * notices, such as a runtime that needs an upgrade (`agents.ts`), knowledge proposals (`knowledge.ts`), and a repository's CI key that could not be rotated or was revoked (`ci.ts`).
 */
import { gitRenderer } from '../../git/inbox.js';
import type { InboxRegistry } from '@/extensions/nocobase-inbox/registry';
import { ciRenderer } from './ci.js';
import { runnersRenderer } from './runners.js';
import { blockedRenderer } from './blocked.js';
import { designRenderer } from './design.js';
import { failedRunRenderer } from './failed-runs.js';
import { knowledgeRenderer } from './knowledge.js';
import { deploysRenderer, previewsRenderer } from './previews.js';
import { projectsRenderer } from './projects.js';
import { releasesRenderer } from './releases.js';
import { reopenRenderer } from './reopen.js';
import { suggestionRenderer } from './suggestions.js';

export const studioInboxRegistry: InboxRegistry = {
  // A failed run's card, a blocked agent's, a suggested executor's and a design proposal's are projects notices with
  // their own decisions: listed before the projects renderer.
  renderers: [
    failedRunRenderer,
    blockedRenderer,
    suggestionRenderer,
    designRenderer,
    projectsRenderer,
    releasesRenderer,
    gitRenderer,
    previewsRenderer,
    reopenRenderer,
    deploysRenderer,
    runnersRenderer,
    knowledgeRenderer,
    ciRenderer,
  ],
  feeds: [],
};
