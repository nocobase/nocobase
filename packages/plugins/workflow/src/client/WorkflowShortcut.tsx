import { PartitionOutlined } from '@ant-design/icons';
import { PluginManager } from '@nocobase/client';
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
