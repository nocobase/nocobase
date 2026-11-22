import type { ReactElement } from 'react';

import { MAIL_ACCOUNTS_PAGE_PATH } from '../../shared/paths.js';
import MailWorkspacePage from './mail-workspace-page.js';

/** The `mail` route: the workspace, linking to the personal Mail accounts page to connect or reauthorize accounts. */
export default function MailPage(): ReactElement {
  return <MailWorkspacePage accountsHref={MAIL_ACCOUNTS_PAGE_PATH} />;
}
