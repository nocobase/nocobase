/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { inspectRunJSSourceWorkspace } from '../compiler';
import { loadNodeRunJSTypeLibraryFiles } from '../compiler/node-type-library';

function inspect(code: string) {
  return inspectRunJSSourceWorkspace({
    entry: 'src/main.tsx',
    files: [{ path: 'src/main.tsx', content: code }],
    surfaceStyle: 'action',
  });
}

describe('RunJS Node Ant Design symbol and Icons group source inspection', () => {
  it('accepts representative official Ant Design and icon usage', () => {
    expect(
      inspect(`
const { Button, Input, Table } = ctx.libs.antd;
const { MinusOutlined, PlusOutlined } = ctx.libs.antdIcons;
interface Row { id: number; name: string }
const button = <Button type="primary" onClick={(event) => event.currentTarget.focus()}>Save</Button>;
const input = <Input onChange={(event) => event.currentTarget.select()} />;
const table = <Table<Row> dataSource={[{ id: 1, name: 'Ada' }]} rowKey="id" />;
const plus = <PlusOutlined spin rotate={90} />;
const minus = <MinusOutlined />;
void button; void input; void table; void plus; void minus;
`),
    ).toEqual([]);
  });

  it('reports official invalid props and unknown static members', () => {
    const messages = inspect(`
const { Button } = ctx.libs.antd;
const { PlusOutlined } = ctx.libs.antdIcons;
<Button type="rainbow" />;
<PlusOutlined spin="yes" />;
ctx.libs.antd.NotAComponent;
ctx.libs.antdIcons.NotAnIcon;
`).map((diagnostic) => diagnostic.message);

    expect(messages.some((message) => /rainbow/.test(message))).toBe(true);
    expect(messages.some((message) => /boolean/.test(message))).toBe(true);
    expect(messages.some((message) => /NotAComponent/.test(message))).toBe(true);
    expect(messages.some((message) => /NotAnIcon/.test(message))).toBe(true);
  });

  it('loads component and icon group closures without unrelated groups', () => {
    const files = loadNodeRunJSTypeLibraryFiles([
      { kind: 'symbol', libraryName: 'antd', packId: 'antd/Button', symbol: 'Button' },
      { kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/P', symbol: 'PlusOutlined', group: 'P' },
    ]);
    const roots = files.rootFiles.map((file) => file.path);

    expect(roots).toEqual(
      expect.arrayContaining([
        '/__runjs__/type-packs/antd/button-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/base-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/p-bridge.d.ts',
      ]),
    );
    expect(roots.some((fileName) => fileName.endsWith('/antd-icons/m-bridge.d.ts'))).toBe(false);
    expect(new Set(files.dependencyFiles.map((file) => file.path)).size).toBe(files.dependencyFiles.length);
  });

  it('uses the same full fallbacks for dynamic access and reuses them for later symbols', () => {
    expect(
      inspect(`
const componentName: keyof RunJSAntdLibrary = 'Input';
const iconName: keyof RunJSAntdIconsLibrary = 'PlusOutlined';
const Component = ctx.libs.antd[componentName];
const Icon = ctx.libs.antdIcons[iconName];
void Component;
void Icon;
`),
    ).toEqual([]);

    const fullFiles = loadNodeRunJSTypeLibraryFiles([
      { kind: 'full', libraryName: 'antd', packId: 'antd/full' },
      { kind: 'full', libraryName: 'antdIcons', packId: 'antd-icons/full' },
    ]);
    const reusedFiles = loadNodeRunJSTypeLibraryFiles([
      { kind: 'symbol', libraryName: 'antd', packId: 'antd/Input', symbol: 'Input' },
      { kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/P', symbol: 'PlusOutlined', group: 'P' },
    ]);
    const fullRoots = fullFiles.rootFiles.map((file) => file.path);
    const reusedRoots = reusedFiles.rootFiles.map((file) => file.path);

    expect(fullRoots).toEqual(
      expect.arrayContaining([
        '/__runjs__/type-packs/antd/full-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/full-bridge.d.ts',
      ]),
    );
    expect(reusedRoots).toEqual(
      expect.arrayContaining([
        '/__runjs__/type-packs/antd/full-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/full-bridge.d.ts',
      ]),
    );
    expect(reusedRoots.some((fileName) => fileName.endsWith('/antd/input-bridge.d.ts'))).toBe(false);
    expect(reusedRoots.some((fileName) => fileName.endsWith('/antd-icons/p-bridge.d.ts'))).toBe(false);
  });
});
