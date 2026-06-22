/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { publicFormsSchema } from '../schemas/publicForms';

describe('publicFormsSchema', () => {
  it('lists v1 public forms and historical unversioned records', () => {
    expect(publicFormsSchema['x-decorator-props']?.params?.filter).toEqual({
      $or: [{ version: 'v1' }, { 'version.$empty': true }],
    });
  });
});
