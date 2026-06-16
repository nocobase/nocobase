/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadFieldModel } from '@nocobase/plugin-file-manager/client';
import type { AIEmployee, Conversation, Message } from '../../ai-employees/types';
import type { WorkflowTask, WorkflowTaskDetail } from '../../ai-employees/chatbox/conversations/common';
import { useChat } from '../../ai-employees/chatbox/hooks/useChat';
import { useChatBoxActions } from '../../ai-employees/chatbox/hooks/useChatBoxActions';
import { useChatConversationActions } from '../../ai-employees/chatbox/hooks/useChatConversationActions';
import { useChatMessageActions } from '../../ai-employees/chatbox/hooks/useChatMessageActions';
import { useToolCallActions } from '../../ai-employees/chatbox/hooks/useToolCallActions';
import { useWorkflowTasks } from '../../ai-employees/chatbox/hooks/useWorkflowTasks';
import { useChatBoxStore } from '../../ai-employees/chatbox/stores/chat-box';
import { useChatConversationsStore } from '../../ai-employees/chatbox/stores/chat-conversations';
import {
  CHAT_DEFAULT_SESSION_KEY,
  CHAT_EMPTY_SESSION_STATE,
  useChatMessagesStore,
} from '../../ai-employees/chatbox/stores/chat-messages';
import { useChatToolCallStore } from '../../ai-employees/chatbox/stores/chat-tool-call';
import { useChatToolsStore } from '../../ai-employees/chatbox/stores/chat-tools';
import { useWorkflowTasksStore } from '../../ai-employees/chatbox/stores/workflow-tasks';

type MockResourceMethods = Record<string, ReturnType<typeof vi.fn>>;

const mockRuntime = vi.hoisted(() => {
  const aiConversations = {
    list: vi.fn(),
    unreadCounts: vi.fn(),
    getMessages: vi.fn(),
    updateUserDecision: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    abort: vi.fn(),
    updateToolArgs: vi.fn(),
  };
  const aiWorkflowTasks = {
    list: vi.fn(),
    accept: vi.fn(),
    getBySession: vi.fn(),
  };
  const request = vi.fn();
  const getModel = vi.fn();
  const toolInvoke = vi.fn();

  return {
    resources: {
      aiConversations,
      aiWorkflowTasks,
    },
    request,
    app: {
      i18n: {
        t: vi.fn((key: string, options?: { nickname?: string }) =>
          options?.nickname ? `${key}:${options.nickname}` : key,
        ),
      },
      flowEngine: {
        getModel,
      },
      aiManager: {
        toolsManager: {
          useTools: vi.fn(
            () =>
              new Map([
                [
                  'localTool',
                  {
                    invoke: toolInvoke,
                  },
                ],
              ]),
          ),
        },
      },
    },
    storage: {
      getItem: vi.fn(() => null),
    },
    services: [
      {
        llmService: 'openai',
        provider: 'openai',
        supportWebSearch: true,
        enabledModels: [{ value: 'gpt-4o' }, { value: 'gpt-4.1' }],
      },
      {
        llmService: 'qwen',
        provider: 'dashscope',
        supportWebSearch: false,
        enabledModels: [{ value: 'qwen-max' }],
      },
    ],
    uid: {
      value: 0,
    },
  };
});

vi.mock('@nocobase/client', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  type RequestOptions<TData> = {
    manual?: boolean;
    onSuccess?: (data: TData, params: unknown[]) => void;
  };

  return {
    CollectionBlockModel: class CollectionBlockModel {},
    DecisionActions: {},
    ToolCall: {},
    Application: class Application {},
    useAPIClient: () => ({
      storage: mockRuntime.storage,
      request: mockRuntime.request,
      resource: (name: keyof typeof mockRuntime.resources) => mockRuntime.resources[name],
    }),
    useApp: () => mockRuntime.app,
    useRequest: <TData>(service: (...params: unknown[]) => Promise<TData> | TData, options?: RequestOptions<TData>) => {
      const [data, setData] = React.useState<TData | undefined>();
      const [loading, setLoading] = React.useState(false);
      const runAsync = React.useCallback(
        async (...params: unknown[]) => {
          setLoading(true);
          try {
            const nextData = await service(...params);
            setData(nextData);
            options?.onSuccess?.(nextData, params);
            return nextData;
          } finally {
            setLoading(false);
          }
        },
        [options, service],
      );
      return {
        data,
        loading,
        run: runAsync,
        runAsync,
      };
    },
  };
});

