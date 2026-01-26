/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum, PopupActionModel, PopupCollectionActionModel } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { NAMESPACE } from '../locale';
import { createTagPageOptions } from './utils';

const SETTINGS_FLOW_KEY = 'bulkEditSettings';

/**
 * 批量编辑操作模型 (FlowModel 完整版本)
 *
 * 与批量更新的关键区别：
 * - 批量编辑：使用 BulkEditField 组件，支持"保持不变"、"修改为"、"清空"三种编辑模式
 * - 批量更新：使用 AssignFormModel，直接赋值
 *
 * 实现方式：
 * 1. 点击按钮后打开弹窗表单（复用原有的 BulkEditActionDecorator 和 Schema）
 * 2. 在弹窗中动态添加字段（使用 SchemaInitializer）
 * 3. 字段使用 BulkEditField 组件（三种编辑模式）
 * 4. 提交时转换字段值并执行批量更新
 */
export class BulkEditActionModel extends PopupActionModel {
  static scene = ActionSceneEnum.collection;

  defaultPopupTitle = tExpr('Bulk edit');
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
  // createModelOptions: async (ctx, extra) => {
  //   console.log('BulkEditActionModel createModelOptions called', ctx, extra);
  //   const item = {
  //     use: 'BulkEditFormModel',
  //     stepParams: {
  //       resourceSettings: {
  //         init: {
  //           dataSourceKey: ctx.collection?.dataSourceKey,
  //           collectionName: ctx.collection?.name,
  //         },
  //       },
  //     },
  //     subModels: {
  //       actions: [
  //         // {
  //         //   use: 'BulkEditFormActionModel',
  //         // },
  //       ],
  //       grid: {
  //         // "uid": "b6dc58a1639",
  //         use: 'FormGridModel',
  //         // "parentId": "2021d179357",
  //         // "subKey": "grid",
  //         // "subType": "object",
  //         // "stepParams": {},
  //         // "sortIndex": 0,
  //         // "flowRegistry": {}
  //       },
  //     },
  //   };
  //   return {
  //     use: 'BulkEditActionModel',
  //     subModels: {
  //       page: createTagPageOptions({
  //         tabTitle: tExpr('Bulk edit'),
  //         items: [item],
  //       }),
  //     },
  //   };
  // },
});

/**
 * 配置流：仅配置基本参数（不包含字段配置）
 */
BulkEditActionModel.registerFlow({
  key: SETTINGS_FLOW_KEY,
  title: tExpr('Bulk edit action settings', { ns: NAMESPACE }),
  manual: true,
  steps: {
    // 编辑范围：选中记录 or 全部记录
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

/**
 * 执行流：点击按钮打开弹窗，用户在弹窗中动态添加字段并编辑
 *
 * 注意：字段配置不在按钮设置中，而是在弹窗表单中动态添加
 * 这样用户每次点击都可以灵活选择要编辑的字段
 */
BulkEditActionModel.registerFlow({
  key: 'apply',
  on: 'click',
  steps: {
    openModal: {
      async handler(ctx) {
        console.log('BulkEditActionModel openModal handler called');
        const editModeParams = ctx.model.getStepParams(SETTINGS_FLOW_KEY, 'editMode') || {};
        const mode = editModeParams?.value || 'selected';

        if (mode === 'selected') {
          const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
          if (!rows.length) {
            ctx.message.error(ctx.t('Please select the records to be updated'));
            return;
          }
        }

        const collection = ctx.collection?.name;
        if (!collection) {
          ctx.message.error(ctx.t('Collection is required to perform this action'));
          return;
        }

        ctx.model.setProps({
          visible: true,
        });
      },
    },
  },
});
