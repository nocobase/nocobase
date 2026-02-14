/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { filterFormDefaultValues } from '../../../../actions/filterFormDefaultValues';
import { FilterFormBlockModel } from '../FilterFormBlockModel';

describe('filter-form defaultValues wiring', () => {
  it('loads action and model modules', () => {
    expect(filterFormDefaultValues).toBeTruthy();
    expect(FilterFormBlockModel).toBeTruthy();
  });
});
