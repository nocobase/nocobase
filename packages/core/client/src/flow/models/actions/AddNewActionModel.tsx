/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ButtonProps } from 'antd';
import { GlobalActionModel } from '../base/ActionModel';
import { openModeAction } from '../../actions/openModeAction';

export class AddNewActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    type: 'primary',
    children: 'Add new',
  };
}

AddNewActionModel.registerFlow({
  sort: 200,
  title: '点击事件',
  key: 'handleClick',
  on: {
    eventName: 'click',
  },
  steps: {
    open: openModeAction,
  },
});
