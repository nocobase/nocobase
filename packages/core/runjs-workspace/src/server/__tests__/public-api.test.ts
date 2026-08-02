/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import * as serverPublicApi from '..';

const repositoryRoot = path.resolve(__dirname, '../../../../../..');
const serverIndexSource = fs.readFileSync(path.resolve(__dirname, '../index.ts'), 'utf8');
const lightExtensionPublicApiSource = fs.readFileSync(
  path.resolve(repositoryRoot, 'packages/plugins/@nocobase/plugin-light-extension/src/server/vsc-file/public-api.ts'),
  'utf8',
);

describe('@nocobase/runjs-workspace/server public API', () => {
  it('uses named exports in both public server barrels', () => {
    expect(serverIndexSource).not.toMatch(/export\s+(?:type\s+)?\*/u);
    expect(lightExtensionPublicApiSource).not.toMatch(/export\s+(?:type\s+)?\*/u);
  });

  it('keeps the production consumer surface available', () => {
    expect(Object.keys(serverPublicApi)).toEqual(
      expect.arrayContaining([
        'RunJSWorkspaceServerModule',
        'getOrCreateRunJSWorkspaceServerModule',
        'getRunJSWorkspaceServerModule',
        'importRunJSWorkspaceCollections',
        'RunJSSourceAdapterRegistry',
        'RunJSSourceAuthoringInspectorRegistry',
        'RunJSAuthoringCapabilityRegistry',
        'createRunJSSourcesResource',
        'createFlowSurfaceRunJSWorkspaceBootstrapPort',
        'createRunJSSourcePermissionHook',
        'createRunJSWorkspaceDiagnostic',
        'createRunJSWorkspaceDiagnosticAt',
        'buildRunJSSourceRepositoryIdentity',
        'VscFileService',
        'TreeService',
        'CommitService',
        'RepositoryService',
      ]),
    );
  });

  it('freezes the raw VSC exports while downstream usage remains unknown', () => {
    expect(serverPublicApi.createVscFileResource).toBeTypeOf('function');
    expect(serverPublicApi.vscFileActionNames).toEqual([
      'createRepository',
      'getRepository',
      'archiveRepository',
      'pull',
      'getFile',
      'push',
      'listCommits',
      'getCommit',
      'diff',
      'diffFile',
      'restoreFile',
      'restoreCommit',
      'listRefs',
      'updateRef',
    ]);
  });
});
