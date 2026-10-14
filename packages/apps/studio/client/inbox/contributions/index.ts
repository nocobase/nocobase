/**
 * Studio's own inbox contributors: the projects plugin's notices (with a failed run's decision card, `failed-runs.ts`,
 * a blocked agent's, `blocked.ts`, and
 * a suggested executor's, `suggestions.ts`), release management's deployment requests and failed deployments (`releases.ts`), Studio's pull
 * requests (`client/git/inbox.tsx`), issue previews and releases waiting (`previews.ts`), reopening what a deployment no longer runs (`reopen.ts`), the agents plugin's
 * notices, such as a runtime that needs an upgrade (`agents.ts`), knowledge proposals (`knowledge.ts`), a repository's CI key that could not be rotated or was revoked (`ci.ts`),
 * and what a 「我的 Agent」 session's agent did while its owner was not looking (`agent-sessions.ts`).
 */
import { gitRenderer } from '../../git/inbox.js';
import type { InboxRegistry } from '@/extensions/nocobase-inbox/registry';
import { agentSessionsRenderer } from './agent-sessions.js';
import { ciRenderer } from './ci.js';
import { runnersRenderer } from './runners.js';
import { blockedRenderer } from './blocked.js';
import { failedRunRenderer } from './failed-runs.js';
import { knowledgeRenderer } from './knowledge.js';
import { deploysRenderer, previewsRenderer } from './previews.js';
import { projectsRenderer } from './projects.js';
import { releasesRenderer } from './releases.js';
import { reopenRenderer } from './reopen.js';
import { suggestionRenderer } from './suggestions.js';

export const studioInboxRegistry: InboxRegistry = {
  // A failed run's card, a blocked agent's and a suggested executor's are projects notices with their own decisions:
  // listed before the projects renderer.
  renderers: [
    failedRunRenderer,
    blockedRenderer,
    suggestionRenderer,
    projectsRenderer,
    releasesRenderer,
    gitRenderer,
    previewsRenderer,
    reopenRenderer,
    deploysRenderer,
    runnersRenderer,
    knowledgeRenderer,
    ciRenderer,
    agentSessionsRenderer,
  ],
  feeds: [],
};
