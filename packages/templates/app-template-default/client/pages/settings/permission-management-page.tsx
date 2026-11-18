import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { SettingsModulePage } from './settings-module-page.js';

/** Permission management: Roles and permissions, Default data scopes and Permission check as tabs of one module. */
export function PermissionManagementPage({
  tab,
  actions,
  children,
}: {
  tab: 'roles' | 'default-access' | 'permission-check';
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
          : tab === 'permission-check'
            ? 'settings.permissionCheck.description'
            : 'settings.defaultAccess.description',
      )}
      actions={actions}
    >
      {children}
    </SettingsModulePage>
  );
}
