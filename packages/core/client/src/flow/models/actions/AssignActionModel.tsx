/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { ButtonProps, Alert } from 'antd';
import { escapeT, FlowModelRenderer, useFlowSettingsContext } from '@nocobase/flow-engine';
import { CollectionActionModel, RecordActionModel } from '../base/ActionModel';
import { AssignFieldsFormModel } from '../blocks';

const SETTINGS_FLOW_KEY = 'assignSettings';

// 配置态编辑器：渲染 assignForm 子模型
function AssignFieldsEditor() {
  const { model, blockModel } = useFlowSettingsContext();
  const action: any = model;
  const formModel: AssignFieldsFormModel = action?.subModels?.assignForm;
  const initializedRef = useRef(false);

  // 初始化回填
  useEffect(() => {
    if (!formModel || initializedRef.current) return;
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
    const isBulk = action instanceof CollectionActionModel && !(action instanceof RecordActionModel);
    if (isBulk && formModel?.context?.defineProperty) {
      // 从上下文层面移除 record 的 meta，使其不出现在变量树中
      formModel.context.defineProperty('record', { get: () => undefined });
    }
    // 回填：优先从每个子项自身的 stepParams 读取 assignValue
    const grid = formModel?.subModels?.grid;
    const items = grid?.subModels?.items || [];
    for (const it of items) {
      const saved =
        typeof it?.getStepParams === 'function' ? it.getStepParams('fieldSettings', 'assignValue')?.value : undefined;
      if (typeof saved !== 'undefined') {
        it.assignValue = saved;
      }
    }
    initializedRef.current = true;
  }, [action, formModel, blockModel?.collection]);

  if (!formModel) return null;
  return <FlowModelRenderer model={formModel} showFlowSettings={false} />;
}

export class RecordAssignActionModel extends RecordActionModel<{
  subModels: {
    assignForm: AssignFieldsFormModel;
  };
}> {
  // 专用于保存动作配置的属性，避免透传到 Button DOM props
  actionProps: { showConfirm?: boolean; updateMode?: 'selected' | 'all' } = {};

  defaultProps: ButtonProps = {
    title: escapeT('Update record'),
    type: 'link',
  };

  getAclActionName() {
    return 'update';
  }
}

RecordAssignActionModel.define({
  label: escapeT('Update record'),
  // 使用函数型 createModelOptions，从父级上下文提取资源信息，直接注入到子模型的 resourceSettings.init
  createModelOptions: (ctx) => {
    const dsKey = ctx.collection.dataSourceKey;
    const collName = ctx.collection.name;
    const init = dsKey && collName ? { dataSourceKey: dsKey, collectionName: collName } : undefined;
    return {
      subModels: {
        assignForm: {
          use: 'AssignFieldsFormModel',
          stepParams: { resourceSettings: { init } },
        },
      },
    };
  },
});

