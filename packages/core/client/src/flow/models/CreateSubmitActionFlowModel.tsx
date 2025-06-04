/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import * as icons from '@ant-design/icons';
import { FlowModel } from '@nocobase/flow-engine';
import { Button } from 'antd';

export class CreateSubmitActionFlowModel extends FlowModel {
  render() {
    return (
      <Button
        onClick={() => {
          this.dispatchEvent('onClick');
        }}
        {...this.props}
      />
    );
  }
}
// 属性流
CreateSubmitActionFlowModel.registerFlow({
  key: 'actionPropsFlow',
  title: '按钮配置',
  auto: true,
  steps: {
    setProps: {
      title: '按钮属性设置',
      uiSchema: {
        title: {
          type: 'string',
          title: '按钮标题',
          'x-component': 'Input',
        },
        type: {
          type: 'string',
          title: '类型',
          'x-component': 'Select',
          enum: [
            { label: '主要', value: 'primary' },
            { label: '次要', value: 'default' },
            { label: '危险', value: 'danger' },
            { label: '虚线', value: 'dashed' },
            { label: '链接', value: 'link' },
            { label: '文本', value: 'text' },
          ],
        },
        icon: {
          type: 'string',
          title: '图标',
          'x-component': 'Select',
          enum: [
            { label: '搜索', value: 'SearchOutlined' },
            { label: '添加', value: 'PlusOutlined' },
            { label: '删除', value: 'DeleteOutlined' },
            { label: '编辑', value: 'EditOutlined' },
            { label: '设置', value: 'SettingOutlined' },
          ],
        },
      },
      defaultParams: {
        type: 'primary',
      },
      // 步骤处理函数，设置模型属性
      handler(ctx, params) {
        console.log('Setting props:', params);
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
        ctx.model.setProps('icon', params.icon ? React.createElement(icons[params.icon]) : undefined);
      },
    },
  },
});
// 事件流
CreateSubmitActionFlowModel.registerFlow({
  key: 'actionEventFlow',
  on: {
    eventName: 'onClick',
  },
  title: '按钮事件',
  steps: {
    confirm: {
      title: '确认弹窗',
      use: 'showConfirm',
      defaultParams: {
        title: '确认提交',
        message: '确定要提交记录吗？此操作不可撤销！',
      },
    },
    submit: {
      handler: (ctx, params) => {
        console.log('submit', ctx, ctx.model, params);
      },
    },
  },
});
