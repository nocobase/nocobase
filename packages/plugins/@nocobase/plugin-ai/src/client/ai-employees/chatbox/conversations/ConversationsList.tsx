/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { App, Spin } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Conversations as AntConversations, ConversationsProps } from '@ant-design/x';
import { css } from '@emotion/css';
import { SchemaComponent, useAPIClient, useActionContext } from '@nocobase/client';
import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { useT } from '../../../locale';
import { useChatConversationActions } from '../hooks/useChatConversationActions';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { ModelRef, useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useWorkflowTasksStore } from '../stores/workflow-tasks';
import { ListEmpty } from './common';

type UseConversationsListOptions = {
  onOpenConversation: (sessionId: string, username?: string, model?: ModelRef) => void;
};

const conversationItemClassName = css`
  .ant-conversations-item {
    .ant-conversations-label {
      display: block !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      max-width: calc(100% - 30px);
    }
  }
`;

const useCloseActionProps = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    onClick: () => {
      setVisible(false);
      form.reset();
    },
  };
};

const useSubmitActionProps = (conversationKey: string) => {
  const { setVisible } = useActionContext();
  const api = useAPIClient();
  const form = useForm();
  const { conversationsService } = useChatConversationActions();
  return {
    onClick: async () => {
      await form.submit();
      await api.resource('aiConversations').update({
        filterByTk: conversationKey,
        values: {
          title: form.values.title,
        },
      });
      setVisible(false);
      form.reset();
      conversationsService.run();
    },
  };
};

const Rename: React.FC<{
  conversation: {
    key: string;
    title?: string;
  };
}> = ({ conversation }) => {
  const t = useT();
  return (
    <SchemaComponent
      scope={{ useCloseActionProps, useSubmitActionProps: () => useSubmitActionProps(conversation.key) }}
      schema={{
        name: 'rename',
        type: 'void',
        'x-component': 'Action',
        'x-component-props': {
          component: (props: React.ComponentProps<'div'>) => <div {...props}>{t('Rename')}</div>,
        },
        title: t('Rename'),
        properties: {
          [uid()]: {
            type: 'void',
            'x-component': 'Action.Modal',
            'x-component-props': {
              styles: {
                mask: {
                  zIndex: 1100,
                },
                wrapper: {
                  zIndex: 1100,
                },
              },
            },
            title: t('Rename conversation'),
            'x-decorator': 'FormV2',
            properties: {
              title: {
                type: 'string',
                title: t('Title'),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                default: conversation.title || '',
              },
              footer: {
                type: 'void',
                'x-component': 'Action.Modal.Footer',
                properties: {
                  close: {
                    title: t('Cancel'),
                    'x-component': 'Action',
                    'x-use-component-props': 'useCloseActionProps',
                  },
                  submit: {
                    title: t('Submit'),
                    'x-component': 'Action',
                    'x-component-props': {
                      type: 'primary',
                    },
                    'x-use-component-props': 'useSubmitActionProps',
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};

export const useConversationsList = ({ onOpenConversation }: UseConversationsListOptions) => {
  const t = useT();
  const api = useAPIClient();
  const { modal, message } = App.useApp();

  const currentConversation = useChatConversationsStore.use.currentConversation();
  const conversations = useChatConversationsStore.use.conversations();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const setReadonly = useChatBoxStore.use.setReadonly();
  const setCurrentWorkflowTask = useWorkflowTasksStore.use.setCurrentWorkflowTask();

  const { startNewConversation } = useChatBoxActions();
  const { conversationsService, lastConversationRef } = useChatConversationActions();
  const { loading: conversationsLoading } = conversationsService;

  const items = useMemo(() => {
    const result: ConversationsProps['items'] = conversations.map((item) => {
      const title = item.title || t('New conversation');
      return {
        key: item.sessionId,
        title,
        timestamp: new Date(item.updatedAt).getTime(),
        label: title,
      };
    });
    if (conversationsLoading) {
      result.push({
        key: 'loading',
        label: (
          <Spin
            style={{
              display: 'block',
              margin: '8px auto',
            }}
          />
        ),
      });
    }
    return result;
  }, [conversations, conversationsLoading, t]);

  const onSelectConversation = useCallback(
    (sessionId: string) => {
      setReadonly(false);
      setCurrentWorkflowTask(undefined);
      onOpenConversation(sessionId, conversations.find((item) => item.sessionId === sessionId)?.aiEmployee?.username);
    },
    [onOpenConversation, conversations, setCurrentWorkflowTask, setReadonly],
  );

  const attachLastConversationObserver = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container || !conversations.length) return;
      const lastLi = container.querySelector('.ant-conversations-item:last-child');
      if (lastLi) {
        lastConversationRef(lastLi as HTMLElement);
      }
    },
    [conversations.length, lastConversationRef],
  );

  const deleteConversation = useCallback(
    async (sessionId: string) => {
      await api.resource('aiConversations').destroy({
        filterByTk: sessionId,
      });
      message.success(t('Deleted successfully'));
      conversationsService.run();
      if (currentEmployee) {
        startNewConversation();
      }
    },
    [api, message, t, conversationsService, currentEmployee, startNewConversation],
  );

  const openDeleteConfirm = useCallback(
    (sessionId: string) => {
      modal.confirm({
        title: t('Delete conversation'),
        content: t('Are you sure you want to delete it?'),
        onOk: () => deleteConversation(sessionId),
      });
    },
    [modal, t, deleteConversation],
  );

  return {
    currentConversation,
    items,
    onSelectConversation,
    attachLastConversationObserver,
    openDeleteConfirm,
    runSearch: (keyword = '') => conversationsService.run(1, keyword),
    refresh: () => conversationsService.run(),
  };
};

export type ConversationsListController = ReturnType<typeof useConversationsList>;

export const ConversationsList: React.FC<{ controller: ConversationsListController }> = ({ controller }) => {
  const t = useT();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    controller.attachLastConversationObserver(listRef.current);
  }, [controller]);

  if (!controller.items.length) {
    return <ListEmpty />;
  }

  return (
    <div ref={listRef} style={{ height: '100%' }}>
      <AntConversations
        className={conversationItemClassName}
        activeKey={controller.currentConversation}
        onActiveChange={controller.onSelectConversation}
        items={controller.items}
        menu={(conversation) => ({
          items: [
            {
              // @ts-ignore
              label: <Rename conversation={conversation} />,
              key: 'rename',
              icon: <EditOutlined />,
            },
            {
              label: t('Delete'),
              key: 'delete',
              icon: <DeleteOutlined />,
            },
          ],
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            if (key === 'delete') {
              controller.openDeleteConfirm(conversation.key);
            }
          },
        })}
      />
    </div>
  );
};
