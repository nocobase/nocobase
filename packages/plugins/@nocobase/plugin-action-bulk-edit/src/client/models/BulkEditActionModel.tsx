/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { NAMESPACE } from '../locale';

const SETTINGS_FLOW_KEY = 'bulkEditSettings';

/**
 * 批量编辑操作模型 (FlowModel 版本)
/**
 * 与批量更新的关键区别：
 * - 批量编辑：使用 BulkEditField 组件，支持"保持不变"、"修改为"、"清空"三种编辑模式
 * - 批量更新：使用 AssignFormModel，直接赋值
 *
 * 实现说明：
 * 1. 复用原有的弹窗和表单逻辑（通过 BulkEditActionDecorator 和现有Schema）
 * 2. FlowModel 主要提供配置界面和执行前的二次确认
 * 3. 实际的表单处理由 useCustomizeBulkEditActionProps 完成
 */
export class BulkEditActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    title: tExpr('Bulk edit'),
    icon: 'EditOutlined',
  };

  getAclActionName() {
    return 'update';
  }
}

BulkEditActionModel.define({
  label: tExpr('Bulk edit'),
});

// 配置流：收集批量编辑的参数
BulkEditActionModel.registerFlow({
  key: SETTINGS_FLOW_KEY,
  title: tExpr('Bulk edit action settings', { ns: NAMESPACE }),
  manual: true,
  steps: {
    confirm: {
      title: tExpr('Secondary confirmation'),
      use: 'confirm',
      defaultParams: {
        enable: false,
        title: tExpr('Bulk edit'),
        content: tExpr('Are you sure you want to perform the bulk edit action?'),
      },
    },
    editMode: {
      title: tExpr('Data scope to edit'),
      uiSchema: {
        value: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          enum: [
            { label: tExpr('Selected'), value: 'selected' },
            { label: tExpr('All'), value: 'all' },
          ],
          default: 'selected',
        },
      },
    },
  },
});
