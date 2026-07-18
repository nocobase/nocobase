/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ts from 'typescript';

import { selectRunJSTypeLibraryRequests } from '../typescript-library';
import { collectRunJSTypeLibraryUsage } from '../typescript-library-usage';

function collect(code: string, path = 'src/main.tsx') {
  return collectRunJSTypeLibraryUsage(ts, { files: [{ path, content: code }] });
}

function ids(code: string, path?: string): string[] {
  return collect(code, path).map((request) => request.packId);
}

describe('collectRunJSTypeLibraryUsage', () => {
  it('recognizes top-level and ctx.libs library access', () => {
    expect(
      ids(`
ctx.React.useState(0);
ctx.libs.React.useEffect(() => undefined, []);
ctx.libs?.['React']?.useMemo(() => 1, []);
ctx.ReactDOM.createRoot(ctx.element);
ctx.libs.dayjs().format('YYYY-MM-DD');
ctx.libs.lodash.get({}, 'id');
ctx.libs.math.evaluate('2 + 2');
ctx.libs.formula.SUM(1, 2);
`),
    ).toEqual(['dayjs', 'formulajs', 'lodash', 'mathjs', 'react', 'react-dom/client']);
  });

  it('supports computed ctx and ctx.libs roots', () => {
    expect(
      ids(`
ctx['React'].useState(0);
ctx['libs']['antd']['Button'];
ctx['libs']?.['antdIcons']?.['PlusOutlined'];
`),
    ).toEqual(['antd-icons/P', 'antd/Button', 'react']);
  });

  it('tracks destructuring and simple aliases', () => {
    expect(
      ids(`
const { React: R, dayjs } = ctx.libs;
const ReactAlias = R;
const ui = ctx.libs.antd;
const uiAlias = ui;
const icons = ctx.libs.antdIcons;
ReactAlias.useState(0);
dayjs();
uiAlias.Input;
icons.PlusOutlined;
`),
    ).toEqual(['antd-icons/P', 'antd/Input', 'dayjs', 'react']);
  });

  it('recognizes direct, bracket, optional-chain, and nested antd destructuring', () => {
    expect(
      ids(`
ctx.libs.antd.Button;
ctx.antd.Button;
ctx.libs.antd['Input'];
ctx.libs?.antd?.Select;
const { Form } = ctx.libs.antd;
const { antd: { Table: DataTable } } = ctx.libs;
DataTable;
`),
    ).toEqual(['antd/Button', 'antd/Form', 'antd/Input', 'antd/Select', 'antd/Table']);
  });

  it('tracks const aliases declared after a function that consumes them', () => {
    expect(
      ids(`
function renderButton() {
  return <ui.Button />;
}
const uiAlias = ui;
const ui = ctx.libs.antd;
`),
    ).toEqual(['antd/Button', 'react']);
  });

  it('keeps icon symbol and grouping metadata', () => {
    expect(collect(`ctx.libs.antdIcons.PlusOutlined; const { MinusOutlined } = ctx.libs.antdIcons;`)).toEqual([
      {
        group: 'M',
        kind: 'symbol',
        libraryName: 'antdIcons',
        packId: 'antd-icons/M',
        symbol: 'MinusOutlined',
      },
      {
        group: 'P',
        kind: 'symbol',
        libraryName: 'antdIcons',
        packId: 'antd-icons/P',
        symbol: 'PlusOutlined',
      },
    ]);
  });

  it('requests React for any JSX and keeps component requests', () => {
    expect(
      ids(`
const ui = ctx.libs.antd;
const { PlusOutlined } = ctx.libs.antdIcons;
return <ui.Button icon={<PlusOutlined />} />;
`),
    ).toEqual(['antd-icons/P', 'antd/Button', 'react']);
  });

  it('falls back to full packs for dynamic access, spreads, rest bindings, and escaping aliases', () => {
    expect(
      ids(`
const name = 'Button';
ctx.libs.antd[name];
const icons = ctx.libs.antdIcons;
consume(icons);
const copied = { ...ctx.libs.antd };
const { Button, ...rest } = ctx.libs.antd;
`),
    ).toEqual(['antd-icons/full', 'antd/full']);
  });

  it('lets full requests dominate symbols and reuses an already loaded full pack', () => {
    const requests = [
      ...collect('ctx.libs.antd.Button; ctx.libs.antd.Input;'),
      ...collect('const name = "Table"; ctx.libs.antd[name];'),
    ];

    expect(selectRunJSTypeLibraryRequests(requests).map((request) => request.packId)).toEqual(['antd/full']);
    expect(
      selectRunJSTypeLibraryRequests(collect('ctx.libs.antd.Input;'), new Map([['antd', 'antd/full']])).map(
        (request) => request.packId,
      ),
    ).toEqual(['antd/full']);
  });

  it('loads every known library when the ctx.libs container or its alias is spread', () => {
    expect(
      ids(`
const libs = ctx.libs;
const direct = { ...ctx.libs };
const aliased = { ...libs };
`),
    ).toEqual([
      '@nocobase/sdk/client',
      'antd-icons/full',
      'antd/full',
      'dayjs',
      'formulajs',
      'lodash',
      'mathjs',
      'react',
      'react-dom/client',
    ]);
  });

  it('treats numeric computed destructuring as a dynamic full request', () => {
    expect(ids(`const { 1: first } = ctx.libs.antd;`)).toEqual(['antd/full']);
  });

  it('uses a full request for mutable aliases that cannot be tracked safely', () => {
    expect(ids(`let ui = ctx.libs.antd; ui.Input;`)).toEqual(['antd/full']);
  });

  it('handles incomplete cursor code, top-level return, and TSX error recovery without throwing', () => {
    expect(ids(`ctx.libs.React.`)).toEqual(['react']);
    expect(ids(`ctx.libs.antd.`)).toEqual([]);
    expect(ids(`return ctx.libs.antd.Button;`)).toEqual(['antd/Button']);
    expect(() => collect(`return <ctx.libs.antd.Input value={`)).not.toThrow();
    expect(ids(`return <ctx.libs.antd.Input value={`)).toEqual(['antd/Input', 'react']);
  });

  it('treats unterminated computed strings and templates as dynamic full access', () => {
    expect(ids(`ctx.libs.antd['But`)).toEqual(['antd/full']);
    expect(ids('ctx.libs.antdIcons[`Plus')).toEqual(['antd-icons/full']);
  });

  it('ignores comments, strings, regex literals, and ordinary template text but scans template expressions', () => {
    expect(
      ids(`
// ctx.libs.antd.Button
/* ctx.libs.React.useState() */
const a = 'ctx.libs.antd.Input';
const b = /ctx\\.libs\\.antdIcons\\.PlusOutlined/;
const c = \`ctx.libs.antd.Select\`;
const d = \`selected: \${ctx.libs.antd.Table}\`;
`),
    ).toEqual(['antd/Table']);
  });

  it('does not treat unrelated objects or a shadowed ctx as RunJS libraries', () => {
    expect(
      ids(`
const other = { libs: { antd: { Button: 1 } } };
other.libs.antd.Button;
function inspect(ctx) {
  return ctx.libs.React.useState;
}
`),
    ).toEqual([]);
  });

  it('respects local type and namespace declarations named React', () => {
    expect(ids(`type React = { FC: unknown }; type Component = React.FC;`, 'src/main.ts')).toEqual([]);
    expect(ids(`namespace React { export type FC = unknown } type Component = React.FC;`, 'src/main.ts')).toEqual([]);
  });

  it('hoists var ctx bindings when checking whether ctx is the RunJS global', () => {
    expect(
      ids(`
function inspect() {
  ctx.libs.React.useState;
  if (true) {
    var ctx = other;
  }
}
`),
    ).toEqual([]);
  });

  it('recognizes built-in module references while ignoring unrelated import strings', () => {
    expect(
      ids(
        `
type ReactModule = typeof import('react');
type Button = import('antd').Button;
import type { PlusOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import value from 'lodash';
import { createClient } from '@nocobase/sdk/client';
import unrelated from 'unrelated-package';
`,
        'src/main.ts',
      ),
    ).toEqual(['@nocobase/sdk/client', 'antd-icons/P', 'antd/Button', 'dayjs', 'lodash', 'react']);
  });

  it.each([
    ['default', `import ReactDefault from 'react'; ReactDefault.createElement('div');`],
    ['namespace', `import * as ReactNamespace from 'react'; ReactNamespace.useEffect(() => undefined, []);`],
    ['named', `import { useEffect as useLocalEffect } from 'react'; useLocalEffect(() => undefined, []);`],
  ])('recognizes %s runtime React imports', (_kind, code) => {
    expect(ids(code, 'src/main.ts')).toEqual(['react']);
  });

  it('recognizes React namespace type references', () => {
    expect(ids(`type Props = React.ComponentProps<'button'>;`, 'src/main.ts')).toEqual(['react']);
    expect(ids(`type ReactLibrary = typeof ctx.libs.React;`, 'src/main.ts')).toEqual(['react']);
  });

  it('merges files, applies deletes and current unsaved content, and returns stable results', () => {
    const input = {
      files: [
        { path: 'src/b.ts', content: `ctx.libs.React.useState(0);` },
        { path: 'src/deleted.ts', content: `ctx.libs.antd.Modal;` },
        { path: 'src/deleted.ts', operation: 'delete' as const },
        { path: 'src/a.tsx', content: `ctx.libs.antd.Button;` },
      ],
      currentFile: { path: 'src/a.tsx', content: `ctx.libs.antd.Input;` },
    };
    const first = collectRunJSTypeLibraryUsage(ts, input);
    const second = collectRunJSTypeLibraryUsage(ts, input);

    expect(first.map((request) => request.packId)).toEqual(['antd/Input', 'react']);
    expect(second).toEqual(first);
  });

  it('ignores non-source workspace files', () => {
    expect(
      collectRunJSTypeLibraryUsage(ts, {
        files: [
          { path: 'README.md', content: 'ctx.libs.antd.Button' },
          { path: 'config.json', content: '"ctx.libs.React"' },
        ],
      }),
    ).toEqual([]);
  });
});
