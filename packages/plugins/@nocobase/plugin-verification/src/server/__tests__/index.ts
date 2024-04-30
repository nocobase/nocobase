/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import path from 'path';

import { ApplicationOptions } from '@nocobase/server';

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface MockAppOptions extends ApplicationOptions {
  manual?: boolean;
}

export async function getApp(options: MockAppOptions = {}): Promise<MockServer> {
  const app = await createMockServer({
    ...options,
    plugins: ['verification'],
  });

  await app.db.import({
    directory: path.resolve(__dirname, './collections'),
  });

  try {
    await app.db.sync();
  } catch (error) {
    console.error(error);
  }

  return app;
}
