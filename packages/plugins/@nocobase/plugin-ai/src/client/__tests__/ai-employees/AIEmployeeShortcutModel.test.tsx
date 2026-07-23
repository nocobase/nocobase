/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIEmployee } from '../../ai-employees/types';
import { AIEmployeeShortcutModel } from '../../ai-employees/flow/models/AIEmployeeShortcutModel';
import { useChatConversationsStore } from '../../ai-employees/chatbox/stores/chat-conversations';
import { useChatMessagesStore } from '../../ai-employees/chatbox/stores/chat-messages';

const mocks = vi.hoisted(() => ({
  triggerTask: vi.fn(),
  syncContextAttachments: vi.fn(),
  employee: {
    username: 'atlas',
    nickname: 'Atlas',
    avatar: 'baseBlue',
  },
}));

vi.mock('antd', () => {
  const Component = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Alert: Component,
    Avatar: ({ onClick }: { onClick?: () => void }) => (
      <button type="button" onClick={onClick}>
        AI employee
      </button>
    ),
    Card: Object.assign(Component, { Meta: Component }),
    Input: Component,
    Popover: Component,
    Select: Component,
    Spin: Component,
    Switch: Component,
    Tag: Component,
    Typography: Component,
  };
});

vi.mock('@nocobase/flow-engine', () => ({
  FlowModel: class FlowModel {
    static registerFlow() {}
  },
  observer: (component: React.ComponentType) => component,
  tExpr: (text: string) => text,
  useFlowContext: () => ({
    engine: {
      getModel: () => true,
    },
    model: {
      parent: undefined,
    },
  }),
  useFlowSettingsContext: vi.fn(),
}));

vi.mock('@nocobase/client', () => ({
  AddContextButton: vi.fn(),
  RemoteSelect: vi.fn(),
  TextAreaWithContextSelector: vi.fn(),
  useCompile: () => (value: string) => value,
  useRequest: () => ({ loading: false }),
  useToken: () => ({ token: {} }),
}));

vi.mock('../../ai-employees/avatars', () => ({
  avatars: () => 'avatar.svg',
}));

vi.mock('../../ai-employees/ProfileCard', () => ({
  ProfileCard: () => null,
}));

vi.mock('../../ai-employees/AddContextButton', () => ({
  AddContextButton: () => null,
}));

vi.mock('../../ai-employees/chatbox/ContextItem', () => ({
  ContextItem: () => null,
}));

vi.mock('../../ai-employees/chatbox/hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({
    triggerTask: mocks.triggerTask,
  }),
}));

vi.mock('../../ai-employees/chatbox/hooks/useChatMessageActions', () => ({
  useChatMessageActions: () => ({
    syncContextAttachments: mocks.syncContextAttachments,
  }),
}));

vi.mock('../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    getAIEmployees: vi.fn().mockResolvedValue([mocks.employee]),
    getAIEmployeesMap: () => ({
      [mocks.employee.username]: mocks.employee,
    }),
  }),
}));

vi.mock('../../llm-services/hooks/useLLMServiceCatalog', () => ({
  useLLMServiceCatalog: () => ({ services: [], loading: false }),
}));

vi.mock('../../locale', () => ({
  namespace: 'ai',
  tExpr: (text: string) => text,
  useT: () => (text: string) => text,
}));

describe('AIEmployeeShortcutModel', () => {
  const employee: AIEmployee = mocks.employee;
  const workContext = [{ type: 'flow-model' as const, uid: 'block-1' }];

  beforeEach(() => {
    mocks.triggerTask.mockReset();
    mocks.syncContextAttachments.mockReset();
    useChatConversationsStore.getState().setCurrentConversation(undefined);
    useChatMessagesStore.getState().resetSessionState(undefined);
    useChatMessagesStore.getState().resetSessionState('session-1');
  });

  it('syncs shortcut context to the new draft when replacing an existing conversation', () => {
    useChatConversationsStore.getState().setCurrentConversation('session-1');
    mocks.triggerTask.mockImplementation(() => {
      useChatConversationsStore.getState().setCurrentConversation(undefined);
      return Promise.resolve();
    });

    const model = Object.create(AIEmployeeShortcutModel.prototype) as AIEmployeeShortcutModel;
    model.props = {
      aiEmployee: employee,
      context: { workContext },
      style: {},
    };

    render(model.render());
    fireEvent.click(screen.getByRole('button', { name: 'AI employee' }));

    expect(useChatMessagesStore.getState().getSessionState(undefined).contextItems).toEqual(workContext);
    expect(useChatMessagesStore.getState().getSessionState('session-1').contextItems).toEqual([]);
    expect(mocks.syncContextAttachments).toHaveBeenCalledWith(workContext);
  });
});
