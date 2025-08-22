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
import { CollectionActionModel } from '../base/ActionModel';

export class AddNewActionModel extends CollectionActionModel {
  defaultProps: ButtonProps = {
    type: 'primary',
    title: escapeT('Add new'),
    icon: 'PlusOutlined',
  };
  getActionName() {
    return 'create';
  }
}

AddNewActionModel.define({
  label: escapeT('Add new'),
});

AddNewActionModel.registerFlow({
  key: 'popupSettings',
  sort: 200,
  title: escapeT('Popup settings'),
  on: 'click',
  steps: {
    popup: {
      use: 'openView',
      defaultParams(ctx) {
        return {};
      },
    },
  },
});
