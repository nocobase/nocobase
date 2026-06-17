/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionModel,
  ActionSceneEnum,
  AssignFormModel,
  createAssignFieldValuesStep,
  createAssignFormSubModelOptions,
  getAssignFieldValuesDefaultParams,
  resolveAssignFieldValues,
} from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { NAMESPACE } from './locale';

const SETTINGS_FLOW_KEY = 'assignSettings';

export class BulkUpdateActionModel extends ActionModel<{
  subModels: {
    assignForm: AssignFormModel;
  };
}> {
  static scene: typeof ActionSceneEnum.collection = ActionSceneEnum.collection;
  static capabilityActionName = 'updateMany';
  assignFormUid?: string;
  defaultProps: ButtonProps = {
    title: tExpr('Bulk update'),
    icon: 'EditOutlined',
  };
  getAclActionName() {
    return 'update';
  }
}

BulkUpdateActionModel.define({
  label: tExpr('Bulk update'),
  sort: 1020,
  // 使用函数型 createModelOptions，从父级上下文提取资源信息，直接注入到子模型的 resourceSettings.init
  createModelOptions: (ctx) => {
    return {
      subModels: {
        assignForm: createAssignFormSubModelOptions(ctx),
      },
    };
  },
});

BulkUpdateActionModel.registerFlow({
  key: SETTINGS_FLOW_KEY,
  title: tExpr('Bulk update action settings', { ns: NAMESPACE }),
  // 配置流仅用于收集参数，避免自动执行
  manual: true,
  steps: {
    // 二次确认：复用全局 confirm action，支持开关、标题、内容（含变量选择）
    confirm: {
      title: tExpr('Secondary confirmation'),
      use: 'confirm',
      defaultParams: {
        enable: false,
        title: tExpr('Bulk update'),
        content: tExpr('Are you sure you want to perform the Update record action?'),
      },
    },
    updateMode: {
      title: tExpr('Data will be updated'),
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
    assignFieldValues: createAssignFieldValuesStep({
      settingsFlowKey: SETTINGS_FLOW_KEY,
      title: tExpr('Assign field values'),
      clearRecordContext: true,
    }),
  },
});

BulkUpdateActionModel.registerFlow({
  key: 'apply',
  on: 'click',
  steps: {
    apply: {
      async defaultParams(ctx) {
        return getAssignFieldValuesDefaultParams(ctx, SETTINGS_FLOW_KEY);
      },
      async handler(ctx, params) {
        // 统一接入二次确认：如果启用则弹窗；未配置时默认不启用
        const savedConfirm = ctx.model.getStepParams(SETTINGS_FLOW_KEY, 'confirm');
        const confirmParams = savedConfirm && typeof savedConfirm === 'object' ? savedConfirm : { enable: false };
        await ctx.runAction('confirm', confirmParams);

        const assignedValues = await resolveAssignFieldValues(ctx, params?.assignedValues, 'BulkUpdateAction');
        if (!assignedValues) {
          return;
        }

        if (!assignedValues || typeof assignedValues !== 'object' || !Object.keys(assignedValues).length) {
          ctx.message.warning(ctx.t('No assigned fields configured'));
          return;
        }
        const collection = ctx.collection?.name;
        if (!collection) {
          ctx.message.error(ctx.t('Collection is required to perform this action'));
          return;
        }
        const updateModeParams = ctx.model.getStepParams(SETTINGS_FLOW_KEY, 'updateMode') || {};
        const mode = updateModeParams?.value || 'selected';
        if (mode === 'selected') {
          const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
          if (!rows.length) {
            ctx.message.error(ctx.t('Please select the records to be updated'));
            return;
          }
          const pk = ctx.collection?.getPrimaryKey?.() || ctx.collection?.filterTargetKey || 'id';
          const filterKey = ctx.collection?.filterTargetKey || pk || 'id';
          const ids = rows.map((r) => ctx.collection.getFilterByTK(r)).filter((v) => v != null);
          const filter = { $and: [{ [filterKey]: { $in: ids } }] };
          ctx.model.setProps({
            loading: true,
          });
          try {
            await ctx.api
              .resource(collection, null, {
                'x-data-source': ctx.collection?.dataSourceKey,
              })
              .update({ filter, values: assignedValues });
          } finally {
            ctx.model.setProps({
              loading: false,
            });
          }
        } else {
          // 整表（无筛选条件时需要 forceUpdate 通过校验）
          ctx.model.setProps({
            loading: true,
          });
          try {
            await ctx.api
              .resource(collection, null, {
                'x-data-source': ctx.collection?.dataSourceKey,
              })
              .update({ values: assignedValues, forceUpdate: true });
          } finally {
            ctx.model.setProps({
              loading: false,
            });
          }
        }

        ctx.blockModel?.resource?.refresh?.();
        ctx.message.success(ctx.t('Saved successfully'));
      },
    },
  },
});
