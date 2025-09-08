/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, escapeT } from '@nocobase/flow-engine';
import { Button } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import React from 'react';
import { Icon } from '../../../icon/Icon';
import { updateOpenViewStepParams } from '../../flows/openViewFlow';

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

  onClick(event) {
    this.dispatchEvent('click', { event });
  }

  render() {
    const props = this.props;
    const icon = props.icon ? <Icon type={props.icon as any} /> : undefined;
    // const linkStyle = props.type === 'link' ? { paddingLeft: 0, paddingRight: 0 } : {};

    return (
      <Button
        {...props}
        onClick={this.onClick.bind(this)}
        icon={icon}
        // style={{
        //   // ...linkStyle,
        //   ...props.style,
        // }}
      >
        {props.children || props.title}
      </Button>
    );
  }

  // 设置态隐藏时的占位渲染（与真实按钮外观一致，去除 onClick 并降低透明度）
  protected renderHiddenInConfig(): React.ReactNode | undefined {
    const merged: ButtonProps = this.props;
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
        return ctx.model.defaultProps;
      },
      handler(ctx, params) {
        const { title, ...rest } = params;
        ctx.model.setProps({
          title: ctx.t(title),
          ...rest,
        });
      },
    },
    linkageRules: {
      uiMode: {
        type: 'dialog',
        props: {
          width: 900,
        },
      },
      use: 'linkageRules',
      defaultParams: {
        supportedActions: ['setButtonProps', 'runjs'],
      },
    },
  },
});

export class CollectionActionModel extends ActionModel {
  onInit(options) {
    super.onInit(options);
    updateOpenViewStepParams(
      {
        collectionName: this.context.collection?.name,
        associationName: this.context.association?.resourceName,
        dataSourceKey: this.context.collection?.dataSourceKey,
      },
      this,
    );
  }

  onClick(event) {
    if (!this.context.resource) {
      this.context.message.error(escapeT('Resource is required to perform this action'));
      return;
    }
    this.dispatchEvent('click', {
      event,
      sourceId: this.context.resource?.getSourceId(),
    });
  }
}

export class RecordActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    children: escapeT('Action'),
  };

  onInit(options) {
    super.onInit(options);
    updateOpenViewStepParams(
      {
        collectionName: this.context.collection?.name,
        associationName: this.context.association?.resourceName,
        dataSourceKey: this.context.collection?.dataSourceKey,
      },
      this,
    );
  }

  onClick(event) {
    if (!this.context.record) {
      this.context.message.error(escapeT('Record is required to perform this action'));
      return;
    }
    if (!this.context.collection) {
      this.context.message.error(escapeT('Collection is required to perform this action'));
      return;
    }
    if (!this.context.resource) {
      this.context.message.error(escapeT('Resource is required to perform this action'));
      return;
    }
    this.dispatchEvent('click', {
      event,
      sourceId: this.context.resource.getSourceId(),
      filterByTk: this.context.collection.getFilterByTK(this.context.record),
    });
  }
}

export class JSCollectionActionModel extends CollectionActionModel {}

JSCollectionActionModel.define({
  label: escapeT('JS action'),
  sort: 9999,
});

export class JSRecordActionModel extends RecordActionModel {}

JSRecordActionModel.define({
  label: escapeT('JS action'),
  sort: 9999,
});

CollectionActionModel.registerFlow({
  key: 'acl',
  steps: {
    aclCheck: {
      use: 'aclCheck',
    },
  },
});

RecordActionModel.registerFlow({
  key: 'acl',
  steps: {
    aclCheck: {
      use: 'aclCheck',
    },
  },
});
