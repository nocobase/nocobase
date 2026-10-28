import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  readFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import ts from 'typescript';

import { inspectSource } from '../../packages/app/app-skills/skills/nocobase-app-development/scripts/check-ui-components.mjs';

const checker = fileURLToPath(
  new URL(
    '../../packages/app/app-skills/skills/nocobase-app-development/scripts/check-ui-components.mjs',
    import.meta.url,
  ),
);
const root = resolve('/fixture');
const file = resolve(root, 'client/pages/customer.tsx');
const inspect = (source) => inspectSource(ts, source, file, root);

test('finds duplicate native controls, widget roles and clickable layout nodes with source locations', () => {
  const result = inspect(`export const Page = () => <>
    <button>Save</button><input/><select/><textarea/><dialog/>
    <div role={'switch'}/><span onClick={save}>Save</span><summary>Details</summary>
  </>`);
  assert.deepEqual(
    result.findings.map((item) => item.tag),
    [
      'button',
      'input',
      'select',
      'textarea',
      'dialog',
      'div',
      'span',
      'summary',
    ],
  );
  assert.equal(result.findings[0].line, 2);
  assert.equal(result.findings[0].column, 5);
});

test('does not confuse semantic layout, hidden fields, component use, strings or comments with primitives', () => {
  const result = inspect(`// <button>example</button>
    const example = '<select/>';
    export const Page = () => <main><form><label>Name</label><Input/><SaveButton/>
      <input type="hidden"/><input type={'hidden'}/><nav><a href="/home">Home</a></nav>
      <table><tbody><tr><td>Data</td></tr></tbody></table><p>{example}</p>
    </form></main>`);
  assert.deepEqual(result.findings, []);
});

test('recognizes aliased and namespace primitive imports in direct Base UI render composition', () => {
  const result =
    inspect(`import { Button as Action } from '#components/ui/button';
    import * as UI from '../components/ui/input.js';
    export const Page = () => <>
      <Action render={<button/>}>Save</Action><UI.Input render={(<input/>)}/>
      <Action><button>Unwrapped child</button></Action>
      <Unknown render={<button/>}/>
    </>`);
  assert.deepEqual(
    result.findings.map((item) => item.tag),
    ['button', 'button'],
  );
});

test('does not treat similar paths or type-only imports as a primitive owner', () => {
  const result = inspect(`import { Button } from '#components/ui-fake/button';
    import type { Input } from '#components/ui/input';
    export const Page = () => <><Button render={<button/>}/><Input render={<input/>}/></>`);
  assert.equal(result.findings.length, 2);
});

test('accepts one adjacent JSX exception and reports it for review without exempting siblings', () => {
  const result = inspect(`export const Page = () => <>
    {/* ui-component-exception: Browser directory selection; docs/ui/pages/import.md */}
    <input type="file" webkitdirectory=""/><button>Save</button>
  </>`);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.accepted[0].tag, 'input');
  assert.deepEqual(
    result.findings.map((item) => item.tag),
    ['button'],
  );
});

test('accepts an adjacent JavaScript comment for a narrowly scoped native adapter', () => {
  const result = inspect(`export const DirectoryInput = () => (
    // ui-component-exception: Browser directory picker adapter; docs/ui/pages/import.md
    <input type="file" />
  );`);
  assert.equal(result.accepted.length, 1);
  assert.deepEqual(result.findings, []);
});

test('rejects empty, placeholder, stale and non-adjacent exception markers', () => {
  for (const reason of ['', 'TODO', 'N/A']) {
    const result = inspect(`export const Page = () => <>
      {/* ui-component-exception: ${reason} */}
      <button/>
    </>`);
    assert.equal(result.accepted.length, 0);
    assert.ok(result.findings.some((item) => item.tag === 'button'));
    assert.ok(result.findings.some((item) => item.tag === 'exception'));
  }
  const result = inspect(`export const Page = () => <>
    {/* ui-component-exception: An old adapter */}
    <Button/>
    <button/>
  </>`);
  assert.equal(result.accepted.length, 0);
  assert.equal(result.findings.length, 2);
});

test('rejects malformed JSX instead of returning a clean scan', () => {
  assert.throws(
    () => inspect('export const Page = () => <button'),
    /customer\.tsx/,
  );
});

test('preserves the boundary between JavaScript strings and real exception comments', () => {
  const result = inspect(`export const Page = () => <>
    {'/* ui-component-exception: This is display text, not authorization */'}
    <button/>
  </>`);
  assert.equal(result.accepted.length, 0);
  assert.deepEqual(
    result.findings.map((item) => item.tag),
    ['button'],
  );
});

