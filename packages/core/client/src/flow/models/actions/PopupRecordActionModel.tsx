/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import { tval } from '@nocobase/utils/client';
import { openModeAction } from '../../actions/openModeAction';
import { RecordActionModel } from '../base/ActionModel';

export class PopupRecordActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    title: tval('Popup'),
  };
}

PopupRecordActionModel.define({
  title: tval('Popup'),
});

PopupRecordActionModel.registerFlow({
  key: 'handleClick',
  title: tval('Click event'),
  on: {
    eventName: 'click',
  },
  steps: {
    popup: {
      use: 'openView',
      defaultParams(ctx) {
        return {};
      },
    },
  },
});
