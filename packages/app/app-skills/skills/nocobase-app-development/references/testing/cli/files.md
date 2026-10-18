# CLI example: file output, dry runs and failures

Use `bindAppCommand()` and `runAppCommand()` from `@nocobase/app-testing/cli` to test an application command's argument parsing, returned data, text or JSON output, exit codes and file effects. This example writes a note to a new JSON file and needs no server or database. It assumes an existing NocoBase 3 application with `@nocobase/app-cli`, `@oclif/core`, `@nocobase/app-testing`, `@nocobase/dev-config` and Vitest installed at compatible versions.

## Configure the tests

Create `vitest.cli.config.ts` at the application root:

```ts
import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';

export default createNodeVitestConfig({
  cacheDir: './storage/tests/vite-cli',
  test: {
    include: ['tests/cli/**/*.test.ts'],
    fileParallelism: false,
    passWithNoTests: false,
  },
});
```

Keep these tests sequential. `runAppCommand()` temporarily captures process-wide output and restores the streams and exit code after each command; do not use `it.concurrent()` or run captured commands concurrently with `Promise.all()`.

## Write the command

Create `cli/commands/notes/create.ts`. Its location registers it as `app notes create`; the command returns plain data and lets `AppCommand` print the JSON envelope. The `wx` write flag prevents overwriting an existing file.

```ts
import { writeFile } from 'node:fs/promises';
import { AppCommand, CommandError, appPath } from '@nocobase/app-cli';
import { Flags } from '@oclif/core';

export interface CreateNoteResult {
  readonly file: string;
  readonly title: string;
  readonly written: boolean;
}

export default class CreateNote extends AppCommand {
  static override summary = 'Write a note to a new JSON file.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --title "Review invoice" --dry-run --json',
  ];
  static override flags = {
    title: Flags.string({
      required: true,
      description: 'The note title.',
    }),
    output: appPath({
      default: 'note.json',
      description: 'The new file to write.',
    }),
    'dry-run': Flags.boolean({
      default: false,
      description: 'Preview the result without writing a file.',
    }),
  };

  public async run(): Promise<CreateNoteResult> {
    const { flags } = await this.parse(CreateNote);
    const title = flags.title.trim();
    const file = flags.output;

    if (!title) {
      throw new CommandError('The title must not be blank.', {
        code: 'INVALID_TITLE',
        exit: 2,
      });
    }

    if (flags['dry-run']) {
      this.setStatus('success-noop');
      this.log(`Would create ${file}.`);
      return { file, title, written: false };
    }

    try {
      await writeFile(file, `${JSON.stringify({ title }, null, 2)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
      });
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'EEXIST'
      ) {
        throw new CommandError('The output file already exists.', {
          code: 'NOTE_EXISTS',
          details: { file },
          suggestions: ['Choose a different --output path.'],
        });
      }
      throw error;
    }

    this.log(`Created ${file}.`);
    return { file, title, written: true };
  }
}
```

`appPath()` resolves the default `note.json` from the application root. An explicit `--output` path resolves from the caller's current directory. Its parent directory must already exist. A dry run reports the planned file and title without attempting to write or checking whether the target already exists.

## Test the command

Create `tests/cli/create-note.test.ts`. Every test receives its own temporary application root and removes it afterwards. The tests import the real command class.

```ts
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { afterEach, beforeEach, expect, it } from 'vitest';
import CreateNote from '../../cli/commands/notes/create.js';

let rootDir: string;
let Command: typeof CreateNote;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), 'notes-cli-test-'));
  Command = bindAppCommand(CreateNote, {
    rootDir,
    id: 'app:notes:create',
  });
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

it('writes the note and returns one JSON document', async () => {
  const file = path.join(rootDir, 'note.json');
  const run = await runAppCommand(Command, [
    '--title',
    '  Review invoice  ',
    '--json',
  ]);

  expect(run.error).toBeUndefined();
  expect(run.exitCode ?? 0).toBe(0);
  expect(run.json()).toEqual({
    schemaVersion: 1,
    ok: true,
    command: 'app notes create',
    status: 'success',
    result: { file, title: 'Review invoice', written: true },
    warnings: [],
  });
  expect(await readFile(file, 'utf8')).toBe(
    JSON.stringify({ title: 'Review invoice' }, null, 2) + '\n',
  );
});

