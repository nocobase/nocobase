import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import MailWorkspacePage from './mail-workspace-page.js';
export { default as MailSendDevPage } from './mail-send-page.js';

export function MailCenterDevPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <MailWorkspacePage
      title={t('dev.centerTitle', { defaultValue: 'Mail center' })}
      description={t('dev.centerDescription', {
        defaultValue: 'Search, synchronize, and read your mail.',
      })}
    />
  );
}

export default MailCenterDevPage;
