/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { matchesMimePattern } from '../../rules/mimetype';

describe('mimetype upload rule', () => {
  it('matches MIME patterns case-insensitively', () => {
    expect(matchesMimePattern('IMAGE/PNG', 'image/*')).toBe(true);
    expect(matchesMimePattern('text/plain', 'image/*')).toBe(false);
  });
});
