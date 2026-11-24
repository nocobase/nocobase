import type { PagePermissionTitles } from '@nocobase/app-plugin-authorization/client/settings';

/** Permission labels for application pages without navigation/breadcrumb titles (including overlays).
 * Keys are existing route names; values are application translation keys.
 * Do not add navigation/breadcrumbs or change authorization ids just to name a permission.
 */
export const pagePermissionTitles: PagePermissionTitles = {
  'onboarding-new': 'onboarding.new',
  'onboarding-detail': 'onboarding.open',
  'procurement-new': 'procurement.new',
  'procurement-detail': 'procurement.open',
  'customer-contacts-batch': 'customerContacts.batchTitle',
  'customer-contacts-detail': 'customerContacts.customer',
  'customer-contacts-edit': 'customerContacts.editCustomer',
  'customer-contacts-new-contact': 'customerContacts.newContact',
  'customer-contacts-edit-contact': 'customerContacts.editContact',
  'skill-projects-new': 'skillProjects.create',
  'skill-projects-detail-edit': 'skillProjects.edit',
  'skill-projects-edit': 'skillProjects.edit',
  // The template detail drawer shares the list page grant.
};
