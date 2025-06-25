/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '../../../../../models';
import { getStepSettingMode, isStepUsingDrawerMode } from '../StepSettings';

// 创建测试模型
class TestModel extends FlowModel {
  render() {
    return null;
  }
}

// 注册测试流程
TestModel.registerFlow({
  key: 'testFlow',
  title: '测试流程',
  steps: {
    dialogStep: {
      title: '对话框步骤',
      use: 'testAction',
      // settingMode 默认为 'dialog'
      uiSchema: {
        message: {
          type: 'string',
          title: '消息',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
    drawerStep: {
      title: '抽屉步骤',
      use: 'testAction',
      settingMode: 'drawer', // 明确设置为抽屉模式
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
    },
    explicitDialogStep: {
      title: '明确对话框步骤',
      use: 'testAction',
      settingMode: 'dialog', // 明确设置为对话框模式
      uiSchema: {
        value: {
          type: 'string',
          title: '值',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
  },
});

describe('StepSettings', () => {
  let testModel: TestModel;

  beforeEach(() => {
    testModel = new TestModel({ uid: 'test-model' });
  });

  describe('getStepSettingMode', () => {
    it('should return "dialog" for default step', () => {
      const mode = getStepSettingMode(testModel, 'testFlow', 'dialogStep');
      expect(mode).toBe('dialog');
    });

    it('should return "drawer" for drawer step', () => {
      const mode = getStepSettingMode(testModel, 'testFlow', 'drawerStep');
      expect(mode).toBe('drawer');
    });

    it('should return "dialog" for explicitly set dialog step', () => {
      const mode = getStepSettingMode(testModel, 'testFlow', 'explicitDialogStep');
      expect(mode).toBe('dialog');
    });

    it('should return null for non-existent step', () => {
      const mode = getStepSettingMode(testModel, 'testFlow', 'nonExistentStep');
      expect(mode).toBe(null);
    });

    it('should return null for non-existent flow', () => {
      const mode = getStepSettingMode(testModel, 'nonExistentFlow', 'dialogStep');
      expect(mode).toBe(null);
    });
  });

  describe('isStepUsingDrawerMode', () => {
    it('should return false for default step', () => {
      const isDrawer = isStepUsingDrawerMode(testModel, 'testFlow', 'dialogStep');
      expect(isDrawer).toBe(false);
    });

    it('should return true for drawer step', () => {
      const isDrawer = isStepUsingDrawerMode(testModel, 'testFlow', 'drawerStep');
      expect(isDrawer).toBe(true);
    });

    it('should return false for explicitly set dialog step', () => {
      const isDrawer = isStepUsingDrawerMode(testModel, 'testFlow', 'explicitDialogStep');
      expect(isDrawer).toBe(false);
    });

    it('should return false for non-existent step', () => {
      const isDrawer = isStepUsingDrawerMode(testModel, 'testFlow', 'nonExistentStep');
      expect(isDrawer).toBe(false);
    });

    it('should return false for non-existent flow', () => {
      const isDrawer = isStepUsingDrawerMode(testModel, 'nonExistentFlow', 'dialogStep');
      expect(isDrawer).toBe(false);
    });
  });
});
