/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchSwitch } from '../SearchSwitch';

const mocks = vi.hoisted(() => ({
  repository: {
    llmServices: [
      {
        llmService: 'service',
        llmServiceTitle: 'Service',
        enabledModels: [{ value: 'model', label: 'Model' }],
        supportWebSearch: true,
        webSearchModels: ['model'],
      },
    ],
    getLLMServices: vi.fn().mockResolvedValue(undefined),
  },
  runtime: {
    chatBoxModel: { model: { llmService: 'service', model: 'model' } },
    chatConversationModel: { webSearch: false, setWebSearch: vi.fn() },
  },
}));

vi.mock('../../../../locale', () => ({ useT: () => (text: string) => text }));
vi.mock('../../stores/runtime', () => ({ useChatBoxRuntime: () => mocks.runtime }));
vi.mock('../../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => mocks.repository,
}));

describe('SearchSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runtime.chatConversationModel.webSearch = false;
    mocks.repository.llmServices[0].supportWebSearch = true;
  });

  it('shows the action label in the mobile options sheet and enables supported search', () => {
    const { getByRole } = render(<SearchSwitch showLabel />);
    const button = getByRole('button', { name: 'Enable search' });
    expect(button.textContent).toBe('Enable search');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(mocks.runtime.chatConversationModel.setWebSearch).toHaveBeenCalledWith(true);
  });

  it('exposes selected search state and allows disabling it', () => {
    mocks.runtime.chatConversationModel.webSearch = true;
    const { getByRole } = render(<SearchSwitch showLabel />);
    const button = getByRole('button', { name: 'Disable search' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(button);
    expect(mocks.runtime.chatConversationModel.setWebSearch).toHaveBeenCalledWith(false);
  });

  it('explains unsupported search without requiring a hover tooltip and clears stale enabled state', () => {
    mocks.repository.llmServices[0].supportWebSearch = false;
    mocks.runtime.chatConversationModel.webSearch = true;
    const { getByRole, rerender } = render(<SearchSwitch showLabel />);
    expect(mocks.runtime.chatConversationModel.setWebSearch).toHaveBeenCalledWith(false);
    mocks.runtime.chatConversationModel.webSearch = false;
    rerender(<SearchSwitch showLabel disabled={false} />);
    const button = getByRole('button', { name: 'Web search not supported' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.textContent).toBe('Web search not supported');
  });

  it('keeps the desktop control icon-only and prevents readonly changes', () => {
    const { getByRole } = render(<SearchSwitch disabled />);
    const button = getByRole('button', { name: 'Web search' });
    expect(button.textContent).toBe('');
    fireEvent.click(button);
    expect(mocks.runtime.chatConversationModel.setWebSearch).not.toHaveBeenCalled();
  });
});
