import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import plugin from '../../client/plugin.js';
import { Composer } from '../../client/components/composer.js';
import { WithdrawnEditor } from '../../client/components/withdrawn-editor.js';
import { TranscriptView } from '../../client/components/transcript-view.js';
import type { Session } from '../../shared/api.js';
import type { TranscriptItem } from '../../client/transcript.js';

const session: Session = {
  id: 'session',
  computerId: 'computer',
  agentId: 'codex',
  cwd: '/work',
  title: 'Test',
  titleSource: 'owner',
  state: null,
  startup: null,
  settings: {},
  running: true,
  waiting: false,
  computerOnline: true,
  lastSeq: 3,
  project: null,
  links: [],
  archivedAt: null,
  lastActivityAt: '2026-10-18T00:00:00Z',
  createdAt: '2026-10-18T00:00:00Z',
};
const prompt: Extract<TranscriptItem, { type: 'prompt' }> = {
  type: 'prompt',
  key: '3',
  at: session.createdAt,
  text: 'Original message',
  images: [
    { type: 'image', id: 'image', mimeType: 'image/png', data: 'aGVsbG8=' },
  ],
  state: 'withdrawn',
  withdrawable: true,
};

describe('withdrawing a queued message', () => {
  it('rechecks stored image access through the API client and lets an unreadable attachment retry', async () => {
    const requests = vi.fn(() =>
      Response.json(
        { error: { message: 'Image not found.' } },
        { status: 404 },
      ),
    );
    const seen: string[] = [];
    await renderWithApp(
      <QueryClientProvider client={new QueryClient()}>
        <WithdrawnEditor
          session={session}
          item={{
            ...prompt,
            images: [
              {
                type: 'image',
                id: 'stored',
                mimeType: 'image/png',
                file: 'stored',
              },
            ],
          }}
          draftKey='stored-editor'
          close={vi.fn()}
        />
      </QueryClientProvider>,
      {
        plugins: [plugin({ routes: false })],
        namespace: '@nocobase/app-plugin-agent-sessions',
        fetch: answerApi((call) => {
          seen.push(call.path);
          return requests();
        }),
      },
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load the original attachments',
    );
    expect(seen).toEqual(['agentSessions/sessions/session/images/stored']);
    fireEvent.click(screen.getByRole('button', { name: 'Retry', exact: true }));
    await waitFor(() => expect(requests).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('textbox')).toBeNull();
  });
  it('offers retry after failure, including while offline, and explains the legacy boundary', async () => {
    const withdraw = vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue(undefined);
    await renderWithApp(
      <TranscriptView
        session={{ ...session, computerOnline: false }}
        items={[
          { ...prompt, state: 'queued' },
          { ...prompt, key: '4', state: 'queued', withdrawable: false },
        ]}
        agentName='Fake'
        writable={false}
        actions={{ answer: vi.fn(), decide: vi.fn(), withdraw }}
      />,
      {
        plugins: [plugin({ routes: false })],
        namespace: '@nocobase/app-plugin-agent-sessions',
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(withdraw).toHaveBeenCalledTimes(2));
    expect(withdraw).toHaveBeenLastCalledWith(3);
    expect(
      screen.getByText(/older bridge and cannot be safely withdrawn/),
    ).toBeVisible();
  });

  it('edits and sends original text and images without changing the current draft', async () => {
    const requests = vi.fn(({ method, json }: ApiCall) =>
      method === 'POST'
        ? {
            data: {
              kind: 'prompt',
              at: session.createdAt,
              seq: 4,
              promptId: 'new',
              content: (json as { content: unknown }).content,
            },
          }
        : { data: [], meta: {} },
    );
    function Harness() {
      const [editing, setEditing] = useState(false);
      return (
        <>
          <Composer
            placeholder='Current draft'
            draftKey='session:session'
            onSend={vi.fn()}
          />
          <TranscriptView
            session={session}
            items={[prompt]}
            agentName='Fake'
            writable
            actions={{
              answer: vi.fn(),
              decide: vi.fn(),
              edit: () => setEditing(true),
            }}
          />
          {editing && (
            <WithdrawnEditor
              session={session}
              item={prompt}
              draftKey='separate'
              close={() => setEditing(false)}
            />
          )}
        </>
      );
    }
    const client = new QueryClient();
    await renderWithApp(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
      {
        plugins: [plugin({ routes: false })],
        namespace: '@nocobase/app-plugin-agent-sessions',
        fetch: answerApi(requests),
      },
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Current draft' }), {
      target: { value: 'Keep this draft' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Edit and send again' }),
    );
    const dialog = await screen.findByRole('dialog');
    const input = await within(dialog).findByRole('textbox');
    expect(input).toHaveValue('Original message');
    fireEvent.change(input, { target: { value: 'Edited original' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('textbox', { name: 'Current draft' })).toHaveValue(
      'Keep this draft',
    );
    expect(
      requests.mock.calls.find(([call]) => call.method === 'POST')?.[0].json,
    ).toMatchObject({
      content: [
        { type: 'text', text: 'Edited original' },
        { type: 'image', mimeType: 'image/png', data: 'aGVsbG8=' },
      ],
      submissionId: expect.any(String),
    });
  });
});
