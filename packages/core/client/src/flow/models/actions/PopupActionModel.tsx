/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import { openModeAction } from '../../actions/openModeAction';
import { ActionModel } from '../base/ActionModel';

export class PopupActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: 'Popup',
  };
}

PopupActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    open: openModeAction,
  },
});
