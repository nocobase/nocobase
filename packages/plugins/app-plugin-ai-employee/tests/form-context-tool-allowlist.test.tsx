// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AIProvider } from '../registry/nocobase-ai/providers/ai-provider.js';
import { useAIChat } from '../registry/nocobase-ai/providers/chat-context.js';
import { AIChatProvider } from '../registry/nocobase-ai/providers/chat-provider.js';
import { mergeAIRequiredTools } from '../registry/nocobase-ai/providers/page-context-utils.js';
import type { AIWorkContextItem } from '../registry/nocobase-ai/providers/types.js';
import type { AIService } from '../registry/nocobase-ai/services/types.js';

const leadForm: AIWorkContextItem = {
  type: 'page-element',
  id: 'lead-form',
  title: 'Lead form',
  kind: 'form',
};

describe('mergeAIRequiredTools', () => {
  it('leaves settings without a tool allowlist as they are', () => {
    expect(mergeAIRequiredTools(undefined, ['formFiller'])).toBeUndefined();
    expect(mergeAIRequiredTools({}, ['formFiller'])).toEqual({});
    expect(mergeAIRequiredTools({ tools: [] }, ['formFiller'])).toEqual({
      tools: [],
    });
    expect(
      mergeAIRequiredTools({ skills: ['lead-intake'] }, ['formFiller']),
    ).toEqual({ skills: ['lead-intake'] });
  });

  it('adds the required tools to an allowlist, once', () => {
    expect(
      mergeAIRequiredTools(
        {
          skills: ['lead-intake'],
          tools: ['find-similar-leads', 'formFiller'],
        },
        ['formFiller'],
      ),
    ).toEqual({
      skills: ['lead-intake'],
      tools: ['find-similar-leads', 'formFiller'],
    });
    expect(
      mergeAIRequiredTools({ tools: ['find-similar-leads'] }, ['formFiller']),
    ).toEqual({ tools: ['find-similar-leads', 'formFiller'] });
  });
});

function createService() {
  return {
    listEmployees: vi
      .fn()
      .mockResolvedValue([{ username: 'lead-desk', nickname: 'Lead desk' }]),
    listModels: vi.fn().mockResolvedValue([
      {
        value: 'general-model',
        label: 'General',
        llmService: 'main',
        configured: true,
      },
    ]),
    updateEmployeeUserPrompt: vi.fn(),
    listConversations: vi.fn().mockResolvedValue([]),
    getConversationMessages: vi.fn().mockResolvedValue([]),
    getConversationActiveState: vi.fn().mockResolvedValue('idle'),
    updateConversationTitle: vi.fn(),
    destroyConversation: vi.fn(),
    uploadFile: vi.fn(),
    createConversation: vi.fn().mockResolvedValue('lead-session'),
    sendMessagesStream: vi
      .fn()
      .mockImplementation(
        async () => new ReadableStream<Uint8Array>({ start: (c) => c.close() }),
      ),
    resendMessagesStream: vi.fn(),
    updateToolCallDecision: vi.fn(),
    resumeToolCallStream: vi.fn(),
    resumeConversationStream: vi.fn(),
  };
}

function Probe() {
  const chat = useAIChat();
  return (
    <div>
      <span data-testid='employee'>{chat.currentEmployee?.username}</span>
      <span data-testid='context'>{chat.workContext.length}</span>
      <button type='button' onClick={() => chat.addWorkContext(leadForm)}>
        Attach form
      </button>
      <button
        type='button'
        onClick={() =>
          void chat.triggerTask({
            task: {
              message: { user: 'Fill the form', workContext: [leadForm] },
              skillSettings: { tools: ['find-similar-leads'] },
              autoSend: true,
            },
          })
        }
      >
        Run task
      </button>
      <input
        aria-label='Message'
        value={chat.draft}
        onChange={(event) => chat.setDraft(event.target.value)}
      />
      <button
        type='button'
        disabled={!chat.canSend}
        onClick={() => void chat.send()}
      >
        Send
      </button>
    </div>
  );
}

function mount() {
  const service = createService();
  render(
    <AIProvider service={service as unknown as AIService}>
      <AIChatProvider id='leads' defaultEmployee='lead-desk'>
        <Probe />
      </AIChatProvider>
    </AIProvider>,
  );
  return service;
}

describe('a message with a form in its context', () => {
  it('sends no tool allowlist when the chat has none, so the employee keeps its tools', async () => {
    const service = mount();
    await waitFor(() =>
      expect(screen.getByTestId('employee')).toHaveTextContent('lead-desk'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Attach form' }));
    await waitFor(() =>
      expect(screen.getByTestId('context')).toHaveTextContent('1'),
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), {
      target: { value: 'Fill it in' },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(service.sendMessagesStream).toHaveBeenCalled());
    expect(service.createConversation.mock.calls[0]?.[0]?.skillSettings).toBe(
      undefined,
    );
    expect(service.sendMessagesStream.mock.calls[0]?.[0]?.skillSettings).toBe(
      undefined,
    );
  });

  it("adds formFiller to a task's own allowlist", async () => {
    const service = mount();
    await waitFor(() =>
      expect(screen.getByTestId('employee')).toHaveTextContent('lead-desk'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Run task' }));

    await waitFor(() => expect(service.sendMessagesStream).toHaveBeenCalled());
    const allowlist = {
      tools: ['find-similar-leads', 'formFiller'],
    };
    expect(
      service.createConversation.mock.calls[0]?.[0]?.skillSettings,
    ).toEqual(allowlist);
    expect(
      service.sendMessagesStream.mock.calls[0]?.[0]?.skillSettings,
    ).toEqual(allowlist);
  });

  it('sends a task triggered before the render that loaded the employees has run its effects', async () => {
    const service = mount();
    const employee = screen.getByTestId('employee');
    // A mutation observer runs as a microtask right after the commit, before
    // React flushes that render's passive effects. A busy runner can deliver a
    // click in the same gap.
    await new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (employee.textContent !== 'lead-desk') return;
        observer.disconnect();
        fireEvent.click(screen.getByRole('button', { name: 'Run task' }));
        resolve();
      });
      observer.observe(employee, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    });

    await waitFor(() => expect(service.sendMessagesStream).toHaveBeenCalled());
    expect(
      service.sendMessagesStream.mock.calls[0]?.[0]?.skillSettings,
    ).toEqual({ tools: ['find-similar-leads', 'formFiller'] });
  });
});
