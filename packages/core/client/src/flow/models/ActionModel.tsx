/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { Button } from 'antd';
import type { ButtonType } from 'antd/es/button';
import React from 'react';

export class ActionModel extends FlowModel {
  title = 'Action';

  type: ButtonType = 'default';

  render() {
    return (
      <Button type={this.type} {...this.props} onClick={() => this.dispatchEvent('click')}>
        {this.props.children || this.title}
      </Button>
    );
  }
}

ActionModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      uiSchema: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: '请输入标题',
          },
        },
      },
      defaultParams(ctx) {
        return {
          title: ctx.model.title,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
      },
    },
  },
});
