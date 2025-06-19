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
import type { ButtonProps } from 'antd/es/button';
import React from 'react';

export class ActionModel extends FlowModel {
  defaultProps: ButtonProps = {
    type: 'default',
    children: 'Action',
  };
  render() {
    return (
      <Button
        {...this.defaultProps}
        {...this.props}
        onClick={(event) => {
          this.dispatchEvent('click', { event });
        }}
      />
    );
  }
}

ActionModel.registerFlow({
  key: 'default',
  auto: true,
  title: '基础',
  sort: 100,
  steps: {
    step1: {
      title: '编辑按钮',
      uiSchema: {
        children: {
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
          type: 'default',
          ...ctx.model.defaultProps,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.children);
      },
    },
  },
});
