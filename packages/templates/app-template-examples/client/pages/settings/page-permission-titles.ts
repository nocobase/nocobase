import type { PagePermissionTitles } from './page-permissions.js';

/** Permission labels for application pages without navigation/breadcrumb titles (including overlays).
 * Keys are existing route names; values are application translation keys.
 * Do not add navigation/breadcrumbs or change authorization ids just to name a permission.
 */
export const pagePermissionTitles: PagePermissionTitles = {
  'customer-contacts-batch': 'customerContacts.batchTitle',
  'customer-contacts-detail': 'customerContacts.customer',
  'customer-contacts-edit': 'customerContacts.editCustomer',
  'customer-contacts-new-contact': 'customerContacts.newContact',
  'customer-contacts-edit-contact': 'customerContacts.editContact',
  'skill-projects-new': 'skillProjects.create',
  'skill-projects-edit': 'skillProjects.edit',
  'runtimes-connect': 'onlineAgent.connectRuntime',
  'skills-new': 'onlineAgent.newSkill',
  'skills-detail': 'onlineAgent.skillDetail',
};
