import { Bell, FileText } from 'lucide-react';
import { defineAppRoutes } from '@nocobase/app-client/plugins';

/** Enable once notification business scenarios are used. Reuse this module for logs and other real views. */
export const notificationTemplateRoute = {
  name: 'notificationTemplates',
  path: '/settings/notifications/templates',
  auth: 'required' as const,
  authz: {
    resource: { type: 'page', id: 'notification.templates' },
    action: 'access',
  },
  navigation: { title: 'settings.notificationTemplates', icon: FileText },
  breadcrumb: { title: 'settings.notificationTemplates' },
  componentLoader: () => import('./notification-templates.js'),
};

const notificationManagementRoutes = defineAppRoutes([
  {
    name: 'notificationManagement',
    parent: 'settings',
    navigation: { title: 'settings.notificationManagement', icon: Bell },
    breadcrumb: { title: 'settings.notificationManagement' },
    children: [notificationTemplateRoute],
  },
]);

export default notificationManagementRoutes;
