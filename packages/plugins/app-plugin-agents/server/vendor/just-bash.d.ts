// The part of `just-bash` this plugin uses, declared here so the published declarations do not reference `just-bash`,
// which the plugin bundles (`scripts/bundle-just-bash.mjs`) rather than depends on. `tsconfig.vendor.json` checks that
// `just-bash` satisfies it.

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface BashExecResult extends ExecResult {
  env: Record<string, string>;
}

/** The filesystem a shell runs over; only what this plugin calls is declared. */
export interface IFileSystem {
  readFile(path: string): Promise<string>;
  resolvePath(base: string, path: string): string;
}

export interface CommandContext {
  readonly fs: IFileSystem;
  readonly cwd: string;
  /** The shell's exported variables, what `env` lists. */
  readonly exportedEnv?: Readonly<Record<string, string>>;
}

export interface Command {
  name: string;
  trusted?: boolean;
  execute(args: string[], ctx: CommandContext): Promise<ExecResult>;
}

export type CustomCommand = Command;

export type CommandName = string;

export interface ExecutionLimits {
  maxExecutionTimeMs?: number;
  maxOutputSize?: number;
}

export interface BashOptions {
  fs?: IFileSystem;
  cwd?: string;
  env?: Record<string, string>;
  executionLimitProfile?: 'normal' | 'hardened';
  executionLimits?: ExecutionLimits;
  commands?: CommandName[];
  customCommands?: CustomCommand[];
}

export declare class Bash {
  constructor(options?: BashOptions);
  exec(commandLine: string): Promise<BashExecResult>;
}

export interface InMemoryFsOptions {
  maxTotalBytes?: number;
}

export declare class InMemoryFs implements IFileSystem {
  constructor(
    initialFiles?: Record<string, string>,
    options?: InMemoryFsOptions,
  );
  readFile(path: string): Promise<string>;
  resolvePath(base: string, path: string): string;
  writeFileSync(
    path: string,
    content: string,
    options?: undefined,
    metadata?: { mode?: number },
  ): void;
}

/** The names of the built-in commands. */
export declare function getCommandNames(): string[];

export declare function defineCommand(
  name: string,
  execute: (args: string[], ctx: CommandContext) => Promise<ExecResult>,
): Command;
