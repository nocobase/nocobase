import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import type { MailSubmissionView } from '../mail-client.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { MailStatusBadge } from './mail-status-badge.js';

export function MailSubmissionStatus({
  submission,
}: {
  readonly submission: MailSubmissionView;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const recipients = submission.error?.recipients;
  const partial =
    submission.status === 'accepted' && Boolean(recipients?.rejected.length);
  const status = partial ? 'partial' : submission.status;
  return (
    <div className='space-y-1'>
      <MailStatusBadge
        label={t(`status.submission.${status}`, {
          defaultValue:
            status === 'partial' ? 'Partially accepted by provider' : status,
        })}
        tone={
          partial
            ? 'warning'
            : status === 'accepted'
              ? 'success'
              : status === 'failed' || status === 'unknown'
                ? 'danger'
                : 'info'
        }
      />
      {partial && recipients ? (
        <div className='text-xs break-words'>
          <div>
            {t('settings.sendLogs.acceptedRecipients', {
              defaultValue: 'Accepted recipients',
            })}
            : {recipients.accepted.join(', ')}
          </div>
          <div className='text-destructive'>
            {t('settings.sendLogs.rejectedRecipients', {
              defaultValue: 'Rejected recipients',
            })}
            : {recipients.rejected.join(', ')}
          </div>
        </div>
      ) : null}
    </div>
  );
}
