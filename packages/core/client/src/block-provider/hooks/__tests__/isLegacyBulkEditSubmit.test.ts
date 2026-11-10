/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/react';
import { isLegacyBulkEditSubmit } from '../isLegacyBulkEditSubmit';

function submitSchema(gridInitializer: string, nested = false, reference = false) {
  const grid = new Schema({ type: 'void', 'x-component': 'Grid', 'x-initializer': gridInitializer });
  const row = grid.addProperty('row', { type: 'void', 'x-component': 'Grid.Row' });
  const column = row.addProperty('col', { type: 'void', 'x-component': 'Grid.Col' });
  const container = nested ? column.addProperty('popup', { type: 'void', 'x-component': 'Action.Container' }) : column;
  const block = container.addProperty('block', {
    type: 'void',
    'x-settings': 'blockSettings:createForm',
    'x-template-key': reference ? 'pc' : undefined,
  });
  const form = block.addProperty('form', { type: 'void', 'x-component': 'FormV2' });
  const bar = form.addProperty('actions', { type: 'void', 'x-component': 'ActionBar' });
  return bar.addProperty('submit', {
    type: 'void',
    'x-component': 'Action',
    'x-action': 'submit',
    'x-use-component-props': 'useCreateActionProps',
  });
}
it('blocks a legacy copied or referenced create submit only in the direct bulk form', () => {
  expect(isLegacyBulkEditSubmit(submitSchema('popup:bulkEdit:addBlock'))).toBe(true);
  expect(isLegacyBulkEditSubmit(submitSchema('BulkEditBlockInitializers', false, true))).toBe(true);
  expect(isLegacyBulkEditSubmit(submitSchema('popup:bulkEdit:addBlock', true))).toBe(false);
  expect(isLegacyBulkEditSubmit(submitSchema('page:addBlock'))).toBe(false);
});
