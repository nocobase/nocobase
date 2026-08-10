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
  'lib/workspace/client/index.js',
  'lib/workspace/client-v2/index.js',
  'lib/workspace/server/index.js',
  'lib/workspace/shared/index.js',
  'lib/workspace/swagger/index.js',
];
const declarationArtifacts = [
  'lib/compiler/loader.d.ts',
  'lib/compiler/build-identity.d.ts',
  'lib/compiler/static-module-references.d.ts',
  'lib/js-template/client/index.d.ts',
  'lib/js-template/schema/index.d.ts',
  'lib/js-template/schema/server.d.ts',
  'lib/js-template/shared/index.d.ts',
  'lib/js-template/typegen/index.d.ts',
  'lib/workspace/client/index.d.ts',
  'lib/workspace/client-v2/index.d.ts',
  'lib/workspace/server/index.d.ts',
  'lib/workspace/shared/index.d.ts',
  'lib/workspace/swagger/index.d.ts',
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

    if (!process.argv.includes('--no-dts') && !process.argv.includes('--only-tar')) {
      process.once('beforeExit', () => {
        verifyArtifacts(declarationArtifacts);
        log(`verified RunJS declaration artifacts: ${declarationArtifacts.join(', ')}`);
      });
    }
  },
});
