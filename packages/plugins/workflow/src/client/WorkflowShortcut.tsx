import React from 'react';
import { PartitionOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { PluginManager } from '@nocobase/client';

import { lang } from './locale';

export const WorkflowShortcut = () => {
  const navigate = useNavigate();
  return (
    <PluginManager.Toolbar.Item
      key="workflow"
      icon={<PartitionOutlined />}
      title={lang('Workflow')}
      onClick={() => {
        navigate('/admin/settings/workflow/workflows');
      }}
    />
  );
};
