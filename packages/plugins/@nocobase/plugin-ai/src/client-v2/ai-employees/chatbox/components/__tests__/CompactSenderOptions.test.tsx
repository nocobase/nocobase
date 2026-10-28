/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompactSenderOptions } from '../CompactSenderOptions';

const mocks = vi.hoisted(() => ({
  runtime: {
    chatBoxModel: {
      currentEmployee: { username: 'atlas', nickname: 'Atlas' } as { username: string; nickname: string } | undefined,
      model: { llmService: 'deepseek', model: 'deepseek-chat' },
      readonly: false,
    },
    chatConversationModel: { currentConversation: undefined, webSearch: false },
  },
  employeeProps: vi.fn(),
  modelProps: vi.fn(),
  contextProps: vi.fn(),
  searchProps: vi.fn(),
  contextItems: [{ type: 'record', uid: 'record-1' }],
  addContextItems: vi.fn(),
  removeContextItem: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', () => ({ observer: (component: unknown) => component }));
vi.mock('../../../../locale', () => ({ useT: () => (text: string) => text }));
vi.mock('../../stores/runtime', () => ({ useChatBoxRuntime: () => mocks.runtime }));
vi.mock('../../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({ llmServices: [] }),
}));
vi.mock('../../hooks/useChat', () => ({
  useChat: () => ({
    use: { contextItems: () => mocks.contextItems },
    addContextItems: mocks.addContextItems,
    removeContextItem: mocks.removeContextItem,
  }),
}));
vi.mock('../AIEmployeeSwitcher', () => ({
  AIEmployeeSwitcher: (props: { disabled?: boolean }) => {
    mocks.employeeProps(props);
    return <button disabled={props.disabled}>Select employee</button>;
  },
}));
vi.mock('../ModelSwitcher', () => ({
  getModelLabel: () => 'Deepseek Flash',
  ModelSwitcher: (props: { disabled?: boolean }) => {
    mocks.modelProps(props);
    return <button disabled={props.disabled}>Select model</button>;
  },
}));
vi.mock('../../../AddContextButton', () => ({
  AddContextButton: (props: { disabled?: boolean; onSelect?: (key: string) => void }) => {
    mocks.contextProps(props);
    return (
      <button disabled={props.disabled} onClick={() => props.onSelect?.('flow-model')}>
        Add context
      </button>
    );
  },
}));
vi.mock('../SearchSwitch', () => ({
  SearchSwitch: (props: { disabled?: boolean }) => {
    mocks.searchProps(props);
    return <button disabled={props.disabled}>Toggle search</button>;
  },
}));

describe('compact sender options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runtime.chatBoxModel.currentEmployee = { username: 'atlas', nickname: 'Atlas' };
    mocks.runtime.chatBoxModel.readonly = false;
  });

  it('shows the current selection in a single trigger and opens an accessible bottom sheet', async () => {
    const { getByRole, getByText } = render(<CompactSenderOptions options={{}} />);
    const trigger = getByRole('button', { name: 'Chat options' });
    expect(trigger.textContent).toContain('Atlas · Deepseek Flash');
    expect(trigger.style.height).toBe('44px');
    expect(trigger.style.justifyContent).toBe('flex-start');
    expect(trigger.style.paddingInline).toBe('0');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(getByRole('dialog')).toBeTruthy();
    expect(getByText('Work context')).toBeTruthy();
    expect(getByRole('button', { name: 'Select model' })).toBeTruthy();
    fireEvent.keyDown(getByRole('dialog'), { key: 'Escape', keyCode: 27 });
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'));
  });

  it('preserves employee and model restrictions and the active context callbacks', () => {
    render(
      <CompactSenderOptions options={{ allowedAIEmployees: ['atlas'], allowedModels: ['deepseek:deepseek-chat'] }} />,
    );
    expect(mocks.employeeProps).toHaveBeenCalledWith(
      expect.objectContaining({ allowedUsernames: ['atlas'], block: true }),
    );
    expect(mocks.modelProps).toHaveBeenCalledWith(
      expect.objectContaining({ allowedModelKeys: ['deepseek:deepseek-chat'], block: true }),
    );
    expect(mocks.contextProps).toHaveBeenCalledWith(
      expect.objectContaining({
        contextItems: mocks.contextItems,
        onAdd: mocks.addContextItems,
        onRemove: mocks.removeContextItem,
      }),
    );
    expect(mocks.searchProps).toHaveBeenCalledWith(expect.objectContaining({ showLabel: true }));
  });

  it('omits hidden controls and does not leak their selection into the summary', () => {
    const { getByRole } = render(
      <CompactSenderOptions
        options={{ showEmployeeSelect: false, showContextSelector: false, showWebSearch: false }}
      />,
    );
    expect(getByRole('button', { name: 'Chat options' }).textContent).toBe('Deepseek Flash');
    expect(mocks.employeeProps).not.toHaveBeenCalled();
    expect(mocks.contextProps).not.toHaveBeenCalled();
    expect(mocks.searchProps).not.toHaveBeenCalled();
  });

  it('does not render an empty options sheet when every setting is hidden', () => {
    const { queryByRole } = render(
      <CompactSenderOptions
        options={{
          showEmployeeSelect: false,
          showModelSelect: false,
          showContextSelector: false,
          showWebSearch: false,
        }}
      />,
    );
    expect(queryByRole('button')).toBeNull();
    expect(mocks.employeeProps).not.toHaveBeenCalled();
    expect(mocks.modelProps).not.toHaveBeenCalled();
  });

  it('keeps every setting readonly but allows inspecting the current selection', () => {
    mocks.runtime.chatBoxModel.readonly = true;
    const { getByRole } = render(<CompactSenderOptions options={{}} />);
    fireEvent.click(getByRole('button', { name: 'Chat options' }));
    for (const name of ['Select employee', 'Select model', 'Add context', 'Toggle search']) {
      expect(getByRole('button', { name }).hasAttribute('disabled')).toBe(true);
    }
  });

  it('allows choosing an employee when none is selected while disabling dependent controls', () => {
    mocks.runtime.chatBoxModel.currentEmployee = undefined;
    const { getByRole } = render(<CompactSenderOptions options={{}} />);
    fireEvent.click(getByRole('button', { name: 'Chat options' }));
    expect(getByRole('button', { name: 'Select employee' }).hasAttribute('disabled')).toBe(false);
    expect(getByRole('button', { name: 'Select model' }).hasAttribute('disabled')).toBe(true);
  });

  it('closes options when picking a block instead of leaving the sheet over the page', async () => {
    const { getByRole, queryByRole } = render(<CompactSenderOptions options={{}} />);
    const trigger = getByRole('button', { name: 'Chat options' });
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(getByRole('button', { name: 'Add context' }));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await waitFor(() => expect(queryByRole('dialog')).toBeNull());
  });
});
