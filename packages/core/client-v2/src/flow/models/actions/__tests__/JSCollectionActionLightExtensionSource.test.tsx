/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { RunJSSourceResolverRegistry } from '../../../components/runjs-source';
import { JSCollectionActionModel } from '../JSCollectionActionModel';
import { createActionModel, JS_ACTION_SOURCE_BINDING } from './jsActionLightExtensionTestUtils';

describe('JSCollectionActionModel light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('resolves JS Action entries with selected collection rows', async () => {
    const resolve = vi.fn(() => ({
      code: `
const rows = ctx.resource.getSelectedRows();
ctx.__testState.resourceRowCount = rows.length;
ctx.__testState.selectedRecordCount = ctx.selectedRecords.length;
ctx.message.success(ctx.settings.successMessage + ':' + rows.map((row) => row.id).join(','));
      `,
      version: 'v2',
      settings: {
        successMessage: 'Batch approved',
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });
    const { model, state, message } = createActionModel<JSCollectionActionModel>({
      ModelClass: JSCollectionActionModel,
      use: 'JSCollectionActionModel',
      uid: 'js-collection-action-run',
    });
    const selectedRecords = [
      { id: 1, status: 'pending' },
      { id: 2, status: 'pending' },
    ];
    model.context.defineProperty('resource', {
      value: {
        getSelectedRows: () => selectedRecords,
      },
    });
    model.context.defineProperty('selectedRecords', {
      value: selectedRecords,
    });

    await model.applyFlow('clickSettings');

    expect(state.resourceRowCount).toBe(2);
    expect(state.selectedRecordCount).toBe(2);
    expect(message.success).toHaveBeenCalledWith('Batch approved:1,2');
    expect(model.props.loading).toBe(false);
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceBinding: JS_ACTION_SOURCE_BINDING,
        context: expect.objectContaining({
          ownerKind: 'flowModel.actionSettings',
          ownerLocator: expect.objectContaining({
            use: 'JSCollectionActionModel',
          }),
        }),
      }),
    );
  });
});
