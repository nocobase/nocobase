/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Button, Card, Descriptions, Skeleton, Space, Typography, theme, type ButtonProps } from 'antd';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { useApp } from '@nocobase/client-v2';
import { useRequest } from 'ahooks';
import { useT } from '../../locale';
import { Markdown } from '../chatbox/components/Markdown';
import { useWorkflowTasks } from '../chatbox/hooks/useWorkflowTasks';
import { useChatBoxStore } from '../chatbox/stores/chat-box';
import { useChatConversationsStore } from '../chatbox/stores/chat-conversations';
import {
  useWorkflowTasksStore,
  type WorkflowTaskDetail,
  type WorkflowTaskOutputSchema,
} from '../chatbox/stores/workflow-tasks';

type WorkflowTaskOutputArgs = {
  result?: Record<string, unknown>;
  [key: string]: unknown;
};

const parseSchema = (schema: WorkflowTaskDetail['structuredOutputSchema']): WorkflowTaskOutputSchema | null => {
  if (!schema) {
    return null;
  }
  if (typeof schema === 'string') {
    try {
      return JSON.parse(schema) as WorkflowTaskOutputSchema;
    } catch (error) {
      console.error('Failed to parse workflow task output schema', error);
      return null;
    }
  }
  return schema;
};

const formatValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <Markdown>{String(value)}</Markdown>
      </div>
    );
  }
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <Typography.Text style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</Typography.Text>
    </div>
  );
};

export const WorkflowTaskOutputCard: React.FC<ToolsUIProperties<WorkflowTaskOutputArgs>> = ({
  toolCall,
  decisions,
}) => {
  const t = useT();
  const { token } = theme.useToken();
  const app = useApp();
  const api = app.apiClient;
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const currentWorkflowTask = useWorkflowTasksStore.use.currentWorkflowTask();
  const { getWorkflowTaskBySession } = useWorkflowTasks();
  const [action, setAction] = useState<'approve' | 'reject' | 'revise' | null>(null);
  const readonly = useChatBoxStore.use.readonly();
  const disabled = toolCall.invokeStatus !== 'interrupted' || Boolean(action) || readonly;
  const senderRef = useChatBoxStore.use.senderRef();
  const setShowSenderHint = useChatBoxStore.use.setShowSenderHint();

  const cachedWorkflowTask =
    currentWorkflowTask && currentWorkflowTask.sessionId === currentConversation ? currentWorkflowTask : undefined;

  const { data, loading } = useRequest<WorkflowTaskDetail | null, []>(
    async () => {
      if (cachedWorkflowTask || !currentConversation) {
        return null;
      }
      try {
        return await getWorkflowTaskBySession(currentConversation);
      } catch {
        return null;
      }
    },
    {
      refreshDeps: [cachedWorkflowTask?.sessionId, currentConversation],
    },
  );

  const cardData = cachedWorkflowTask ?? data ?? undefined;
  const schema = parseSchema(cardData?.structuredOutputSchema);
  const result = toolCall.args?.result;
  const descriptionItems = useMemo(() => {
    if (schema?.properties && result && typeof result === 'object' && !Array.isArray(result)) {
      return Object.entries(schema.properties).map(([key, item]) => ({
        key,
        label: item?.title ? t(item.title) : key,
        children: formatValue(result[key]),
      }));
    }

    return [];
  }, [result, schema, t]);

  const actionProps: ButtonProps = {
    size: 'small',
    variant: 'link',
    disabled: disabled || action != null,
  };

  return (
    <Card
      loading={!cachedWorkflowTask && loading}
      style={{ margin: `${token.marginSM}px 0` }}
      title={
        <Space split="-" wrap>
          <Typography.Text>{cardData?.workflowTitle || t('Task executing')}</Typography.Text>
          {cardData?.nodeTitle ? <Typography.Text>{cardData.nodeTitle}</Typography.Text> : null}
        </Space>
      }
      actions={[
        <Button
          {...actionProps}
          key="reject"
          color="danger"
          loading={action === 'reject'}
          onClick={async () => {
            setAction('reject');
            try {
              if (cardData?.id) {
                await api.resource('aiWorkflowTasks').reject({
                  values: {
                    id: cardData.id,
                    result: t('The user rejected the execution of this workflow node.'),
                  },
                });
              }
              await decisions.reject(
                'The user rejected this workflow node. Stop. Do not continue, do not reply about the task result, and do not call this tool again. Only state that you understand.',
              );
            } finally {
              setAction(null);
            }
          }}
        >
          {t('Reject')}
        </Button>,
        <Button
          {...actionProps}
          key="revise"
          color="default"
          loading={action === 'revise'}
          onClick={async () => {
            setAction('revise');
            try {
              setShowSenderHint(true);
              senderRef?.current?.focus?.();
            } finally {
              setAction(null);
            }
          }}
        >
          {t('Revise')}
        </Button>,
        <Button
          {...actionProps}
          key="approve"
          color="primary"
          loading={action === 'approve'}
          onClick={async () => {
            setAction('approve');
            try {
              await decisions.approve();
            } finally {
              setAction(null);
            }
          }}
        >
          {t('Approve')}
        </Button>,
      ]}
    >
      {cardData ? <Descriptions layout="vertical" column={1} items={descriptionItems} /> : <Skeleton active />}
    </Card>
  );
};
