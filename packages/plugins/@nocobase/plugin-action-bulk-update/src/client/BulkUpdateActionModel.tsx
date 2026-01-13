/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum, AssignFormModel } from '@nocobase/client';
import {
  FlowModelRenderer,
  resolveRunJSObjectValues,
  tExpr,
  useFlowEngine,
  useFlowSettingsContext,
} from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import React, { useEffect, useRef } from 'react';
import { NAMESPACE } from './locale';

const SETTINGS_FLOW_KEY = 'assignSettings';

// 配置态编辑器：渲染 assignForm 子模型
function AssignFieldsEditor() {
  const { model: action, blockModel } = useFlowSettingsContext();
  const engine = useFlowEngine();
  const initializedRef = useRef(false);
  const [formModel, setFormModel] = React.useState<AssignFormModel | null>(null);

  // 加载 assignForm 子模型（同一实例）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = (await engine.loadOrCreateModel({
        parentId: action.uid,
        subKey: 'assignForm',
        use: 'AssignFormModel',
      })) as AssignFormModel;
      if (cancelled) return;
      setFormModel(loaded);
      action['assignFormUid'] = loaded?.uid || action['assignFormUid'];
    })();
    return () => {
      cancelled = true;
    };
  }, [action, engine]);

  // 初始化回填（在子模型加载完成后）
  useEffect(() => {
    if (initializedRef.current) return;
    if (!formModel) return;
    const prev = action.getStepParams?.(SETTINGS_FLOW_KEY, 'assignFieldValues') || {};
    // 注入资源上下文：与所在表格区块一致
    const coll = blockModel?.collection || action?.context?.collection;
    const dsKey = coll?.dataSourceKey;
    const collName = coll?.name;
    if (dsKey && collName) {
      formModel.setStepParams('resourceSettings', 'init', {
        dataSourceKey: dsKey,
        collectionName: collName,
      });
    }
    formModel.setInitialAssignedValues(prev?.assignedValues || {});
    // 批量配置态：移除 ctx.record（Action 为区块级，不具备单条记录上下文）
    // formModel.context.defineProperty('formValues', { get: () => undefined });
    formModel.context.defineProperty('record', {
      get: () => undefined,
      cache: false,
    });
    initializedRef.current = true;
  }, [action, blockModel?.collection, formModel]);

  return formModel ? <FlowModelRenderer model={formModel} showFlowSettings={false} /> : null;
}

export class BulkUpdateActionModel extends ActionModel<{
  subModels: {
    assignForm: AssignFormModel;
  };
}> {
  static scene = ActionSceneEnum.collection;
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
  // 使用函数型 createModelOptions，从父级上下文提取资源信息，直接注入到子模型的 resourceSettings.init
  createModelOptions: (ctx) => {
    const dsKey = ctx.collection.dataSourceKey;
    const collName = ctx.collection?.name;
    const init = dsKey && collName ? { dataSourceKey: dsKey, collectionName: collName } : undefined;
    return {
      subModels: {
        assignForm: {
          use: 'AssignFormModel',
          async: true,
          stepParams: { resourceSettings: { init } },
        },
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
    assignFieldValues: {
      title: tExpr('Assign field values'),
      uiSchema() {
        return {
          editor: {
            'x-decorator': 'FormItem',
            'x-component': () => <AssignFieldsEditor />,
          },
        };
      },
      async beforeParamsSave(ctx) {
        const m = ctx.model as BulkUpdateActionModel;
        // 跨视图栈按 uid 定位到设置面板中的真实 AssignForm 实例
        const form: AssignFormModel = (m?.assignFormUid &&
          (ctx.engine.getModel?.(m.assignFormUid, true) as any)) as any;
        if (!form) return;
        const assignedValues = form?.getAssignedValues?.() || {};
        ctx.model.setStepParams(SETTINGS_FLOW_KEY, 'assignFieldValues', { assignedValues });
      },
    },
  },
});

BulkUpdateActionModel.registerFlow({
  key: 'apply',
  on: 'click',
  steps: {
    apply: {
      async defaultParams(ctx) {
        const step = ctx.model.getStepParams(SETTINGS_FLOW_KEY, 'assignFieldValues') || {};
        return { assignedValues: step?.assignedValues || {} };
      },
      async handler(ctx, params) {
        // 统一接入二次确认：如果启用则弹窗；未配置时默认不启用
        const savedConfirm = ctx.model.getStepParams(SETTINGS_FLOW_KEY, 'confirm');
        const confirmParams = savedConfirm && typeof savedConfirm === 'object' ? savedConfirm : { enable: false };
        await ctx.runAction('confirm', confirmParams);

        let assignedValues: Record<string, any> = {};
        try {
          assignedValues = await resolveRunJSObjectValues(ctx, params?.assignedValues);
        } catch (error) {
          console.error('[BulkUpdateAction] RunJS execution failed', error);
          ctx.message.error(ctx.t('RunJS execution failed'));
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
          await ctx.api
            .resource(collection, null, {
              'x-data-source': ctx.collection?.dataSourceKey,
            })
            .update({ filter, values: assignedValues });
          ctx.model.setProps({
            loading: false,
          });
        } else {
          // 整表（无筛选条件时需要 forceUpdate 通过校验）
          ctx.model.setProps({
            loading: true,
          });
          await ctx.api
            .resource(collection, null, {
              'x-data-source': ctx.collection?.dataSourceKey,
            })
            .update({ values: assignedValues, forceUpdate: true });
          ctx.model.setProps({
            loading: false,
          });
        }

        ctx.blockModel?.resource?.refresh?.();
        ctx.message.success(ctx.t('Saved successfully'));
      },
    },
  },
});