it('prints a readable result and honors --output', async () => {
  const file = path.join(rootDir, 'custom-note.json');
  const run = await runAppCommand(Command, [
    '--title',
    'Review invoice',
    '--output',
    file,
  ]);

  expect(run.error).toBeUndefined();
  expect(run.exitCode ?? 0).toBe(0);
  expect(run.stdout).toBe(`Created ${file}.\n`);
  expect(run.result).toEqual({ file, title: 'Review invoice', written: true });
  expect(await readFile(file, 'utf8')).toContain('Review invoice');
  expect(await readdir(rootDir)).toEqual(['custom-note.json']);
});

it('previews the result without writing a file', async () => {
  const file = path.join(rootDir, 'note.json');
  const run = await runAppCommand(Command, [
    '--title',
    'Review invoice',
    '--dry-run',
    '--json',
  ]);

  expect(run.error).toBeUndefined();
  expect(run.exitCode ?? 0).toBe(0);
  expect(run.json()).toMatchObject({
    ok: true,
    status: 'success-noop',
    result: { file, title: 'Review invoice', written: false },
  });
  expect(await readdir(rootDir)).toEqual([]);
});

it('refuses to overwrite an existing file', async () => {
  const file = path.join(rootDir, 'note.json');
  const original = JSON.stringify({ title: 'Keep this note' });
  await writeFile(file, original);

  const run = await runAppCommand(Command, [
    '--title',
    'Replacement',
    '--json',
  ]);

  expect(run.error).toBeUndefined();
  expect(run.exitCode).toBe(1);
  expect(run.json()).toMatchObject({
    ok: false,
    status: 'failure',
    error: {
      code: 'NOTE_EXISTS',
      details: { file },
      suggestions: [{ message: 'Choose a different --output path.' }],
    },
  });
  expect(await readFile(file, 'utf8')).toBe(original);
});

it.each([
  { name: 'missing title', args: [], code: 'INVALID_USAGE' },
  { name: 'blank title', args: ['--title', '   '], code: 'INVALID_TITLE' },
])('rejects $name without writing a file', async ({ args, code }) => {
  const run = await runAppCommand(Command, [...args, '--json']);

  expect(run.exitCode).toBe(2);
  expect(run.json()).toMatchObject({
    ok: false,
    status: 'failure',
    error: { code },
  });
  expect(await readdir(rootDir)).toEqual([]);
});
```

These six cases check the written content and JSON envelope, text output with an explicit destination, a dry run with no file effects, preservation of an existing file, missing required input and a blank title. `run.json()` parses all of stdout as one JSON value, so extra text on stdout makes the JSON check fail.

With `--json`, a handled `CommandError` becomes the failure document and `run.error` can be `undefined`; assert `run.exitCode` and `run.json().error.code`. For a successful run, `exitCode: undefined` means zero. Without `--json`, `run.error` holds the error that the outer CLI runner would render. These tests exercise the command class; command discovery and deployment packaging are separate checks.

## Choose a CLI fixture

Use `bindAppCommand()` for commands whose inputs and effects are files, flags or returned data. Its `rootDir` selects the test application root and `id` uses the runner's colon-separated command name. The helper does not create that directory, so the test creates it first. `runAppCommand()` exercises the command's parsing, lifecycle and output contract without spawning the outer runner.

If the command uses `withApp()` and needs real application services or records, use `bindTestAppCommand()` with `createTestAppConfig()`. Bind before running, close preparation database handles before the command starts, and dispose the configuration after the command finishes. The [database-backed example](command.md) shows the complete setup and both empty and populated results.

## Run and check

From the application root:

```bash
pnpm exec vitest run --config vitest.cli.config.ts --reporter=verbose
```

Expect one test file and six passing cases. To inspect the command through the CLI, start with its preview:

```bash
pnpm nocobase app notes create --title "Review invoice" --dry-run --json
```

For commands that open the application and read or write its database, use `createTestAppConfig()` with `bindTestAppCommand()` as shown in [the database-backed command example](command.md).

Return to [testing and verification](../../testing.md).
