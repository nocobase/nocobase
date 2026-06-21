/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum } from '@nocobase/client';
import { FlowModelContext } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class TestActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    title: tExpr('Test action'),
  };
}

export class NestedActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  static async defineChildren(ctx: FlowModelContext) {
    return [
      {
        key: 'test1',
        label: 'Test1 Block',
        useModel: 'TestActionModel',
        createModelOptions: {
          props: {},
          stepParams: {
            buttonSettings: {
              general: { children: 'Test1' },
            },
          },
        },
      },
      {
        key: 'test2',
        label: 'Test2 Block',
        useModel: 'TestActionModel',
        createModelOptions: {
          props: {},
          stepParams: {
            buttonSettings: {
              general: { title: 'Test2' },
            },
          },
        },
      },
    ];
  }
}

NestedActionModel.define({
  label: tExpr('Nested action'),
});
