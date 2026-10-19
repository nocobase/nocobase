import { renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AIFormFillPage from '../../client/pages/ai-form-fill/index.js';
import locales from '../../client/locales/index.js';
import packageMetadata from '../../package.json' with { type: 'json' };

const hooks = vi.hoisted(() => ({
  createConversation: vi.fn(),
  openChat: vi.fn(),
  selectUI: vi.fn(),
}));
vi.mock('@nocobase/app-plugin-agents/client/chat', () => ({
  useAIForm: () => () => undefined,
  useAIFormRegistry: () => ({}),
  useChatUIContextSource: () => undefined,
  useChatSources: () => ({ selectUI: hooks.selectUI }),
  useChatApi: () => ({ createConversation: hooks.createConversation }),
  useChatPanel: () => ({ available: true, openChat: hooks.openChat }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'user-a' } } }),
}));
vi.mock('../../client/components/online-agent/identity-context.js', () => ({
  useOnlineAgentIdentityActive: () => () => true,
}));
vi.mock('../../client/components/online-agent/use-model-catalog.js', () => ({
  useModelCatalog: () => ({
    phase: 'ready',
    canSend: true,
    services: [
      { name: 'test-model', models: [{ kind: 'chat', value: 'chat' }] },
    ],
  }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  hooks.createConversation.mockResolvedValue({ id: 'conversation-a' });
});

async function renderPage(locale: string = 'en-US') {
  return renderWithApp(<AIFormFillPage />, {
    namespace: packageMetadata.name,
    namespaces: { [packageMetadata.name]: locales },
    locale,
  });
}

describe('form-local AI chat shortcut', () => {
  it.each([
    ['en-US', 'Open AI chat for this form', 'Request draft'],
    ['zh-CN', '打开此表单的 AI 对话', '申请草稿'],
  ])(
    'opens scoped chat and includes the form only after the icon click in %s',
    async (locale, label, title) => {
      await renderPage(locale);
      const button = screen.getByRole('button', { name: label });
      const header = button.closest('[data-slot="card-header"]');
      expect(header).toHaveTextContent(title);
      expect(button.querySelector('svg')).toBeInTheDocument();
      expect(screen.queryByTestId('ask-form-agent')).not.toBeInTheDocument();
      expect(screen.queryByTestId('include-form')).not.toBeInTheDocument();
      expect(hooks.selectUI).not.toHaveBeenCalled();
      expect(hooks.openChat).not.toHaveBeenCalled();
      fireEvent.click(button);
      await waitFor(() => expect(hooks.openChat).toHaveBeenCalledTimes(1));
      expect(hooks.createConversation).toHaveBeenCalledWith({
        agentId: 'online',
        config: { scope: ['examples-form-fill'] },
        selectedModel: { modelService: 'test-model', model: 'chat' },
      });
      expect(hooks.selectUI).toHaveBeenCalledWith(
        { kind: 'form', id: 'example-request' },
        true,
      );
      expect(hooks.selectUI.mock.invocationCallOrder[0]).toBeLessThan(
        hooks.openChat.mock.invocationCallOrder[0],
      );
      expect(hooks.openChat).toHaveBeenCalledWith({
        conversationId: 'conversation-a',
        draft: expect.any(String),
      });
    },
  );

  it('does not include the form or open chat when conversation creation fails', async () => {
    hooks.createConversation.mockRejectedValueOnce(
      new Error('Connection failed'),
    );
    await renderPage();
    fireEvent.click(screen.getByTestId('open-form-chat'));
    await screen.findByRole('alert');
    expect(hooks.selectUI).not.toHaveBeenCalled();
    expect(hooks.openChat).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId('open-form-chat')).toBeEnabled(),
    );
  });
});
