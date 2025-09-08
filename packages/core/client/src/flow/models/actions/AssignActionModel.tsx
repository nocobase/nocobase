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
  const { model, blockModel } = useFlowSettingsContext() as any;
  const action: any = model;
  const formModel: AssignFieldsFormModel | undefined = action?.subModels?.assignForm;
  const initializedRef = useRef(false);

  // 初始化回填
  useEffect(() => {
    if (!formModel || initializedRef.current) return;
    const prev = action.getStepParams?.(SETTINGS_FLOW_KEY, 'assignFieldValues') || {};
    // 注入资源上下文：与所在表格区块一致
    try {
      const coll = blockModel?.collection || action?.context?.collection;
      const dsKey = coll?.dataSourceKey;
      const collName = coll?.name;
      if (dsKey && collName) {
        formModel.setStepParams('resourceSettings', 'init', {
          dataSourceKey: dsKey,
          collectionName: collName,
        });
      }
    } catch (e) {
      // 忽略上下文注入失败
      void e;
    }
    formModel.setInitialAssignedValues(prev?.assignedValues || {});
    // 批量配置态：移除 ctx.record（Action 为区块级，不具备单条记录上下文）
    try {
      const isBulk = action instanceof CollectionActionModel && !(action instanceof RecordActionModel);
      if (isBulk) {
        // 从上下文层面移除 record 的 meta，使其不出现在变量树中
        formModel.context.defineProperty('record', { get: () => undefined });
      }
    } catch (e) {
      void e;
    }
    // 回填：优先从每个子项自身的 stepParams 读取 assignValue
    try {
      const grid = (formModel as any)?.subModels?.grid;
      const items: any[] = (grid?.subModels?.items as any[]) || [];
      for (const it of items) {
        const saved =
          typeof it?.getStepParams === 'function' ? it.getStepParams('fieldSettings', 'assignValue')?.value : undefined;
        if (typeof saved !== 'undefined') {
          it.assignValue = saved;
        }
      }
    } catch (e) {
      // 忽略子项回填失败
      void e;
    }
    initializedRef.current = true;
  }, [action, formModel, blockModel?.collection]);

  if (!formModel) return null;
  return <FlowModelRenderer model={formModel} showFlowSettings={false} />;
}

export class RecordAssignActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('更新数据'),
    type: 'link',
  };

  getAclActionName() {
    return 'update';
  }
}

RecordAssignActionModel.define({
  label: escapeT('更新数据'),
  createModelOptions: {
    subModels: {
      assignForm: { use: 'AssignFieldsFormModel' },
    },
  },
});

RecordAssignActionModel.registerFlow({
  key: SETTINGS_FLOW_KEY,
  title: escapeT('操作设置'),
  steps: {
    assignFieldValues: {
      title: escapeT('字段赋值'),
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
        } as any;
      },
      async beforeParamsSave(ctx) {
        const form: AssignFieldsFormModel | undefined = (ctx.model as any)?.subModels?.assignForm;
        const assignedValues = form?.getAssignedValues?.() || {};
        try {
          const grid = (form as any)?.subModels?.grid;
          const items: any[] = (grid?.subModels?.items as any[]) || [];
          for (const it of items) {
            if (typeof it?.setStepParams === 'function') {
              it.setStepParams('fieldSettings', 'assignValue', { value: it.assignValue });
            }
          }
        } catch (e) {
          // 忽略子项保存失败
          void e;
        }
        (ctx.model as any).setStepParams(SETTINGS_FLOW_KEY, 'assignFieldValues', { assignedValues });
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
        const assignedValues = (params?.assignedValues || {}) as any;
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

export class BulkAssignActionModel extends CollectionActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('批量更新'),
    icon: 'EditOutlined',
  };
  getAclActionName() {
    return 'update';
  }
}

BulkAssignActionModel.define({
  label: escapeT('批量更新'),
  createModelOptions: {
    subModels: {
      assignForm: { use: 'AssignFieldsFormModel' },
    },
  },
});

BulkAssignActionModel.registerFlow({
  key: SETTINGS_FLOW_KEY,
  title: escapeT('操作设置'),
  steps: {
    assignFieldValues: {
      title: escapeT('字段赋值'),
      uiSchema() {
        return {
          editor: {
            'x-decorator': 'FormItem',
            'x-component': () => <AssignFieldsEditor />,
          },
        } as any;
      },
      async beforeParamsSave(ctx) {
        const form: AssignFieldsFormModel | undefined = (ctx.model as any)?.subModels?.assignForm;
        const assignedValues = form?.getAssignedValues?.() || {};
        try {
          const grid = (form as any)?.subModels?.grid;
          const items: any[] = (grid?.subModels?.items as any[]) || [];
          for (const it of items) {
            if (typeof it?.setStepParams === 'function') {
              it.setStepParams('fieldSettings', 'assignValue', { value: it.assignValue });
            }
          }
        } catch (e) {
          // 忽略子项保存失败
          void e;
        }
        (ctx.model as any).setStepParams(SETTINGS_FLOW_KEY, 'assignFieldValues', { assignedValues });
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
        const assignedValues = (params?.assignedValues || {}) as any;
        if (!assignedValues || typeof assignedValues !== 'object' || !Object.keys(assignedValues).length) {
          ctx.message.warning(ctx.t('No assigned fields configured'));
          return;
        }
        const collection = ctx.collection?.name;
        if (!collection) {
          ctx.message.error(ctx.t('Collection is required to perform this action'));
          return;
        }
        const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
        if (!rows.length) {
          ctx.message.error(ctx.t('Please select the records to be updated'));
          return;
        }
        // 构造 filter：仅限制到选中的记录
        const pk = ctx.collection?.getPrimaryKey?.() || ctx.collection?.filterTargetKey || 'id';
        const filterKey = ctx.collection?.filterTargetKey || pk || 'id';
        const ids = rows.map((r: any) => ctx.collection.getFilterByTK(r)).filter((v: any) => v != null);
        const filter = { $and: [{ [filterKey]: { $in: ids } }] };
        await ctx.api.resource(collection).update({ filter, values: assignedValues });

        ctx.blockModel?.resource?.refresh?.();
        ctx.message.success(ctx.t('Saved successfully'));
      },
    },
  },
});
