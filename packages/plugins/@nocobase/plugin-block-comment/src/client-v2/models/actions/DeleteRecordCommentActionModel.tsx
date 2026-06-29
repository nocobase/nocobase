/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionSceneEnum } from '@nocobase/client-v2';
import type { MultiRecordResource } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';

import { tExpr } from '../../locale';
import { getRecordPrimaryKeyValue, type RecordCommentCollection, type RecordCommentRecord } from '../utils';
import { getErrorMessage } from '../utils/errors';
import { RecordCommentActionModel } from './RecordCommentActionGroupModel';

export class DeleteRecordCommentActionModel extends RecordCommentActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    type: 'link',
    style: { padding: 0, height: 'auto' },
    title: tExpr('Delete'),
  };

  getAclActionName() {
    return 'destroy';
  }
}

DeleteRecordCommentActionModel.define({
  label: tExpr('Delete'),
  toggleable: true,
});

DeleteRecordCommentActionModel.registerFlow({
  key: 'deleteRecordComment',
  title: tExpr('Delete settings'),
  on: 'click',
  steps: {
    confirm: {
      use: 'confirm',
      defaultParams: {
        enable: true,
        title: tExpr('Delete record'),
        content: tExpr('Are you sure you want to delete it?'),
      },
    },
    delete: {
      async handler(ctx) {
        const resource = ctx.resource as MultiRecordResource<RecordCommentRecord> | undefined;
        const record = ctx.record as RecordCommentRecord | undefined;
        const collection = ctx.collection as RecordCommentCollection | undefined;
        const recordKey = getRecordPrimaryKeyValue(record, collection);

        if (!resource || !recordKey) {
          ctx.message.error(ctx.t('No resource or record selected for deletion'));
          return;
        }

        try {
          await resource.destroy(recordKey);
          ctx.message.success(ctx.t('Record deleted successfully'));
        } catch (error) {
          ctx.message.error(getErrorMessage(error, ctx.t('Failed to delete comment')));
        }
      },
    },
  },
});
