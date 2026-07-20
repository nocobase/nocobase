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
import { FlowContextProvider, type FlowModel, type FlowModelContext } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearMountedChatBoxes, getMountedChatBox } from '../../../ai-employees/chatbox/stores/mounted-chat-boxes';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { AIChatBoxCoreModel } from '../AIChatBoxCoreModel';
import { AI_CHAT_BOX_CORE_MIN_HEIGHT, AI_CHAT_BOX_CORE_MIN_WIDTH, AIChatBoxView } from '../components/AIChatBoxView';

type ToolbarItem = {
  key?: React.Key;
};

type FlowModelRendererProps = {
  model?: FlowModel;
  showFlowSettings?: unknown;
  hideRemoveInSettings?: boolean;
  extraToolbarItems?: ToolbarItem[];
};

const mocks = vi.hoisted(() => ({
  runtime: {
    scope: undefined as string | undefined,
    chatConversationModel: {
      currentConversation: undefined as string | undefined,
      conversations: [] as Array<{ sessionId: string; read: boolean }>,
      unreadCount: 0,
    },
  },
  eventBus: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  clear: vi.fn(),
  triggerTask: vi.fn().mockResolvedValue(undefined),
  refreshConversations: vi.fn(),
  addContextItems: vi.fn(),
  syncContextAttachments: vi.fn(),
  flowModelRendererProps: [] as FlowModelRendererProps[],
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/client-v2')>()),
  useApp: () => ({
    eventBus: mocks.eventBus,
  }),
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
    FlowModelRenderer: (props: FlowModelRendererProps) => {
      mocks.flowModelRendererProps.push(props);
      return <div data-testid="flow-model-renderer" />;
    },
    FlowSettingsButton: ({ children }: { children?: React.ReactNode }) => <button>{children}</button>,
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

vi.mock('../../../ai-employees/chatbox/hooks/useChatConversationActions', () => ({
  useChatConversationActions: () => ({
    refresh: mocks.refreshConversations,
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

vi.mock('../../../ai-employees/chatbox/components/Conversations', () => ({
  Conversations: () => <div data-testid="conversations" />,
}));

const makeModel = (
  props: AIChatBoxBlockModel['props'] = {},
  decoratorProps: AIChatBoxBlockModel['decoratorProps'] = {},
  items: FlowModel[] = [],
  flowSettingsEnabled = false,
): AIChatBoxBlockModel => {
  return {
    uid: 'chat-box-1',
    props,
    decoratorProps,
    context: {
      flowSettingsEnabled,
    },
    mapSubModels: (subKey: string, callback: (model: FlowModel, index: number) => React.ReactNode) =>
      subKey === 'items' ? items.map((item, index) => callback(item, index)) : [],
  } as AIChatBoxBlockModel;
};

const makeCoreModel = () => {
  const core = Object.create(AIChatBoxCoreModel.prototype) as FlowModel;
  Object.defineProperty(core, 'uid', { value: 'core-1' });
  return core;
};

const makeBodyModel = () => {
  return {
    uid: 'body-1',
  } as FlowModel;
};

const renderAIChatBoxView = (model: AIChatBoxBlockModel) => {
  return render(
    <FlowContextProvider context={{ model } as FlowModelContext}>
      <AIChatBoxView />
    </FlowContextProvider>,
  );
};

describe('AIChatBoxView mounted registry', () => {
  afterEach(() => {
    clearMountedChatBoxes();
    mocks.clear.mockClear();
    mocks.triggerTask.mockClear();
    mocks.eventBus.addEventListener.mockClear();
    mocks.eventBus.removeEventListener.mockClear();
    mocks.refreshConversations.mockClear();
    mocks.addContextItems.mockClear();
    mocks.syncContextAttachments.mockClear();
    mocks.flowModelRendererProps = [];
    mocks.runtime.scope = undefined;
    mocks.runtime.chatConversationModel.conversations = [];
    mocks.runtime.chatConversationModel.unreadCount = 0;
  });

  it('registers the mounted block runtime and removes it on unmount', () => {
    const { container, unmount } = renderAIChatBoxView(makeModel({ height: 720 }));
    const entry = getMountedChatBox('chat-box-1');

    const layouts = container.querySelectorAll('.ant-layout');
    expect(layouts[0]?.getAttribute('style')).toContain('height: 720px');
    expect(layouts[1]?.getAttribute('style')).toContain('height: 100%');
    expect(entry).toMatchObject({
      uid: 'chat-box-1',
      runtime: mocks.runtime,
      clear: mocks.clear,
    });

    entry?.triggerTask({ aiEmployee: { username: 'sales' } });
    expect(mocks.triggerTask).toHaveBeenCalledWith({
      aiEmployee: { username: 'sales' },
      scope: 'chat-box-1',
    });
    entry?.syncContextItems([{ type: 'flow-model', uid: 'block-1' }]);
    expect(mocks.addContextItems).toHaveBeenCalledWith([{ type: 'flow-model', uid: 'block-1' }]);
    expect(mocks.syncContextAttachments).toHaveBeenCalledWith([{ type: 'flow-model', uid: 'block-1' }]);

    unmount();

    expect(getMountedChatBox('chat-box-1')).toBeUndefined();
    expect(mocks.refreshConversations).toHaveBeenCalledTimes(1);
    expect(mocks.eventBus.addEventListener).toHaveBeenCalledWith(
      'ws:message:ai-conversations:read',
      expect.any(Function),
    );
    expect(mocks.eventBus.removeEventListener).toHaveBeenCalledWith(
      'ws:message:ai-conversations:read',
      expect.any(Function),
    );
  });

  it('uses the initialized block uid for conversation queries', () => {
    renderAIChatBoxView(makeModel({ scope: 'chat-box-1' }));

    expect(mocks.runtime.scope).toBe('chat-box-1');
  });

  it('keeps explicitly blank scope unfiltered for conversation queries', () => {
    renderAIChatBoxView(makeModel({ scope: '' }));

    expect(mocks.runtime.scope).toBeUndefined();
  });

  it('uses explicit scope for conversation queries', () => {
    renderAIChatBoxView(makeModel({ scope: 'shared-sales' }));

    expect(mocks.runtime.scope).toBe('shared-sales');
  });

  it('fills the common block height container when height mode is fixed', () => {
    const { container } = renderAIChatBoxView(makeModel({}, { heightMode: 'specifyValue', height: 720 }));

    expect(container.querySelector('.ant-layout')?.getAttribute('style')).toContain('height: 100%');
  });

  it('keeps the chat box core wide enough for horizontal scrolling', () => {
    const { container, getByTestId } = renderAIChatBoxView(makeModel({}, {}, [makeCoreModel()]));
    const coreItem = getByTestId('flow-model-renderer').closest(
      `[style*="min-width: ${AI_CHAT_BOX_CORE_MIN_WIDTH}px"]`,
    );

    expect(container.querySelector('.ant-layout')?.getAttribute('style')).toContain(
      `min-width: ${AI_CHAT_BOX_CORE_MIN_WIDTH}px`,
    );
    expect(coreItem).toBeTruthy();
  });

  it('does not render a drag handle for the chat box core itself', () => {
    const core = makeCoreModel();

    renderAIChatBoxView(makeModel({}, {}, [core], true));

    const coreRendererProps = mocks.flowModelRendererProps.find((props) => props.model === core);

    expect(coreRendererProps?.showFlowSettings).toBe(false);
    expect(coreRendererProps?.hideRemoveInSettings).toBe(true);
    expect(coreRendererProps?.extraToolbarItems).toEqual([]);
  });

  it('lets added body items push the chat core down inside the scrollable body area', () => {
    const { getAllByTestId } = renderAIChatBoxView(makeModel({}, {}, [makeBodyModel(), makeCoreModel()]));
    const [bodyRenderer, coreRenderer] = getAllByTestId('flow-model-renderer');
    const bodyItem = bodyRenderer.parentElement;
    const coreItem = coreRenderer.closest(`[style*="min-width: ${AI_CHAT_BOX_CORE_MIN_WIDTH}px"]`);

    expect(bodyItem).toBeTruthy();
    expect(bodyItem?.getAttribute('style') || '').not.toContain('max-height');
    expect(coreItem?.getAttribute('style')).toContain(`min-height: ${AI_CHAT_BOX_CORE_MIN_HEIGHT}px`);
  });

  it('shows an unread dot on the conversation toggle for unread block conversations', () => {
    mocks.runtime.chatConversationModel.conversations = [{ sessionId: 'session-1', read: false }];

    const { container } = renderAIChatBoxView(makeModel());

    expect(container.querySelector('.ant-badge-dot')).toBeTruthy();
  });

  it('does not show an unread dot when only other scopes have unread conversations', () => {
    mocks.runtime.chatConversationModel.unreadCount = 1;
    mocks.runtime.chatConversationModel.conversations = [{ sessionId: 'session-1', read: true }];

    const { container } = renderAIChatBoxView(makeModel());

    expect(container.querySelector('.ant-badge-dot')).toBeFalsy();
  });
});
