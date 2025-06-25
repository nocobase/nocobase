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
import { Icon } from '../../../icon/Icon';
import IconPicker from '../../../schema-component/antd/icon-picker/IconPicker';

export class ActionModel extends FlowModel {
  declare props: ButtonProps;

  defaultProps: ButtonProps = {
    type: 'default',
    title: 'Action',
  };

  render() {
    const props = { ...this.defaultProps, ...this.props };
    const icon = props.icon ? <Icon type={props.icon as any} /> : undefined;
    const linkStyle = props.type === 'link' ? { paddingLeft: 0, paddingRight: 0 } : {};

    return (
      <Button {...props} icon={icon} style={{ ...linkStyle, ...props.style }}>
        {props.children || props.title}
      </Button>
    );
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
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'Button title',
        },
        icon: {
          'x-decorator': 'FormItem',
          'x-component': IconPicker,
          title: 'Button icon',
        },
      },
      defaultParams(ctx) {
        return {
          title: ctx.model.defaultProps.title,
          icon: ctx.model.defaultProps.icon,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('title', params.title);
        ctx.model.setProps('icon', params.icon);
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

export class GlobalActionModel extends ActionModel {}

export class RecordActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    children: 'Action',
  };

  render() {
    const props = { ...this.defaultProps, ...this.props };
    const icon = props.icon ? <Icon type={props.icon as any} /> : undefined;

    return (
      <Button style={{ padding: 0, height: 'auto' }} {...props} icon={icon}>
        {props.children || props.title}
      </Button>
    );
  }
}
