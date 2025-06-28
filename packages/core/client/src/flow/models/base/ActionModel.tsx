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
import { tval } from '@nocobase/utils/client';
import type { ButtonProps } from 'antd/es/button';
import React from 'react';
import { Icon } from '../../../icon/Icon';
import IconPicker from '../../../schema-component/antd/icon-picker/IconPicker';

export class ActionModel extends FlowModel {
  declare props: ButtonProps;

  defaultProps: ButtonProps = {
    type: 'default',
    title: tval('Action'),
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
  title: tval('General configuration'),
  auto: true,
  steps: {
    buttonProps: {
      title: tval('Edit button'),
      uiSchema: {
        title: {
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: tval('Button title'),
        },
        icon: {
          'x-decorator': 'FormItem',
          'x-component': IconPicker,
          title: tval('Button icon'),
        },
      },
      defaultParams(ctx) {
        return {
          title: ctx.model.defaultProps.title,
          icon: ctx.model.defaultProps.icon,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('title', ctx.globals.flowEngine.translate(params.title));
        ctx.model.setProps('icon', params.icon);
        ctx.model.setProps('onClick', (event) => {
          ctx.model.dispatchEvent('click', {
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
    children: tval('Action'),
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

RecordActionModel.registerFlow({
  key: 'default',
  title: tval('General configuration'),
  auto: true,
  steps: {
    buttonProps: {
      title: tval('Edit button'),
      uiSchema: {
        title: {
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: tval('Button title'),
        },
        icon: {
          'x-decorator': 'FormItem',
          'x-component': IconPicker,
          title: tval('Button icon'),
        },
      },
      defaultParams(ctx) {
        return {
          title: ctx.model.defaultProps.title,
          icon: ctx.model.defaultProps.icon,
        };
      },
      handler(ctx, params) {
        const { currentRecord, currentBlockModel } = ctx.shared;
        if (!currentRecord) {
          throw new Error('Current record is not set in shared context');
        }
        if (!currentBlockModel) {
          throw new Error('Current block model is not set in shared context');
        }
        ctx.model.setProps('title', ctx.globals.flowEngine.translate(params.title));
        ctx.model.setProps('icon', params.icon);
        ctx.model.setProps('onClick', (event) => {
          ctx.model.dispatchEvent('click', {
            event,
            filterByTk: currentRecord[currentBlockModel.collection.filterTargetKey],
          });
        });
      },
    },
  },
});
