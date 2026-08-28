/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionSceneEnum } from '@nocobase/client-v2';
import type { ButtonProps } from 'antd/es/button';

import { tExpr } from '../../locale';
import { RecordCommentActionModel } from './RecordCommentActionGroupModel';

export class EditRecordCommentActionModel extends RecordCommentActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    type: 'link',
    style: { padding: 0, height: 'auto' },
    title: tExpr('Edit'),
  };

  getAclActionName() {
    return 'update';
  }
}

EditRecordCommentActionModel.define({
  label: tExpr('Edit'),
  toggleable: true,
});

EditRecordCommentActionModel.registerFlow({
  key: 'editRecordComment',
  on: 'click',
  steps: {
    edit: {
      async handler(ctx) {
        ctx.setEditing();
      },
    },
  },
});