RecordAssignActionModel.registerFlow({
  key: SETTINGS_FLOW_KEY,
  title: escapeT('Action settings'),
  steps: {
    showConfirm: {
      title: escapeT('Secondary confirmation'),
      uiSchema: {
        value: {
          type: 'boolean',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
      },
      handler: (ctx, params) => {
        // 存入 actionProps，避免污染按钮 DOM props
        const m = ctx.model as RecordAssignActionModel;
        m.actionProps = { ...(m.actionProps || {}), showConfirm: !!params.value };
      },
    },
    assignFieldValues: {
      title: escapeT('Assign field values'),
      uiSchema() {
        return {
          tip: {
            'x-decorator': 'FormItem',
            'x-component': () => (
              <Alert type="info" showIcon message={'点击当前自定义按钮时，当前数据以下字段将按照以下表单保存。'} />
            ),
          },
          editor: {
            'x-decorator': 'FormItem',
            'x-component': () => <AssignFieldsEditor />,
          },
        };
      },
      async beforeParamsSave(ctx) {
        const form: AssignFieldsFormModel = ctx.model?.subModels?.assignForm;
        const assignedValues = form?.getAssignedValues?.() || {};
        const grid = form?.subModels?.grid;
        const items = grid?.subModels?.items || [];
        for (const it of items) {
          if (typeof it?.setStepParams === 'function') {
            it.setStepParams('fieldSettings', 'assignValue', { value: it.assignValue });
          }
        }
        ctx.model.setStepParams(SETTINGS_FLOW_KEY, 'assignFieldValues', { assignedValues });
      },
    },
  },
});

RecordAssignActionModel.registerFlow({
  key: 'apply',
  on: 'click',
  steps: {
    apply: {
      async defaultParams(ctx) {
        const step = ctx.model.getStepParams(SETTINGS_FLOW_KEY, 'assignFieldValues') || {};
        return { assignedValues: step?.assignedValues || {} };
      },
      async handler(ctx, params) {
        const m = ctx.model as RecordAssignActionModel;
        const needConfirm = m.actionProps?.showConfirm === true;
        if (needConfirm) {
          await ctx.runAction('confirm');
        }
        const assignedValues = params?.assignedValues || {};
        if (!assignedValues || typeof assignedValues !== 'object' || !Object.keys(assignedValues).length) {
          ctx.message.warning(ctx.t('No assigned fields configured'));
          return;
        }
        const collection = ctx.collection?.name;
        const filterByTk = ctx.collection?.getFilterByTK?.(ctx.record);
        if (!collection || typeof filterByTk === 'undefined' || filterByTk === null) {
          ctx.message.error(ctx.t('Record is required to perform this action'));
          return;
        }
        await ctx.api.resource(collection).update({ filterByTk, values: assignedValues });
        // 刷新与提示
        ctx.blockModel?.resource?.refresh?.();
        ctx.message.success(ctx.t('Saved successfully'));
      },
    },
  },
});

export class BulkAssignActionModel extends CollectionActionModel<{
  subModels: {
    assignForm: AssignFieldsFormModel;
  };
}> {
  // 专用于保存动作配置的属性，避免透传到 Button DOM props
  // 不需要 observe，仅在运行时读取
  actionProps: { showConfirm?: boolean; updateMode?: 'selected' | 'all' } = {};

  defaultProps: ButtonProps = {
    title: escapeT('Bulk edit'),
    icon: 'EditOutlined',
  };
  getAclActionName() {
    return 'update';
  }
}

BulkAssignActionModel.define({
  label: escapeT('Bulk edit'),
  // 使用函数型 createModelOptions，从父级上下文提取资源信息，直接注入到子模型的 resourceSettings.init
  createModelOptions: (ctx) => {
    const dsKey = ctx.collection.dataSourceKey;
    const collName = ctx.collection?.name;
    const init = dsKey && collName ? { dataSourceKey: dsKey, collectionName: collName } : undefined;
    return {
      subModels: {
        assignForm: {
          use: 'AssignFieldsFormModel',
          stepParams: { resourceSettings: { init } },
        },
      },
    };
  },
});

BulkAssignActionModel.registerFlow({
  key: SETTINGS_FLOW_KEY,
  title: escapeT('Action settings'),
  steps: {
    showConfirm: {
      title: escapeT('Secondary confirmation'),
      uiSchema: {
        value: {
          type: 'boolean',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
      },
      handler: (ctx, params) => {
        const m = ctx.model as BulkAssignActionModel;
        m.actionProps = { ...(m.actionProps || {}), showConfirm: !!params.value };
      },
    },
    updateMode: {
      title: escapeT('Data will be updated'),
      uiSchema: {
        value: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          enum: [
            { label: escapeT('Selected'), value: 'selected' },
            { label: escapeT('All'), value: 'all' },
          ],
          default: 'selected',
        },
      },
      handler: (ctx, params) => {
        const m = ctx.model as BulkAssignActionModel;
        m.actionProps = { ...(m.actionProps || {}), updateMode: (params.value as any) || 'selected' };
      },
    },
    assignFieldValues: {
      title: escapeT('Assign field values'),
      uiSchema() {
        return {
          editor: {
            'x-decorator': 'FormItem',
            'x-component': () => <AssignFieldsEditor />,
          },
        };
      },
      async beforeParamsSave(ctx) {
        const form: AssignFieldsFormModel = ctx.model?.subModels?.assignForm;
        const assignedValues = form?.getAssignedValues?.() || {};
        const grid = form?.subModels?.grid;
        const items = grid?.subModels?.items || [];
        for (const it of items) {
          if (typeof it?.setStepParams === 'function') {
            it.setStepParams('fieldSettings', 'assignValue', { value: it.assignValue });
          }
        }
        ctx.model.setStepParams(SETTINGS_FLOW_KEY, 'assignFieldValues', { assignedValues });
      },
    },
  },
});

BulkAssignActionModel.registerFlow({
  key: 'apply',
  on: 'click',
  steps: {
    apply: {
      async defaultParams(ctx) {
        const step = ctx.model.getStepParams(SETTINGS_FLOW_KEY, 'assignFieldValues') || {};
        return { assignedValues: step?.assignedValues || {} };
      },
      async handler(ctx, params) {
        const m = ctx.model as BulkAssignActionModel;
        const needConfirm = m.actionProps?.showConfirm === true;
        if (needConfirm) {
          await ctx.runAction('confirm');
        }
        const assignedValues = params?.assignedValues || {};
        if (!assignedValues || typeof assignedValues !== 'object' || !Object.keys(assignedValues).length) {
          ctx.message.warning(ctx.t('No assigned fields configured'));
          return;
        }
        const collection = ctx.collection?.name;
        if (!collection) {
          ctx.message.error(ctx.t('Collection is required to perform this action'));
          return;
        }
        const mode = m.actionProps?.updateMode || 'selected';
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
          await ctx.api.resource(collection).update({ filter, values: assignedValues });
        } else {
          // 整表（无筛选条件时需要 forceUpdate 通过校验）
          await ctx.api.resource(collection).update({ values: assignedValues, forceUpdate: true });
        }

        ctx.blockModel?.resource?.refresh?.();
        ctx.message.success(ctx.t('Saved successfully'));
      },
    },
  },
});
