import React from 'react';
import { Card } from 'antd';
import { PartitionOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

import { PluginManager, SchemaComponent } from '@nocobase/client';

import { workflowSchema } from './schemas/workflows';
import { WorkflowLink } from './WorkflowLink';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';
import { ExecutionLink } from './ExecutionLink';



export const WorkflowPane = () => {
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={workflowSchema}
        components={{
          WorkflowLink,
          ExecutionResourceProvider,
          ExecutionLink
        }}
      />
    </Card>
  );
};

export const WorkflowShortcut = () => {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <PluginManager.Toolbar.Item
      icon={<PartitionOutlined />}
      title={t('Workflow')}
      onClick={() => {
        history.push('/admin/settings/workflow/workflows');
      }}
    />
  );
};
