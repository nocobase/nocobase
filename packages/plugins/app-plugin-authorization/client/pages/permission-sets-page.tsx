import { PermissionsPage } from '../components/page-shell.js';
import { useAuthorizationTranslation } from '../i18n.js';
import type { ReactElement } from 'react';
import { useResourceOptions } from '../components/use-resource-options.js';
import { PermissionSetsPanel } from './permission-sets/index.js';
import {
  AuthorizationPageState,
  useAuthorizationPageData,
} from './page-support.js';

export default function PermissionSetsPage(): ReactElement {
  const t = useAuthorizationTranslation();
  const page = useAuthorizationPageData('permissionSets');
  const options = useResourceOptions(page.options);
  return (
    <PermissionsPage
      title={t('permissionSets.page.title')}
      description={t('permissionSets.page.description')}
    >
      {options ? (
        <PermissionSetsPanel options={options} />
      ) : (
        <AuthorizationPageState {...page} />
      )}
    </PermissionsPage>
  );
}
