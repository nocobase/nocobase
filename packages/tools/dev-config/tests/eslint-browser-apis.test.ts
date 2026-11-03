import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createApplicationConfig,
  createClientLibraryConfig,
  createNodeLibraryConfig,
} from '../eslint/index.ts';

let root: string;
beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'eslint-browser-apis-'));
});
afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

async function restricted(
  factory: typeof createApplicationConfig,
  file: string,
  source: string,
): Promise<string[]> {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: factory({ tsconfigRootDir: root }),
  });
  const [result] = await eslint.lintText(source, {
    filePath: path.join(root, file),
  });
  expect(result?.messages.filter((message) => message.fatal)).toEqual([]);
  return (result?.messages ?? [])
    .filter((message) => message.ruleId === 'no-restricted-properties')
    .map((message) => message.message);
}

const forbidden = [
  'crypto.randomUUID()',
  'globalThis.crypto.randomUUID()',
  "crypto['randomUUID']()",
  'crypto?.randomUUID?.()',
  'navigator.clipboard.writeText("text")',
  'navigator.clipboard?.writeText("text")',
  'globalThis.navigator.clipboard?.writeText("text")',
  "navigator['clipboard'].writeText('text')",
];

describe('HTTP-compatible browser APIs', () => {
  it.each([
    ['plugin client', createClientLibraryConfig, 'client/action.jsx'],
    ['browser library', createClientLibraryConfig, 'src/action.jsx'],
    ['browser shared code', createClientLibraryConfig, 'shared/action.jsx'],
    [
      'UI registry',
      createClientLibraryConfig,
      'registry/components/action.jsx',
    ],
    ['preview website', createClientLibraryConfig, 'website/action.jsx'],
    ['application client', createApplicationConfig, 'client/action.jsx'],
    ['application shared code', createApplicationConfig, 'shared/action.jsx'],
    ['application registry', createApplicationConfig, 'registry/action.jsx'],
  ])('rejects direct calls in %s', async (_, factory, file) => {
    for (const expression of forbidden) {
      const messages = await restricted(
        factory,
        file,
        `export const action = () => ${expression};`,
      );
      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain(
        expression.includes('randomUUID') ? 'createUuid()' : 'copyText()',
      );
    }
  });

  it.each([
    [createApplicationConfig, 'server/action.mjs'],
    [createApplicationConfig, 'cli/action.mjs'],
    [createClientLibraryConfig, 'server/action.mjs'],
    [createClientLibraryConfig, 'cli/action.mjs'],
    [createClientLibraryConfig, 'scripts/action.mjs'],
    [createNodeLibraryConfig, 'src/action.mjs'],
  ])('allows Node APIs with %s in %s', async (factory, file) => {
    expect(
      await restricted(
        factory,
        file,
        'export const action = () => crypto.randomUUID();',
      ),
    ).toEqual([]);
  });

  it('allows the shared helpers in browser code', async () => {
    expect(
      await restricted(
        createApplicationConfig,
        'client/action.jsx',
        "import { createUuid, copyText } from '@nocobase/app-client'; export const action = () => copyText(createUuid());",
      ),
    ).toEqual([]);
  });

  it('preserves the CLI and browser environment restrictions', async () => {
    expect(
      await restricted(
        createApplicationConfig,
        'cli/action.js',
        'export const action = () => process.cwd();',
      ),
    ).toHaveLength(1);
    const eslint = new ESLint({
      cwd: root,
      overrideConfigFile: true,
      overrideConfig: createApplicationConfig({ tsconfigRootDir: root }),
    });
    const [result] = await eslint.lintText(
      'export const secret = import.meta.env.SECRET;',
      { filePath: path.join(root, 'client/env.jsx') },
    );
    expect(
      result?.messages.some(
        (message) => message.ruleId === 'no-restricted-syntax',
      ),
    ).toBe(true);
  });
});
