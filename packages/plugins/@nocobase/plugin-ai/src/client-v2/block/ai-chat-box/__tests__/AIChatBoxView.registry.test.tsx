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
    mode: 'block',
    getScope: undefined as undefined | ((options?: { operation?: 'list' | 'create' }) => Promise<string | undefined>),
    chatConversationModel: {
      currentConversation: undefined as string | undefined,
      conversations: [] as Array<{ sessionId: string; read: boolean }>,
      unreadCount: 0,
      setConversationRead: vi.fn(),
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
  renderActions: vi.fn(() => null),
  renderConfigureActions: vi.fn(() => null),
  renderConfigureItems: vi.fn(() => null),
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
    renderActions: mocks.renderActions,
    renderConfigureActions: mocks.renderConfigureActions,
    renderConfigureItems: mocks.renderConfigureItems,
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

const renderAIChatBoxView = (model: AIChatBoxBlockModel, context: Partial<FlowModelContext> = {}) => {
  return render(
    <FlowContextProvider context={{ model, ...context } as FlowModelContext}>
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
    mocks.runtime.chatConversationModel.setConversationRead.mockClear();
    mocks.addContextItems.mockClear();
    mocks.syncContextAttachments.mockClear();
    mocks.renderActions.mockClear();
    mocks.renderConfigureActions.mockClear();
    mocks.renderConfigureItems.mockClear();
    mocks.flowModelRendererProps = [];
    mocks.runtime.getScope = undefined;
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

  it('resolves the initialized block uid for conversation queries', async () => {
    renderAIChatBoxView(makeModel({ scope: 'chat-box-1' }));

    await expect(mocks.runtime.getScope?.({ operation: 'list' })).resolves.toBe('chat-box-1');
  });

  it('updates conversation read state from websocket events without refreshing the list', () => {
    renderAIChatBoxView(makeModel());
    const readListener = mocks.eventBus.addEventListener.mock.calls.find(
      ([eventName]) => eventName === 'ws:message:ai-conversations:read',
    )?.[1] as EventListener | undefined;
    expect(readListener).toBeDefined();
    expect(mocks.refreshConversations).toHaveBeenCalledTimes(1);

    mocks.refreshConversations.mockClear();
    readListener?.(
      new CustomEvent('ws:message:ai-conversations:read', {
        detail: {
          sessionId: 'session-1',
          read: false,
        },
      }),
    );

    expect(mocks.runtime.chatConversationModel.setConversationRead).toHaveBeenCalledWith('session-1', false);
    expect(mocks.refreshConversations).not.toHaveBeenCalled();
  });

  it('keeps explicitly blank scope unfiltered for conversation queries', async () => {
    renderAIChatBoxView(makeModel({ scope: '' }));

    await expect(mocks.runtime.getScope?.({ operation: 'list' })).resolves.toBeUndefined();
    await expect(mocks.runtime.getScope?.({ operation: 'create' })).resolves.toBe('chat-box-1');
  });

  it('resolves explicit scope for conversation queries', async () => {
    renderAIChatBoxView(makeModel({ scope: 'shared-sales' }));

    await expect(mocks.runtime.getScope?.({ operation: 'list' })).resolves.toBe('shared-sales');
    await expect(mocks.runtime.getScope?.({ operation: 'create' })).resolves.toBe('shared-sales');
  });

  it('renders scope variables when conversation requests resolve scope', async () => {
    const resolveJsonTemplate = vi.fn().mockResolvedValue('record-1');

    renderAIChatBoxView(makeModel({ scope: '{{ ctx.record.id }}' }), {
      resolveJsonTemplate,
    } as Partial<FlowModelContext>);

    await expect(mocks.runtime.getScope?.({ operation: 'list' })).resolves.toBe('record-1');
    expect(resolveJsonTemplate).toHaveBeenCalledWith('{{ ctx.record.id }}');
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
