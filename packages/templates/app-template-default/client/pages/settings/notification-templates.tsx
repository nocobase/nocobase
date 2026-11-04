import type { ReactElement } from 'react';
import { useSearchParams } from 'react-router';
import { NotificationTemplates } from '@nocobase/app-plugin-notification/client/templates';

import { SettingsModulePage } from './settings-module-page.js';

/**
 * Notification templates, one view of the Notification management settings module: the module's heading sits above
 * its tabs, so a sibling view such as Delivery logs shares one heading with this one.
 */
export default function NotificationTemplatesPage(): ReactElement {
  const [query, setQuery] = useSearchParams();
  return (
    <SettingsModulePage>
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