function fixture(t) {
  const directory = mkdtempSync(resolve(tmpdir(), 'nb-ui-components-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  function write(name, content) {
    const path = resolve(directory, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  write('package.json', '{}');
  mkdirSync(resolve(directory, 'node_modules'));
  symlinkSync(
    dirname(createRequire(import.meta.url).resolve('typescript/package.json')),
    resolve(directory, 'node_modules/typescript'),
    'dir',
  );
  return {
    directory,
    write,
    run: (...args) =>
      spawnSync(process.execPath, [checker, '--root', directory, ...args], {
        encoding: 'utf8',
      }),
  };
}

test('CLI scans application and plugin business components while excluding primitives, tests and generated directories', (t) => {
  const app = fixture(t);
  app.write('client/pages/index.tsx', 'export const Page = () => <Button/>');
  app.write(
    'client/components/save-button.tsx',
    'export const SaveButton = () => <button/>',
  );
  for (const name of [
    'client/components/ui/button.tsx',
    'client/__tests__/page.tsx',
    'client/field.test.tsx',
    'client/demo.stories.tsx',
    'dist/page.tsx',
    'client/generated/page.tsx',
    'client/vendor/page.tsx',
  ]) {
    app.write(name, 'export const Component = () => <button/>');
  }
  const result = app.run();
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /client\/components\/save-button.tsx:1:/);
  assert.match(result.stdout, /Scanned 2 source files;.*1 findings/);
  const scoped = app.run('client/pages/index.tsx');
  assert.equal(scoped.status, 0, scoped.stderr);
  assert.match(scoped.stdout, /Scanned 1 source files/);
});

test('CLI reports skipped inputs and rejects missing paths, traversal, invalid options and missing compiler', (t) => {
  const app = fixture(t);
  app.write(
    'client/components/ui/button.tsx',
    'export const Button = () => <button/>',
  );
  const skipped = app.run('client/components/ui/button.tsx');
  assert.equal(skipped.status, 0);
  assert.match(skipped.stdout, /Scanned 0 source files; skipped 1 paths/);
  for (const args of [
    ['client/missing.tsx'],
    ['../outside'],
    ['--unknown'],
    ['--root'],
  ]) {
    const result = app.run(...args);
    assert.equal(result.status, 2, result.stdout);
    assert.match(result.stderr, /check incomplete/);
  }
  rmSync(resolve(app.directory, 'node_modules/typescript'));
  const missing = app.run();
  assert.equal(missing.status, 2);
  assert.match(
    missing.stderr,
    /Install this project's development dependencies/,
  );
});

test('distributed script resolves the target project compiler after being copied out of this repository', (t) => {
  const app = fixture(t);
  app.write('client/pages/index.tsx', 'export const Page = () => <Input/>');
  app.write(
    '.agents/skills/nocobase-app-development/scripts/check-ui-components.mjs',
    readFileSync(checker),
  );
  const result = spawnSync(
    process.execPath,
    [
      resolve(
        app.directory,
        '.agents/skills/nocobase-app-development/scripts/check-ui-components.mjs',
      ),
      '--root',
      app.directory,
    ],
    { encoding: 'utf8', cwd: tmpdir() },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /0 findings; 0 exceptions/);
});

test('CLI executes through the mirrored Claude skill symlink and reports native exceptions', (t) => {
  const app = fixture(t);
  app.write(
    'client/adapter.tsx',
    `export const Input = () => (
    // ui-component-exception: Native browser adapter; docs/ui/pages/import.md
    <input type="file"/>
  );`,
  );
  const target =
    '.agents/skills/nocobase-app-development/scripts/check-ui-components.mjs';
  app.write(target, readFileSync(checker));
  mkdirSync(resolve(app.directory, '.claude/skills'), { recursive: true });
  symlinkSync(
    '../../.agents/skills/nocobase-app-development',
    resolve(app.directory, '.claude/skills/nocobase-app-development'),
    'dir',
  );
  const result = spawnSync(
    process.execPath,
    [
      resolve(
        app.directory,
        '.claude/skills/nocobase-app-development/scripts/check-ui-components.mjs',
      ),
      '--root',
      app.directory,
    ],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /REVIEW EXCEPTION <input>: Native browser adapter/,
  );
  assert.match(
    result.stdout,
    /Scanned 1 source files;.*1 exceptions requiring review/,
  );
});
