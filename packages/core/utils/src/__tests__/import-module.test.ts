/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { importModule } from '../requireModule';

describe('import module', () => {
  it('should import module with absolute path', async () => {
    const file = './test.ts';
    const filePath = path.resolve(__dirname, file);

    const m = await importModule(filePath);
    expect(m.test).toEqual('hello');
  });
});
