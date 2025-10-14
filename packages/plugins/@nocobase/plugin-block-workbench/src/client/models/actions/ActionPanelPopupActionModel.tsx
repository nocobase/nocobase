/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { ActionSceneEnum, PopupActionModel, ColorPicker, Icon, openViewFlow } from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { Avatar } from 'antd';
import React from 'react';
import { css } from '@emotion/css';
import { ActionPanelActionModel } from './ActionPanelActionModel';

export class ActionPanelPopupActionModel extends ActionPanelActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Popup'),
  };
}

ActionPanelPopupActionModel.define({
  label: escapeT('Popup'),
});

ActionPanelPopupActionModel.registerFlow({
  key: 'actionPanelPopupSetting',
  title: escapeT('Popup action settings'),
  steps: {
    init: {
      title: escapeT('Add action'),
      preset: true,
      hideInSettings: true,
      uiSchema(ctx) {
        const t = ctx.t;
        return {
          title: {
            title: t('Title'),
            required: true,
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
          icon: {
            title: t('Icon'),
            required: true,
            'x-component': 'IconPicker',
            'x-decorator': 'FormItem',
          },
          iconColor: {
            title: t('Color'),
            required: true,
            default: '#1677FF',
            'x-component': ColorPicker,
            'x-decorator': 'FormItem',
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          title: params.title,
          icon: params.icon,
          iconColor: params.iconColor,
        });
      },
    },
  },
});

ActionPanelPopupActionModel.registerFlow(openViewFlow);
