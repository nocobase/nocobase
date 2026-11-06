import type { ReactElement } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { NotificationTemplates } from '@nocobase/app-plugin-notification/client/templates';
import { SettingsModulePage } from './settings-module-page.js';

export default function NotificationTemplatesPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  const [query, setQuery] = useSearchParams();
  return (
    // A view of the Notifications settings module: it gains tabs once the module has another view, such as logs.
    <SettingsModulePage title={t('templates.title')}>
      <NotificationTemplates
        selectedId={query.get('template')}
        onSelect={(id) =>
          setQuery((previous) => {
            const next = new URLSearchParams(previous);
            if (id) next.set('template', id);
            else next.delete('template');
            return next;
          })
        }
      />
    </SettingsModulePage>
  );
}
