/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { tval } from '@nocobase/utils/client';
import { RecordActionModel } from '../base/ActionModel';

export class DeleteActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: tval('Delete'),
  };
}

DeleteActionModel.define({
  title: tval('Delete'),
});

DeleteActionModel.registerFlow({
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
        if (!ctx.shared.currentRecord) {
          ctx.globals.message.error(t('No resource or record selected for deletion'));
          return;
        }
        const resource = ctx.shared.currentBlockModel.resource as MultiRecordResource;
        await resource.destroy(ctx.shared.currentRecord);
        ctx.globals.message.success(t('Record deleted successfully'));
      },
    },
  },
});
