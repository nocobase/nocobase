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
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { collectRunJSCompletionCatalog } from '../../../completion-catalog/generator';
import { collectRunJSTypeLibraryUsage } from '../../../typescript-library-usage';
import type { RunJSTypeLibraryPack } from '../../../typescript-library';
import {
  RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
} from '../../../typescript-project';
import { generateRunJSTypeLibraryPacks, type RunJSTypeLibraryPackDefinition } from '../../generator';
import {
  createRunJSAntdIconsTypeLibraryPackDefinitions,
  createRunJSAntdIconsTypePackEntries,
  getRunJSAntdIconGroup,
  RUNJS_ANTD_ICONS_BASE_PACK_ID,
  RUNJS_ANTD_ICONS_FULL_PACK_ID,
  RUNJS_ANTD_ICONS_GROUP_NAMES,
  RUNJS_ANTD_ICONS_MAX_GROUP_COUNT,
  RUNJS_ANTD_ICONS_MAX_GROUP_SIZE,
  RUNJS_ANTD_ICONS_NON_ICON_EXPORT_POLICY,
  type RunJSAntdIconsCompletionCatalogEntry,
} from '..';

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');
const selectedPackIds = new Set([
  RUNJS_ANTD_ICONS_BASE_PACK_ID,
  RUNJS_ANTD_ICONS_FULL_PACK_ID,
  'antd-icons/C',
  'antd-icons/G',
  'antd-icons/I',
  'antd-icons/M',
  'antd-icons/P',
  'antd-icons/S',
]);
const reactDefinition: RunJSTypeLibraryPackDefinition = {
  id: 'react',
  libraryName: 'react',
  entry: 'react',
  rootFiles: [{ path: RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH, content: RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION }],
  triggers: ['react'],
};

let outputDirectory: string;
let generatedPacks: ReadonlyMap<string, RunJSTypeLibraryPack>;
let catalogEntries: readonly RunJSAntdIconsCompletionCatalogEntry[];

beforeAll(async () => {
  const catalog = await collectRunJSCompletionCatalog(repositoryRoot, {
    id: 'antd-icons',
    moduleName: '@ant-design/icons',
    initialBudgetBytes: 24 * 1024,
  });
  catalogEntries = catalog.entries as readonly RunJSAntdIconsCompletionCatalogEntry[];
  const definitions = createRunJSAntdIconsTypeLibraryPackDefinitions(catalogEntries);
  outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-antd-icons-type-packs-'));
  const result = await generateRunJSTypeLibraryPacks({
    projectRoot: repositoryRoot,
    outputDirectory,
    definitions: [reactDefinition, ...definitions.filter((definition) => selectedPackIds.has(definition.id))],
  });
  generatedPacks = result.packs;
});

afterAll(async () => {
  await fs.rm(outputDirectory, { recursive: true, force: true });
});

