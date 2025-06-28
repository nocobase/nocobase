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
import { GlobalActionModel } from '../base/ActionModel';

export class BulkDeleteActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    title: tval('Delete'),
    icon: 'DeleteOutlined',
  };
}

BulkDeleteActionModel.define({
  title: tval('Delete'),
});

BulkDeleteActionModel.registerFlow({
  key: 'handleClick',
  title: tval('Click event'),
  on: {
    eventName: 'click',
  },
  steps: {
    confirm: {
      use: 'confirm',
    },
    delete: {
      async handler(ctx, params) {
        const t = ctx.model.translate;
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.globals.message.error(t('No resource selected for deletion'));
          return;
        }
        const resource = ctx.shared.currentBlockModel.resource as MultiRecordResource;
        if (resource.getSelectedRows().length === 0) {
          ctx.globals.message.warning(t('No records selected for deletion'));
          return;
        }
        await resource.destroySelectedRows();
        ctx.globals.message.success(t('Selected records deleted successfully'));
      },
    },
  },
});
