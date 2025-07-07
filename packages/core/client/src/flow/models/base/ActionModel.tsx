/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, escapeT } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Button } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import React from 'react';
import { Icon } from '../../../icon/Icon';
import IconPicker from '../../../schema-component/antd/icon-picker/IconPicker';

export class ActionModel extends FlowModel {
  declare props: ButtonProps;

  defaultProps: ButtonProps = {
    type: 'default',
    title: escapeT('Action'),
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
  key: 'buttonSettings',
  title: escapeT('Button settings'),
  auto: true,
  steps: {
    buttonProps: {
      title: escapeT('Edit button'),
      uiSchema: {
        title: {
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: escapeT('Button title'),
        },
        icon: {
          'x-decorator': 'FormItem',
          'x-component': IconPicker,
          title: escapeT('Button icon'),
        },
        type: {
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          title: escapeT('Button background color'),
          enum: [
            { value: 'default', label: '{{t("Default")}}' },
            { value: 'primary', label: '{{t("Highlight")}}' },
            { value: 'danger', label: '{{t("Danger red")}}' },
          ],
          'x-reactions': [
            (field) => {
              field.hidden = field.value === 'link';
            },
          ],
        },
      },
      defaultParams(ctx) {
        return {
          title: ctx.model.defaultProps.title,
          icon: ctx.model.defaultProps.icon,
          type: ctx.model.props.type || ctx.model.defaultProps.type,
        };
      },
      handler(ctx, params) {
        const { title, icon, type } = params;
        ctx.model.setProps({
          title: ctx.t(title),
          icon,
          type: type === 'danger' ? 'primary' : type,
          danger: type === 'danger',
          onClick: (event) => {
            ctx.model.dispatchEvent('click', { event });
          },
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
    const isLink = props.type === 'link';
    const icon = props.icon ? <Icon type={props.icon as any} /> : undefined;
    return (
      <Button style={isLink ? { padding: 0, height: 'auto' } : undefined} {...props} icon={icon}>
        {props.children || props.title}
      </Button>
    );
  }
}

RecordActionModel.registerFlow({
  key: 'recordActionSettings',
  auto: true,
  steps: {
    buttonProps: {
      handler(ctx, params) {
        const { currentRecord, currentBlockModel } = ctx.shared;
        if (!currentRecord) {
          throw new Error('Current record is not set in shared context');
        }
        if (!currentBlockModel) {
          throw new Error('Current block model is not set in shared context');
        }
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
