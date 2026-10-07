import aiEmployee from '@nocobase/app-plugin-ai-employee/client';
import aiEmployeeExample from '@nocobase/app-plugin-ai-employee-example/client';
import { NamespaceScope } from '@nocobase/i18n/client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AIEmployeeEntry } from '../../client/components/ai-employee-entry.js';
import TasksPage from '../../client/extensions/nocobase-ai-employee-example-tasks-page/pages/ai-employee-tasks-page.js';

const NAMESPACE = '@nocobase/app-plugin-ai-employee-example';

const calls: ApiCall[] = [];

function aiApi(roster: readonly object[]): ReturnType<typeof answerApi> {
  return answerApi((call) => {
    calls.push(call);
    const { method, path } = call;
    if (path === 'aiEmployees/roster') return { data: roster };
    if (path === 'aiEmployee/models') {
      return {
        data: [
          {
            llmService: 'openai',
            llmServiceTitle: 'OpenAI',
            enabledModels: [{ label: 'Test model', value: 'test-model' }],
          },
        ],
      };
    }
    if (method === 'POST' && path === 'aiEmployee/conversations') {
      return { data: { sessionId: 'session-1' } };
    }
    if (path === 'aiEmployee/conversations/session-1/send') {
      // The run's stream: nothing to say, so the run ends at once.
      return new Response('', {
        headers: { 'content-type': 'text/event-stream' },
      });
    }
    return { data: [], meta: {} };
  });
}

/** The conversation the chat created, and the first message it sent into it. */
function createdConversation(): ApiCall | undefined {
  return calls.find(
    ({ method, path }) =>
      method === 'POST' && path === 'aiEmployee/conversations',
  );
}

interface SentMessage {
  readonly content: { readonly content: string };
  readonly workContext: readonly { readonly id: string }[];
}

function sentMessage(): SentMessage | undefined {
  const send = calls.find(({ path }) => path.endsWith('/send'));
  return (send?.json as { readonly messages: readonly SentMessage[] })
    ?.messages[0];
}

async function renderPage(roster: readonly object[]): Promise<void> {
  // As in the application: the entry belongs to the layout, and only the page renders in the plugin's namespace,
  // because it overrides the plugin's route.
  await renderWithApp(
    <AIEmployeeEntry>
      <NamespaceScope ns={NAMESPACE}>
        <TasksPage />
      </NamespaceScope>
    </AIEmployeeEntry>,
    // The chat translates in the AI Employee plugin's namespace, so that plugin is registered as in the application.
    { plugins: [aiEmployee(), aiEmployeeExample()], fetch: aiApi(roster) },
  );
}

beforeEach(() => {
  calls.length = 0;
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  return () => vi.unstubAllGlobals();
});

describe('AI employee tasks page', () => {
  it('offers the selected ticket’s tasks through the example employee', async () => {
    await renderPage([{ username: 'iris', nickname: 'Iris' }]);

    expect(
      screen.getByRole('heading', { level: 1, name: 'AI employee tasks' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Ask Iris/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Northwind Finance')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /Unable to update profile/ }),
    );

    expect(
      screen.getByRole('button', { name: /Unable to update profile/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Contoso Retail')).toBeInTheDocument();
  });

  it('sends the queue triage to the example employee with every ticket as work context', async () => {
    await renderPage([{ username: 'iris', nickname: 'Iris' }]);
    const triage = screen.getByRole('button', { name: 'Triage the queue' });
    await screen.findByRole('button', { name: /Ask Iris/ });
    expect(triage).toBeEnabled();

    await userEvent.click(triage);

    await waitFor(() => expect(sentMessage()).toBeDefined());
    expect(createdConversation()).toMatchObject({
      method: 'POST',
      json: {
        aiEmployee: { username: 'iris' },
        systemMessage: expect.stringContaining('Rank them by urgency'),
      },
    });
    expect(sentMessage()?.content.content).toBe(
      'Rank the open tickets by urgency and tell me which to handle first.',
    );
    expect(sentMessage()?.workContext.map(({ id }) => id)).toEqual([
      'TK-1042',
      'TK-1041',
      'TK-1038',
    ]);
  });

  it('runs a ticket’s task from the employee shortcut with that ticket as work context', async () => {
    await renderPage([{ username: 'iris', nickname: 'Iris' }]);
    await userEvent.click(
      screen.getByRole('button', { name: /Unable to update profile/ }),
    );

    await userEvent.hover(
      await screen.findByRole('button', { name: /Ask Iris/ }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /Analyze this ticket/ }),
    );

    await waitFor(() => expect(sentMessage()).toBeDefined());
    // The task narrows the run to the tool it needs.
    expect(createdConversation()).toMatchObject({
      json: {
        aiEmployee: { username: 'iris' },
        skillSettings: { tools: ['example-ticket-history'] },
      },
    });
    expect(sentMessage()?.content.content).toBe(
      'Analyze ticket TK-1041 and recommend the next action.',
    );
    expect(sentMessage()?.workContext.map(({ id }) => id)).toEqual(['TK-1041']);
  });

  it('explains a missing example employee instead of offering its tasks', async () => {
    await renderPage([{ username: 'atlas', nickname: 'Atlas' }]);

    expect(
      await screen.findByText(/The AI employee “iris” is not available to you/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Triage the queue' }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: /Ask Iris/ }),
    ).not.toBeInTheDocument();
  });
});
