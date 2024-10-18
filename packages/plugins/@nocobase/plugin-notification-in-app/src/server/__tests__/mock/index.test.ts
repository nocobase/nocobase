/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { main } from '.';
describe('create messages', () => {
  beforeEach(async () => {
    await main();
  });
  test('demo', () => {
    expect(1).toBe(1);
  });
});

// pg_dump -a -t notification_channels nocobase_test | psql nocobase_notifications_inapp
// pg_dump -a -t notification_in_app_messages nocobase_test | psql nocobase_notifications_inapp
