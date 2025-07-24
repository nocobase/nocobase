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
import { Button } from 'antd';
import { observer } from '@formily/react';
import { observable } from '@formily/reactive';
import { tval } from '@nocobase/utils/client';
import { FilterFormActionModel } from './FilterFormActionModel';
import { useFlowModel } from '@nocobase/flow-engine';

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

  render() {
    return <CollapseButton />;
  }
}

CollapseFilterFormActionModel.registerFlow({
  key: 'collapseSettings',
  on: {
    eventName: 'collapseToggle',
  },
  steps: {
    doCollapse: {
      async handler(ctx, params) {
        const { collapsed } = params;
        // 这里可以添加实际的折叠/展开逻辑
        // 例如，隐藏/显示表单字段或改变布局
        console.log('Collapse state changed:', collapsed);

        // 可以通过ctx.model获取模型实例，通过ctx.blockModel获取区块模型
        if (ctx.blockModel) {
          // 设置区块的折叠状态
          ctx.blockModel.setProps({ collapsed });
        }
      },
    },
  },
});

CollapseFilterFormActionModel.define({
  title: tval('Collapse/Expand'),
});
