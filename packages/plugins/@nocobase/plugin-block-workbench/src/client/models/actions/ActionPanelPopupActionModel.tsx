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
import { openViewFlow } from '@nocobase/client';
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
      use: 'addAction',
      title: escapeT('Popup'),
      preset: true,
      hideInSettings: true,
    },
  },
});

ActionPanelPopupActionModel.registerFlow(openViewFlow);
