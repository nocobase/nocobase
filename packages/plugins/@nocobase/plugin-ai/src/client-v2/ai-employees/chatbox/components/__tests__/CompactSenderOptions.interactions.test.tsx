/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { App } from 'antd';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIEmployee } from '../../../types';
import type { ModelRef } from '../../stores/chat-box';
import { CompactSenderOptions } from '../CompactSenderOptions';

const mocks = vi.hoisted(() => {
  const employee: AIEmployee = { username: 'atlas', nickname: 'Atlas', category: 'business' };
  const repository = {
    aiEmployees: [employee],
    llmServices: [
      {
        llmService: 'deepseek',
        llmServiceTitle: 'Deepseek',
        enabledModels: [
          { value: 'deepseek-chat', label: 'Deepseek Flash' },
          { value: 'deepseek-reasoner', label: 'Deepseek Reasoner' },
        ],
      },
    ],
    llmServicesLoading: false,
    getLLMServices: vi.fn().mockResolvedValue([]),
    getAIEmployees: vi.fn().mockResolvedValue([]),
  };
  const pickBlock = vi.fn();
  return {
    employee,
    repository,
    pickBlock,
    context: {},
    runtime: {
      mode: 'block',
      chatBoxModel: {
        currentEmployee: employee,
        readonly: false,
        model: { llmService: 'deepseek', model: 'deepseek-chat' } as ModelRef | null,
        setModel: vi.fn(),
      },
      chatConversationModel: { currentConversation: undefined, webSearch: false },
    },
    app: {
      apiClient: { storage: { getItem: () => null, setItem: vi.fn() } },
      pluginSettingsManager: { has: () => false },
      pm: {
        get: () => ({
          aiManager: {
            workContext: {
              getValues: () => [{ name: 'flow-model', menu: { label: 'Pick block', onClick: pickBlock } }],
            },
          },
        }),
      },
    },
    switchAIEmployee: vi.fn(),
  };
});

vi.mock('@nocobase/client-v2', () => ({ useApp: () => mocks.app }));
vi.mock('@nocobase/flow-engine', () => ({
  observer: (component: unknown) => component,
  useFlowContext: () => mocks.context,
}));
vi.mock('../../../../locale', () => ({ useT: () => (text: string) => text }));
vi.mock('../../stores/runtime', () => ({ useChatBoxRuntime: () => mocks.runtime }));
vi.mock('../../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => mocks.repository,
}));
vi.mock('../../hooks/useChat', () => ({
  useChat: () => ({
    use: { contextItems: () => [] },
    addContextItems: vi.fn(),
    removeContextItem: vi.fn(),
  }),
}));
vi.mock('../../hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({ switchAIEmployee: mocks.switchAIEmployee }),
}));
vi.mock('../../hooks/useChatMessageActions', () => ({
  useChatMessageActions: () => ({ syncContextAttachments: vi.fn() }),
}));
vi.mock('../../../ProfileCard', () => ({ AIEmployeeProfileCard: () => null }));
vi.mock('../AddLLMModal', () => ({ AddLLMModal: () => null }));
vi.mock('../SearchSwitch', () => ({ SearchSwitch: () => null }));

function renderOptions() {
  return render(
    <App>
      <CompactSenderOptions options={{ showWebSearch: false }} />
    </App>,
  );
}

