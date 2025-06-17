/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { Button, ButtonProps } from 'antd';
import React from 'react';

export class ActionModel extends FlowModel<{ subModels: { view?: FlowModel } }> {
  declare props: ButtonProps;

  render() {
    const props = this.getProps();
    return <Button {...props} onClick={(event) => this.dispatchEvent('onClick', { event })} />;
  }
}

ActionModel.registerFlow({
  key: 'defaultProps',
  auto: true,
  title: '基础配置',
  steps: {
    editButton: {
      title: '编辑按钮',
      uiSchema: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        icon: {
          type: 'string',
          title: '图标',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '搜索', value: 'SearchOutlined' },
            { label: '添加', value: 'PlusOutlined' },
            { label: '删除', value: 'DeleteOutlined' },
            { label: '编辑', value: 'EditOutlined' },
            { label: '设置', value: 'SettingOutlined' },
          ],
        },
        type: {
          type: 'string',
          title: '颜色',
          'x-decorator': 'FormItem',
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
      },
      handler(ctx, params) {
        ctx.model.setProps(params);
      },
    },
    // linkageRules: {
    //   title: '联动规则',
    //   uiSchema: {},
    //   handler(ctx, params) {
    //     ctx.model.setProps(params);
    //   },
    // },
  },
});

ActionModel.registerFlow({
  key: 'defaultClickHandler',
  on: {
    eventName: 'onClick',
  },
  title: '点击事件',
  steps: {
    openMode: {
      title: '打开方式',
      uiSchema: {},
      handler(ctx, params) {
        ctx.model.setProps(params);
      },
    },
    popupSize: {
      title: '弹窗尺寸',
      uiSchema: {},
      handler(ctx, params) {
        ctx.model.setProps(params);
      },
    },
  },
});
