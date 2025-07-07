/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, MultiRecordResource } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import type { ButtonProps } from 'antd/es/button';
import { RecordActionModel } from '../base/ActionModel';

export class DeleteActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: escapeT('Delete'),
  };
}

DeleteActionModel.define({
  title: escapeT('Delete'),
});

DeleteActionModel.registerFlow({
  key: 'deleteSettings',
  title: escapeT('Delete settings'),
  on: 'click',
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
