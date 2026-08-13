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

const packageRoot = path.resolve(__dirname, '../../../..');
const sourceRoot = path.resolve(__dirname, '../..');

describe('@nocobase/runjs workspace boundary', () => {
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

  it('publishes explicit workspace subpath exports', () => {
    const manifest = JSON.parse(fs.readFileSync(path.resolve(packageRoot, 'package.json'), 'utf8')) as {
      exports?: Record<string, unknown>;
    };

    expect(manifest.exports).toMatchObject({
      './workspace/client': expect.any(Object),
      './workspace/client-v2': expect.any(Object),
      './workspace/server': expect.any(Object),
      './workspace/shared': expect.any(Object),
    });
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
