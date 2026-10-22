import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Composer } from '../../client/components/composer.js';
import plugin from '../../client/plugin.js';
import { sessionMemoryKey } from '../../client/use-session-memory.js';

async function setup(draftKey: string | undefined) {
  const client = new QueryClient();
  const onSend = vi.fn();
  function Harness() {
    const [key, setKey] = useState(draftKey);
    const [shown, setShown] = useState(true);
    return (
      <QueryClientProvider client={client}>
        <button onClick={() => setKey('new-session')}>New draft</button>
        <button onClick={() => setKey('session:A')}>Session A</button>
        <button onClick={() => setKey('session:B')}>Session B</button>
        <button onClick={() => setShown(!shown)}>Navigate</button>
        {shown && (
          <Composer
            draftKey={key}
            placeholder='Draft'
            commands={[{ name: 'help', description: 'Show help' }]}
            mentions={{ projectId: null }}
            onSend={onSend}
          />
        )}
      </QueryClientProvider>
    );
  }
  await renderWithApp(<Harness />, {
    namespace: '@nocobase/app-plugin-agent-sessions',
    plugins: [plugin({ routes: false })],
    fetch: answerApi(() => ({
      data: [
        {
          kind: 'issue',
          refId: 'issue-1',
          key: 'ST-58',
          title: 'Mentioned task',
          group: 'Tasks',
          href: '/issues/issue-1',
        },
      ],
    })),
  });
  return { client, onSend };
}

describe('retained composer drafts', () => {
  it.each(['new-session', 'session:A', undefined])(
    'keeps each input synchronously while composing with draft key %s',
    async (key) => {
      const { onSend } = await setup(key);
      const input = screen.getByRole('textbox', { name: 'Draft' });
      fireEvent.compositionStart(input);
      for (const text of ['w', 'wo', "wo'de", "wo'de'dian", '我的电脑']) {
        fireEvent.change(input, {
          // IMEs can keep the caret at the start of the active composition.
          target: { value: text, selectionStart: 0 },
        });
        // No waitFor or timer: React must retain the DOM value in this event.
        expect(input).toHaveValue(text);
      }
      fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
      expect(onSend).not.toHaveBeenCalled();
      fireEvent.compositionEnd(input, { data: '我的电脑' });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onSend).toHaveBeenCalledWith(
        [{ type: 'text', text: '我的电脑' }],
        false,
        [],
      );
      await waitFor(() => expect(input).toHaveValue(''));
    },
  );

  it('restores separate text, images and mentions on key changes and remounts', async () => {
    const { onSend } = await setup('new-session');
    const input = screen.getByRole('textbox', { name: 'Draft' });
    fireEvent.change(input, { target: { value: '#' } });
    fireEvent.select(input, { target: { selectionStart: 1 } });
    fireEvent.click(await screen.findByText('Mentioned task'));
    await waitFor(() => expect(input).toHaveValue('#ST-58 '));
    await waitFor(() =>
      expect((input as HTMLTextAreaElement).selectionStart).toBe(7),
    );
    fireEvent.paste(input, {
      clipboardData: {
        files: [new File(['image'], 'draft.png', { type: 'image/png' })],
      },
    });
    await screen.findByRole('button', { name: 'Remove image' });
    fireEvent.click(screen.getByText('Session A'));
    expect(input).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Remove image' })).toBeNull();
    fireEvent.change(input, { target: { value: 'Session A draft' } });
    fireEvent.click(screen.getByText('Session B'));
    expect(input).toHaveValue('');
    fireEvent.change(input, { target: { value: 'Session B draft' } });
    fireEvent.click(screen.getByText('Session A'));
    expect(input).toHaveValue('Session A draft');
    fireEvent.click(screen.getByText('New draft'));
    expect(input).toHaveValue('#ST-58 ');
    expect(screen.getByRole('button', { name: 'Remove image' })).toBeVisible();
    fireEvent.click(screen.getByText('Navigate'));
    fireEvent.click(screen.getByText('Navigate'));
    const restored = screen.getByRole('textbox', { name: 'Draft' });
    expect(restored).toHaveValue('#ST-58 ');
    fireEvent.keyDown(restored, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith(
      [
        { type: 'text', text: '#ST-58' },
        { type: 'image', mimeType: 'image/png', data: 'aW1hZ2U=' },
      ],
      false,
      [{ kind: 'issue', refId: 'issue-1' }],
    );
    await waitFor(() => expect(restored).toHaveValue(''));
    expect(screen.queryByRole('button', { name: 'Remove image' })).toBeNull();
  });

  it('retains slash completion and its caret without sending', async () => {
    const { onSend } = await setup('session:A');
    const input = screen.getByRole('textbox', { name: 'Draft' });
    fireEvent.change(input, { target: { value: '/he' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveValue('/help ');
    expect(onSend).not.toHaveBeenCalled();
    await waitFor(() =>
      expect((input as HTMLTextAreaElement).selectionStart).toBe(6),
    );
  });

  it('reflects a draft cleared through the cache after submission recovery', async () => {
    const { client } = await setup('session:A');
    const input = screen.getByRole('textbox', { name: 'Draft' });
    fireEvent.change(input, { target: { value: 'Recovered message' } });
    await waitFor(() => expect(input).toHaveValue('Recovered message'));
    await act(async () => {
      client.setQueryData(sessionMemoryKey('text:session:A'), '');
    });
    await waitFor(() => expect(input).toHaveValue(''));
  });
});

it('offers an optional context inspection action without removing or changing what is sent', async () => {
  const { SessionSurfaceContext } = await import('../../client/config.js');
  const client = new QueryClient();
  const attachment = {
    id: 'intent',
    label: 'Create task',
    text: 'Full creation intent',
  };
  client.setQueryData(sessionMemoryKey('attached:preview'), [attachment]);
  const inspect = vi.fn();
  const send = vi.fn();
  await renderWithApp(
    <QueryClientProvider client={client}>
      <SessionSurfaceContext.Provider
        value={{ panel: true, onInspectAttachment: inspect }}
      >
        <Composer draftKey='preview' placeholder='Draft' onSend={send} />
      </SessionSurfaceContext.Provider>
    </QueryClientProvider>,
    {
      namespace: '@nocobase/app-plugin-agent-sessions',
      plugins: [plugin({ routes: false })],
    },
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Create task', exact: true }),
  );
  expect(inspect).toHaveBeenCalledWith(attachment);
  fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), {
    target: { value: 'Please' },
  });
  fireEvent.keyDown(screen.getByRole('textbox', { name: 'Draft' }), {
    key: 'Enter',
  });
  await waitFor(() =>
    expect(send).toHaveBeenCalledWith(
      [
        { type: 'text', text: 'Please' },
        { type: 'text', text: 'Full creation intent' },
      ],
      false,
      [],
    ),
  );
});
