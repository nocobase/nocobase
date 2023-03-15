import React from 'react';
import { Button } from 'antd';
import { ActionInitializer } from './ActionInitializer';
import { useTranslation } from 'react-i18next';
import { useTableBlockContext } from '../../';
import { NodeCollapseOutlined, NodeExpandOutlined } from '@ant-design/icons';
export const ExpandActionInitializer = (props) => {
  const schema = {
    'x-action': 'expandAll',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      icon: '{{ expandIcon}}',
      useProps: '{{ useExpandAllActionProps }}',
      component: 'ExpandActionComponent',
      useAction: () => {
        return {
          run() {},
        };
      },
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const ExpandActionComponent = () => {
  const { t } = useTranslation();
  const ctx = useTableBlockContext();
  return (
    <Button
      onClick={() => {
        ctx?.setExpandFlag();
      }}
      icon={ctx?.expandFlag ? <NodeCollapseOutlined /> : <NodeExpandOutlined />}
    >
      {ctx?.expandFlag ? t('Collapse all') : t('Expand all')}
    </Button>
  );
};
