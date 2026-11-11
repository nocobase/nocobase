import type { ReactElement } from 'react';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { NotificationTemplates } from '@nocobase/app-plugin-notification/client/templates';
import { SettingsModulePage } from './settings-module-page.js';

export default function NotificationTemplatesPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  // The child route `:templateId` gives each template its own address; its details open in the block's drawer.
  const { templateId } = useParams();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const legacy = query.get('template');
  // Earlier links kept the selected template in the query string.
  if (legacy && !templateId)
    return <Navigate replace to={encodeURIComponent(legacy)} />;
  return (
    // A view of the Notifications settings module: it gains tabs once the module has another view, such as logs.
    <SettingsModulePage title={t('templates.title')}>
      <NotificationTemplates
        selectedId={templateId ?? null}
        onSelect={(id) => {
          // Paths resolve against this page's route, also while a template is open.
          void navigate(id ? encodeURIComponent(id) : '.');
        }}
      />
    </SettingsModulePage>
  );
}
