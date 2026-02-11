/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DefaultStructure, FlowModel, tExpr, useFlowModel } from '@nocobase/flow-engine';
import { Button, Tooltip } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { Icon } from '../../../icon/Icon';
import { ColorPicker } from '../../../schema-component/antd/color-picker';
import { commonConditionHandler, ConditionBuilder } from '../../components/ConditionBuilder';

export function ActionWithoutPermission(props) {
  const { t } = useTranslation();
  const model: any = useFlowModel();
  const blockModel = model.context.blockModel;
  const collection = props.collection || blockModel.collection;
  const dataSource = collection.dataSource;
  const nameValue = useMemo(() => {
    const dataSourcePrefix = `${t(dataSource.displayName || dataSource.key)} > `;
    const collectionPrefix = collection ? `${t(collection.title) || collection.name || collection.tableName} ` : '';
    return `${dataSourcePrefix}${collectionPrefix}`;
  }, []);
  const { actionName } = props?.forbidden || model.forbidden;
  const messageValue = useMemo(() => {
    return t(
      `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for collection "{{name}}"`,
      {
        name: nameValue,
        actionName: t(_.capitalize(actionName)),
      },
    ).replaceAll('&gt;', '>');
  }, [actionName, nameValue, t]);

  return <Tooltip title={props.message || messageValue}>{props.children}</Tooltip>;
}

export type ActionSceneType = 'collection' | 'record' | ActionSceneType[];

export const ActionSceneEnum = {
  collection: 'collection' as ActionSceneType,
  record: 'record' as ActionSceneType,
  all: ['collection', 'record'] as ActionSceneType,
  both: ['collection', 'record'] as ActionSceneType,
};

export class ActionModel<T extends DefaultStructure = DefaultStructure> extends FlowModel<T> {
  declare props: ButtonProps & { tooltip?: string };
  declare scene: ActionSceneType;

  defaultProps: ButtonProps & { tooltip?: string } = {
    type: 'default',
    title: tExpr('Action'),
  };

  enableEditTooltip = true;
  enableEditTitle = true;
  enableEditIcon = true;
  enableEditType = true;
  enableEditDanger = true;
  enableEditColor = false;

  static _getScene() {
    return _.castArray(this['scene'] || []);
  }

  static _isScene(scene: ActionSceneType) {
    const scenes = this._getScene();
    return scenes.includes(scene);
  }

  getAclActionName() {
    return null;
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
    const inputArgs: Record<string, any> = {};
    const defaultKeys: string[] = [];
    if (this.context.resource) {
      const sourceId = this.context.resource.getSourceId();
      if (sourceId) {
        inputArgs['sourceId'] = sourceId;
        defaultKeys.push('sourceId');
      }
    }
    if (this.context.collection && this.context.record) {
      const filterByTk = this.context.collection.getFilterByTK(this.context.record);
      if (filterByTk) {
        inputArgs['filterByTk'] = filterByTk;
        defaultKeys.push('filterByTk');
      }
    }
    if (defaultKeys.length) {
      // 标记哪些字段是自动推断出来的默认值，openView 会用它来区分“显式传入”与“默认值”
      inputArgs['defaultInputKeys'] = defaultKeys;
    }
    return inputArgs;
  }

  onClick(event) {
    this.dispatchEvent(
      'click',
      {
        event,
        ...this.getInputArgs(),
      },
      {
        debounce: true,
      },
    );
  }

  getTitle() {
    return this.props.title;
  }

  getIcon() {
    return this.props.icon;
  }

  renderButton() {
    const props = this.props;
    const icon = this.getIcon() ? <Icon type={this.getIcon() as any} /> : undefined;

    return (
      <Button {...props} onClick={this.onClick.bind(this)} icon={icon}>
        {props.children || this.getTitle()}
      </Button>
    );
  }

  render() {
    if (this.props.tooltip) {
      return <Tooltip title={this.props.tooltip}>{this.renderButton()}</Tooltip>;
    }

    return this.renderButton();
  }

  // 设置态隐藏时的占位渲染（与真实按钮外观一致，去除 onClick 并降低透明度）
  renderHiddenInConfig(): React.ReactNode | undefined {
    const props = this.props;
    const icon = this.getIcon() ? <Icon type={this.getIcon() as any} /> : undefined;
    if (this.forbidden) {
      return (
        <ActionWithoutPermission>
          <Button {...props} onClick={this.onClick.bind(this)} icon={icon} style={{ opacity: '0.3' }}>
            {props.children || this.getTitle()}
          </Button>
        </ActionWithoutPermission>
      );
    }
    return (
      <Tooltip title={this.context.t('The button is hidden and only visible when the UI Editor is active')}>
        <Button {...props} onClick={this.onClick.bind(this)} icon={icon} style={{ opacity: '0.3' }}>
          {props.children || this.getTitle()}
        </Button>
      </Tooltip>
    );
  }
}

ActionModel.registerFlow({
  key: 'buttonSettings',
  title: tExpr('Button settings'),
  sort: -999,
  steps: {
    general: {
      title: tExpr('Edit button'),
      uiSchema(ctx) {
        return {
          title: ctx.model.enableEditTitle
            ? {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: tExpr('Button title'),
              }
            : undefined,
          tooltip: ctx.model.enableEditTooltip
            ? {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: tExpr('Button tooltip'),
              }
            : undefined,
          icon: ctx.model.enableEditIcon
            ? {
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                title: tExpr('Button icon'),
              }
            : undefined,
          type: ctx.model.enableEditType
            ? {
                'x-decorator': 'FormItem',
                'x-component': 'Radio.Group',
                title: tExpr('Button type'),
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
                title: tExpr('Danger action'),
              }
            : undefined,
          color: ctx.model.enableEditColor
            ? {
                'x-decorator': 'FormItem',
                'x-component': ColorPicker,
                title: tExpr('Color'),
              }
            : undefined,
        };
      },
      defaultParams(ctx) {
        return ctx.model.defaultProps;
      },
      handler(ctx, params) {
        const { title, tooltip, ...rest } = params;
        ctx.model.setProps({
          title: ctx.t(title, { ns: 'lm-flow-engine' }),
          tooltip: ctx.t(tooltip, { ns: 'lm-flow-engine' }),
          ...rest,
        });
      },
    },
    linkageRules: {
      use: 'actionLinkageRules',
    },
  },
});

ActionModel.registerFlow({
  key: 'buttonAclSettings',
  steps: {
    aclCheck: {
      use: 'aclCheck',
    },
  },
});

// 分页切换后需要重新计算 ACL 与联动规则（fork 复用时尤其重要）
ActionModel.registerFlow({
  key: 'paginationChange',
  on: 'paginationChange',
  steps: {
    aclCheckRefresh: {
      use: 'aclCheckRefresh',
    },
    linkageRulesRefresh: {
      use: 'linkageRulesRefresh',
      defaultParams: {
        actionName: 'actionLinkageRules',
        flowKey: 'buttonSettings',
        stepKey: 'linkageRules',
      },
    },
  },
});

ActionModel.registerEvents({
  click: {
    title: tExpr('Click'),
    name: 'click',
    uiSchema: {
      condition: {
        type: 'object',
        title: tExpr('Trigger condition'),
        'x-decorator': 'FormItem',
        'x-component': ConditionBuilder,
      },
    },
    handler: commonConditionHandler,
  },
});