vi.mock('@nocobase/plugin-workflow/client', () => ({
  JOB_STATUS: {
    PENDING: 0,
    RESOLVED: 1,
    ABORTED: -3,
    REJECTED: -5,
  },
}));

vi.mock('@nocobase/plugin-file-manager/client', () => ({
  UploadFieldModel: class UploadFieldModel {
    props: { value?: unknown };
    subModels: Record<string, unknown>;

    constructor(props: { value?: unknown }) {
      this.props = props;
      this.subModels = {};
    }
  },
}));

vi.mock('@formily/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@formily/shared')>();
  return {
    ...actual,
    uid: () => {
      mockRuntime.uid.value += 1;
      return `uid-${mockRuntime.uid.value}`;
    },
  };
});

vi.mock('../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    getLLMServices: vi.fn(() => Promise.resolve(mockRuntime.services)),
  }),
}));

vi.mock('../../ai-employees/chatbox/roles', () => ({
  aiEmployeeRole: (employee: AIEmployee) => ({
    nickname: employee.nickname || employee.username,
  }),
}));

vi.mock('../../ai-employees/chatbox/hooks/useLoadMoreObserver', () => ({
  useLoadMoreObserver: () => ({ ref: vi.fn() }),
}));

vi.mock('../../debug-logger', () => ({
  aiDebugLogger: {
    log: vi.fn(),
  },
}));

const atlas: AIEmployee = {
  username: 'atlas',
  nickname: 'Atlas',
  greeting: 'Atlas greeting',
};

const dex: AIEmployee = {
  username: 'dex',
  nickname: 'Dex',
  greeting: 'Dex greeting',
};

const textMessage = (
  key: string,
  role: string,
  content: string,
  metadata?: Message['content']['metadata'],
): Message => ({
  key,
  role,
  loading: false,
  content: {
    type: 'text',
    messageId: key,
    content,
    metadata,
  },
});

const conversation = (sessionId: string): Conversation => ({
  sessionId,
  title: sessionId,
  updatedAt: '',
  read: true,
  aiEmployee: atlas,
});

const workflowTask = (sessionId: string, status = 'processing'): WorkflowTask => ({
  id: `task-${sessionId}`,
  sessionId,
  workflowTitle: `Workflow ${sessionId}`,
  nodeTitle: `Node ${sessionId}`,
  status,
  read: true,
});

const workflowTaskDetail = (sessionId: string, readonly = false): WorkflowTaskDetail => ({
  ...workflowTask(sessionId),
  readonly,
  config: {
    username: 'atlas',
    model: {
      llmService: 'openai',
      model: 'gpt-4o',
    },
  },
});

const resetStores = () => {
  useChatBoxStore.setState({
    open: false,
    expanded: false,
    collapsed: false,
    showConversations: false,
    minimize: false,
    currentEmployee: null,
    senderValue: '',
    senderPlaceholder: '',
    taskVariables: {},
    roles: {},
    isEditingMessage: false,
    editingMessageId: null,
    chatBoxRef: { current: null },
    senderRef: { current: null },
    showCodeHistory: false,
    model: null,
    showDebugPanel: false,
    readonly: false,
    isShowSenderHint: false,
  });
  useChatConversationsStore.setState({
    currentConversation: undefined,
    conversations: [],
    keyword: '',
    webSearch: false,
    conversationSegmented: 'conversations',
    unreadCount: 0,
  });
  useChatMessagesStore.setState({
    sessions: {
      [CHAT_DEFAULT_SESSION_KEY]: { ...CHAT_EMPTY_SESSION_STATE, messages: [], attachments: [], contextItems: [] },
    },
    editorRef: {},
    currentEditorRefUid: null,
    flowContext: null,
  });
  useChatToolCallStore.setState({ sessions: {} });
  useChatToolsStore.setState({
    toolsByName: {},
    toolsByMessageId: {},
    openToolModal: false,
    activeTool: null,
    activeMessageId: '',
    adjustArgs: {},
  });
  useWorkflowTasksStore.setState({
    workflowTasks: [],
    currentWorkflowTask: undefined,
    unreadCount: 0,
    loading: false,
    keyword: '',
    selectedJobStatus: undefined,
  });
};

