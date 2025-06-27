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
import { RecordActionModel } from '../base/ActionModel';

export class DuplicateActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: 'Duplicate',
  };
}

DuplicateActionModel.define({
  title: 'Duplicate',
  hide: true,
});

DuplicateActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    open: openModeAction,
    duplicateMode: {
      title: '复制方式',
      uiSchema: {
        // TODO
        duplicateMode: {
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            {
              label: '快速复制',
              value: 'quickDuplicate',
            },
            {
              label: '表单复制',
              value: 'formDuplicate',
            },
          ],
          title: '复制方式',
        },
      },
      defaultParams(ctx) {
        return {
          duplicateMode: 'quickDuplicate',
        };
      },
      handler(ctx, params) {},
    },
  },
});
