/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button } from 'antd';
import { FlowModel } from '../../../../../models';
import { openStepSettings } from '../StepSettings';

/**
 * 简单的抽屉测试示例
 */

// 创建一个简单的测试模型
class SimpleTestModel extends FlowModel {
  render() {
    return (
      <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 4 }}>
        <h3>简单抽屉测试</h3>
        <p>点击下面的按钮测试抽屉配置功能</p>
        <Button
          type="primary"
          onClick={() => {
            openStepSettings({
              model: this,
              flowKey: 'testFlow',
              stepKey: 'drawerStep',
            })
              .then((values) => {
                console.log('保存的配置:', values);
              })
              .catch((error) => {
                console.log('用户取消或出错:', error);
              });
          }}
        >
          打开抽屉配置
        </Button>
      </div>
    );
  }
}

// 注册简单的测试流程
SimpleTestModel.registerFlow({
  key: 'testFlow',
  title: '测试流程',
  steps: {
    drawerStep: {
      title: '抽屉步骤',
      settingMode: 'drawer', // 使用抽屉模式
      uiSchema: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: '请输入标题',
          },
        },
        description: {
          type: 'string',
          title: '描述',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
          'x-component-props': {
            placeholder: '请输入描述',
            rows: 3,
          },
        },
        enabled: {
          type: 'boolean',
          title: '启用',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
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
          'x-component': 'Select',
        },
      },
      defaultParams: {
        title: '默认标题',
        description: '默认描述',
        enabled: true,
        priority: 'medium',
      },
      // 简单的处理函数
      handler: (ctx, params) => {
        console.log('执行抽屉步骤:', params);
        return params;
      },
    },
  },
});

export { SimpleTestModel };
