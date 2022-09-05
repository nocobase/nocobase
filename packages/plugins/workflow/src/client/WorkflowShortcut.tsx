import { PartitionOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { ActionContext, PluginManager, SchemaComponent } from '@nocobase/client';
import { Card } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ExecutionResourceProvider } from './ExecutionResourceProvider';
import { workflowSchema } from './schemas/workflows';
import { WorkflowLink } from './WorkflowLink';

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'Action.Drawer',
      type: 'void',
      title: '{{t("Workflow")}}',
      properties: {
        table: workflowSchema,
      },
    },
  },
};

const schema2: ISchema = {
  type: 'object',
  properties: {
    [uid()]: workflowSchema,
  },
};

export const WorkflowPane = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={schema2}
        components={{
          WorkflowLink,
          ExecutionResourceProvider,
        }}
      />
    </Card>
  );
};

export const WorkflowShortcut = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        icon={<PartitionOutlined />}
        title={t('Workflow')}
        onClick={() => {
          setVisible(true);
        }}
      />
      <SchemaComponent
        schema={schema}
        components={{
          WorkflowLink,
          ExecutionResourceProvider,
        }}
      />
    </ActionContext.Provider>
  );
};
