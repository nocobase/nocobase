/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { lazy, ToolsUIProperties, useAPIClient, useCompile, useRequest } from '@nocobase/client';
import { Button, ButtonProps, Card, Descriptions, Skeleton, Space, Typography } from 'antd';
import { namespace, useT } from '../../../locale';
import { useChatBoxStore } from '../../chatbox/stores/chat-box';
const { Markdown } = lazy(() => import('../../chatbox/markdown/Markdown'), 'Markdown');

type WorkflowTaskOutputSchema = {
  title?: string;
  type?: string;
  properties?: Record<string, WorkflowTaskOutputSchema>;
};

type WorkflowTaskOutputData = {
  executionId: string;
  workflowTitle?: string;
  nodeTitle?: string;
  structuredOutputSchema?: WorkflowTaskOutputSchema | string | null;
  args?: {
    result?: Record<string, any>;
    [key: string]: any;
  } | null;
};

const parseSchema = (schema: WorkflowTaskOutputData['structuredOutputSchema']): WorkflowTaskOutputSchema | null => {
  if (!schema) {
    return null;
  }
  if (typeof schema === 'string') {
    try {
      return JSON.parse(schema);
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
        <Markdown message={{ content: String(value) }} />
      </div>
    );
  }
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <Typography.Text style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</Typography.Text>
    </div>
  );
};

export const WorkflowTaskOutputCard: React.FC<ToolsUIProperties<Record<string, any>>> = ({
  messageId,
  toolCall,
  decisions,
}) => {
  const t = useT();
  const compile = useCompile();
  const api = useAPIClient();
  const [action, setAction] = useState<'approve' | 'reject' | 'revise' | null>(null);
  const readonly = useChatBoxStore.use.readonly();
  const disabled = toolCall.invokeStatus !== 'interrupted' || !!action || readonly;
  const senderRef = useChatBoxStore.use.senderRef();
  const setShowSenderHint = useChatBoxStore.use.setShowSenderHint();

  const { data, loading } = useRequest<{ data: WorkflowTaskOutputData }>(
    async () => {
      if (!messageId) {
        return null;
      }
      const res = await api.resource('aiWorkflowTasks').getByToolCall({
        values: {
          messageId,
          toolCallId: toolCall.id,
        },
      });
      return res?.data;
    },
    {
      refreshDeps: [toolCall.id],
    },
  );

  const cardData = data?.data;
  const schema = parseSchema(cardData?.structuredOutputSchema);
  const result = cardData?.args?.result;
  const descriptionItems = useMemo(() => {
    if (schema?.properties && result && typeof result === 'object') {
      return Object.entries(schema.properties).map(([key, item]) => ({
        key,
        label: compile(item?.title) || key,
        children: formatValue(result[key]),
      }));
    }

    return [
      {
        key: 'result',
        label: compile(schema?.title) || t('Response result'),
        children: formatValue(result ?? cardData?.args),
      },
    ];
  }, [cardData?.args, result, schema, t]);

  const actionProps: ButtonProps = {
    size: 'small',
    variant: 'link',
    disabled: disabled || action != null,
  };

  return (
    <Card
      loading={loading}
      style={{ margin: '12px 0' }}
      title={
        <Space split="-" wrap>
          {<Typography.Text>{cardData?.workflowTitle || t('Task executing')}</Typography.Text>}
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
              await api.resource('executions').cancel({ filterByTk: cardData?.executionId });
              await decisions.reject(
                'The user has decided to terminate the workflow task. You do not need to call the current tool to output the task result. The task is finished.',
              );
            } finally {
              setAction(null);
            }
          }}
        >
          {t('Reject', { ns: namespace })}
        </Button>,
        <Button
          {...actionProps}
          key="revise"
          color="default"
          loading={action === 'revise'}
          onClick={async () => {
            setAction('reject');
            try {
              setShowSenderHint(true);
              senderRef?.current?.focus();
            } finally {
              setAction(null);
            }
          }}
        >
          {t('Revise', { ns: namespace })}
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
          {t('Approve', { ns: namespace })}
        </Button>,
      ]}
    >
      {cardData ? <Descriptions layout="vertical" column={1} items={descriptionItems} /> : <Skeleton active />}
    </Card>
  );
};
