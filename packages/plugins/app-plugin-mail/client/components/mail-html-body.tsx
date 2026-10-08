import { useTranslation } from '@nocobase/i18n/client';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { useLayoutEffect, useMemo, useRef, type ReactElement } from 'react';

import type { MailMessage } from '../mail-client.js';
import { observeMailBodyTheme } from '../lib/mail-body-theme.js';
import { createMailMessageDocument } from '../lib/mail-message-document.js';

export function MailHtmlBody({
  message,
  title,
  scope = 'personal',
  collapseQuotes = true,
}: {
  readonly message: Pick<
    MailMessage,
    'accountId' | 'id' | 'attachments' | 'html'
  >;
  readonly title: string;
  readonly scope?: 'personal' | 'management';
  readonly collapseQuotes?: boolean;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const quoteLabel = collapseQuotes
    ? t('workspace.quotedContent', { defaultValue: 'Quoted content' })
    : undefined;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const { accountId, id, attachments, html } = message;
  const source = useMemo(
    () =>
      createMailMessageDocument(
        { accountId, id, attachments },
        html ?? '',
        scope,
        quoteLabel,
      ),
    [accountId, id, attachments, html, scope, quoteLabel],
  );

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let observer: ResizeObserver | undefined;
    let stopTheme: (() => void) | undefined;
    let animationFrame: number;

    const measureWhenReady = (): void => {
      const document = frame.contentDocument;
      // The initial about:blank document is replaced asynchronously. Measure
      // srcdoc as soon as parsing finishes, without waiting for remote images.
      if (
        document?.URL !== 'about:srcdoc' ||
        document.readyState === 'loading' ||
        !document.body
      ) {
        animationFrame = requestAnimationFrame(measureWhenReady);
        return;
      }
      stopTheme = observeMailBodyTheme(frame, document);
      const body = document.body;
      const resize = (): void => {
        const style = frame.contentWindow?.getComputedStyle(body);
        const margin =
          Number.parseFloat(style?.marginTop ?? '0') +
          Number.parseFloat(style?.marginBottom ?? '0');
        const height = Math.ceil(
          Math.max(body.scrollHeight, body.getBoundingClientRect().height) +
            margin,
        );
        frame.style.height = `${Math.max(96, height)}px`;
      };
      resize();
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(resize);
        observer.observe(body);
      }
    };
    animationFrame = requestAnimationFrame(measureWhenReady);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      stopTheme?.();
    };
  }, [source]);

  return (
    <iframe
      key={source}
      ref={frameRef}
      title={title}
      className='mt-4 block min-h-24 w-full border-0 bg-transparent text-inherit'
      // Same-origin access is for measuring height and authenticated CID images.
      // Never add allow-scripts: sender CSS belongs exclusively inside this frame.
      sandbox='allow-same-origin allow-popups allow-popups-to-escape-sandbox'
      referrerPolicy='no-referrer'
      srcDoc={source}
    />
  );
}
