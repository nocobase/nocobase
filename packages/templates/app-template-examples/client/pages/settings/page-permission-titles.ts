import type { PagePermissionTitles } from './page-permissions.js';

/** Permission labels for application pages without navigation/breadcrumb titles (including overlays).
 * Keys are existing route names; values are application translation keys.
 * Do not add navigation/breadcrumbs or change authorization ids just to name a permission.
 */
export const pagePermissionTitles: PagePermissionTitles = {
  'procurement-new': 'procurement.new',
  'procurement-detail': 'procurement.open',
  'skill-projects-new': 'skillProjects.create',
  'skill-projects-edit': 'skillProjects.edit',
  'runtimes-connect': 'onlineAgent.connectRuntime',
  'skills-new': 'onlineAgent.newSkill',
  'skills-detail': 'onlineAgent.skillDetail',
};
