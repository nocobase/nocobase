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
import { CommentActionModel } from './CommentActionGroupModel';

export class QuoteReplyActionModel extends CommentActionModel {
  static scene: typeof ActionSceneEnum.record = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    type: 'link',
    title: tExpr('Quote reply'),
  };

  getAclActionName() {
    return 'create';
  }
}

QuoteReplyActionModel.define({
  label: tExpr('Quote reply'),
  toggleable: true,
});

QuoteReplyActionModel.registerFlow({
  key: 'quoteReplySettings',
  on: 'click',
  steps: {
    quoteReply: {
      async handler(ctx) {
        const blockModel = ctx.model.context.blockModel;
        const content = ctx.record?.content ?? '';
        const quoteContent = `${content
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n')}`;
        blockModel.context.setQuoteContent(quoteContent);
      },
    },
  },
});
