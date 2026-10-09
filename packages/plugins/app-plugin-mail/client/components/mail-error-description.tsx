import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import type { MailPublicError } from '../../shared/mail.js';
import { mailErrorDescription } from '../lib/mail-error-description.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';

export function MailErrorDescription({
  error,
}: {
  readonly error: Pick<MailPublicError, 'category' | 'reasonCode'>;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const description = mailErrorDescription(error);
  return <>{t(description.key, { defaultValue: description.defaultValue })}</>;
}