const resetMockResource = (methods: MockResourceMethods) => {
  for (const method of Object.values(methods)) {
    method.mockReset();
  }
};

beforeEach(() => {
  resetStores();
  resetMockResource(mockRuntime.resources.aiConversations);
  resetMockResource(mockRuntime.resources.aiWorkflowTasks);
  mockRuntime.request.mockReset();
  mockRuntime.storage.getItem.mockClear();
  mockRuntime.app.flowEngine.getModel.mockReset();
  mockRuntime.app.aiManager.toolsManager.useTools.mockClear();
  mockRuntime.app.i18n.t.mockClear();
  mockRuntime.uid.value = 0;
});

afterEach(() => {
  resetStores();
});

describe('useChat facade contract', () => {
  it('uses draft by default and scopes writes by session', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setMessages([textMessage('draft-message', 'user', 'draft')]);
      result.current.for('session-a').setMessages([textMessage('session-message', 'atlas', 'session')]);
    });

    expect(result.current.sessionKey).toBe(CHAT_DEFAULT_SESSION_KEY);
    expect(useChatMessagesStore.getState().getSessionState().messages).toHaveLength(1);
    expect(useChatMessagesStore.getState().getSessionState('session-a').messages).toHaveLength(1);
    expect(useChatMessagesStore.getState().getSessionState().messages[0].key).toBe('draft-message');
  });

  it('rerenders use.messages subscribers and migrates draft state to a new session', async () => {
    const { result } = renderHook(() => {
      const chat = useChat();
      return {
        chat,
        messages: chat.use.messages(),
      };
    });

    act(() => {
      result.current.chat.setMessages([textMessage('draft-1', 'user', 'hello')]);
      result.current.chat.setAttachments([{ filename: 'draft.txt', status: 'done' }]);
    });

    await waitFor(() => {
      expect(result.current.messages.map((message) => message.key)).toEqual(['draft-1']);
    });

    act(() => {
      result.current.chat.migrateSessionState('created-session');
    });

    expect(useChatMessagesStore.getState().getSessionState('created-session')).toMatchObject({
      messages: [expect.objectContaining({ key: 'draft-1' })],
      attachments: [{ filename: 'draft.txt', status: 'done' }],
    });
    expect(useChatMessagesStore.getState().getSessionState().messages).toEqual([]);
    expect(useChatMessagesStore.getState().getSessionState().attachments).toEqual([]);
  });
});

describe('useChatConversationActions contract', () => {
  it('replaces first-page conversations, appends later pages, and sends keyword filters', async () => {
    mockRuntime.resources.aiConversations.list
      .mockResolvedValueOnce({
        data: {
          data: [conversation('session-1')],
          meta: { count: 2, page: 1, pageSize: 50, totalPage: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [conversation('session-2')],
          meta: { count: 2, page: 2, pageSize: 50, totalPage: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [conversation('needle-session')],
          meta: { count: 1, page: 1, pageSize: 50, totalPage: 1 },
        },
      });

    const { result } = renderHook(() => useChatConversationActions());

    await act(async () => {
      await result.current.conversationsService.runAsync(1, '');
    });
    expect(useChatConversationsStore.getState().conversations.map((item) => item.sessionId)).toEqual(['session-1']);

    await act(async () => {
      await result.current.conversationsService.runAsync(2, '');
    });
    expect(useChatConversationsStore.getState().conversations.map((item) => item.sessionId)).toEqual([
      'session-1',
      'session-2',
    ]);

    await act(async () => {
      await result.current.runSearch('needle');
    });
    expect(mockRuntime.resources.aiConversations.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filter: {
          title: {
            $includes: 'needle',
          },
        },
      }),
    );
    expect(useChatConversationsStore.getState().conversations.map((item) => item.sessionId)).toEqual([
      'needle-session',
    ]);
  });

  it('writes conversation and workflow-task unread counts from one API result', async () => {
    mockRuntime.resources.aiConversations.unreadCounts.mockResolvedValue({
      data: {
        data: {
          conversationUnreadCount: 3,
          workflowTaskUnreadCount: 5,
        },
      },
    });

    const { result } = renderHook(() => useChatConversationActions());

    await act(async () => {
      await result.current.loadUnreadCounts();
    });

    expect(useChatConversationsStore.getState().unreadCount).toBe(3);
    expect(useWorkflowTasksStore.getState().unreadCount).toBe(5);
  });
});

