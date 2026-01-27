/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  ActionModel,
  ActionSceneEnum,
  CollectionActionGroupModel,
  FormActionGroupModel,
  RecordActionGroupModel,
} from '@nocobase/client';
import { FlowModelContext, escapeT } from '@nocobase/flow-engine';
import { isHide } from '../../built-in/utils';
import { AIEmployee } from '../../types';
import { AIEmployeeListItem } from '../../AIEmployeeListItem';
import { AIEmployeeShortcutModel } from './AIEmployeeShortcutModel';

export class AIEmployeeButtonModel extends AIEmployeeShortcutModel {
  constructor(options: any) {
    super(options);
    this.props = {
      ...this.props,
      style: {
        size: 40,
        mask: false,
      },
    };
  }
}

export class AIEmployeeActionModel extends ActionModel {
  static scene = ActionSceneEnum.all;

  static async defineChildren(ctx: FlowModelContext) {
    const { aiEmployees } = ctx.aiEmployeesData;

    return aiEmployees
      ?.filter((aiEmployee: AIEmployee) => !isHide(aiEmployee))
      .map((aiEmployee: AIEmployee) => ({
        key: aiEmployee.username,
        label: <AIEmployeeListItem aiEmployee={aiEmployee} />,
        createModelOptions: {
          use: 'AIEmployeeButtonModel',
          props: {
            aiEmployee: {
              username: aiEmployee.username,
            },
            context: {
              workContext: [{ type: 'flow-model', uid: ctx.model.uid }],
            },
            auto: false,
          },
        },
      }));
  }
}

AIEmployeeActionModel.define({
  label: escapeT('AI employees'),
  sort: 8000,
});

CollectionActionGroupModel.registerActionModels({
  AIEmployeeActionModel,
});

RecordActionGroupModel.registerActionModels({
  AIEmployeeActionModel,
});

FormActionGroupModel.registerActionModels({
  AIEmployeeActionModel,
});
