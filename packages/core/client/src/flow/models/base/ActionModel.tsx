/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, FlowModel, escapeT } from '@nocobase/flow-engine';
import { Button } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import React from 'react';
import { Icon } from '../../../icon/Icon';

export class ActionModel extends FlowModel {
  declare props: ButtonProps;

  defaultProps: ButtonProps = {
    type: 'default',
    title: escapeT('Action'),
  };

  enableEditTitle = true;
  enableEditIcon = true;
  enableEditType = true;
  enableEditDanger = true;

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
  steps: {
    general: {
      title: escapeT('General'),
      uiSchema(ctx) {
        return {
          title: ctx.model.enableEditTitle
            ? {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: escapeT('Button title'),
              }
            : undefined,
          icon: ctx.model.enableEditIcon
            ? {
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                title: escapeT('Button icon'),
              }
            : undefined,
          type: ctx.model.enableEditType
            ? {
                'x-decorator': 'FormItem',
                'x-component': 'Radio.Group',
                title: escapeT('Button type'),
                enum: [
                  { value: 'default', label: '{{t("Default")}}' },
                  { value: 'primary', label: '{{t("Primary")}}' },
                  { value: 'dashed', label: '{{t("Dashed")}}' },
                  { value: 'link', label: '{{t("Link")}}' },
                  { value: 'text', label: '{{t("Text")}}' },
                ],
              }
            : undefined,
          danger: ctx.model.enableEditDanger
            ? {
                'x-decorator': 'FormItem',
                'x-component': 'Switch',
                title: escapeT('Danger action'),
              }
            : undefined,
        };
      },
      defaultParams(ctx) {
        return {
          title: ctx.model.defaultProps.title,
          icon: ctx.model.defaultProps.icon,
          type: ctx.model.props.type || ctx.model.defaultProps.type,
        };
      },
      handler(ctx, params) {
        const { title, icon, type, danger } = params;
        ctx.model.setProps({
          title: ctx.t(title),
          icon,
          type: type,
          danger,
          onClick: (event) => {
            ctx.model.dispatchEvent('click', { event });
          },
        });
      },
    },
  },
});

export class CollectionActionModel extends ActionModel {}

export class RecordActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    children: escapeT('Action'),
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
  steps: {
    interaction: {
      handler(ctx, params) {
        const blockModel = ctx.blockModel;
        if (!blockModel) {
          throw new Error('Current block model is not set in context');
        }
        const { record } = ctx;
        if (!record) {
          throw new Error('Current record is not set in context');
        }
        ctx.model.setProps('onClick', (event) => {
          const collection = ctx.collection as Collection;
          ctx.model.dispatchEvent('click', {
            event,
            filterByTk: collection.getFilterByTK(record),
          });
        });
      },
    },
  },
});
