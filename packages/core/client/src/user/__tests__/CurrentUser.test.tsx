/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
// Import the leaf module first to exercise initialization through the mobile topbar's dependency path.
import { DropdownVisibleContext } from '../CurrentUser';
import { DropdownVisibleContext as exportedDropdownVisibleContext, TableBlockProvider } from '../../index';

describe('CurrentUser module initialization', () => {
  it('keeps the user menu context and table provider available from the client entry', () => {
    expect(exportedDropdownVisibleContext).toBe(DropdownVisibleContext);
    expect(TableBlockProvider).toBeDefined();
  });
});
