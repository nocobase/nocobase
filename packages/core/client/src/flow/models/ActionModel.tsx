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
  declare props: ButtonProps;

  defaultProps: ButtonProps = {
    type: 'default',
    title: 'Action',
  };

  render() {
    const props = { ...this.defaultProps, ...this.props };

    return <Button {...props}>{props.children || props.title}</Button>;
  }
}

ActionModel.registerFlow({
  key: 'default',
  title: '通用配置',
  auto: true,
  steps: {
    buttonProps: {
      title: '编辑按钮',
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
          title: ctx.model.defaultProps.title,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('onClick', (event) => {
          ctx.model.dispatchEvent('click', {
            ...ctx.extra,
            event,
          });
        });
      },
    },
  },
});
