import type { useAIForm } from '@nocobase/app-plugin-agents/client/chat';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { renderWithApp } from '@nocobase/app-testing/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AIFormFillPage from '../../client/pages/ai-form-fill/index.js';
import locales from '../../client/locales/index.js';
import packageMetadata from '../../package.json' with { type: 'json' };

const hooks = vi.hoisted(() => ({
  form: vi.fn<(options: Parameters<typeof useAIForm>[0]) => void>(),
  createConversation: vi.fn(),
  openChat: vi.fn(),
  selectUI: vi.fn(),
  canSend: true,
}));
vi.mock('@nocobase/app-plugin-agents/client/chat', () => ({
  useAIForm: (options: Parameters<typeof useAIForm>[0]) => {
    hooks.form(options);
    return () => undefined;
  },
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
    canSend: hooks.canSend,
    services: [
      { name: 'test-model', models: [{ kind: 'chat', value: 'chat' }] },
    ],
  }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  hooks.canSend = true;
  hooks.createConversation.mockResolvedValue({ id: 'conversation-a' });
});
async function renderPage(locale = 'en-US') {
  return renderWithApp(<AIFormFillPage />, {
    namespace: packageMetadata.name,
    namespaces: { [packageMetadata.name]: locales },
    locale,
  });
}
const currentForm = () => hooks.form.mock.calls.at(-1)![0];
const operation = () => ({
  signal: new AbortController().signal,
  isCurrent: () => true,
});
const proposal = {
  name: 'Designer laptops',
  department: 'design',
  quantity: 3,
  budget: 36000,
  arrival: '2026-11-06',
  purpose: 'Design work and prototyping',
};