describe('useChatBoxActions contract', () => {
  it('clears the current session and global transient chatbox state by default', () => {
    useChatConversationsStore.getState().setCurrentConversation('session-a');
    useChatBoxStore.setState({
      senderValue: 'draft',
      taskVariables: { variables: { id: 1 } },
    });
    useChatMessagesStore.getState().setSessionSystemMessage('session-a', 'system');
    useChatMessagesStore.getState().setSessionAttachments('session-a', [{ filename: 'file.txt' }]);
    useChatMessagesStore.getState().setSessionContextItems('session-a', [{ type: 'flow-model', uid: 'ctx' }]);
    useChatMessagesStore.getState().setSessionSkillSettings('session-a', { skills: ['skill-a'] });
    useChatToolsStore.setState({
      openToolModal: true,
      activeTool: { id: 'tool-a', type: 'function', name: 'tool', invokeStatus: 'init', auto: false, args: {} },
      activeMessageId: 'message-a',
    });

    const { result } = renderHook(() => useChatBoxActions());

    act(() => {
      result.current.clear();
    });

    expect(useChatBoxStore.getState()).toMatchObject({
      senderValue: '',
      taskVariables: {},
    });
    expect(useChatMessagesStore.getState().getSessionState('session-a')).toMatchObject({
      systemMessage: '',
      attachments: [],
      contextItems: [],
      skillSettings: undefined,
    });
    expect(useChatToolsStore.getState()).toMatchObject({
      openToolModal: false,
      activeTool: null,
      activeMessageId: '',
    });
  });

  it('keeps explicitly preserved sender, attachments, and context items on clear', () => {
    useChatConversationsStore.getState().setCurrentConversation('session-a');
    useChatBoxStore.getState().setSenderValue('keep me');
    useChatMessagesStore.getState().setSessionAttachments('session-a', [{ filename: 'keep.txt' }]);
    useChatMessagesStore.getState().setSessionContextItems('session-a', [{ type: 'flow-model', uid: 'keep' }]);
    useChatMessagesStore.getState().setSessionSystemMessage('session-a', 'drop');

    const { result } = renderHook(() => useChatBoxActions());

    act(() => {
      result.current.clear({ attachments: false, contextItems: false, sender: false });
    });

    expect(useChatBoxStore.getState().senderValue).toBe('keep me');
    expect(useChatMessagesStore.getState().getSessionState('session-a')).toMatchObject({
      systemMessage: '',
      attachments: [{ filename: 'keep.txt' }],
      contextItems: [{ type: 'flow-model', uid: 'keep' }],
    });
  });

  it('starts a new draft conversation without mutating the previous session messages', () => {
    useChatBoxStore.setState({
      currentEmployee: atlas,
      model: { llmService: 'openai', model: 'gpt-4o' },
      senderRef: { current: { focus: vi.fn() } },
    });
    useChatConversationsStore.getState().setCurrentConversation('session-a');
    useWorkflowTasksStore.getState().setCurrentWorkflowTask(workflowTaskDetail('session-a'));
    useChatMessagesStore.getState().setSessionMessages('session-a', [textMessage('existing', 'user', 'existing')]);

    const { result } = renderHook(() => useChatBoxActions());

    act(() => {
      result.current.startNewConversation();
    });

    expect(useChatConversationsStore.getState().currentConversation).toBeUndefined();
    expect(useWorkflowTasksStore.getState().currentWorkflowTask).toBeUndefined();
    expect(useChatBoxStore.getState().currentEmployee).toMatchObject({ username: 'atlas' });
    expect(useChatBoxStore.getState().model).toEqual({ llmService: 'openai', model: 'gpt-4o' });
    expect(useChatMessagesStore.getState().getSessionState('session-a').messages).toHaveLength(1);
    expect(useChatMessagesStore.getState().getSessionState().messages).toMatchObject([
      {
        key: 'uid-1',
        role: 'atlas',
        content: {
          type: 'greeting',
          content: 'Atlas greeting',
        },
      },
    ]);
  });

  it('switches AI employee, resets active workflow/conversation/model, and writes target greeting', () => {
    useChatBoxStore.setState({
      currentEmployee: atlas,
      model: { llmService: 'openai', model: 'gpt-4o' },
      senderRef: { current: { focus: vi.fn() } },
    });
    useChatConversationsStore.getState().setCurrentConversation('session-a');
    useWorkflowTasksStore.getState().setCurrentWorkflowTask(workflowTaskDetail('session-a'));

    const { result } = renderHook(() => useChatBoxActions());

    act(() => {
      result.current.switchAIEmployee(dex);
    });

    expect(useChatBoxStore.getState()).toMatchObject({
      currentEmployee: { username: 'dex' },
      model: null,
    });
    expect(useChatConversationsStore.getState().currentConversation).toBeUndefined();
    expect(useWorkflowTasksStore.getState().currentWorkflowTask).toBeUndefined();
    expect(useChatMessagesStore.getState().getSessionState().messages).toMatchObject([
      {
        key: 'uid-1',
        role: 'dex',
        content: {
          type: 'greeting',
          content: 'Dex greeting',
        },
      },
    ]);
  });
});

