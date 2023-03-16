import React from 'react';
import { Button } from 'antd';
import { css } from '@emotion/css';
import { useTranslation } from 'react-i18next';
import { useFieldSchema } from '@formily/react';
import { ActionInitializer } from './ActionInitializer';
import { useTableBlockContext, useTableSelectorContext } from '../../';
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

const actionDesignerCss = css`
  position: relative;
  &:hover {
    .general-schema-designer {
      display: block;
    }
  }
  .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: rgba(241, 139, 98, 0.06);
    border: 0;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: #f18b62;
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
      }
    }
  }
`;

export const ExpandActionComponent = (props) => {
  const { t } = useTranslation();
  const schema = useFieldSchema();
  const isTableSelector = schema.parent?.parent?.['x-decorator'] === 'TableSelectorProvider';
  const ctx = isTableSelector ? useTableSelectorContext() : useTableBlockContext();
  return (
    <div className={actionDesignerCss}>
      {ctx.params['tree'] && (
        <Button
          onClick={() => {
            ctx?.setExpandFlag();
          }}
          icon={ctx?.expandFlag ? <NodeCollapseOutlined /> : <NodeExpandOutlined />}
          type={props.type}
        >
          {props.children[1]}
          <span style={{ marginLeft: 10 }}>{ctx?.expandFlag ? t('Collapse all') : t('Expand all')}</span>
        </Button>
      )}
    </div>
  );
};
