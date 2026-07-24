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
import { afterEach, expect, it } from 'vitest';

import { runDomTypeOnlyBridgeGeneratorCli } from '../../../scripts/generate-dom-type-only-bridge';
import { buildRunJSDOMTypeOnlyBridge } from '../generator';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

it('uses the TypeScript AST to emit only interface and type alias bridges', () => {
  const bridge = buildRunJSDOMTypeOnlyBridge([
    {
      fileName: 'lib.dom.d.ts',
      content: `
interface BaseNode { readonly id: string }
interface Collection<T extends BaseNode = BaseNode> extends BaseNode { item(): T }
type NodeName<T extends BaseNode> = keyof T;
declare var Collection: { new(): Collection };
declare function open(url: string): void;
`,
    },
    {
      fileName: 'lib.dom.iterable.d.ts',
      content: `interface Collection<T extends BaseNode = BaseNode> { [Symbol.iterator](): Iterator<T> }`,
    },
  ]);
  const sourceFile = ts.createSourceFile('bridge.d.ts', bridge, ts.ScriptTarget.Latest, true);

  expect(bridge).toContain('interface Collection<T extends BaseNode = BaseNode> extends RunJSDOM.Collection<T>');
  expect(bridge).toContain('type NodeName<T extends BaseNode> = RunJSDOM.NodeName<T>;');
  expect(sourceFile.statements.filter(ts.isInterfaceDeclaration)).toHaveLength(2);
  expect(sourceFile.statements.filter(ts.isTypeAliasDeclaration)).toHaveLength(1);
  expect(sourceFile.statements.some(ts.isVariableStatement)).toBe(false);
  expect(sourceFile.statements.some(ts.isFunctionDeclaration)).toBe(false);
});

it('generates stable artifacts and detects stale output in check mode', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-dom-type-bridge-'));
  temporaryDirectories.push(directory);
  const outputPath = path.join(directory, 'dom-type-only-bridge.ts');
  const messages: string[] = [];
  const io = {
    error(message: string) {
      messages.push(message);
    },
    log(message: string) {
      messages.push(message);
    },
  };

  expect(await runDomTypeOnlyBridgeGeneratorCli([], { outputPath, io })).toBe(0);
  const first = await fs.readFile(outputPath, 'utf8');
  expect(await runDomTypeOnlyBridgeGeneratorCli([], { outputPath, io })).toBe(0);
  expect(await fs.readFile(outputPath, 'utf8')).toBe(first);
  expect(await runDomTypeOnlyBridgeGeneratorCli(['--check'], { outputPath, io })).toBe(0);

  await fs.writeFile(outputPath, `${first}\n// stale\n`, 'utf8');
  expect(await runDomTypeOnlyBridgeGeneratorCli(['--check'], { outputPath, io })).toBe(1);
  expect(messages.join('\n')).toContain('out of date');
});
