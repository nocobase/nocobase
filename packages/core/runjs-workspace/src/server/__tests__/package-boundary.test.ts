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

const packageRoot = path.resolve(__dirname, '../../..');
const sourceRoot = path.join(packageRoot, 'src');

describe('@nocobase/runjs-workspace package boundary', () => {
  it('is a Core package rather than a user-visible plugin', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as {
      name: string;
      displayName?: string;
      exports: Record<string, unknown>;
    };

    expect(packageJson.name).toBe('@nocobase/runjs-workspace');
    expect(packageJson.displayName).toBeUndefined();
    expect(Object.keys(packageJson.exports).sort()).toEqual([
      '.',
      './client',
      './client-v2',
      './package.json',
      './server',
      './shared',
      './swagger',
    ]);
  });

  it('does not depend on plugin lifecycle or JS Template domain implementations', () => {
    const violations = collectSourceFiles(sourceRoot)
      .filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`))
      .flatMap((file) => {
        const source = fs.readFileSync(file, 'utf8');
        return [
          '@nocobase/plugin-flow-engine',
          '@nocobase/plugin-js-template',
          '/JsTemplateProjectService',
          '/JsTemplateService',
          '/SaveAsJsTemplateService',
        ]
          .filter((needle) => source.includes(needle))
          .map((needle) => `${path.relative(sourceRoot, file)} -> ${needle}`);
      });

    expect(violations).toEqual([]);
  });

  it('keeps the client-v2 integration dependency acyclic', () => {
    const clientV2Package = JSON.parse(
      fs.readFileSync(path.resolve(packageRoot, '../client-v2/package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> };
    const flowEnginePluginPackage = JSON.parse(
      fs.readFileSync(path.resolve(packageRoot, '../../plugins/@nocobase/plugin-flow-engine/package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> };

    expect(clientV2Package.dependencies).not.toHaveProperty('@nocobase/runjs-workspace');
    expect(flowEnginePluginPackage.dependencies).toHaveProperty('@nocobase/runjs-workspace');
  });

  it('preserves all persisted VSC collection names without defining a plugin package', () => {
    const collectionSources = collectSourceFiles(path.join(sourceRoot, 'server/collections'))
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');
    for (const name of [
      'vscFileRepositories',
      'vscFileBlobs',
      'vscFileTrees',
      'vscFileTreeEntries',
      'vscFileCommits',
      'vscFileRefs',
      'vscFileRemotes',
      'vscFileSyncJobs',
      'vscFileExternalCommitMaps',
      'vscFileConflicts',
    ]) {
      expect(collectionSources).toContain(`name: '${name}'`);
    }
    expect(fs.existsSync(path.resolve(process.cwd(), 'packages/plugins/@nocobase/plugin-vsc-file/package.json'))).toBe(
      false,
    );
  });
});

function collectSourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(absolutePath);
    }
    return entry.isFile() && /\.tsx?$/u.test(entry.name) ? [absolutePath] : [];
  });
}
