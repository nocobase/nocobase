import React from 'react';
import { PartitionOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';

import { PluginManager } from '@nocobase/client';

import { lang } from './locale';

export const WorkflowShortcut = () => {
  const history = useHistory();
  return (
    <PluginManager.Toolbar.Item
      key="workflow"
      icon={<PartitionOutlined />}
      title={lang('Workflow')}
      onClick={() => {
        history.push('/admin/settings/workflow/workflows');
      }}
    />
  );
};
