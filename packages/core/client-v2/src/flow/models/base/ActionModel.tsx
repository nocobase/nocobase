/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DefaultStructure, FlowModel, tExpr, useFlowModel } from '@nocobase/flow-engine';
import { ColorPicker, Icon } from '../../../flow-compat';
import { Button, Tooltip } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { commonConditionHandler, ConditionBuilder } from '../../components/ConditionBuilder';
export { ActionModel, ActionSceneEnum, ActionWithoutPermission, type ActionSceneType } from './ActionModelCore';
import { ActionModel } from './ActionModelCore';

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
