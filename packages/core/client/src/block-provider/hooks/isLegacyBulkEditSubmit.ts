/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Schema } from '@formily/react';

// The old bulk template initializer wrapped field-only templates in a create form.
// Restrict the guard to a direct child of the bulk edit grid so nested quick-create dialogs still work.
export function isLegacyBulkEditSubmit(action: Schema) {
  const bar = action?.parent;
  const form = bar?.parent;
  const block = form?.parent;
  if (
    action?.['x-action'] !== 'submit' ||
    bar?.['x-component'] !== 'ActionBar' ||
    form?.['x-component'] !== 'FormV2' ||
    block?.['x-settings'] !== 'blockSettings:createForm'
  )
    return false;

  let grid = block.parent;
  while (grid && ['Grid.Col', 'Grid.Row'].includes(grid['x-component'])) grid = grid.parent;
  return (
    grid?.['x-component'] === 'Grid' &&
    ['popup:bulkEdit:addBlock', 'BulkEditBlockInitializers', 'CreateFormBulkEditBlockInitializers'].includes(
      grid['x-initializer'],
    )
  );
}
