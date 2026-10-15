import { realtimeClientToken } from '@nocobase/app-client';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { act, fireEvent, screen } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { expect, it, vi } from 'vitest';

import plugin from '../../client/plugin.js';
import { AgentSessionsProvider } from '../../client/application-provider.js';
import { Composer } from '../../client/components/composer.js';

function Menu(): ReactElement {
  const [owner, setOwner] = useState<string | null>('A');
  const [shown, setShown] = useState(true);
  return (
    <>
      <button onClick={() => setShown(!shown)}>Navigate</button>
      <button onClick={() => setOwner(owner === 'A' ? 'B' : 'A')}>
        Account
      </button>
      <button onClick={() => setOwner(null)}>Logout</button>
      <AgentSessionsProvider owner={owner}>
        {shown && (
          <Composer
            draftKey='new-session'
            placeholder='Draft'
            onSend={() => undefined}
          />
        )}
      </AgentSessionsProvider>
    </>
  );
}

it('retains an editable draft and one live subscription across routes, but discards them on owner change', async () => {
  let subscriptions = 0;
  const opened = new Set<() => void>();
  await renderWithApp(<Menu />, {
    namespace: '@nocobase/app-plugin-agent-sessions',
    plugins: [plugin({ routes: false })],
    fetch: answerApi(() => ({ data: [] })),
    services: (app) => {
      const realtime = app.container.resolve(realtimeClientToken);
      vi.spyOn(realtime, 'subscribe').mockImplementation(() => {
        subscriptions++;
        return () => {
          subscriptions--;
        };
      });
      vi.spyOn(realtime, 'onOpen').mockImplementation((listener) => {
        opened.add(listener);
        return () => {
          opened.delete(listener);
        };
      });
    },
  });
  fireEvent.change(screen.getByPlaceholderText('Draft'), {
    target: { value: 'Keep my draft' },
  });
  for (let i = 0; i < 10; i++) {
    fireEvent.click(screen.getByText('Navigate'));
    expect(subscriptions).toBe(1);
    fireEvent.click(screen.getByText('Navigate'));
    expect(screen.getByPlaceholderText('Draft')).toHaveValue('Keep my draft');
  }
  await act(async () => {
    for (const listener of opened) listener();
  });
  expect(screen.getByPlaceholderText('Draft')).toHaveValue('Keep my draft');
  fireEvent.click(screen.getByText('Account'));
  expect(screen.getByPlaceholderText('Draft')).toHaveValue('');
  fireEvent.click(screen.getByText('Account'));
  expect(screen.getByPlaceholderText('Draft')).toHaveValue('');
  fireEvent.click(screen.getByText('Logout'));
  expect(subscriptions).toBe(0);
});
