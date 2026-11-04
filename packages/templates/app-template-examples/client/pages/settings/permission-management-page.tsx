import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { SettingsModulePage } from './settings-module-page.js';

/** Permission management: Roles and permissions and Default data scopes as tabs of one settings module. */
export function PermissionManagementPage({
  tab,
  actions,
  children,
}: {
  tab: 'roles' | 'default-access';
  actions?: ReactNode;
  children: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <SettingsModulePage
      title={t('settings.permissionManagement')}
      description={t(
        tab === 'roles'
          ? 'settings.rolesDescription'
          : 'settings.defaultAccess.description',
      )}
      actions={actions}
    >
      {children}
    </SettingsModulePage>
  );
}
