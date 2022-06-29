import React, { useState } from 'react';
import { PartitionOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { useTranslation } from 'react-i18next';

import { PluginManager, ActionContext, SchemaComponent } from '@nocobase/client';

import { workflowSchema } from './schemas/workflows';
import { WorkflowLink } from './WorkflowLink';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';



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
          ExecutionResourceProvider
        }}
      />
    </ActionContext.Provider>
  );
};
