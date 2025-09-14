/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DefaultStructure, FlowModel, escapeT, createSafeWindow, createSafeDocument } from '@nocobase/flow-engine';
import { Button } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import React from 'react';
import { Icon } from '../../../icon/Icon';
import { updateOpenViewStepParams } from '../../flows/openViewFlow';
import { CodeEditor } from '../../components/code-editor';

export class ActionModel<T extends DefaultStructure = DefaultStructure> extends FlowModel<T> {
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
      use: 'actionLinkageRules',
    },
  },
});

export class CollectionActionModel<T extends DefaultStructure = DefaultStructure> extends ActionModel<T> {
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

export class RecordActionModel<T extends DefaultStructure = DefaultStructure> extends ActionModel<T> {
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

JSCollectionActionModel.registerFlow({
  key: 'clickSettings',
  on: 'click',
  title: escapeT('Click settings'),
  steps: {
    runJs: {
      title: escapeT('Write JavaScript'),
      uiSchema: {
        code: {
          type: 'string',
          // 直接使用组件引用，避免依赖全局注册
          'x-component': CodeEditor,
          'x-component-props': {
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
          },
        },
      },
      uiMode: {
        type: 'dialog',
        props: {
          width: '70%',
        },
      },
      defaultParams(ctx) {
        return {
          code: `/**
 * JS Collection Action 示例
 * 可用上下文：
 *  - ctx.collection  当前集合
 *  - ctx.resource    集合资源（可刷新、取选中行等）
 *  - ctx.selectedRows / ctx.selectedRowKeys  已选择的数据
 *  - ctx.message     消息提示（success/warning/error）
 */
const rows = ctx.selectedRows || ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning('请选择数据');
} else {
  ctx.message.success('已选择 ' + rows.length + ' 条');
}
`,
        };
      },
      async handler(ctx, params) {
        const { code = '' } = params || {};
        // 暴露集合级辅助属性（若可获取）
        ctx.defineProperty('selectedRows', {
          get: () => ctx.resource?.getSelectedRows?.() || [],
          cache: false,
        });
        ctx.defineProperty('selectedRowKeys', {
          get: () =>
            (ctx.resource?.getSelectedRows?.() || []).map((row) =>
              ctx.collection ? row[ctx.collection.filterTargetKey] : row?.id,
            ),
          cache: false,
        });
        // 快捷刷新：优先刷新当前区块的资源
        ctx.defineMethod('refresh', async () => {
          if (ctx.blockModel?.resource?.refresh) {
            await ctx.blockModel.resource.refresh();
          } else if (ctx.resource?.refresh) {
            await ctx.resource.refresh();
          }
        });

        await ctx.runjs(code, { window: createSafeWindow(), document: createSafeDocument() });
      },
    },
  },
});

JSRecordActionModel.registerFlow({
  key: 'clickSettings',
  on: 'click',
  title: escapeT('Click settings'),
  steps: {
    runJs: {
      title: escapeT('Write JavaScript'),
      uiSchema: {
        code: {
          type: 'string',
          // 直接使用组件引用，避免依赖全局注册
          'x-component': CodeEditor,
          'x-component-props': {
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
          },
        },
      },
      uiMode: {
        type: 'dialog',
        props: {
          width: '70%',
        },
      },
      defaultParams(ctx) {
        return {
          code: `/**
 * JS Record Action 示例
 * 可用上下文：
 *  - ctx.collection  当前集合
 *  - ctx.record      当前记录
 *  - ctx.filterByTk  当前记录主键
 *  - ctx.resource    集合资源（可刷新）
 *  - ctx.message     消息提示
 */
if (!ctx.record) {
  ctx.message.error('未获取到记录');
} else {
  ctx.message.success('记录ID：' + (ctx.filterByTk ?? ctx.record?.id));
}
`,
        };
      },
      async handler(ctx, params) {
        const { code = '' } = params || {};

        ctx.defineMethod('refresh', async () => {
          if (ctx.blockModel?.resource?.refresh) {
            await ctx.blockModel.resource.refresh();
          } else if (ctx.resource?.refresh) {
            await ctx.resource.refresh();
          }
        });

        await ctx.runjs(code, { window: createSafeWindow(), document: createSafeDocument() });
      },
    },
  },
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