describe('useChatMessageActions contract', () => {
  it('does not request messages without a session id', async () => {
    const { result } = renderHook(() => useChatMessageActions());

    await act(async () => {
      await result.current.loadMessages(undefined);
    });

    expect(mockRuntime.resources.aiConversations.getMessages).not.toHaveBeenCalled();
  });

  it('loads first-page history in chronological order, preserves trailing errors, and syncs message metadata model', async () => {
    useChatBoxStore.getState().setOpen(true);
    useChatConversationsStore.getState().setCurrentConversation('session-a');
    useChatMessagesStore
      .getState()
      .setSessionMessages('session-a', [
        textMessage('old-local', 'user', 'local'),
        textMessage('local-error', 'error', 'error'),
      ]);
    mockRuntime.resources.aiConversations.getMessages.mockResolvedValue({
      data: {
        data: [
          textMessage('newer', 'atlas', 'newer', { llmService: 'openai', provider: 'openai', model: 'gpt-4o' }),
          textMessage('older', 'user', 'older'),
        ],
        meta: { cursor: 'cursor-1', hasMore: true },
      },
    });

    const { result } = renderHook(() => useChatMessageActions());
    let loadPromise: Promise<void>;

    act(() => {
      loadPromise = result.current.loadMessages('session-a');
    });
    expect(useChatMessagesStore.getState().getSessionState('session-a').messagesLoading).toBe(true);

    await act(async () => {
      await loadPromise;
    });

    expect(mockRuntime.resources.aiConversations.getMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-a',
        cursor: undefined,
        paginate: false,
        updateRead: true,
      }),
    );
    expect(useChatMessagesStore.getState().getSessionState('session-a')).toMatchObject({
      messagesLoading: false,
      messagesMeta: { cursor: 'cursor-1', hasMore: true },
    });
    expect(
      useChatMessagesStore
        .getState()
        .getSessionState('session-a')
        .messages.map((message) => message.key),
    ).toEqual(['older', 'newer', 'local-error']);
    expect(useChatBoxStore.getState().model).toEqual({ llmService: 'openai', model: 'gpt-4o' });
  });

  it('prepends cursor history without replacing current messages and only marks current open conversation read', async () => {
    useChatConversationsStore.getState().setCurrentConversation('session-a');
    useChatBoxStore.getState().setOpen(false);
    useChatMessagesStore.getState().setSessionMessages('session-a', [textMessage('current', 'atlas', 'current')]);
    mockRuntime.resources.aiConversations.getMessages
      .mockResolvedValueOnce({
        data: {
          data: [textMessage('history-newer', 'atlas', 'history newer'), textMessage('history-older', 'user', 'older')],
          meta: { cursor: 'cursor-0', hasMore: false },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [textMessage('other', 'atlas', 'other')],
          meta: {},
        },
      });

    const { result } = renderHook(() => useChatMessageActions());

    await act(async () => {
      await result.current.loadMessages('session-a', 'cursor-1');
    });
    expect(
      useChatMessagesStore
        .getState()
        .getSessionState('session-a')
        .messages.map((message) => message.key),
    ).toEqual(['history-older', 'history-newer', 'current']);
    expect(mockRuntime.resources.aiConversations.getMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sessionId: 'session-a',
        cursor: 'cursor-1',
        updateRead: false,
      }),
    );

    useChatBoxStore.getState().setOpen(true);
    await act(async () => {
      await result.current.loadMessages('session-b');
    });
    expect(mockRuntime.resources.aiConversations.getMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sessionId: 'session-b',
        updateRead: false,
      }),
    );
  });

  it('syncs upload field values from flow-model context into done attachments', () => {
    useChatConversationsStore.getState().setCurrentConversation('session-a');
    const uploadField = new UploadFieldModel({
      value: [
        {
          filename: 'from-context.txt',
          status: 'uploading',
        },
      ],
    });
    mockRuntime.app.flowEngine.getModel.mockReturnValue({
      subModels: {
        uploadField,
      },
    });

    const { result } = renderHook(() => useChatMessageActions());

    act(() => {
      result.current.syncContextAttachments({ type: 'flow-model', uid: 'form-uid' });
    });

    expect(mockRuntime.app.flowEngine.getModel).toHaveBeenCalledWith('form-uid', true);
    expect(useChatMessagesStore.getState().getSessionState('session-a').attachments).toEqual([
      {
        filename: 'from-context.txt',
        status: 'done',
      },
    ]);
  });
});

