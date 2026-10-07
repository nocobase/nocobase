import aiEmployee from '@nocobase/app-plugin-ai-employee/client';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AIEmployeeEntry } from '../../client/components/ai-employee-entry.js';
import { useGlobalAIChatController } from '../../client/extensions/nocobase-ai/index.js';

const iris = {
  username: 'iris',
  nickname: 'Iris',
  position: 'Support analyst',
  avatar: 'nocobase-016-female',
};

/** The AI routes the entry reads on load; `roster` is what the current user may talk to. */
function aiApi(roster: readonly object[]): ReturnType<typeof answerApi> {
  return answerApi(({ path }) => {
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
    return { data: [], meta: {} };
  });
}

function StartTask(): ReactElement {
  const controller = useGlobalAIChatController();
  return (
    <button
      type='button'
      onClick={() => controller.triggerTask({ aiEmployee: 'iris', open: true })}
    >
      Start task
    </button>
  );
}

beforeEach(() => {
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

describe('global AI employee entry', () => {
  it('offers the floating trigger once an employee is available and opens the shared chat from it', async () => {
    await renderWithApp(
      <AIEmployeeEntry>
        <p>Page content</p>
      </AIEmployeeEntry>,
      { plugins: [aiEmployee()], fetch: aiApi([iris]) },
    );

    expect(screen.getByText('Page content')).toBeInTheDocument();
    const trigger = await screen.findByRole('button', {
      name: 'Open AI chat',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(trigger);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    // The trigger hides while the panel it opened is showing.
    expect(
      screen.queryByRole('button', { name: 'Open AI chat' }),
    ).not.toBeInTheDocument();
  });

  it('opens the same chat for a task a page starts through the global controller', async () => {
    await renderWithApp(
      <AIEmployeeEntry>
        <StartTask />
      </AIEmployeeEntry>,
      { plugins: [aiEmployee()], fetch: aiApi([iris]) },
    );
    await screen.findByRole('button', { name: 'Open AI chat' });

    await userEvent.click(screen.getByRole('button', { name: 'Start task' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('shows no trigger when the current user has no AI employee', async () => {
    const fetch = vi.fn(aiApi([]));
    await renderWithApp(
      <AIEmployeeEntry>
        <p>Page content</p>
      </AIEmployeeEntry>,
      { plugins: [aiEmployee()], fetch },
    );

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open AI chat' }),
    ).not.toBeInTheDocument();
  });
});
