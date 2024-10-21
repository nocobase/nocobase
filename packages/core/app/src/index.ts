/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Gateway } from '@nocobase/server';
import { getConfig } from './config';
import { loadPluginsStaticImport } from './load-plugins-static-import';

async function initializeGateway() {
  await loadPluginsStaticImport();
  const config = await getConfig();
  await Gateway.getInstance().run({
    mainAppOptions: config,
  });
}

initializeGateway().catch((e) => {
  console.error(e);
  process.exit(1);
});
