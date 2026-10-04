import type { ReactElement } from 'react';
import { PermissionsPage } from '@nocobase/app-plugin-authorization/client/management';
import { useAuthorizationTranslation } from '../i18n.js';
import { SharingRulesPanel } from './sharing-rules-panel.js';
import {
  AuthorizationPageState,
  useAuthorizationPageData,
} from '@nocobase/app-plugin-authorization/client/management';

export default function SharingRulesPage(): ReactElement {
  const t = useAuthorizationTranslation();
  const page = useAuthorizationPageData('sharingRules');
  return (
    <PermissionsPage
      title={t('sharingRules.page.title')}
      description={t('sharingRules.page.description')}
    >
      {page.options ? (
        <SharingRulesPanel options={page.options} />
      ) : (
        <AuthorizationPageState {...page} />
      )}
    </PermissionsPage>
  );
}
