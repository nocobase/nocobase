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
import { escapeT, FlowModelRenderer, useFlowEngine, useFlowSettingsContext } from '@nocobase/flow-engine';
import { CollectionActionModel, RecordActionModel } from '../base/ActionModel';
import { AssignFormModel } from '../blocks';
// import { RemoteFlowModelRenderer } from '../../FlowPage';

const SETTINGS_FLOW_KEY = 'assignSettings';

// 配置态编辑器：渲染 assignForm 子模型
function AssignFieldsEditor() {
  const { model, blockModel } = useFlowSettingsContext();
  const action: any = model;
  const engine = useFlowEngine();
  const initializedRef = useRef(false);
  const [formModel, setFormModel] = React.useState<AssignFormModel | null>(null);

  // 初始化回填
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
      action.assignFormUid = (loaded as any)?.uid || action.assignFormUid;
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
    const isBulk = action instanceof CollectionActionModel && !(action instanceof RecordActionModel);
    if (isBulk && (formModel as any)?.context?.defineProperty) {
      formModel.context.defineProperty('record', { get: () => undefined });
    }
    const grid = (formModel as any)?.subModels?.grid;
    const items = grid?.subModels?.items || [];
    for (const it of items) {
      const saved =
        typeof it?.getStepParams === 'function' ? it.getStepParams('fieldSettings', 'assignValue')?.value : undefined;
      if (typeof saved !== 'undefined') {
        (it as any).assignValue = saved;
      }
    }
    initializedRef.current = true;
  }, [action, blockModel?.collection, formModel]);

  return formModel ? <FlowModelRenderer model={formModel} showFlowSettings={false} /> : null;
}

export class UpdateRecordActionModel extends RecordActionModel<{
  subModels: {
    assignForm: AssignFormModel;
  };
}> {
  assignFormUid?: string;
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

UpdateRecordActionModel.define({
  label: escapeT('Update record'),
  // 使用函数型 createModelOptions，从父级上下文提取资源信息，直接注入到子模型的 resourceSettings.init
  createModelOptions: (ctx) => {
    const dsKey = ctx.collection.dataSourceKey;
    const collName = ctx.collection.name;
    const init = dsKey && collName ? { dataSourceKey: dsKey, collectionName: collName } : undefined;
    return {
      subModels: {
        assignForm: {
          async: true,
          use: 'AssignFormModel',
          stepParams: { resourceSettings: { init } },
        },
      },
    };
  },
});

UpdateRecordActionModel.registerFlow({
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
        const m = ctx.model as UpdateRecordActionModel;
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
        const m = ctx.model as UpdateRecordActionModel;
        let form: AssignFormModel = m?.assignFormUid && ctx.engine.getModel?.(m.assignFormUid);
        if (!form && ctx.engine) {
          form = (await ctx.engine.loadModel({
            uid: m.assignFormUid || undefined,
            parentId: ctx.model.uid,
            subKey: 'assignForm',
          })) as any;
        }
        if (!form) return;
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

UpdateRecordActionModel.registerFlow({
  key: 'apply',
  on: 'click',
  steps: {
    apply: {
      async defaultParams(ctx) {
        const step = ctx.model.getStepParams(SETTINGS_FLOW_KEY, 'assignFieldValues') || {};
        return { assignedValues: step?.assignedValues || {} };
      },
      async handler(ctx, params) {
        const m = ctx.model as UpdateRecordActionModel;
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
