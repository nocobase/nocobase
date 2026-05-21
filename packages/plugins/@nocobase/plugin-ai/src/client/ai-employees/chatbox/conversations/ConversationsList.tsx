/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { App, Badge, Space, Typography } from 'antd';
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
import { Conversation } from '../../types';

const getConversationModel = (conversation?: Conversation) => {
  const modelSettings = conversation?.options?.modelSettings;
  if (!modelSettings?.llmService || !modelSettings?.model) {
    return undefined;
  }
  return {
    llmService: modelSettings.llmService,
    model: modelSettings.model,
  };
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
  const { refresh } = useChatConversationActions();
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
      refresh();
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

export const ConversationsList: React.FC<{
  onOpenConversation: (sessionId: string, username?: string, model?: ModelRef) => void;
}> = ({ onOpenConversation }) => {
  const t = useT();
  const listRef = useRef<HTMLDivElement>(null);
  const api = useAPIClient();
  const { modal, message } = App.useApp();
  const conversations = useChatConversationsStore.use.conversations();

  const currentConversation = useChatConversationsStore.use.currentConversation?.();
  const currentEmployee = useChatBoxStore.use.currentEmployee?.();
  const setReadonly = useChatBoxStore.use.setReadonly();
  const setCurrentWorkflowTask = useWorkflowTasksStore.use.setCurrentWorkflowTask();

  const { startNewConversation } = useChatBoxActions();
  const { refresh, lastConversationRef } = useChatConversationActions();

  const onSelectConversation = useCallback(
    (sessionId: string) => {
      setReadonly(false);
      setCurrentWorkflowTask(undefined);
      const conversation = conversations.find((item) => item.sessionId === sessionId);
      onOpenConversation(sessionId, conversation?.aiEmployee?.username, getConversationModel(conversation));
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
      refresh();
      if (currentEmployee) {
        startNewConversation();
      }
    },
    [api, message, t, refresh, currentEmployee, startNewConversation],
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

  const items = useMemo(() => {
    const result: ConversationsProps['items'] = conversations.map((item) => {
      const title = item.title || t('New conversation');
      return {
        key: item.sessionId,
        title,
        icon: !item.read ? <Badge dot offset={[-3, 0]} /> : undefined,
        timestamp: new Date(item.updatedAt).getTime(),
        label: title,
      };
    });

    return result;
  }, [conversations, t]);

  useEffect(() => {
    attachLastConversationObserver(listRef.current);
  }, [attachLastConversationObserver]);

  if (!items.length) {
    return <ListEmpty />;
  }

  return (
    <div ref={listRef} style={{ height: '100%' }}>
      <AntConversations
        className={conversationItemClassName}
        activeKey={currentConversation}
        onActiveChange={onSelectConversation}
        items={items}
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
              openDeleteConfirm(conversation.key);
            }
          },
        })}
      />
    </div>
  );
};
