/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Space } from 'antd';
import { FlowModel } from '../../../../../models';
import { openStepSettings, getStepSettingMode } from '../StepSettings';

/**
 * 示例：展示如何使用 settingMode: 'drawer' 配置
 */

// 创建一个示例模型类
class ExampleModel extends FlowModel {
  render() {
    return (
      <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 4 }}>
        <h3>示例模型</h3>
        <p>这是一个配置了不同 settingMode 的示例模型</p>
        <Space>
          <Button
            onClick={() => {
              openStepSettings({
                model: this,
                flowKey: 'exampleFlow',
                stepKey: 'dialogStep',
              });
            }}
          >
            打开对话框配置 (Dialog)
          </Button>
          <Button
            onClick={() => {
              openStepSettings({
                model: this,
                flowKey: 'exampleFlow',
                stepKey: 'drawerStep',
              });
            }}
          >
            打开抽屉配置 (Drawer)
          </Button>
        </Space>
        <div style={{ marginTop: 10 }}>
          <p>Dialog Step 模式: {getStepSettingMode(this, 'exampleFlow', 'dialogStep')}</p>
          <p>Drawer Step 模式: {getStepSettingMode(this, 'exampleFlow', 'drawerStep')}</p>
        </div>
      </div>
    );
  }
}

// 注册示例流程
ExampleModel.registerFlow({
  key: 'exampleFlow',
  title: '示例流程',
  auto: true,
  steps: {
    // 使用默认的 dialog 模式
    dialogStep: {
      title: '对话框步骤',
      use: 'exampleAction',
      // settingMode 默认为 'dialog'
      uiSchema: {
        message: {
          type: 'string',
          title: '消息内容',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
        type: {
          type: 'string',
          title: '消息类型',
          enum: [
            { label: '信息', value: 'info' },
            { label: '成功', value: 'success' },
            { label: '警告', value: 'warning' },
            { label: '错误', value: 'error' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Select',
        },
      },
      defaultParams: {
        message: '这是一个对话框配置的步骤',
        type: 'info',
      },
    },
    // 使用 drawer 模式
    drawerStep: {
      title: '抽屉步骤',
      use: 'exampleAction',
      settingMode: 'drawer', // 配置为使用抽屉模式
      uiSchema: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        description: {
          type: 'string',
          title: '描述',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
        priority: {
          type: 'string',
          title: '优先级',
          enum: [
            { label: '低', value: 'low' },
            { label: '中', value: 'medium' },
            { label: '高', value: 'high' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
        enabled: {
          type: 'boolean',
          title: '启用',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
      },
      defaultParams: {
        title: '这是一个抽屉配置的步骤',
        description: '抽屉模式提供更大的配置空间',
        priority: 'medium',
        enabled: true,
      },
    },
  },
});

// 注册示例动作 (需要通过 FlowEngine 实例注册)
// ExampleModel.registerAction({
//   name: 'exampleAction',
//   title: '示例动作',
//   handler: (ctx, params) => {
//     console.log('执行示例动作:', params);
//     return params;
//   },
// });

export { ExampleModel };
