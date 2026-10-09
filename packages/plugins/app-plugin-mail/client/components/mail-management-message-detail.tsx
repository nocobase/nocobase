import { isVisibleMailAttachment } from '../../shared/inline-images.js';
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import {
  mailErrorMessage,
  type MailMessage,
  type MailMessageSummary,
} from '../mail-client.js';
import { useMailClient } from '../runtime.js';
import { MailTextBody } from './mail-text-body.js';
import { MailHtmlBody } from './mail-html-body.js';
import { Button } from './ui/button.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet.js';

export function MailManagementMessageDetail({
  selected,
  accountName,
  onClose,
}: {
  readonly selected: MailMessageSummary;
  readonly accountName: string;
  readonly onClose: () => void;
}): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation();
  const [message, setMessage] = useState<MailMessage>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [downloading, setDownloading] = useState<string>();
  const [downloadError, setDownloadError] = useState<string>();
  const visibleAttachments =
    message?.attachments.filter(isVisibleMailAttachment) ?? [];
  const fallback = t('errors.requestFailed', {
    defaultValue: 'Mail request failed.',
  });

  useEffect(() => {
    let active = true;
    void mail
      .getManagedMessage(selected.accountId, selected.id)
      .then((value) => {
        if (active) setMessage(value);
      })
      .catch((cause: unknown) => {
        if (active) setError(mailErrorMessage(cause, fallback));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mail, selected.accountId, selected.id, retry, fallback]);

  const download = async (
    attachment: MailMessage['attachments'][number],
  ): Promise<void> => {
    setDownloading(attachment.id);
    setDownloadError(undefined);
    try {
      const stream = await mail.downloadManagedAttachment(
        selected.accountId,
        selected.id,
        attachment.id,
      );
      const blob = await new Response(stream, {
        headers: { 'content-type': attachment.contentType },
      }).blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setDownloadError(mailErrorMessage(cause, fallback));
    } finally {
      setDownloading(undefined);
    }
  };

  const addresses = (items: MailMessage['to']): string =>
    items
      .map((item) =>
        item.name ? `${item.name} <${item.address}>` : item.address,
      )
      .join(', ') || '—';
  const timestamp = message?.receivedAt ?? message?.sentAt;
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className='gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-4xl'
        side='right'
        closeLabel={t('dev.management.close', { defaultValue: 'Close' })}
      >
        <SheetHeader className='shrink-0 border-b bg-muted/20 pr-14'>
          <SheetTitle>
            {t('dev.management.details', { defaultValue: 'Message details' })}
          </SheetTitle>
        </SheetHeader>
        <div className='min-h-0 flex-1 overflow-y-auto p-4'>
          {loading ? (
            <p role='status' className='py-8 text-sm text-muted-foreground'>
              {t('workspace.loading', { defaultValue: 'Loading mail…' })}
            </p>
          ) : error ? (
            <div className='mt-4 space-y-3'>
              <p role='alert' className='text-sm text-destructive'>
                {error}
              </p>
              <Button
                variant='outline'
                onClick={() => {
                  setLoading(true);
                  setError(undefined);
                  setRetry((value) => value + 1);
                }}
              >
                {t('dev.management.retryDetails', { defaultValue: 'Retry' })}
              </Button>
            </div>
          ) : message ? (
            <div className='mt-4 space-y-4'>
              <h3 className='break-words text-lg font-semibold'>
                {message.subject ||
                  t('workspace.noSubject', { defaultValue: 'No subject' })}
              </h3>
              <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm [&_dd]:break-words [&_dt]:text-muted-foreground'>
                <dt>{t('dev.management.account')}</dt>
                <dd>{accountName}</dd>
                <dt>{t('dev.management.sender')}</dt>
                <dd>{addresses(message.from ? [message.from] : [])}</dd>
                <dt>{t('dev.management.recipients')}</dt>
                <dd>{addresses(message.to)}</dd>
                {message.cc.length ? (
                  <>
                    <dt>{t('dev.management.cc', { defaultValue: 'Cc' })}</dt>
                    <dd>{addresses(message.cc)}</dd>
                  </>
                ) : null}
                {message.bcc.length ? (
                  <>
                    <dt>{t('dev.management.bcc', { defaultValue: 'Bcc' })}</dt>
                    <dd>{addresses(message.bcc)}</dd>
                  </>
                ) : null}
                <dt>{t('dev.management.time')}</dt>
                <dd>
                  {timestamp ? new Date(timestamp).toLocaleString() : '—'}
                </dd>
                <dt>{t('dev.management.status')}</dt>
                <dd>
                  {t(
                    message.draft
                      ? 'dev.management.draft'
                      : message.read
                        ? 'dev.management.read'
                        : 'dev.management.unread',
                  )}
                </dd>
              </dl>
              {message.contentStatus && message.contentStatus !== 'complete' ? (
                <p
                  className='rounded-lg border bg-muted p-3 text-sm'
                  role='status'
                >
                  {t(
                    message.contentStatus === 'deferred'
                      ? 'content.deferred'
                      : 'content.failed',
                  )}
                </p>
              ) : null}
              <div className='border-t pt-4'>
                {message.html ? (
                  <MailHtmlBody
                    message={message}
                    title={message.subject || t('workspace.noSubject')}
                    scope='management'
                  />
                ) : (
                  <MailTextBody text={message.text ?? message.preview ?? '—'} />
                )}
              </div>
              {visibleAttachments.length ? (
                <section className='space-y-2 border-t pt-4'>
                  <h4 className='text-sm font-medium'>
                    {t('dev.management.attachments')}
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    {visibleAttachments.map((attachment) => (
                      <Button
                        key={attachment.id}
                        variant='outline'
                        className='max-w-full'
                        disabled={Boolean(downloading)}
                        onClick={() => {
                          void download(attachment);
                        }}
                      >
                        <span className='truncate'>{attachment.fileName}</span>
                      </Button>
                    ))}
                  </div>
                  {downloadError ? (
                    <p role='alert' className='text-sm text-destructive'>
                      {downloadError}
                    </p>
                  ) : null}
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
