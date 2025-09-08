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
import { AssignFieldsFormModel } from '../common/AssignFieldsFormModel';

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
  createModelOptions: {
    subModels: {
      assignForm: { use: 'AssignFieldsFormModel' },
    },
  },
});

RecordAssignActionModel.registerFlow({
  key: SETTINGS_FLOW_KEY,
  title: escapeT('Action settings'),
  steps: {
    showConfirm: {
      title: '是否二次确认',
      uiSchema: {
        value: {
          type: 'boolean',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
      },
      handler: (ctx, params) => {
        ctx.model.setProps('showConfirm', params.value);
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
        if (ctx.model.props['showConfirm']) {
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
  defaultProps: ButtonProps = {
    title: escapeT('Bulk update'),
    icon: 'EditOutlined',
  };
  getAclActionName() {
    return 'update';
  }
}

BulkAssignActionModel.define({
  label: escapeT('Bulk update'),
  createModelOptions: {
    subModels: {
      assignForm: { use: 'AssignFieldsFormModel' },
    },
  },
});

BulkAssignActionModel.registerFlow({
  key: SETTINGS_FLOW_KEY,
  title: escapeT('Action settings'),
  steps: {
    showConfirm: {
      title: '是否二次确认',
      uiSchema: {
        value: {
          type: 'boolean',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
      },
      handler: (ctx, params) => {
        ctx.model.setProps('showConfirm', params.value);
      },
    },
    updateMode: {
      title: '更新范围',
      uiSchema: {
        value: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          enum: [
            { label: '仅选中', value: 'selected' },
            { label: '整表', value: 'all' },
          ],
          default: 'selected',
        },
      },
      handler: (ctx, params) => {
        ctx.model.setProps('updateMode', params.value || 'selected');
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
        if (ctx.model.props['showConfirm']) {
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
        const mode = ctx.model.props['updateMode'] || 'selected';
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
