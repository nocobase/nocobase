/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Diagnostic } from '@codemirror/lint';
import { afterEach, describe, expect, it } from 'vitest';

import { generatedRunJSTypeLibraryPackManifest } from '../type-packs/generated/manifest';
import { clearRunJSTypeLibraryPackRegistryForTests } from '../typescriptLibraryRegistry';
import { clearTypeScriptProjectCachesForTests, createTypeScriptProjectSession } from '../typescriptProject';

function errorMessages(diagnostics: Diagnostic[]): string[] {
  return diagnostics.filter((diagnostic) => diagnostic.severity === 'error').map((diagnostic) => diagnostic.message);
}

function project(code: string) {
  return {
    currentFilePath: 'src/main.tsx',
    files: [{ path: 'src/main.tsx', content: code }],
  };
}

afterEach(() => {
  clearRunJSTypeLibraryPackRegistryForTests();
  clearTypeScriptProjectCachesForTests();
});

describe('RunJS generated Ant Design and Icons TypeScript packs', () => {
  it('loads representative Ant Design symbols with official props, generics, hooks, and static APIs', async () => {
    const code = `
const { Button, DatePicker, Form, Input, message, Modal, Table, Typography } = ctx.libs.antd;
const button = <Button type="primary" loading onClick={(event) => event.currentTarget.focus()}>Save</Button>;
const input = <Input onChange={(event) => { const value: string = event.currentTarget.value; void value; }} />;
interface Row { id: number; name: string }
const table = <Table<Row> dataSource={[{ id: 1, name: 'Ada' }]} columns={[{
  dataIndex: 'name',
  render: (_value, record) => record.name,
}]} rowKey="id" />;
const [form] = Form.useForm<{ name: string }>();
const formView = <Form form={form}><Form.Item name="name"><Input /></Form.Item></Form>;
const date = ctx.libs.dayjs('2026-07-14');
const picker = <DatePicker value={date} onChange={(value) => value?.add(1, 'day')} />;
const modal = Modal.confirm({ title: 'Confirm' });
const notice = message.success('Saved');
const title = <Typography.Title level={2}>Title</Typography.Title>;
void button; void input; void table; void formView; void picker; void modal; void notice; void title;
`;
    const session = createTypeScriptProjectSession();

    expect(errorMessages(await session.getDiagnostics(project(code), code))).toEqual([]);
    const roots = session.getDebugState().rootFileNames;
    for (const name of ['button', 'date-picker', 'form', 'input', 'message', 'modal', 'table', 'typography']) {
      expect(roots.some((fileName) => fileName.endsWith(`/antd/${name}-bridge.d.ts`))).toBe(true);
    }
    expect(roots).not.toContain('/__runjs__/type-packs/antd-full-bridge.d.ts');
  });

  it('reports official invalid Ant Design props and unknown symbols', async () => {
    const code = `
const { Button, DatePicker, Input, Typography } = ctx.antd;
<Button type="rainbow" loading="yes" />;
<Input onChange={(event) => { const value: number = event.currentTarget.value; void value; }} />;
<DatePicker onChange={(value) => { const text: string = value; void text; }} />;
<Typography.Title level={7}>Invalid</Typography.Title>;
ctx.libs.antd.NotAComponent;
`;
    const messages = errorMessages(await createTypeScriptProjectSession().getDiagnostics(project(code), code));

    expect(messages.some((message) => /rainbow/.test(message))).toBe(true);
    expect(messages.some((message) => /boolean/.test(message))).toBe(true);
    expect(messages.some((message) => /number/.test(message) && /string/.test(message))).toBe(true);
    expect(messages.some((message) => /NotAComponent/.test(message))).toBe(true);
  });

  it('loads only requested icon groups plus the shared base and React pack', async () => {
    const code = `
const { MinusOutlined, PlusOutlined } = ctx.libs.antdIcons;
const plus = <PlusOutlined spin rotate={90} aria-label="add" />;
const minus = <MinusOutlined onClick={(event) => event.currentTarget.focus()} />;
void plus; void minus;
`;
    const session = createTypeScriptProjectSession();

    expect(errorMessages(await session.getDiagnostics(project(code), code))).toEqual([]);
    const roots = session.getDebugState().rootFileNames;
    expect(roots).toEqual(
      expect.arrayContaining([
        '/__runjs__/type-packs/antd-icons/base-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/m-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/p-bridge.d.ts',
      ]),
    );
    expect(roots.some((fileName) => fileName.includes('antd-icons-full'))).toBe(false);
  });

  it('reports invalid icon props and records symbol/group manifests', async () => {
    const code = `
const { PlusOutlined } = ctx.libs.antdIcons;
<PlusOutlined spin="yes" rotate="90" unknownProp />;
ctx.libs.antdIcons.NotAnIcon;
`;
    const messages = errorMessages(await createTypeScriptProjectSession().getDiagnostics(project(code), code));

    expect(messages.some((message) => /boolean/.test(message))).toBe(true);
    expect(messages.some((message) => /number/.test(message))).toBe(true);
    expect(messages.some((message) => /NotAnIcon/.test(message))).toBe(true);
    expect(generatedRunJSTypeLibraryPackManifest).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'antd/Button', sourcePackage: 'antd' }),
        expect.objectContaining({ id: 'antd-icons/base', sourcePackage: '@ant-design/icons' }),
        expect.objectContaining({ id: 'antd-icons/P', sourcePackage: '@ant-design/icons' }),
      ]),
    );
  });
});
