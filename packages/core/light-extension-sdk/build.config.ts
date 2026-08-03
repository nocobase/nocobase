/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineConfig } from '@nocobase/build';
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export default defineConfig({
  afterBuild() {
    const destinationDirectory = path.resolve(__dirname, 'lib/schema');
    mkdirSync(destinationDirectory, { recursive: true });
    copyFileSync(
      path.resolve(__dirname, '../js-template-sdk/src/schema/entry-v1.schema.json'),
      path.join(destinationDirectory, 'entry-v1.schema.json'),
    );
  },
});