describe('procurement form AI assistance', () => {
  it('starts empty, exposes only six business fields and hides technical controls', async () => {
    await renderPage();
    for (const field of ['name', 'quantity', 'budget', 'purpose'])
      expect(screen.getByTestId(`draft-${field}`)).toHaveValue('');
    expect(screen.getByTestId('draft-department')).toHaveTextContent(
      enUS.aiFormFill.departmentPlaceholder,
    );
    expect(screen.getByTestId('draft-arrival')).toHaveTextContent(
      enUS.aiFormFill.arrivalPlaceholder,
    );
    expect(screen.queryByTestId('draft-record')).not.toBeInTheDocument();
    expect(
      screen.queryByText(enUS.aiFormFill.draftOnly),
    ).not.toBeInTheDocument();
    expect(
      screen
        .getByText(enUS.aiFormFill.hint)
        .closest('[data-slot="card-footer"]'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('draft-priority')).not.toBeInTheDocument();
    expect(screen.queryByTestId('draft-subscribe')).not.toBeInTheDocument();
    expect(currentForm().fields.map((field) => field.name)).toEqual([
      'name',
      'department',
      'quantity',
      'budget',
      'arrival',
      'purpose',
    ]);
    expect(currentForm().getValues()).toEqual({});
  });

  it('snapshots numeric drafts without coercing blank fields to zero', async () => {
    await renderPage();
    fireEvent.change(screen.getByTestId('draft-budget'), {
      target: { value: '5000' },
    });
    fireEvent.change(screen.getByTestId('draft-quantity'), {
      target: { value: '3' },
    });
    expect(currentForm().getValues()).toEqual({ budget: 5000, quantity: 3 });
    fireEvent.change(screen.getByTestId('draft-quantity'), {
      target: { value: '' },
    });
    expect(currentForm().getValues()).toEqual({ budget: 5000 });
    for (const value of ['invalid', '-1', '1000001']) {
      fireEvent.change(screen.getByTestId('draft-budget'), {
        target: { value },
      });
      expect(() => currentForm().getValues()).toThrow(
        enUS.aiFormFill.invalidDraft,
      );
    }
  });

  it('fills all six fields, reports completion and undoes only the latest AI fill', async () => {
    await renderPage();
    fireEvent.change(screen.getByTestId('draft-name'), {
      target: { value: 'Manual purchase' },
    });
    const revision = currentForm().getRevision();
    act(() => {
      currentForm().setValues(proposal, operation());
    });
    expect(screen.getByTestId('draft-name')).toHaveValue(proposal.name);
    expect(screen.getByTestId('draft-quantity')).toHaveValue('3');
    expect(screen.getByTestId('draft-budget')).toHaveValue('36000');
    expect(screen.getByTestId('draft-department')).toHaveTextContent(
      'Product Design',
    );
    expect(screen.getByTestId('draft-arrival')).toHaveTextContent(
      'Nov 6, 2026',
    );
    expect(currentForm().getValues()).toEqual(proposal);
    expect(screen.getByRole('status')).toHaveTextContent('Filled 6 fields');
    expect(currentForm().getRevision()).not.toBe(revision);
    const filledRevision = currentForm().getRevision();
    fireEvent.click(screen.getByRole('button', { name: enUS.aiFormFill.undo }));
    expect(currentForm().getValues()).toEqual({ name: 'Manual purchase' });
    expect(currentForm().getRevision()).not.toBe(filledRevision);
    expect(screen.getByTestId('draft-name')).toHaveFocus();
    expect(
      screen.queryByTestId('form-fill-completion'),
    ).not.toBeInTheDocument();
  });

  it('preserves unsupplied values on partial fill and clears stale undo after manual edits', async () => {
    await renderPage();
    fireEvent.change(screen.getByTestId('draft-purpose'), {
      target: { value: 'Keep my reason' },
    });
    act(() => {
      currentForm().setValues({ name: 'Laptops' }, operation());
    });
    expect(currentForm().getValues()).toEqual({
      name: 'Laptops',
      purpose: 'Keep my reason',
    });
    fireEvent.change(screen.getByTestId('draft-name'), {
      target: { value: 'Edited' },
    });
    expect(
      screen.queryByRole('button', { name: enUS.aiFormFill.undo }),
    ).not.toBeInTheDocument();
    const revision = currentForm().getRevision();
    fireEvent.click(
      screen.getByRole('button', { name: enUS.aiFormFill.clear }),
    );
    expect(currentForm().getValues()).toEqual({});
    expect(currentForm().getRevision()).not.toBe(revision);
    expect(screen.getByTestId('draft-name')).toHaveFocus();
  });

  it('rejects stale or aborted operations and invalid procurement patches', async () => {
    await renderPage();
    expect(() =>
      currentForm().setValues(proposal, {
        ...operation(),
        isCurrent: () => false,
      }),
    ).toThrow(enUS.aiFormFill.stale);
    const controller = new AbortController();
    controller.abort();
    expect(() =>
      currentForm().setValues(proposal, {
        ...operation(),
        signal: controller.signal,
      }),
    ).toThrow(enUS.aiFormFill.stale);
    for (const patch of [
      {},
      { quantity: 0 },
      { quantity: 1.5 },
      { department: 'unknown' },
      { arrival: '2026-02-30' },
      { priority: 'high' },
      { recordId: 'record-a' },
    ])
      expect(currentForm().validate?.(patch)).toBe(
        enUS.aiFormFill.invalidProposal,
      );
    expect(currentForm().getValues()).toEqual({});
  });

  it('picks a date from the localized calendar', async () => {
    await renderPage('zh-CN');
    const user = userEvent.setup();
    await user.click(screen.getByTestId('draft-arrival'));
    const day = document.querySelector<HTMLButtonElement>(
      'button[data-day]:not(:disabled)',
    );
    expect(day).not.toBeNull();
    await user.click(day!);
    expect(currentForm().getValues()).toHaveProperty('arrival');
    expect(screen.getByTestId('draft-arrival')).not.toHaveTextContent(
      zhCN.aiFormFill.arrivalPlaceholder,
    );
  });

  it.each(['en-US', 'zh-CN'])(
    'opens real scoped chat with an editable procurement prompt in %s',
    async (locale) => {
      await renderPage(locale);
      const copy = (locale === 'zh-CN' ? zhCN : enUS).aiFormFill;
      const button = screen.getByRole('button', { name: copy.openChat });
      expect(button.closest('[data-slot="card-header"]')).toHaveTextContent(
        copy.draftTitle,
      );
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
        draft: copy.prompt,
      });
      expect(currentForm().getValues()).toEqual({});
    },
  );

  it('allows manual filling without model-configuration reminders', async () => {
    hooks.canSend = false;
    await renderPage();
    expect(screen.getByTestId('open-form-chat')).toBeDisabled();
    expect(screen.getByTestId('draft-name')).toBeEnabled();
    expect(
      screen.queryByText('No chat models are available.'),
    ).not.toBeInTheDocument();
  });

  it('does not select the form or open chat if conversation creation fails', async () => {
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
