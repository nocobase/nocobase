/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, useFlowSettingsContext } from '@nocobase/flow-engine';
import { Alert, ButtonProps } from 'antd';
import React from 'react';
import { AxiosRequestConfig } from 'axios';
import { ActionModel, ActionSceneEnum } from '../base/ActionModel';
import { AssignFormModel } from '../blocks/assign-form/AssignFormModel';
import {
  createAssignFieldValuesStep,
  createAssignFormSubModelOptions,
  getAssignFieldValuesDefaultParams,
} from '../blocks/assign-form/assignFieldValuesFlow';
import { applyUpdateRecordAction } from './UpdateRecordActionUtils';
// import { RemoteFlowModelRenderer } from '../../FlowPage';

const SETTINGS_FLOW_KEY = 'assignSettings';

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
    return {
      subModels: {
        assignForm: createAssignFormSubModelOptions(ctx),
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
    assignFieldValues: createAssignFieldValuesStep({
      settingsFlowKey: SETTINGS_FLOW_KEY,
      title: tExpr('Field values'),
      tipComponent: Info,
      validateBeforeSave: true,
    }),
  },
});

UpdateRecordActionModel.registerFlow({
  key: 'apply',
  on: 'click',
  steps: {
    apply: {
      async defaultParams(ctx) {
        return getAssignFieldValuesDefaultParams(ctx, SETTINGS_FLOW_KEY);
      },
      async handler(ctx, params) {
        await applyUpdateRecordAction(ctx, params, { settingsFlowKey: SETTINGS_FLOW_KEY });
      },
    },
  },
});
