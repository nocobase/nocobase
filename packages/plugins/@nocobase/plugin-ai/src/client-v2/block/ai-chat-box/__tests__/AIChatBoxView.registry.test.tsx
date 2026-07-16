/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render } from '@testing-library/react';
import type { FlowModel } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearMountedChatBoxes, getMountedChatBox } from '../../../ai-employees/chatbox/stores/mounted-chat-boxes';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { AIChatBoxView } from '../components/AIChatBoxView';

const mocks = vi.hoisted(() => ({
  runtime: {
    chatConversationModel: {
      currentConversation: undefined as string | undefined,
    },
  },
  clear: vi.fn(),
  triggerTask: vi.fn().mockResolvedValue(undefined),
  addContextItems: vi.fn(),
  syncContextAttachments: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return {
    ...actual,
    AddSubModelButton: Passthrough,
    DndProvider: Passthrough,
    DragHandler: () => <span data-testid="drag-handler" />,
    Droppable: Passthrough,
    FlowModelRenderer: () => <div data-testid="flow-model-renderer" />,
    FlowSettingsButton: ({ children }: { children?: React.ReactNode }) => <button>{children}</button>,
    FlowsFloatContextMenu: Passthrough,
  };
});

vi.mock('../../../locale', () => ({
  NAMESPACE: '@nocobase/plugin-ai',
  tExpr: (text: string) => text,
  useT: () => (text: string) => text,
}));

vi.mock('../../../ai-employees/chatbox/stores/runtime', () => ({
  useChatBoxRuntime: () => mocks.runtime,
}));

vi.mock('../../../ai-employees/chatbox/hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({
    clear: mocks.clear,
    startNewConversation: vi.fn(),
    triggerTask: mocks.triggerTask,
  }),
}));

vi.mock('../../../ai-employees/chatbox/hooks/useChatMessageActions', () => ({
  useChatMessageActions: () => ({
    syncContextAttachments: mocks.syncContextAttachments,
  }),
}));

vi.mock('../../../ai-employees/chatbox/hooks/useChat', () => ({
  useChat: () => ({
    addContextItems: mocks.addContextItems,
  }),
}));

vi.mock('../../../ai-employees/chatbox/components/Messages', () => ({
  Messages: () => <div data-testid="messages" />,
}));

vi.mock('../components/Conversations', () => ({
  Conversations: () => <div data-testid="conversations" />,
}));

const makeModel = (): AIChatBoxBlockModel => {
  return {
    uid: 'chat-box-1',
    props: {},
    context: {
      flowSettingsEnabled: false,
    },
    mapSubModels: (_subKey: string, _callback: (model: FlowModel, index: number) => React.ReactNode) => [],
  } as AIChatBoxBlockModel;
};

describe('AIChatBoxView mounted registry', () => {
  afterEach(() => {
    clearMountedChatBoxes();
    mocks.clear.mockClear();
    mocks.triggerTask.mockClear();
    mocks.addContextItems.mockClear();
    mocks.syncContextAttachments.mockClear();
  });

  it('registers the mounted block runtime and removes it on unmount', () => {
    const { unmount } = render(<AIChatBoxView model={makeModel()} />);
    const entry = getMountedChatBox('chat-box-1');

    expect(entry).toMatchObject({
      uid: 'chat-box-1',
      runtime: mocks.runtime,
      clear: mocks.clear,
      triggerTask: mocks.triggerTask,
    });

    entry?.syncContextItems([{ type: 'flow-model', uid: 'block-1' }]);
    expect(mocks.addContextItems).toHaveBeenCalledWith([{ type: 'flow-model', uid: 'block-1' }]);
    expect(mocks.syncContextAttachments).toHaveBeenCalledWith([{ type: 'flow-model', uid: 'block-1' }]);

    unmount();

    expect(getMountedChatBox('chat-box-1')).toBeUndefined();
  });
});
