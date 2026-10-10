/**
 * The pages a Studio role may open (`page` grants, action `access`): each assembled plugin's and Studio's own. Pages are
 * client routes, which the authorization plugin does not register on the server, so Studio lists the ones it offers
 * here; the role editor groups them as the sidebar does (`client/pages/config/members/page-groups.ts`).
 */
import * as agents from '@nocobase/app-plugin-agents/shared/access';
import * as knowledge from '@nocobase/app-plugin-knowledge/shared/access';
import * as projects from '@nocobase/app-plugin-projects/shared/access';
import * as releases from '@nocobase/app-plugin-releases/shared/access';

import { STUDIO_PAGES } from './access.js';

export const PAGES = [
  ...projects.PAGES,
  ...agents.PAGES,
  ...releases.PAGES,
  ...STUDIO_PAGES,
  ...knowledge.PAGES,
] as const;

export type Page = (typeof PAGES)[number];

export function isPage(id: string): id is Page {
  return (PAGES as readonly string[]).includes(id);
}
