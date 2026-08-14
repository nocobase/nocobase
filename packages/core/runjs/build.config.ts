/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineConfig } from '@nocobase/build';
import fs from 'fs';
import path from 'path';

const runtimeArtifacts = [
  'lib/compiler/loader.js',
  'lib/compiler/build-identity.js',
  'lib/compiler/static-module-references.js',
  'lib/js-template/client/index.js',
  'lib/js-template/schema/index.js',
  'lib/js-template/schema/server.js',
  'lib/js-template/schema/entry-v1.schema.json',
  'lib/js-template/shared/index.js',
  'lib/js-template/typegen/index.js',
  'lib/workspace/server/index.js',
  'lib/workspace/shared/index.js',
  'lib/workspace/swagger/index.js',
];
function verifyArtifacts(artifacts: string[]): void {
  const missingArtifacts = artifacts.filter((artifact) => !fs.existsSync(path.resolve(__dirname, artifact)));

  if (missingArtifacts.length) {
    throw new Error(`Missing RunJS build artifacts: ${missingArtifacts.join(', ')}`);
  }
}

export default defineConfig({
  afterBuild: (log) => {
    verifyArtifacts(runtimeArtifacts);
    log(`verified RunJS build artifacts: ${runtimeArtifacts.join(', ')}`);
  },
});
