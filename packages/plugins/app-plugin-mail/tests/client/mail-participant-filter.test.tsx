import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import mailPlugin, {
  MailWorkspacePage,
} from '@nocobase/app-plugin-mail/client';
import { MAIL_PLUGIN_NS } from '../../client/namespace.js';
import type { MailMessage } from '../../client/mail-client.js';
import locales from '../../client/locales/index.js';

function message(id: string): MailMessage {
  return {
    id,
    accountId: 'account-1',
    providerMessageId: id,
    subject: id,
    text: `Body ${id}`,
    from: { address: 'alice@example.com' },
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    folderIds: [],
    labelIds: [],
    attachments: [],
    read: true,
    starred: false,
    draft: false,
    hasAttachments: false,
  };
}

async function setup(locale = 'en-US') {
  const list = vi
    .fn<(query: URLSearchParams) => unknown | Promise<unknown>>()
    .mockResolvedValue({
      data: [message('first')],
      meta: { total: 2, nextPageToken: 'page-2' },
    });
  const detail = vi
    .fn<() => unknown | Promise<unknown>>()
    .mockResolvedValue({ data: message('second') });
  await renderWithApp(<MailWorkspacePage />, {
    plugins: [mailPlugin()],
    namespace: MAIL_PLUGIN_NS,
    locale,
    fetch: answerApi(({ path, query }) => {
      if (path === 'mail/messages')
        return list(
          new URLSearchParams(
            Object.entries(query).flatMap(([key, value]) =>
              (Array.isArray(value) ? value : [value]).map((item) => [
                key,
                item,
              ]),
            ),
          ),
        );
      if (path.includes('/messages/')) return detail();
      if (path === 'mail/accounts')
        return {
          data: [
            {
              id: 'account-1',
              userId: 'user-1',
              address: 'user@example.com',
              provider: { type: 'gmail', name: 'google' },
              scopes: [],
              status: 'active',
            },
          ],
        };
      return { data: [] };
    }),
  });
  await screen.findByRole('button', { name: /first/ });
  return { list, detail };
}

function change(value: string, label = 'Participant'): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function lastQuery(
  list: Awaited<ReturnType<typeof setup>>['list'],
): URLSearchParams {
  return list.mock.lastCall![0];
}

async function debounce(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
}

