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

import { collectRunJSCompletionCatalog } from '../../../completion-catalog/generator';
import type { RunJSTypeLibraryPack } from '../../../typescript-library';
import {
  RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
} from '../../../typescript-project';
import { RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION } from '../../dayjs';
import { generateRunJSTypeLibraryPacks, type RunJSTypeLibraryPackDefinition } from '../../generator';
import {
  createRunJSAntdTypeLibraryPackDefinitions,
  createRunJSAntdTypePackEntries,
  RUNJS_ANTD_FULL_PACK_ID,
  RUNJS_ANTD_NON_COMPONENT_TYPE_POLICY,
  type RunJSAntdCompletionCatalogEntry,
} from '..';

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');
const reactDefinition: RunJSTypeLibraryPackDefinition = {
  id: 'react',
  libraryName: 'react',
  entry: 'react',
  rootFiles: [{ path: RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH, content: RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION }],
  triggers: ['react'],
};

let outputDirectory: string;
let generatedPacks: ReadonlyMap<string, RunJSTypeLibraryPack>;

beforeAll(async () => {
  const catalog = await collectRunJSCompletionCatalog(repositoryRoot, {
    id: 'antd',
    moduleName: 'antd',
    initialBudgetBytes: 48 * 1024,
  });
  const definitions = createRunJSAntdTypeLibraryPackDefinitions(
    catalog.entries as readonly RunJSAntdCompletionCatalogEntry[],
  );
  const generatedDefinitionIds = new Set(['antd/Button', 'antd/DatePicker', RUNJS_ANTD_FULL_PACK_ID]);
  outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-antd-type-packs-'));
  const result = await generateRunJSTypeLibraryPacks({
    projectRoot: repositoryRoot,
    outputDirectory,
    definitions: [
      reactDefinition,
      RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION,
      ...definitions.filter((definition) => generatedDefinitionIds.has(definition.id)),
    ],
  });
  generatedPacks = result.packs;
});

afterAll(async () => {
  await fs.rm(outputDirectory, { recursive: true, force: true });
});

describe('RunJS Ant Design component-level type packs', () => {
  it('maps every public value catalog entry to a stable symbol pack', async () => {
    const catalog = await collectRunJSCompletionCatalog(repositoryRoot, {
      id: 'antd',
      moduleName: 'antd',
      initialBudgetBytes: 48 * 1024,
    });
    const entries = createRunJSAntdTypePackEntries(catalog.entries as readonly RunJSAntdCompletionCatalogEntry[]);

    expect(entries.map((entry) => entry.packId)).toEqual(
      catalog.entries.map((entry) => entry.packId).sort((left, right) => left.localeCompare(right)),
    );
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: 'Button', entry: 'antd/es/button', exportName: 'default' }),
        expect.objectContaining({ symbol: 'QRCode', entry: 'antd/es/qr-code', exportName: 'default' }),
        expect.objectContaining({ symbol: 'message', entry: 'antd/es/message', exportName: 'default' }),
        expect.objectContaining({
          symbol: 'unstableSetRender',
          entry: 'antd/es/config-provider/UnstableContext',
          exportName: 'unstableSetRender',
        }),
      ]),
    );
    expect(RUNJS_ANTD_NON_COMPONENT_TYPE_POLICY).toMatchObject({ strategy: 'symbol-pack' });
  });

  it('generates isolated closures, explicit shared dependencies, and symbol bridges', () => {
    const button = requirePack('antd/Button');
    const datePicker = requirePack('antd/DatePicker');
    const buttonPaths = new Set(button.dependencyFiles.map((file) => file.path));
    const datePickerPaths = new Set(datePicker.dependencyFiles.map((file) => file.path));

    expect(button.dependencies.map((dependency) => dependency.id)).toEqual(['react']);
    expect(datePicker.dependencies.map((dependency) => dependency.id)).toEqual(['dayjs', 'react']);
    expect(button.rootFiles[0]?.content).toContain("readonly Button: typeof import('antd/es/button').default;");
    expect(button.dependencyFiles.some((file) => file.path.includes('/antd/es/button/'))).toBe(true);
    expect(button.dependencyFiles.some((file) => file.path.includes('/antd/es/table/'))).toBe(false);
    expect(button.dependencyFiles.some((file) => file.path.includes('/@types/react/'))).toBe(false);
    expect(datePicker.dependencyFiles.some((file) => file.path === '/node_modules/dayjs/index.d.ts')).toBe(false);
    expect([...buttonPaths].some((filePath) => datePickerPaths.has(filePath))).toBe(true);
    expect([...datePickerPaths].some((filePath) => !buttonPaths.has(filePath))).toBe(true);
    expect(button.metadata).toMatchObject({
      category: 'component',
      entry: 'antd/es/button',
      requiresDOMTypeBridge: true,
      symbol: 'Button',
    });
  });

  it('generates an official full-module fallback without a broad index signature', () => {
    const full = requirePack(RUNJS_ANTD_FULL_PACK_ID);
    const button = requirePack('antd/Button');
    const buttonFiles = new Map(button.dependencyFiles.map((file) => [file.path, file.contentHash]));
    const sharedFiles = full.dependencyFiles.filter((file) => buttonFiles.has(file.path));

    expect(full.dependencies.map((dependency) => dependency.id)).toEqual(['dayjs', 'react']);
    expect(full.rootFiles[0]?.content).toContain('interface RunJSAntdLibrary extends RunJSOfficialAntdModule');
    expect(full.rootFiles[0]?.content).not.toContain('[name: string]');
    expect(full.dependencyFiles.some((file) => file.path.endsWith('/antd/es/index.d.ts'))).toBe(true);
    expect(sharedFiles.length).toBeGreaterThan(0);
    expect(sharedFiles.every((file) => buttonFiles.get(file.path) === file.contentHash)).toBe(true);
    expect(full.metadata).toMatchObject({ fallback: true, strategy: 'full-module' });
  });
});

function requirePack(id: string): RunJSTypeLibraryPack {
  const pack = generatedPacks.get(id);
  if (!pack) throw new Error(`Missing generated Ant Design pack: ${id}`);
  return pack;
}