describe('useWorkflowTasks contract', () => {
  it('replaces first-page tasks, appends later pages with session dedupe, and maps job status filters', async () => {
    mockRuntime.resources.aiWorkflowTasks.list
      .mockResolvedValueOnce({
        data: {
          data: [workflowTask('session-1')],
          meta: { page: 1, totalPage: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [workflowTask('session-1'), workflowTask('session-2')],
          meta: { page: 2, totalPage: 2 },
        },
      })
      .mockResolvedValue({
        data: {
          data: [],
          meta: { page: 1, totalPage: 1 },
        },
      });

    const { result } = renderHook(() => useWorkflowTasks());

    await act(async () => {
      await result.current.runSearch('workflow');
    });
    expect(useWorkflowTasksStore.getState().keyword).toBe('workflow');
    expect(useWorkflowTasksStore.getState().workflowTasks.map((item) => item.sessionId)).toEqual(['session-1']);
    expect(mockRuntime.resources.aiWorkflowTasks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filter: {
          $or: [
            { workflowTitle: { $includes: 'workflow' } },
            { nodeTitle: { $includes: 'workflow' } },
            { status: { $includes: 'workflow' } },
          ],
        },
      }),
    );

    await act(async () => {
      await result.current.loadMoreWorkflowTasks();
    });
    expect(useWorkflowTasksStore.getState().workflowTasks.map((item) => item.sessionId)).toEqual([
      'session-1',
      'session-2',
    ]);

    await act(async () => {
      await result.current.runJobStatusFilter(0);
      await result.current.runJobStatusFilter(1);
      await result.current.runJobStatusFilter(-5);
      await result.current.runJobStatusFilter(-3);
    });

    const filters = mockRuntime.resources.aiWorkflowTasks.list.mock.calls.slice(-4).map((call) => call[0].filter);
    expect(filters.map((filter) => ({ status: filter.status }))).toEqual([
      { status: { $in: ['processing', 'pending_acceptance', 'pending_approval'] } },
      { status: { $in: ['approved'] } },
      { status: { $in: ['rejected'] } },
      { status: { $in: ['aborted'] } },
    ]);
    expect(filters.every((filter) => Array.isArray(filter.$or))).toBe(true);
  });

  it('loads task details through getWorkflowTaskBySession and updates readonly after accept', async () => {
    mockRuntime.resources.aiWorkflowTasks.accept.mockResolvedValue({ data: { data: {} } });
    mockRuntime.resources.aiWorkflowTasks.getBySession.mockResolvedValue({
      data: {
        data: workflowTaskDetail('session-a', true),
      },
    });

    const { result } = renderHook(() => useWorkflowTasks());

    await act(async () => {
      const task = await result.current.getWorkflowTaskBySession('session-a');
      expect(task?.sessionId).toBe('session-a');
    });
    expect(useWorkflowTasksStore.getState().currentWorkflowTask).toMatchObject({
      sessionId: 'session-a',
      readonly: true,
    });

    await act(async () => {
      await result.current.updateReadonly('session-a');
    });
    expect(mockRuntime.resources.aiWorkflowTasks.accept).toHaveBeenCalledWith({
      values: {
        sessionId: 'session-a',
      },
    });
    expect(useChatBoxStore.getState().readonly).toBe(true);
  });
});

