/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { DeleteRecordCommentActionModel } from '../actions/DeleteRecordCommentActionModel';
import { EditRecordCommentActionModel } from '../actions/EditRecordCommentActionModel';
import { QuoteReplyRecordCommentActionModel } from '../actions/QuoteReplyRecordCommentActionModel';

function getFlowStep(ModelClass: { globalFlowRegistry?: { getFlow: (key: string) => unknown } }, flowKey: string) {
  return ModelClass.globalFlowRegistry?.getFlow(flowKey) as {
    steps: Record<string, { handler: (ctx: Record<string, unknown>) => Promise<void> | void }>;
  };
}

describe('record comment action models', () => {
  it('enters edit mode from the edit action flow', async () => {
    const flow = getFlowStep(EditRecordCommentActionModel as never, 'editRecordComment');
    const setEditing = vi.fn();

    await flow.steps.edit.handler({ setEditing });

    expect(EditRecordCommentActionModel.prototype.getAclActionName()).toBe('update');
    expect(setEditing).toHaveBeenCalled();
  });

  it('quotes the mapped comment content line by line', async () => {
    const flow = getFlowStep(QuoteReplyRecordCommentActionModel as never, 'quoteReplyRecordComment');
    const setQuoteContent = vi.fn();

    await flow.steps.quoteReply.handler({
      blockModel: {
        mapping: {
          contentField: 'content',
        },
        context: {
          setQuoteContent,
        },
      },
      record: {
        content: 'First line\nSecond line',
      },
    });

    expect(QuoteReplyRecordCommentActionModel.prototype.getAclActionName()).toBe('create');
    expect(setQuoteContent).toHaveBeenCalledWith('> First line\n> Second line');
  });

  it('deletes the selected comment and reports success', async () => {
    const flow = getFlowStep(DeleteRecordCommentActionModel as never, 'deleteRecordComment');
    const destroy = vi.fn(async () => undefined);
    const success = vi.fn();

    await flow.steps.delete.handler({
      resource: {
        destroy,
      },
      record: {
        id: 7,
      },
      collection: {
        filterTargetKey: 'id',
      },
      message: {
        success,
        error: vi.fn(),
      },
      t: (value: string) => value,
    });

    expect(DeleteRecordCommentActionModel.prototype.getAclActionName()).toBe('destroy');
    expect(destroy).toHaveBeenCalledWith(7);
    expect(success).toHaveBeenCalledWith('Record deleted successfully');
  });

  it('shows a guard error when delete has no resource or record key', async () => {
    const flow = getFlowStep(DeleteRecordCommentActionModel as never, 'deleteRecordComment');
    const error = vi.fn();

    await flow.steps.delete.handler({
      record: {},
      collection: {
        filterTargetKey: 'id',
      },
      message: {
        success: vi.fn(),
        error,
      },
      t: (value: string) => value,
    });

    expect(error).toHaveBeenCalledWith('No resource or record selected for deletion');
  });

  it('uses API error messages when delete fails', async () => {
    const flow = getFlowStep(DeleteRecordCommentActionModel as never, 'deleteRecordComment');
    const error = vi.fn();

    await flow.steps.delete.handler({
      resource: {
        destroy: vi.fn(async () => {
          throw {
            response: {
              data: {
                errors: [{ message: 'Permission denied' }],
              },
            },
          };
        }),
      },
      record: {
        id: 8,
      },
      collection: {
        filterTargetKey: 'id',
      },
      message: {
        success: vi.fn(),
        error,
      },
      t: (value: string) => value,
    });

    expect(error).toHaveBeenCalledWith('Permission denied');
  });
});
