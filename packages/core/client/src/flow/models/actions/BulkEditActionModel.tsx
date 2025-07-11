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
import { tval } from '@nocobase/utils/client';
import { openModeAction } from '../../actions/openModeAction';
import { GlobalActionModel } from '../base/ActionModel';

export class BulkEditActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    title: tval('Bulk edit'),
    icon: 'EditOutlined',
  };
}

BulkEditActionModel.define({
  title: tval('Bulk edit'),
  hide: true,
});

BulkEditActionModel.registerFlow({
  key: 'handleClick',
  title: tval('Click event'),
  on: {
    eventName: 'click',
  },
  steps: {
    openModeAction,
    bulkEdit: {
      title: tval('Data will be updated'),
      uiSchema: {
        updateMode: {
          'x-component': 'Radio.Group',
          'x-component-props': {
            options: [
              { label: tval('Update selected data?'), value: 'selected' },
              { label: tval('Update all data?'), value: 'all' },
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
        const t = ctx.model.translate;
        if (!ctx.currentBlockModel?.resource) {
          ctx.message.error(t('No resource selected for bulk edit'));
          return;
        }
        const resource = ctx.currentBlockModel.resource as MultiRecordResource;
        if (resource.getSelectedRows().length === 0) {
          ctx.message.warning(t('No records selected for bulk edit'));
          return;
        }
        //TODO: await resource.updateSelectedRows(params);
        ctx.message.success(t('updateSelectedRows not implemented!'));
      },
    },
  },
});
