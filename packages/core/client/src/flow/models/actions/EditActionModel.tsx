/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { RecordActionModel } from '../base/ActionModel';

export class EditActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: escapeT('Edit'),
  };
}

EditActionModel.define({
  label: escapeT('Edit'),
});

EditActionModel.registerFlow({
  key: 'popupSettings',
  title: escapeT('Popup settings'),
  on: 'click',
  steps: {
    openView: {
      use: 'openView',
    },
  },
});
