/**
 * The plugin compiles against its own declaration of just-bash (`server/vendor/just-bash.d.ts`), which ships with the
 * bundle; `tsconfig.type-tests.json` checks that just-bash satisfies it where the plugin relies on it.
 */
import * as actual from 'just-bash';
import { expect, it } from 'vitest';

import type * as declared from '../server/vendor/just-bash.js';

/** `true` when `From` may be used where `To` is expected. */
type Fits<From, To> = [From] extends [To] ? true : false;

// What the plugin passes in, just-bash accepts. The filesystem is an `InMemoryFs` (or a view of one) and the command
// names come from `getCommandNames()`, so neither needs the full type declared.
const options: Fits<
  Omit<declared.BashOptions, 'fs' | 'commands'>,
  actual.BashOptions
> = true;
const memoryFs: Fits<actual.InMemoryFs, declared.IFileSystem> = true;
// What just-bash returns or hands a command, the plugin may read as declared.
const result: Fits<actual.BashExecResult, declared.BashExecResult> = true;
const context: Fits<actual.CommandContext, declared.CommandContext> = true;
const command: Fits<actual.Command, declared.Command> = true;
const exec: Fits<
  actual.Bash['exec'],
  (commandLine: string) => Promise<declared.BashExecResult>
> = true;
const functions: Pick<typeof declared, 'defineCommand' | 'getCommandNames'> =
  actual;

it('declares what just-bash exports', () => {
  expect([options, memoryFs, result, context, command, exec]).not.toContain(
    false,
  );
  expect(functions.getCommandNames()).toContain('cat');
  expect(typeof actual.Bash).toBe('function');
  expect(typeof actual.InMemoryFs).toBe('function');
});
