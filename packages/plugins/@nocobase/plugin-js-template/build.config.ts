/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineConfig } from '@nocobase/build';
import fs from 'fs-extra';
import path from 'path';

const requiredJavaScriptArtifacts = [
  'dist/client/index.js',
  'dist/client-v2/index.js',
  'dist/server/index.js',
  'dist/swagger/index.js',
] as const;

export default defineConfig({
  afterBuild: (log) => {
    assertBuildArtifacts(requiredJavaScriptArtifacts);
    log(`verified build artifacts: ${requiredJavaScriptArtifacts.join(', ')}`);
  },
});

function assertBuildArtifacts(relativePaths: readonly string[]): void {
  const missingArtifacts = relativePaths.filter(
    (relativePath) => !fs.pathExistsSync(path.join(__dirname, relativePath)),
  );
  if (missingArtifacts.length) {
    throw new Error(`Missing JS Template build artifacts: ${missingArtifacts.join(', ')}`);
  }
}
