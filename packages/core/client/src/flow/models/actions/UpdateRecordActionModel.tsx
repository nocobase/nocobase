/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd';
import { afterSuccessAction } from '../../actions/afterSuccessAction';
import { refreshOnCompleteAction } from '../../actions/refreshOnCompleteAction';
import { secondaryConfirmationAction } from '../../actions/secondaryConfirmationAction';
import { ActionModel } from '../base/ActionModel';

export class UpdateRecordActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: 'Update record',
  };
}

UpdateRecordActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    secondaryConfirmation: secondaryConfirmationAction,
    update: {
      title: '字段赋值',
      handler: async (ctx, params) => {},
    },
    afterSuccess: afterSuccessAction,
    refresh: refreshOnCompleteAction,
  },
});
