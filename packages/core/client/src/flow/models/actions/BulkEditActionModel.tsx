/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { GlobalActionModel } from '../base/ActionModel';
import { openModeAction } from '../../actions/openModeAction';

export class BulkEditActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    title: 'Bulk edit',
    icon: 'EditOutlined',
  };
}

BulkEditActionModel.define({
  title: 'Bulk edit',
});

BulkEditActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    openModeAction,
    bulkEdit: {
      title: '更新的数据',
      uiSchema: {
        updateMode: {
          'x-component': 'Radio.Group',
          'x-component-props': {
            options: [
              { label: '更新选中行', value: 'selected' },
              { label: '更新所有行', value: 'all' },
            ],
          },
        },
      },
      defaultParams(ctx) {
        return {
          updateMode: 'selected',
        };
      },
      async handler(ctx, params) {
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.globals.message.error('No resource selected for bulk edit.');
          return;
        }
        const resource = ctx.shared.currentBlockModel.resource as MultiRecordResource;
        if (resource.getSelectedRows().length === 0) {
          ctx.globals.message.warning('No records selected for bulk edit.');
          return;
        }
        await resource.destroySelectedRows();
        ctx.globals.message.success('Successfully.');
      },
    },
  },
});