describe('participant workspace filter through the application API client', () => {
  it('resets real pagination and selection on edit and clear, and keeps keyword search independent', async () => {
    const { list } = await setup();
    list.mockResolvedValueOnce({
      data: [message('second')],
      meta: { total: 2 },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.click(await screen.findByRole('button', { name: /second/ }));
    await screen.findByText('Body second');
    expect(lastQuery(list).get('pageToken')).toBe('page-2');

    change(' Alice@Example.com ');
    expect(screen.queryByText('Body second')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /second/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
    await waitFor(() =>
      expect(lastQuery(list).get('participant')).toBe(' Alice@Example.com '),
    );
    expect(lastQuery(list).has('pageToken')).toBe(false);
    expect(lastQuery(list).has('q')).toBe(false);

    fireEvent.change(screen.getByLabelText('Search mail'), {
      target: { value: '  alice@example.com  ' },
    });
    await waitFor(() =>
      expect(lastQuery(list).get('q')).toBe('alice@example.com'),
    );
    expect(lastQuery(list).get('participant')).toBe(' Alice@Example.com ');
    change('@example.com');
    await waitFor(() =>
      expect(lastQuery(list).get('participant')).toBe('@example.com'),
    );
    expect(lastQuery(list).get('q')).toBe('alice@example.com');
    list.mockResolvedValueOnce({
      data: [message('second')],
      meta: { total: 2 },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.click(await screen.findByRole('button', { name: /second/ }));
    await screen.findByText('Body second');
    change('');
    expect(screen.queryByText('Body second')).not.toBeInTheDocument();
    await waitFor(() => expect(lastQuery(list).has('participant')).toBe(false));
    expect(lastQuery(list).has('pageToken')).toBe(false);
    expect(lastQuery(list).get('q')).toBe('alice@example.com');
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
  });

  it('rejects stale list, detail and page responses while editing, invalid and cleared', async () => {
    const { list, detail } = await setup();
    const staleDetail = Promise.withResolvers<unknown>();
    detail.mockReturnValueOnce(staleDetail.promise);
    fireEvent.click(screen.getByRole('button', { name: /first/ }));
    await waitFor(() => expect(detail).toHaveBeenCalledOnce());
    const stalePage = Promise.withResolvers<unknown>();
    list.mockReturnValueOnce(stalePage.promise);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() =>
      expect(lastQuery(list).get('pageToken')).toBe('page-2'),
    );
    const oldCount = list.mock.calls.length;
    change('alice@example.com');
    // Neither an old page nor a reader may arrive during the debounce window.
    await act(async () => {
      stalePage.resolve({
        data: [message('stale-page')],
        meta: { nextPageToken: 'stale-token' },
      });
      staleDetail.resolve({ data: message('stale-detail') });
    });
    expect(list).toHaveBeenCalledTimes(oldCount);
    expect(screen.queryByText('Body stale-detail')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /stale-page/ }),
    ).not.toBeInTheDocument();
    const staleList = Promise.withResolvers<unknown>();
    list.mockReturnValueOnce(staleList.promise);
    await waitFor(() =>
      expect(lastQuery(list).get('participant')).toBe('alice@example.com'),
    );
    change('@');
    expect(screen.getByLabelText('Participant')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a valid full email address or @domain.',
    );
    const invalidCount = list.mock.calls.length;
    await act(async () => {
      staleList.resolve({ data: [message('stale-list')] });
    });
    await debounce();
    expect(list).toHaveBeenCalledTimes(invalidCount);
    expect(
      screen.queryByRole('button', { name: /stale-list/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    fireEvent.focus(window);
    await debounce();
    expect(list).toHaveBeenCalledTimes(invalidCount);
    change('');
    await waitFor(() => expect(list).toHaveBeenCalledTimes(invalidCount + 1));
    expect(lastQuery(list).has('participant')).toBe(false);
    expect(lastQuery(list).has('pageToken')).toBe(false);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ignores a pending participant response after clearing and rapid replacement edits', async () => {
    const { list } = await setup();
    const pending = Promise.withResolvers<unknown>();
    list.mockReturnValueOnce(pending.promise);
    change('alice@example.com');
    await waitFor(() =>
      expect(lastQuery(list).get('participant')).toBe('alice@example.com'),
    );
    const count = list.mock.calls.length;
    change('bob@example.com');
    change('@example.com');
    change('');
    await waitFor(() => expect(list).toHaveBeenCalledTimes(count + 1));
    expect(lastQuery(list).has('participant')).toBe(false);
    await screen.findByRole('button', { name: /first/ });
    await act(async () => {
      pending.resolve({
        data: [message('stale-cleared-filter')],
        meta: { nextPageToken: 'stale-page' },
      });
    });
    expect(
      screen.queryByRole('button', { name: /stale-cleared-filter/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /first/ })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(count + 1);
  });

  it.each(['en-US', 'zh-CN'] as const)(
    'exposes localized hint and field errors without issuing broad queries in %s',
    async (locale) => {
      const { list } = await setup(locale);
      const labels = (await locales[locale]()).default.workspace;
      const input = screen.getByLabelText(labels.participant);
      expect(input).toHaveAccessibleDescription(labels.participantHint);
      const count = list.mock.calls.length;
      for (const invalid of [
        '   ',
        '@',
        'alice',
        'Alice <alice@example.com>',
        '@example',
        'a'.repeat(321),
      ]) {
        change(invalid, labels.participant);
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAccessibleErrorMessage(labels.participantInvalid);
        await debounce();
        expect(list).toHaveBeenCalledTimes(count);
      }
      change('@Example.com', labels.participant);
      await waitFor(() =>
        expect(lastQuery(list).get('participant')).toBe('@Example.com'),
      );
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );
});
