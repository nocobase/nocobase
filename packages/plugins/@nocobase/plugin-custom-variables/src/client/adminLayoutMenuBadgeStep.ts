/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React from 'react';
import { AdminLayoutMenuItemModel, VariableScope } from '@nocobase/client';
import type { FlowSettingsContext } from '@nocobase/flow-engine';
import { NAMESPACE } from '../locale';
import { BadgeVariableTextArea, getBadgeFieldsSchema, mergeBadgeIntoRouteOptions } from './EditBadge';

type Translate = (key: string, options?: Record<string, any>) => string;

type AdminLayoutMenuItemModelLike = {
  globalFlowRegistry?: {
    getFlow: (flowKey: string) => any;
  };
};

const FlowBadgeVariableTextArea = (props) => {
  const route = props?.field?.form?.values?.__menuRoute || props?.menuRoute;
  const scopeId = route?.schemaUid;

  if (!scopeId) {
    return React.createElement(BadgeVariableTextArea, props);
  }

  return React.createElement(
    VariableScope,
    { scopeId, type: route?.type === 'group' ? 'groupItem' : 'menuItem' },
    React.createElement(BadgeVariableTextArea, props),
  );
};

FlowBadgeVariableTextArea.displayName = 'FlowBadgeVariableTextArea';

export const registerAdminLayoutMenuBadgeStep = (
  translate: Translate = (key) => key,
  menuItemModel: AdminLayoutMenuItemModelLike | undefined = AdminLayoutMenuItemModel,
) => {
  const menuSettingsFlow = menuItemModel?.globalFlowRegistry?.getFlow('menuSettings');
  if (!menuSettingsFlow) {
    return;
  }

  menuSettingsFlow.addStep('badge', {
    title: translate('Edit badge', { ns: NAMESPACE }),
    defaultParams: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) => ctx.model.getRoute()?.options?.badge,
    uiSchema: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) => {
      const schema = getBadgeFieldsSchema(
        (key, options) => ctx.t(key, { ns: NAMESPACE, ...(options || {}) }),
        FlowBadgeVariableTextArea,
      );

      schema.count['x-component-props'] = {
        ...(schema.count['x-component-props'] || {}),
        menuRoute: ctx.model.getRoute(),
      };

      return schema;
    },
    beforeParamsSave: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>, params) => {
      await ctx.model.updateMenuRoute({
        options: mergeBadgeIntoRouteOptions(ctx.model.getRoute()?.options, params),
      });
    },
  });

  // 重复注册时继续覆盖同 key，并把顺序稳定放回 insertBefore 前。
  if (menuSettingsFlow.hasStep('insertBefore')) {
    menuSettingsFlow.moveStep('badge', 'insertBefore');
  }
};
