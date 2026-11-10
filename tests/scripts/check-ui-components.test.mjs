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

test('accepts an adjacent multiline JSX comment expression', () => {
  const result = inspect(`export const Page = () => <>{
    /* ui-component-exception: Browser directory picker adapter */
  }
    <input type="file"/>
  </>`);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.accepted[0].tag, 'input');
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

test('treats comment-like JSX text as display content, never as an exception', () => {
  for (const marker of [
    '// ui-component-exception: Browser directory picker adapter',
    '/* ui-component-exception: Browser directory picker adapter */',
  ]) {
    for (const control of ['', '<button>Save</button>']) {
      const result = inspect(`export const Help = () => <pre>
        ${marker}
        ${control}
      </pre>`);
      assert.deepEqual(result.accepted, []);
      assert.deepEqual(
        result.findings.map((item) => item.tag),
        control ? ['button'] : [],
      );
    }
  }
});

test('does not transfer a stale JSX exception to a later or nested control', () => {
  for (const elements of [
    '<Input/><button>Save</button>',
    '<input type="hidden"/><button>Save</button>',
    '<div><button>Save</button></div>',
    '<><button>Save</button></>',
    '{label}<button>Save</button>',
    'Visible text<button>Save</button>',
    '<Button render={<button/>}/><button>Save</button>',
  ]) {
    const result = inspect(`import { Button } from '#components/ui/button';
      export const Page = () => <>
        {/* ui-component-exception: Browser directory picker adapter */}
        ${elements}
      </>`);
    assert.deepEqual(result.accepted, [], elements);
    assert.deepEqual(
      result.findings.map((item) => item.tag),
      ['button', 'exception'],
      elements,
    );
  }
});

test('does not transfer a JavaScript exception across intervening code', () => {
  const result = inspect(`export function Page() {
    // ui-component-exception: Browser directory picker adapter
    const value = 1; return <button>{value}</button>;
  }`);
  assert.deepEqual(result.accepted, []);
  assert.deepEqual(
    result.findings.map((item) => item.tag),
    ['button', 'exception'],
  );
});

test('reports native and shadcn Input date pickers with a date picker recommendation', () => {
  const result = inspect(`import { Input } from '#components/ui/input';
    import { Input as TextInput, InputGroupInput as GroupInput } from '../components/ui/input-group.js';
    import * as UI from '#components/ui/input';
    export const Page = () => <>
      <input type='date'/><input type={'date'}/><input type={\`DATE\`}/>
      <Input type='date'/><TextInput type={'date'}/><GroupInput type='date'/><UI.Input type='date'/>
    </>`);
  assert.deepEqual(
    result.findings.map((item) => [item.tag, item.type, item.line]),
    [
      ['input', 'date', 5],
      ['input', 'date', 5],
      ['input', 'date', 5],
      ['Input', 'date', 6],
      ['TextInput', 'date', 6],
      ['GroupInput', 'date', 6],
      ['UI.Input', 'date', 6],
    ],
  );
  for (const finding of result.findings) {
    assert.match(
      finding.replacement,
      /DatePicker \(#components\/date-picker\)/,
    );
    assert.match(finding.replacement, /calendar, popover and button/);
    assert.match(
      finding.replacement,
      /ui\.shadcn\.com\/docs\/components\/base\/date-picker/,
    );
    assert.doesNotMatch(finding.replacement, /Checkbox|Switch/);
  }
  assert.equal(result.findings[3].column, 7);
});

test('keeps the time of a native or shadcn datetime-local input in its recommendation', () => {
  const result = inspect(`import { Input } from '#components/ui/input';
    export const Page = () => <><input type='datetime-local'/><Input type={'datetime-local'}/></>`);
  assert.deepEqual(
    result.findings.map((item) => item.type),
    ['datetime-local', 'datetime-local'],
  );
  for (const finding of result.findings) {
    assert.match(finding.replacement, /Input type='time'/);
    assert.match(finding.replacement, /keep the time/);
  }
});

test('does not let a primitive render prop hide a native date input', () => {
  const result = inspect(`import { Input } from '#components/ui/input';
    import { Button } from '#components/ui/button';
    export const Page = () => <>
      <Input render={<input type='date'/>}/><Button render={<input type='datetime-local'/>}/>
      <Input render={<input/>}/>
    </>`);
  assert.deepEqual(
    result.findings.map((item) => [item.tag, item.type]),
    [
      ['input', 'date'],
      ['input', 'datetime-local'],
    ],
  );
});

test('accepts date picker compositions, ordinary inputs, time inputs and undeclared wrappers', () => {
  const result = inspect(`import { Input } from '#components/ui/input';
    import { Calendar } from '#components/ui/calendar';
    import { Popover, PopoverContent, PopoverTrigger } from '#components/ui/popover';
    import { InputGroup, InputGroupInput } from '#components/ui/input-group';
    import { DatePicker } from '#components/date-picker';
    import { Input as Other } from '#components/fields/input';
    export const Page = ({ kind }) => <>
      <DatePicker value={date} onChange={setDate}/>
      <Popover><PopoverTrigger render={<Input value={text}/>}/><PopoverContent><Calendar mode='single'/></PopoverContent></Popover>
      <InputGroup><InputGroupInput value={text}/></InputGroup>
      <Input/><Input type='text'/><Input type='time'/><Input type='month'/><Input type={kind}/>
      <input type='hidden'/><Other type='date'/><Unknown type='date'/>
    </>`);
  assert.deepEqual(result.findings, []);
});

test('reviews a justified exception for a date input and rejects a stale one', () => {
  const accepted = inspect(`import { Input } from '#components/ui/input';
    export const Page = () => <>
      {/* ui-component-exception: Native date for a kiosk browser; docs/ui/pages/kiosk.md */}
      <Input type='date'/>
      <input type='date'/>
    </>`);
  assert.deepEqual(
    accepted.accepted.map((item) => [item.tag, item.type]),
    [['Input', 'date']],
  );
  assert.deepEqual(
    accepted.findings.map((item) => [item.tag, item.type]),
    [['input', 'date']],
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

test('CLI passes displayed markers but fails controls behind stale exceptions', (t) => {
  const app = fixture(t);
  app.write(
    'client/help.tsx',
    `export const Help = () => <pre>
    // ui-component-exception: Browser directory picker adapter
  </pre>`,
  );
  const help = app.run();
  assert.equal(help.status, 0, help.stdout);
  assert.match(help.stdout, /0 findings; 0 exceptions/);

  app.write(
    'client/adapter.tsx',
    `export const Page = () => <>
    {/* ui-component-exception: Browser directory picker adapter */}
    <Input/><button>Save</button>
  </>`,
  );
  const stale = app.run();
  assert.equal(stale.status, 1, stale.stdout);
  assert.match(stale.stdout, /<button>:/);
  assert.match(stale.stdout, /<exception>:/);
  assert.match(stale.stdout, /2 findings; 0 exceptions/);
});

test('CLI fails a native or shadcn date input with its location and date picker advice', (t) => {
  const app = fixture(t);
  app.write(
    'client/pages/native.tsx',
    `export const Page = () => <input type='date'/>`,
  );
  app.write(
    'client/pages/shadcn.tsx',
    `import { Input } from '#components/ui/input';
export const Page = () => <>
  <Input type='date'/>
  <Input type='datetime-local'/>
</>`,
  );
  const result = app.run();
  assert.equal(result.status, 1, result.stderr);
  assert.match(
    result.stdout,
    /client\/pages\/native\.tsx:1:27 <input type="date">: use the application's DatePicker/,
  );
  assert.match(
    result.stdout,
    /client\/pages\/shadcn\.tsx:3:3 <Input type="date">: use the application's DatePicker/,
  );
  assert.match(
    result.stdout,
    /client\/pages\/shadcn\.tsx:4:3 <Input type="datetime-local">: .*Input type='time'/,
  );
  assert.match(result.stdout, /3 findings; 0 exceptions/);

  app.write(
    'client/pages/native.tsx',
    `import { DatePicker } from '#components/date-picker';
export const Page = () => <DatePicker value={undefined} onChange={() => {}}/>`,
  );
  app.write(
    'client/pages/shadcn.tsx',
    `import { Input } from '#components/ui/input';
export const Page = () => <Input type='time'/>`,
  );
  const fixed = app.run();
  assert.equal(fixed.status, 0, fixed.stdout);
  assert.match(fixed.stdout, /Scanned 2 source files;.*0 findings/);

  app.write(
    'client/pages/broken.tsx',
    `export const Page = () => <Input type='date'`,
  );
  const broken = app.run();
  assert.equal(broken.status, 2, broken.stdout);
  assert.match(broken.stderr, /check incomplete/);
});

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

test('rejects a plain form that bypasses the route overlay discard question, a FeedbackForm without saved values and a draft-based dirty', () => {
  const result = inspect(`import { useForm } from 'react-hook-form';
    import { RouteDialog } from '#components/route-dialog';
    import { FeedbackForm } from '#components/feedback-form';
    export const Edit = () => <RouteDialog title='Edit' dirty={storageFailed ? isDirty : undefined}>
      <form id='repair' onSubmit={save}><Input {...form.register('name')}/></form>
      <FeedbackForm id='other' onSubmit={save}/>
      <FeedbackForm id='ok' values={form.getValues} savedValues={saved} onSubmit={save}/>
      <form role='search'><Input aria-label='Find'/></form>
    </RouteDialog>`);
  assert.deepEqual(
    result.findings.map((item) => [item.tag, item.line]),
    [
      ['RouteDialog', 4],
      ['form', 5],
      ['FeedbackForm', 6],
    ],
  );
  assert.match(
    result.findings[1].replacement,
    /FeedbackForm.*savedValues.*M7\.4/,
  );
  assert.match(
    result.findings[2].replacement,
    /values=\{form\.getValues\}.*savedValues/,
  );
  assert.match(result.findings[0].replacement, /never derive it from a draft/);
});

test('lets no exception marker waive the discard question of a create or edit form', () => {
  const result = inspect(`import { useForm } from 'react-hook-form';
    export const Edit = () => <>
      {/* ui-component-exception: the draft is kept, so no discard prompt is needed */}
      <form onSubmit={save}/>
    </>`);
  assert.deepEqual(
    result.findings.map((item) => item.tag),
    ['form', 'exception'],
  );
  assert.deepEqual(result.accepted, []);
});

test('leaves forms that are not create or edit forms alone', () => {
  // A chat composer without React Hook Form or an overlay, a tool form on a page, and FeedbackForm's own <form>.
  assert.deepEqual(
    inspect(
      `export const Chat = () => <form onSubmit={send}><Textarea/></form>`,
    ).findings,
    [],
  );
  assert.deepEqual(
    inspect(`import { useForm } from 'react-hook-form';
      import { PageContainer } from '#components/page-container';
      export const Tool = () => <PageContainer><FeedbackForm onSubmit={run}/></PageContainer>`)
      .findings,
    [],
  );
  assert.deepEqual(
    inspect(`import { useForm } from 'react-hook-form';
      export function FeedbackForm() { return <form noValidate/>; }`).findings,
    [],
  );
});

test('reads the spread props of a FeedbackForm, and reports values it cannot confirm instead of passing them', () => {
  const result = inspect(`import { useForm } from 'react-hook-form';
    import { RouteDialog } from '#components/route-dialog';
    import { FeedbackForm } from '#components/feedback-form';
    const compared = { values: form.getValues, savedValues: saved };
    const partial = { values: form.getValues };
    export const Edit = ({ formProps }) => <RouteDialog title='Edit'>
      <FeedbackForm id='a' {...compared} onSubmit={save}/>
      <FeedbackForm id='b' {...{ values: form.getValues, ...{ savedValues: saved } }} onSubmit={save}/>
      <FeedbackForm id='c' {...partial} savedValues={saved} onSubmit={save}/>
      <FeedbackForm id='d' {...partial} onSubmit={save}/>
      <FeedbackForm id='e' {...formProps} onSubmit={save}/>
      <FeedbackForm id='f' {...useFormProps()} values={form.getValues} onSubmit={save}/>
    </RouteDialog>`);
  assert.deepEqual(
    result.findings.map((item) => [item.tag, item.line]),
    [
      ['FeedbackForm', 10],
      ['FeedbackForm', 11],
      ['FeedbackForm', 12],
    ],
  );
  assert.match(result.findings[0].replacement, /values=\{form\.getValues\}/);
  assert.doesNotMatch(result.findings[0].replacement, /spread/);
  assert.match(result.findings[1].replacement, /spread.*cannot confirm/);
  assert.match(result.findings[2].replacement, /spread.*cannot confirm/);
});
