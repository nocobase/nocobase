/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LockOutlined } from '@ant-design/icons';
import { DefaultStructure, FlowModel, escapeT } from '@nocobase/flow-engine';
import { Button, Tooltip } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import _ from 'lodash';
import React from 'react';
import { Icon } from '../../../icon/Icon';
import condition from 'packages/plugins/@nocobase/plugin-workflow/src/client/nodes/condition';
import { commonConditionHandler, ConditionBuilder } from '../../components/ConditionBuilder';

export type ActionSceneType = 'collection' | 'record' | ActionSceneType[];

export const ActionSceneEnum = {
  collection: 'collection' as ActionSceneType,
  record: 'record' as ActionSceneType,
  all: ['collection', 'record'] as ActionSceneType,
  both: ['collection', 'record'] as ActionSceneType,
};

export class ActionModel<T extends DefaultStructure = DefaultStructure> extends FlowModel<T> {
  declare props: ButtonProps;
  declare scene: ActionSceneType;

  defaultProps: ButtonProps = {
    type: 'default',
    title: escapeT('Action'),
  };

  enableEditTitle = true;
  enableEditIcon = true;
  enableEditType = true;
  enableEditDanger = true;

  static _getScene() {
    return _.castArray(this['scene'] || []);
  }

  static _isScene(scene: ActionSceneType) {
    const scenes = this._getScene();
    return scenes.includes(scene);
  }

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

  getInputArgs() {
    const inputArgs = {};
    if (this.context.resource) {
      const sourceId = this.context.resource.getSourceId();
      if (sourceId) {
        inputArgs['sourceId'] = sourceId;
      }
    }
    if (this.context.collection && this.context.record) {
      const filterByTk = this.context.collection.getFilterByTK(this.context.record);
      if (filterByTk) {
        inputArgs['filterByTk'] = filterByTk;
      }
    }
    return inputArgs;
  }

  onClick(event) {
    this.dispatchEvent('click', {
      event,
      ...this.getInputArgs(),
    });
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
    return (
      <Tooltip title={this.context.t('当前按钮已被隐藏，你无法点击（该内容仅在激活 UI Editor 时显示）。')}>
        <Button type={this.props.type} disabled icon={<LockOutlined />} />
      </Tooltip>
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
    aclCheck: {
      use: 'aclCheck',
    },
    linkageRules: {
      use: 'actionLinkageRules',
    },
  },
});

ActionModel.registerEvents({
  click: {
    title: escapeT('Click'),
    name: 'click',
    uiSchema: { condition: { type: 'object', 'x-component': ConditionBuilder } },
    handler: commonConditionHandler,
  },
});