describe('RunJS Ant Design Icons grouped type packs', () => {
  it('maps the public catalog to stable bounded letter groups and helper entries', () => {
    const entries = createRunJSAntdIconsTypePackEntries(catalogEntries);
    const groups = new Map<string, number>();
    entries.forEach((entry) => groups.set(entry.group, (groups.get(entry.group) || 0) + 1));

    expect(entries).toHaveLength(catalogEntries.length);
    expect(groups.size).toBeLessThanOrEqual(RUNJS_ANTD_ICONS_MAX_GROUP_COUNT);
    expect(Math.max(...groups.values())).toBeLessThanOrEqual(RUNJS_ANTD_ICONS_MAX_GROUP_SIZE);
    expect([...groups.keys()].every((group) => RUNJS_ANTD_ICONS_GROUP_NAMES.includes(group as never))).toBe(true);
    expect(getRunJSAntdIconGroup('PlusOutlined')).toBe('P');
    expect(getRunJSAntdIconGroup('$InternalIcon')).toBe('other');
    expect(entries.find((entry) => entry.symbol === 'PlusOutlined')).toMatchObject({
      category: 'icon',
      group: 'P',
      packId: 'antd-icons/P',
    });
    expect(entries.filter((entry) => entry.category !== 'icon')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: 'createFromIconfontCN', entry: '@ant-design/icons/lib/components/IconFont' }),
        expect.objectContaining({ symbol: 'IconProvider', entry: '@ant-design/icons/lib/components/Context' }),
        expect.objectContaining({ symbol: 'getTwoToneColor', group: 'G' }),
        expect.objectContaining({ symbol: 'setTwoToneColor', group: 'S' }),
      ]),
    );
    expect(RUNJS_ANTD_ICONS_NON_ICON_EXPORT_POLICY).toMatchObject({ strategy: 'letter-group' });
  });

  it('generates one shared base and isolated groups without the full icons graph', () => {
    const base = requirePack(RUNJS_ANTD_ICONS_BASE_PACK_ID);
    const plus = requirePack('antd-icons/P');
    const minus = requirePack('antd-icons/M');

    expect(base.dependencies.map((dependency) => dependency.id)).toEqual(['react']);
    expect(plus.dependencies.map((dependency) => dependency.id)).toEqual([RUNJS_ANTD_ICONS_BASE_PACK_ID]);
    expect(minus.dependencies.map((dependency) => dependency.id)).toEqual([RUNJS_ANTD_ICONS_BASE_PACK_ID]);
    expect(base.rootFiles[0]?.content).toContain('type RunJSAntdIconComponent');
    expect(plus.rootFiles[0]?.content).toContain('readonly PlusOutlined: RunJSAntdIconComponent');
    expect(plus.rootFiles[0]?.content).not.toContain('MinusOutlined');
    expect(minus.rootFiles[0]?.content).toContain('readonly MinusOutlined: RunJSAntdIconComponent');
    expect(plus.dependencyFiles).toEqual([]);
    expect(minus.dependencyFiles).toEqual([]);
    expect(base.dependencyFiles.some((file) => file.path.includes('/@ant-design/icons/lib/icons/'))).toBe(false);
    expect(base.dependencyFiles.some((file) => file.path.endsWith('/@ant-design/icons/lib/index.d.ts'))).toBe(false);
  });

  it('keeps helper exports mapped to their official bridge types', () => {
    expect(requirePack('antd-icons/C').rootFiles[0]?.content).toContain(
      "readonly createFromIconfontCN: typeof import('@ant-design/icons/lib/components/IconFont').default",
    );
    expect(requirePack('antd-icons/G').rootFiles[0]?.content).toContain(
      "readonly getTwoToneColor: typeof import('@ant-design/icons/lib/components/twoTonePrimaryColor').getTwoToneColor",
    );
    expect(requirePack('antd-icons/I').rootFiles[0]?.content).toContain(
      "readonly IconProvider: import('react').Provider<import('@ant-design/icons/lib/components/Context').IconContextProps>",
    );
    expect(requirePack('antd-icons/S').rootFiles[0]?.content).toContain(
      "readonly setTwoToneColor: typeof import('@ant-design/icons/lib/components/twoTonePrimaryColor').setTwoToneColor",
    );
  });

  it('generates an official full-module fallback without widening unknown names', () => {
    const full = requirePack(RUNJS_ANTD_ICONS_FULL_PACK_ID);
    const base = requirePack(RUNJS_ANTD_ICONS_BASE_PACK_ID);
    const baseFiles = new Map(base.dependencyFiles.map((file) => [file.path, file.contentHash]));
    const sharedFiles = full.dependencyFiles.filter((file) => baseFiles.has(file.path));

    expect(full.dependencies.map((dependency) => dependency.id)).toEqual(['react']);
    expect(full.rootFiles[0]?.content).toContain(
      'interface RunJSAntdIconsLibrary extends RunJSOfficialAntdIconsModule',
    );
    expect(full.rootFiles[0]?.content).not.toContain('[name: string]');
    expect(full.dependencyFiles.some((file) => file.path.endsWith('/@ant-design/icons/lib/index.d.ts'))).toBe(true);
    expect(sharedFiles.length).toBeGreaterThan(0);
    expect(sharedFiles.every((file) => baseFiles.get(file.path) === file.contentHash)).toBe(true);
    expect(full.metadata).toMatchObject({ fallback: true, strategy: 'full-module' });
  });

  it('keeps direct access, destructuring, aliases, and JSX on the requested groups', () => {
    const requests = collectRunJSTypeLibraryUsage(ts, {
      files: [
        {
          path: 'src/main.tsx',
          content: `
const icons = ctx.libs.antdIcons;
const { PlusOutlined: Plus } = icons;
const { MinusOutlined } = ctx.libs.antdIcons;
ctx.libs.antdIcons.PlusCircleOutlined;
const view = <><Plus /><MinusOutlined /></>;
`,
        },
      ],
    });

    expect(requests).toEqual([
      { group: 'M', kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/M', symbol: 'MinusOutlined' },
      { group: 'P', kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/P', symbol: 'PlusCircleOutlined' },
      { group: 'P', kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/P', symbol: 'PlusOutlined' },
      { kind: 'library', libraryName: 'React', packId: 'react' },
    ]);
  });
});

function requirePack(id: string): RunJSTypeLibraryPack {
  const pack = generatedPacks.get(id);
  if (!pack) throw new Error(`Missing generated Ant Design Icons pack: ${id}`);
  return pack;
}
