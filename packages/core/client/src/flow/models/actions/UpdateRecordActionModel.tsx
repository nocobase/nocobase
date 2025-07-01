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
import { RecordActionModel } from '../base/ActionModel';
import { tval } from '@nocobase/utils/client';

export class UpdateRecordActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: tval('Update record'),
  };
}

UpdateRecordActionModel.define({
  title: tval('Update record action'),
  hide: true,
});

UpdateRecordActionModel.registerFlow({
  key: 'handleClick',
  title: tval('Click event'),
  on: {
    eventName: 'click',
  },
  steps: {
    secondaryConfirmation: secondaryConfirmationAction,
    update: {
      title: tval('Assign field values'),
      handler: async (ctx, params) => {},
    },
    afterSuccess: afterSuccessAction,
    refresh: refreshOnCompleteAction,
  },
});
