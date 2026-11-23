import { useClientApplication } from '@nocobase/app-client';
import type { ReactElement } from 'react';

import { MAIL_ACCOUNTS_PAGE_PATH } from '../../shared/paths.js';
import MailWorkspacePage from './mail-workspace-page.js';

// Registered by this plugin unless personal settings are off or the application excludes it.
const MAIL_ACCOUNTS_ROUTE_ID = '@nocobase/app-plugin-mail:mailAccounts';

/** The `mail` route: the workspace, linking to the personal Mail accounts page to connect or reauthorize accounts. */
export default function MailPage(): ReactElement {
  const { routes } = useClientApplication().runtime;
  const hasAccountsPage = routes.some(function visit(route): boolean {
    return route.id === MAIL_ACCOUNTS_ROUTE_ID || !!route.children?.some(visit);
  });
  return (
    <MailWorkspacePage
      accountsHref={hasAccountsPage ? MAIL_ACCOUNTS_PAGE_PATH : undefined}
    />
  );
}
