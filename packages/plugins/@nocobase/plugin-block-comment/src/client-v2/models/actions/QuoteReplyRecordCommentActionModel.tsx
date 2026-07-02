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

import type { RecordCommentsBlockModel } from '../RecordCommentsBlockModel';
import { tExpr } from '../../locale';
import type { RecordCommentRecord } from '../utils';
import { RecordCommentActionModel } from './RecordCommentActionGroupModel';

export class QuoteReplyRecordCommentActionModel extends RecordCommentActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    type: 'link',
    style: { padding: 0, height: 'auto' },
    title: tExpr('Quote reply'),
  };

  getAclActionName() {
    return 'create';
  }
}

QuoteReplyRecordCommentActionModel.define({
  label: tExpr('Quote reply'),
  toggleable: true,
});

QuoteReplyRecordCommentActionModel.registerFlow({
  key: 'quoteReplyRecordComment',
  on: 'click',
  steps: {
    quoteReply: {
      async handler(ctx) {
        const blockModel = ctx.blockModel as RecordCommentsBlockModel | undefined;
        const record = ctx.record as RecordCommentRecord | undefined;
        const contentField = blockModel?.mapping.contentField;
        const content = contentField ? String(record?.[contentField] ?? '') : '';
        const quoteContent = content
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n');

        blockModel?.context.setQuoteContent(quoteContent);
      },
    },
  },
});
