/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { ActionSceneEnum } from '@nocobase/client';
import { CommentActionModel } from './CommentActionGroupModel';

export class QuoteReplyActionModel extends CommentActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: escapeT('Quote reply', { ns: 'comments' }),
  };

  getAclActionName() {
    return 'create';
  }
}

QuoteReplyActionModel.define({
  label: escapeT('Quote reply', { ns: 'comments' }),
  toggleable: true,
});

QuoteReplyActionModel.registerFlow({
  key: 'quoteReplySettings',
  on: 'click',
  steps: {
    quoteReply: {
      async handler(ctx, params) {
        const blockModel = ctx.model.context.blockModel;
        const content = ctx.record?.content ?? '';
        const quoteContent = `${content
          .split('\n')
          .map((_) => `> ${_}`)
          .join('\n')}`;
        blockModel.context.setQuoteContent(quoteContent);
      },
    },
  },
});
