/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { lazy, ToolsUIProperties, useAPIClient, useRequest } from '@nocobase/client';
import { Button, Card, Descriptions, Space, Typography } from 'antd';
import { namespace, useT } from '../../../locale';
import { useChatBoxStore } from '../../chatbox/stores/chat-box';
const { Markdown } = lazy(() => import('../../chatbox/markdown/Markdown'), 'Markdown');

type WorkflowTaskOutputSchema = {
  title?: string;
  type?: string;
  properties?: Record<string, WorkflowTaskOutputSchema>;
};

type WorkflowTaskOutputData = {
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
    return <Markdown message={{ content: String(value) }} />;
  }
  return <Typography.Text style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</Typography.Text>;
};

export const WorkflowTaskOutputCard: React.FC<ToolsUIProperties<Record<string, any>>> = ({ toolCall, decisions }) => {
  const t = useT();
  const api = useAPIClient();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const readonly = useChatBoxStore.use.readonly();
  const disabled = toolCall.invokeStatus !== 'interrupted' || !!action || readonly;

  const { data, loading } = useRequest<{ data: WorkflowTaskOutputData }>(
    async () => {
      const res = await api.resource('aiWorkflowTasks').getByToolCall({
        values: {
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
        label: item?.title || key,
        children: formatValue(result[key]),
      }));
    }

    return [
      {
        key: 'result',
        label: schema?.title || t('Result'),
        children: formatValue(result ?? cardData?.args),
      },
    ];
  }, [cardData?.args, result, schema, t]);

  return (
    <Card
      loading={loading}
      style={{ margin: '12px 0' }}
      title={
        <Space split="-" wrap>
          {<Typography.Text>{cardData?.workflowTitle || t('Workflow task')}</Typography.Text>}
          {cardData?.nodeTitle ? <Typography.Text>{cardData.nodeTitle}</Typography.Text> : null}
        </Space>
      }
      actions={[
        <Button
          key="reject"
          color="danger"
          variant="link"
          loading={action === 'reject'}
          disabled={disabled || action != null}
          onClick={async () => {
            setAction('reject');
            try {
              await decisions.reject();
            } finally {
              setAction(null);
            }
          }}
        >
          {t('Reject', { ns: namespace })}
        </Button>,
        <Button
          key="approve"
          color="primary"
          variant="link"
          loading={action === 'approve'}
          disabled={disabled || action != null}
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
      <Descriptions layout="vertical" column={1} items={descriptionItems} />
    </Card>
  );
};
