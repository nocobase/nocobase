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

  getAclActionName() {
    return 'view';
  }

  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('actionName', {
      get: () => {
        return this.getAclActionName();
      },
      cache: false,
    });
  }

  render() {
    const props = { ...this.defaultProps, ...this.props };
    const icon = props.icon ? <Icon type={props.icon as any} /> : undefined;
    const linkStyle = props.type === 'link' ? { paddingLeft: 0, paddingRight: 0 } : {};
    const handleClick = (e) => {
      if (props.onClick) {
        props.onClick(e);
      }
    };

    return (
      <Button
        {...props}
        onClick={handleClick}
        icon={icon}
        style={{
          ...linkStyle,
          ...props.style,
        }}
      >
        {props.children || props.title}
      </Button>
    );
  }

  // 设置态隐藏时的占位渲染（与真实按钮外观一致，去除 onClick 并降低透明度）
  protected renderHiddenInConfig(): React.ReactNode | undefined {
    const merged: ButtonProps = { ...this.defaultProps, ...(this.props || {}) };
    const { onClick, style, icon, type, children, title, ...rest } = merged;
    const btnStyle: React.CSSProperties = {
      ...(style || {}),
      opacity: 0.5,
      cursor: 'default',
    };
    const iconNode = icon ? typeof icon === 'string' ? <Icon type={icon} /> : icon : undefined;
    const isLink = type === 'link';
    const linkStyle = isLink ? { padding: 0, height: 'auto' } : undefined;
    return (
      <Button {...rest} type={type} icon={iconNode} style={{ ...linkStyle, ...btnStyle }}>
        {children || title}
      </Button>
    );
  }
}

ActionModel.registerFlow({
  key: 'buttonSettings',
  title: escapeT('Button settings'),
  sort: -999,
  steps: {
    general: {
      title: escapeT('Edit button'),
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
            console.log('Action: ctx.inputArgs', {
              event,
            });
            ctx.model.dispatchEvent('click', { event });
          },
        });
      },
    },
    aclCheck: {
      use: 'aclCheck',
    },
  },
});

export class CollectionActionModel extends ActionModel {
  onInit(options) {
    super.onInit(options);
    console.log('CollectionActionModel:', this.context.collection, this.context.association);
  }
}

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
      <Button
        {...props}
        icon={icon}
        style={{
          ...(isLink ? { padding: 0, height: 'auto' } : {}),
          ...props.style,
        }}
      >
        {props.children || props.title}
      </Button>
    );
  }

  // 设置态隐藏时的占位渲染（行内样式，去除 onClick 并降低透明度）
  protected renderHiddenInConfig(): React.ReactNode | undefined {
    const merged: ButtonProps = { ...this.defaultProps, ...(this.props || {}) };
    const { onClick, style, icon, type, children, title, ...rest } = merged;
    const iconNode = icon ? typeof icon === 'string' ? <Icon type={icon} /> : icon : undefined;
    const isLink = (type ?? 'link') === 'link';
    const btnStyle: React.CSSProperties = {
      ...(style || {}),
      opacity: 0.5,
      cursor: 'default',
    };
    const linkStyle = isLink ? { padding: 0, height: 'auto' } : undefined;
    return (
      <Button {...rest} type={type} icon={iconNode} style={{ ...linkStyle, ...btnStyle }}>
        {children || title}
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
          ctx.exit();
        }
        ctx.model.setProps('onClick', (event) => {
          const collection = ctx.collection as Collection;
          console.log('RecordAction: ctx.inputArgs', {
            event,
            filterByTk: collection.getFilterByTK(record),
          });
          ctx.model.dispatchEvent('click', {
            event,
            filterByTk: collection.getFilterByTK(record),
          });
        });
      },
    },
  },
});

//
