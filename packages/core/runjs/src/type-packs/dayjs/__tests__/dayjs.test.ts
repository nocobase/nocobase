/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { RunJSTypeLibraryPack } from '../../../typescript-library';
import { generateRunJSTypeLibraryPacks } from '../../generator';
import {
  RUNJS_DAYJS_PLUGIN_POLICY,
  RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION,
  RUNJS_TYPESCRIPT_DAYJS_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_DAYJS_BRIDGE_PATH,
} from '..';

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');
let outputDirectory: string;
let dayjsPack: RunJSTypeLibraryPack;

beforeAll(async () => {
  outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-dayjs-type-pack-'));
  const result = await generateRunJSTypeLibraryPacks({
    projectRoot: repositoryRoot,
    outputDirectory,
    definitions: [RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION],
  });
  const generatedPack = result.packs.get('dayjs');
  if (!generatedPack) throw new Error('The dayjs type pack was not generated.');
  dayjsPack = generatedPack;
});

afterAll(async () => {
  await fs.rm(outputDirectory, { recursive: true, force: true });
});

describe('RunJS dayjs official type library', () => {
  it('generates the base declaration closure, bridge, and installed version', async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(repositoryRoot, 'node_modules/dayjs/package.json'), 'utf8'),
    ) as { version?: string };
    const dependencyPaths = dayjsPack.dependencyFiles.map((file) => file.path);

    expect(dayjsPack).toMatchObject({ libraryName: 'dayjs', version: packageJson.version });
    expect(dayjsPack.rootFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: RUNJS_TYPESCRIPT_DAYJS_BRIDGE_PATH,
          content: RUNJS_TYPESCRIPT_DAYJS_BRIDGE_DECLARATION,
        }),
      ]),
    );
    expect(dependencyPaths).toContain('/node_modules/dayjs/index.d.ts');
    expect(dependencyPaths).toContain('/node_modules/dayjs/package.json');
    expect(dependencyPaths.some((filePath) => filePath.includes('/dayjs/plugin/'))).toBe(false);
    expect(RUNJS_DAYJS_PLUGIN_POLICY).toMatchObject({ kind: 'base-only', preinstalledPlugins: [] });
  });
});
