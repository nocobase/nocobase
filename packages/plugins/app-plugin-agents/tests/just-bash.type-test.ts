import type * as actual from 'just-bash';
import type * as declared from '../server/vendor/just-bash.js';

type Fits<From, To> = [From] extends [To] ? true : false;

// Values supplied by this plugin must be accepted by the pinned upstream API.
export const bashOptions: Fits<
  Omit<declared.BashOptions, 'fs' | 'commands'>,
  actual.BashOptions
> = true;
export const execOptions: Fits<declared.ExecOptions, actual.ExecOptions> = true;
export const command: Fits<declared.Command, actual.Command> = true;

// Values and callbacks supplied by upstream must satisfy the local declaration.
export const filesystem: Fits<actual.IFileSystem, declared.IFileSystem> = true;
export const memory: Fits<actual.InMemoryFs, declared.InMemoryFs> = true;
export const result: Fits<actual.BashExecResult, declared.BashExecResult> =
  true;
export const context: Fits<actual.CommandContext, declared.CommandContext> =
  true;
export const resolvedContext: Fits<
  ReturnType<typeof actual.createCommandContext>,
  declared.CommandContext
> = true;
export const exec: Fits<actual.Bash['exec'], declared.Bash['exec']> = true;
export const defineCommand: Fits<
  typeof actual.defineCommand,
  typeof declared.defineCommand
> = true;
export const commandNames: Fits<
  ReturnType<typeof actual.getCommandNames>,
  ReturnType<typeof declared.getCommandNames>
> = true;
