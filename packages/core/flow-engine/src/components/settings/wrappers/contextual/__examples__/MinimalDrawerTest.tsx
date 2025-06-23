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
import { openStepSettingsDrawer } from '../StepSettingsDrawer';

/**
 * 最小化的抽屉测试
 */

// 创建一个模拟的模型对象
const mockModel = {
  uid: 'test-model',
  flowEngine: {
    context: {},
    flowSettings: {
      components: {},
      scopes: {},
    },
  },
  getFlow: (flowKey: string) => {
    if (flowKey === 'testFlow') {
      return {
        key: 'testFlow',
        title: '测试流程',
        steps: {
          drawerStep: {
            title: '抽屉步骤',
            settingMode: 'drawer',
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
            },
            defaultParams: {
              title: '默认标题',
              description: '默认描述',
            },
          },
        },
      };
    }
    return null;
  },
  getStepParams: (flowKey: string, stepKey: string) => {
    return {
      title: '当前标题',
      description: '当前描述',
    };
  },
  setStepParams: (flowKey: string, stepKey: string, params: any) => {
    console.log('设置步骤参数:', { flowKey, stepKey, params });
  },
  save: async () => {
    console.log('保存模型');
    return Promise.resolve();
  },
};

const MinimalDrawerTest: React.FC = () => {
  const handleOpenDrawer = async () => {
    try {
      const result = await openStepSettingsDrawer({
        model: mockModel,
        flowKey: 'testFlow',
        stepKey: 'drawerStep',
        drawerWidth: 600,
        drawerTitle: '测试抽屉配置',
      });
      console.log('抽屉配置结果:', result);
    } catch (error) {
      console.log('抽屉配置取消或出错:', error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>最小化抽屉测试</h3>
      <p>这是一个最小化的抽屉测试，用于验证基本功能。</p>
      <Button type="primary" onClick={handleOpenDrawer}>
        打开抽屉配置
      </Button>
    </div>
  );
};

export default MinimalDrawerTest;
