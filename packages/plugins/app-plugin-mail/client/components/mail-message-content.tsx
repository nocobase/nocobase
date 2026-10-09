import { useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import type { MailMessage } from '../mail-client.js';
import { useMailClient } from '../runtime.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { Button } from './ui/button.js';
import { MailTextBody } from './mail-text-body.js';
import { MailHtmlBody } from './mail-html-body.js';

interface MailMessageContentProps {
  readonly message: MailMessage;
  readonly title: string;
}

export function MailMessageContent(
  props: MailMessageContentProps,
): ReactElement {
  if (
    props.message.contentStatus === 'deferred' ||
    props.message.contentStatus === 'failed'
  )
    return <IncompleteContent key={props.message.id} {...props} />;
  return props.message.html ? (
    <MailHtmlBody message={props.message} title={props.title} />
  ) : (
    <MailTextBody text={props.message.text ?? props.message.preview ?? ''} />
  );
}

function IncompleteContent({
  message,
  title,
}: MailMessageContentProps): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const [loaded, setLoaded] = useState<MailMessage>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const current = loaded?.id === message.id ? loaded : message;
  const incomplete =
    current.contentStatus === 'deferred' || current.contentStatus === 'failed';
  const retry = async (): Promise<void> => {
    setBusy(true);
    setError(false);
    try {
      setLoaded(await mail.retryMessageContent(message.accountId, message.id));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className='space-y-3'>
      {incomplete ? (
        <div
          className='rounded-lg border border-border bg-muted p-3 text-sm'
          role='status'
        >
          <p>
            {t(
              current.contentError === 'IMAP_DETAIL_BODY_TOO_LARGE'
                ? 'content.tooLarge'
                : current.contentStatus === 'deferred'
                  ? 'content.deferred'
                  : 'content.failed',
            )}
          </p>
          {current.size !== undefined ? (
            <p className='text-muted-foreground'>
              {t('content.size', {
                size: (current.size / 1024 / 1024).toFixed(1),
              })}
            </p>
          ) : null}
          <Button
            className='mt-2'
            disabled={
              busy || current.contentError === 'IMAP_DETAIL_BODY_TOO_LARGE'
            }
            onClick={() => void retry()}
            variant='outline'
          >
            {t(busy ? 'content.loading' : 'content.retry')}
          </Button>
          {error ? (
            <p className='mt-2 text-destructive' role='alert'>
              {t('content.retryFailed')}
            </p>
          ) : null}
        </div>
      ) : null}
      {current.html ? (
        <MailHtmlBody message={current} title={title} />
      ) : (
        <MailTextBody text={current.text ?? current.preview ?? ''} />
      )}
    </div>
  );
}
