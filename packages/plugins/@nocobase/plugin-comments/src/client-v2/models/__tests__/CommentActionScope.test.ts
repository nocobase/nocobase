/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteActionModel, EditActionModel, RecordActionGroupModel } from '@nocobase/client-v2';
import { FlowEngine, type FlowModelContext } from '@nocobase/flow-engine';
import { describe, expect, test } from 'vitest';

import { CommentActionGroupModel } from '../actions/CommentActionGroupModel';
import { EditCommentActionModel } from '../actions/EditCommentActionModel';
import { DeleteCommentActionModel } from '../actions/DeleteCommentActionModel';
import { QuoteReplyActionModel } from '../actions/QuoteReplyActionModel';

describe('Comment action scope', () => {
  test('keeps comment actions in their own group and out of table record actions', async () => {
    const commentActions = {
      EditCommentActionModel,
      DeleteCommentActionModel,
      QuoteReplyActionModel,
    };
    const engine = new FlowEngine();
    engine.registerModels({
      EditActionModel,
      DeleteActionModel,
      ...commentActions,
    });
    const ctx = {
      engine,
      dataSourceManager: engine.dataSourceManager,
      model: { uid: 'action-scope-test' },
    } as unknown as FlowModelContext;

    const tableItems = await RecordActionGroupModel.defineChildren(ctx);
    const tableActions = tableItems.map((item) => item.useModel);
    expect(tableActions).toEqual(expect.arrayContaining(['EditActionModel', 'DeleteActionModel']));
    for (const name of Object.keys(commentActions)) {
      expect(tableActions).not.toContain(name);
    }

    const commentItems = await CommentActionGroupModel.defineChildren(ctx);
    const availableCommentActions = commentItems.map((item) => item.useModel);
    expect(availableCommentActions).toEqual(expect.arrayContaining(Object.keys(commentActions)));
    expect(availableCommentActions).not.toContain('EditActionModel');
    expect(availableCommentActions).not.toContain('DeleteActionModel');
  });
});
