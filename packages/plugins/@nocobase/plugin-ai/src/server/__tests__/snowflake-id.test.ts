/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Snowflake from '../snowflake';

it('generate snowflake id', async () => {
  const snowflake = new Snowflake();
  const ids = [];
  for (let i = 0; i < 10; i++) {
    ids.push(snowflake.generate());
  }
  // check unique
  expect(new Set(ids).size).toBe(10);
});