describe('compact options with real employee, model and context selectors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runtime.chatBoxModel.model = { llmService: 'deepseek', model: 'deepseek-chat' };
  });

  it('initializes and resolves the model while the named dialog is closed', () => {
    mocks.runtime.chatBoxModel.model = null;
    const { queryByRole, getByRole } = renderOptions();
    expect(queryByRole('dialog', { name: 'Chat options' })).toBeNull();
    expect(mocks.repository.getLLMServices).toHaveBeenCalledTimes(1);
    expect(mocks.runtime.chatBoxModel.setModel).toHaveBeenCalledWith({
      llmService: 'deepseek',
      model: 'deepseek-chat',
    });
    fireEvent.click(getByRole('button', { name: 'Chat options' }));
    expect(getByRole('dialog', { name: 'Chat options' })).toBeTruthy();
  });

  it.each(['Model', 'AI employee', 'Work context'])('closes %s before the dialog on Escape', async (name) => {
    const { getByRole, findByRole, queryByRole } = renderOptions();
    const trigger = getByRole('button', { name: 'Chat options' });
    fireEvent.click(trigger);
    fireEvent.click(getByRole('button', { name }));
    const menu = await findByRole('menu');
    fireEvent.keyDown(menu, { key: 'Escape', keyCode: 27 });
    await waitFor(() => expect(queryByRole('menu')).toBeNull());
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(getByRole('dialog', { name: 'Chat options' }), { key: 'Escape', keyCode: 27 });
    await waitFor(() => expect(queryByRole('dialog', { name: 'Chat options' })).toBeNull());
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('button[aria-label="Model"]')).not.toBeNull();
    expect(mocks.repository.getLLMServices).toHaveBeenCalledTimes(1);
  });

  it.each(['Model', 'AI employee', 'Work context'])(
    'clears %s when dismissing and reopening the sheet',
    async (name) => {
      const { getByRole, findByRole, queryByRole } = renderOptions();
      const trigger = getByRole('button', { name: 'Chat options' });
      fireEvent.click(trigger);
      fireEvent.click(getByRole('button', { name }));
      await findByRole('menu');
      const mask = document.querySelector('.ant-drawer-mask');
      if (!mask) {
        throw new Error('Expected the options sheet backdrop');
      }
      fireEvent.click(mask);
      await waitFor(() => expect(queryByRole('menu')).toBeNull());
      await waitFor(() => expect(queryByRole('dialog', { name: 'Chat options' })).toBeNull());
      fireEvent.click(trigger);
      expect(getByRole('dialog', { name: 'Chat options' })).toBeTruthy();
      expect(queryByRole('menu')).toBeNull();
      expect(mocks.repository.getLLMServices).toHaveBeenCalledTimes(1);
    },
  );

  it('closes the menu first even if the drawer focus trap owns keyboard focus', async () => {
    const { getByRole, findByRole, queryByRole } = renderOptions();
    const trigger = getByRole('button', { name: 'Chat options' });
    fireEvent.click(trigger);
    const root = getByRole('dialog', { name: 'Chat options' }).closest('.ant-drawer');
    if (!(root instanceof HTMLElement)) {
      throw new Error('Expected the drawer focus trap');
    }
    fireEvent.click(getByRole('button', { name: 'Model' }));
    await findByRole('menu');
    root.focus();
    fireEvent.keyDown(root, { key: 'Escape', keyCode: 27 });
    await waitFor(() => expect(queryByRole('menu')).toBeNull());
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(root, { key: 'Escape', keyCode: 27 });
    await waitFor(() => expect(queryByRole('dialog', { name: 'Chat options' })).toBeNull());
  });

  it('opens only the most recently selected menu', async () => {
    const { getByRole, findByRole, queryByRole } = renderOptions();
    fireEvent.click(getByRole('button', { name: 'Chat options' }));
    fireEvent.click(getByRole('button', { name: 'Model' }));
    await findByRole('menuitem', { name: /Deepseek Reasoner/ });
    fireEvent.click(getByRole('button', { name: 'AI employee' }));
    await findByRole('menuitem', { name: /Atlas/ });
    await waitFor(() => expect(queryByRole('menuitem', { name: /Deepseek Reasoner/ })).toBeNull());
  });

  it('keeps model selection functional', async () => {
    const { getByRole, findByRole, queryByRole } = renderOptions();
    fireEvent.click(getByRole('button', { name: 'Chat options' }));
    fireEvent.click(getByRole('button', { name: 'Model' }));
    fireEvent.click(await findByRole('menuitem', { name: /Deepseek Reasoner/ }));
    expect(mocks.runtime.chatBoxModel.setModel).toHaveBeenCalledWith({
      llmService: 'deepseek',
      model: 'deepseek-reasoner',
    });
    await waitFor(() => expect(queryByRole('menu')).toBeNull());
    expect(getByRole('dialog', { name: 'Chat options' })).toBeTruthy();
  });

  it('dismisses the sheet and the actual context menu before picking a block', async () => {
    const { getByRole, findByRole, queryByRole } = renderOptions();
    fireEvent.click(getByRole('button', { name: 'Chat options' }));
    fireEvent.click(getByRole('button', { name: 'Work context' }));
    fireEvent.click(await findByRole('menuitem', { name: 'Pick block' }));
    expect(mocks.pickBlock).toHaveBeenCalledTimes(1);
    expect(getByRole('button', { name: 'Chat options' }).getAttribute('aria-expanded')).toBe('false');
    await waitFor(() => expect(queryByRole('menu')).toBeNull());
    await waitFor(() => expect(queryByRole('dialog', { name: 'Chat options' })).toBeNull());
  });
});
