import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MailHtmlBody } from '../../client/components/mail-html-body.js';
import type { MailMessage } from '../../client/mail-client.js';

const message: MailMessage = {
  id: 'message-1',
  accountId: 'account-1',
  providerMessageId: 'message-1',
  folderIds: [],
  labelIds: [],
  to: [],
  cc: [],
  bcc: [],
  replyTo: [],
  references: [],
  read: true,
  starred: false,
  draft: false,
  hasAttachments: false,
  attachments: [],
  html: '<p>Message body</p><img src="https://example.com/slow.png">',
};

describe('HTML message sizing', () => {
  let resize: () => void;
  const disconnect = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    disconnect.mockClear();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe(): void {}
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sizes parsed content before load and tracks later image resizing', () => {
    const { unmount } = render(
      <MailHtmlBody message={message} title='Message' />,
    );
    const frame = screen.getByTitle<HTMLIFrameElement>('Message');
    const document = frame.contentDocument!;
    // JSDOM does not navigate srcdoc; simulate its browser lifecycle while
    // leaving remote resources pending. No iframe load event is dispatched.
    act(() => vi.advanceTimersToNextFrame());
    expect(frame.style.height).toBe('');
    Object.defineProperty(document, 'URL', { value: 'about:srcdoc' });
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'loading',
    });
    Object.defineProperty(document.body, 'scrollHeight', {
      configurable: true,
      value: 800,
    });
    act(() => vi.advanceTimersToNextFrame());
    expect(frame.style.height).toBe('');

    Object.defineProperty(document, 'readyState', { value: 'interactive' });
    act(() => vi.advanceTimersToNextFrame());
    expect(frame.style.height).toBe('800px');

    Object.defineProperty(document.body, 'scrollHeight', { value: 1200 });
    act(() => resize());
    expect(frame.style.height).toBe('1200px');
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('discards the old height when switching messages and cancels pending measurement', () => {
    const { rerender, unmount } = render(
      <MailHtmlBody message={message} title='Message' />,
    );
    const frame = screen.getByTitle<HTMLIFrameElement>('Message');
    frame.style.height = '1200px';
    rerender(
      <MailHtmlBody
        message={{ ...message, id: 'message-2', html: '<p>Short message</p>' }}
        title='Message'
      />,
    );
    const replacement = screen.getByTitle<HTMLIFrameElement>('Message');
    expect(replacement).not.toBe(frame);
    expect(replacement.style.height).toBe('');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
