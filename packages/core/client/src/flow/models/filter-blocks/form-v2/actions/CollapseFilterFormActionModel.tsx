/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { DownOutlined } from '@ant-design/icons';
import type { ButtonProps } from 'antd/es/button';
import { Button, InputNumber } from 'antd';
import { observer } from '@formily/react';
import { observable } from '@formily/reactive';
import { tval } from '@nocobase/utils/client';
import { FilterFormActionModel } from './FilterFormActionModel';
import { useFlowModel } from '@nocobase/flow-engine';
import { FilterFormEditableFieldModel } from '../fields';

// 使用observable创建响应式状态
const collapseState = observable({
  collapsed: false,
});

const CollapseButton = observer(() => {
  const model = useFlowModel<FilterFormActionModel>();
  const props = { ...model.defaultProps, ...model.props };

  const handleClick = () => {
    collapseState.collapsed = !collapseState.collapsed;
    // 触发折叠/展开事件
    model.dispatchEvent('collapseToggle', { collapsed: collapseState.collapsed });
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      icon={<DownOutlined rotate={collapseState.collapsed ? 0 : 180} />}
      iconPosition="end"
    >
      {collapseState.collapsed ? model.translate('Expand') : model.translate('Collapse')}
    </Button>
  );
});

export class CollapseFilterFormActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
  };

  enableEditTitle = false;
  enableEditIcon = false;

  toggle(collapsedRows: number) {
    const gridRows = this.context.blockModel.subModels.grid.props.rows || {};

    if (collapseState.collapsed) {
      Object.values(gridRows)
        .filter((row, index) => index >= collapsedRows)
        .flat(2)
        .forEach((uid: string) => {
          const fieldModel = this.flowEngine.getModel<FilterFormEditableFieldModel>(uid);
          if (fieldModel) {
            fieldModel.hide();
          }
        });
    } else {
      Object.values(gridRows)
        .filter((row, index) => index >= collapsedRows)
        .flat(2)
        .forEach((uid: string) => {
          const fieldModel = this.flowEngine.getModel<FilterFormEditableFieldModel>(uid);
          if (fieldModel) {
            fieldModel.show();
          }
        });
    }
  }

  render() {
    return <CollapseButton />;
  }
}

CollapseFilterFormActionModel.registerFlow({
  key: 'collapseEventSettings',
  title: tval('Collapse event settings'),
  on: 'collapseToggle',
  steps: {
    toggle: {
      title: '折叠时显示的行数',
      uiSchema: {
        collapsedRows: {
          type: 'number',
          'x-decorator': 'FormItem',
          'x-component': InputNumber,
          'x-component-props': {
            min: 1,
            max: 10,
            placeholder: '请输入显示行数',
          },
          default: 1,
        },
      },
      async handler(ctx, params) {
        const collapsedRows = params.collapsedRows || 1;
        ctx.model.toggle(collapsedRows);
      },
    },
  },
});

// CollapseFilterFormActionModel.registerFlow({
//   key: 'collapseSettings',
//   title: tval('Collapse Settings'),
//   steps: {
//     settings: {
//       title: '默认是否折叠',
//       uiSchema: {
//         defaultState: {
//           type: 'boolean',
//           'x-decorator': 'FormItem',
//           'x-component': 'Switch',
//         },
//       },
//       defaultParams: {
//         defaultState: false,
//       },
//       async handler(ctx, params) {
//         collapseState.collapsed = params.defaultState || false;
//         const collapsedRows = ctx.model.getStepParams('collapseEventSettings', 'toggle')?.collapsedRows || 1;
//         ctx.model.toggle(collapsedRows);
//       },
//     },
//   },
// });

CollapseFilterFormActionModel.define({
  title: tval('Collapse/Expand'),
});
