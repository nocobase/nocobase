/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  tExpr,
  FlowModelRenderer,
  useFlowEngine,
  useFlowSettingsContext,
  SingleRecordResource,
  MultiRecordResource,
  resolveRunJSObjectValues,
} from '@nocobase/flow-engine';
import { Alert, ButtonProps } from 'antd';
import React, { useEffect, useRef } from 'react';
import { AxiosRequestConfig } from 'axios';
import { ActionModel, ActionSceneEnum } from '../base/ActionModel';
import { CollectionActionModel } from '../base/CollectionActionModel';
import { RecordActionModel } from '../base/RecordActionModel';
import { AssignFormModel } from '../blocks/assign-form/AssignFormModel';
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
      formModel.context.defineProperty('record', { get: () => undefined, cache: false });
    }
    initializedRef.current = true;
  }, [action, blockModel?.collection, formModel]);

  return formModel ? <FlowModelRenderer model={formModel} showFlowSettings={false} /> : null;
}

function Info() {
  const ctx = useFlowSettingsContext();
  return (
    <Alert
      type="info"
      showIcon
      message={ctx.t(
        'After clicking the custom button, the following fields of the current record will be saved according to the following form.',
      )}
    />
  );
}

export class UpdateRecordActionModel extends ActionModel<{
  subModels: {
    assignForm: AssignFormModel;
  };
}> {
  static scene = ActionSceneEnum.record;

  assignFormUid?: string;

  defaultProps: ButtonProps = {
    title: tExpr('Update record'),
    type: 'link',
    icon: 'EditOutlined',
  };

  getAclActionName() {
    return 'update';
  }

  /**
   * 简化设置保存请求配置的方式
   * @param requestConfig
   */
  setSaveRequestConfig(requestConfig?: AxiosRequestConfig) {
    this.setStepParams('apply', 'apply', {
      requestConfig,
    });
  }
}

UpdateRecordActionModel.define({
  label: tExpr('Update record'),
  sort: 50,
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
  title: tExpr('Action settings'),
  // 配置流仅用于收集参数，避免作为自动流程执行
  manual: true,
  steps: {
    // 二次确认：复用全局 confirm action，支持开关、标题、内容（含变量选择）
    confirm: {
      title: tExpr('Secondary confirmation'),
      use: 'confirm',
      defaultParams: {
        enable: false,
        title: tExpr('Perform the Update record'),
        content: tExpr('Are you sure you want to perform the Update record action?'),
      },
    },
    assignFieldValues: {
      title: tExpr('Field values'),
      uiSchema() {
        return {
          tip: {
            'x-decorator': 'FormItem',
            'x-component': () => <Info />,
          },
          editor: {
            'x-decorator': 'FormItem',
            'x-component': () => <AssignFieldsEditor />,
          },
        };
      },
      async beforeParamsSave(ctx) {
        const m = ctx.model as UpdateRecordActionModel;
        // 跨视图栈按 uid 定位到设置面板中的真实 AssignForm 实例
        const form: AssignFormModel = m?.assignFormUid && ctx.engine.getModel?.(m.assignFormUid, true);
        if (!form) return;
        const assignedValues = form?.getAssignedValues?.() || {};
        const grid = form?.subModels?.grid;
        const items = grid?.subModels?.items || [];
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
        // 统一接入二次确认：如果启用则弹窗；未配置时默认不启用
        const savedConfirm = ctx.model.getStepParams(SETTINGS_FLOW_KEY, 'confirm');
        const confirmParams = savedConfirm && typeof savedConfirm === 'object' ? savedConfirm : { enable: false };
        await ctx.runAction('confirm', confirmParams);

        let assignedValues: Record<string, any> = {};
        try {
          assignedValues = await resolveRunJSObjectValues(ctx, params?.assignedValues);
        } catch (error) {
          console.error('[UpdateRecordAction] RunJS execution failed', error);
          ctx.message.error(ctx.t('RunJS execution failed'));
          return;
        }

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
        if (ctx.resource instanceof SingleRecordResource) {
          await ctx.resource.save(assignedValues, params.requestConfig);
        } else if (ctx.resource instanceof MultiRecordResource) {
          await ctx.resource.update(filterByTk, assignedValues, params.requestConfig);
        }
        ctx.message.success(ctx.t('Saved successfully'));
      },
    },
  },
});