describe('useToolCallActions contract', () => {
  it('updates interrupted decisions in the active session and resumes only after all tool calls wait', async () => {
    useChatConversationsStore.getState().setCurrentConversation('tool-session');
    useChatBoxStore.setState({
      currentEmployee: atlas,
      model: { llmService: 'openai', model: 'gpt-4o' },
    });
    useChatToolCallStore.getState().updateToolCallInvokeStatus('tool-session', 'message-a', 'tool-a', 'interrupted');
    useChatToolCallStore.getState().updateToolCallInvokeStatus('tool-session', 'message-a', 'tool-b', 'interrupted');
    useChatToolCallStore.getState().updateToolCallInvokeStatus('other-session', 'message-a', 'tool-a', 'interrupted');
    mockRuntime.resources.aiConversations.updateUserDecision.mockResolvedValue({
      data: {
        data: {
          updated: 1,
          toolCalls: [
            { id: 'tool-a', name: 'localTool', args: { a: 1 } },
            { id: 'tool-b', name: 'remoteTool', args: { b: 2 } },
          ],
        },
      },
    });
    mockRuntime.app.aiManager.toolsManager.useTools.mockReturnValue(
      new Map([
        [
          'localTool',
          {
            invoke: mockRuntime.app.aiManager.toolsManager.useTools().get('localTool')?.invoke,
          },
        ],
      ]),
    );
    mockRuntime.request.mockResolvedValue({ data: null });
    mockRuntime.app.aiManager.toolsManager.useTools().get('localTool')?.invoke.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useToolCallActions({ messageId: 'message-a' }));
    const firstActions = result.current.getDecisionActions({
      id: 'tool-a',
      type: 'function',
      name: 'localTool',
      invokeStatus: 'interrupted',
      auto: false,
      args: {},
    });
    const secondActions = result.current.getDecisionActions({
      id: 'tool-b',
      type: 'function',
      name: 'remoteTool',
      invokeStatus: 'interrupted',
      auto: false,
      args: {},
    });

    await act(async () => {
      await firstActions.approve();
    });
    expect(useChatToolCallStore.getState().getInvokeStatus('tool-session', 'message-a', 'tool-a')).toBe('waiting');
    expect(useChatToolCallStore.getState().getInvokeStatus('other-session', 'message-a', 'tool-a')).toBe('interrupted');
    expect(mockRuntime.request).not.toHaveBeenCalled();

    await act(async () => {
      await secondActions.reject('not now');
    });
    expect(useChatToolCallStore.getState().getSessionState('tool-session').toolCalls['message-a']).toMatchObject([
      { id: 'tool-a', invokeStatus: 'waiting' },
      { id: 'tool-b', invokeStatus: 'waiting' },
    ]);
    expect(mockRuntime.resources.aiConversations.updateUserDecision).toHaveBeenLastCalledWith({
      values: {
        sessionId: 'tool-session',
        messageId: 'message-a',
        toolCallId: 'tool-b',
        userDecision: {
          type: 'reject',
          message: 'not now',
        },
      },
    });
    expect(mockRuntime.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'aiConversations:resumeToolCall',
        data: expect.objectContaining({
          sessionId: 'tool-session',
          messageId: 'message-a',
          toolCallIds: ['tool-a', 'tool-b'],
          toolCallResults: [{ id: 'tool-a', result: { ok: true } }],
        }),
      }),
    );
  });
});
