// Only the just-bash surface used by this plugin. Published declarations must not require just-bash.
// tests/just-bash.type-test.ts checks this contract against the pinned development dependency.
export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
export interface BashExecResult extends ExecResult {
  env: Record<string, string>;
}
export type FileContent = string | Uint8Array;
export interface FsStat {
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  mode: number;
  size: number;
  mtime: Date;
}
export interface MkdirOptions {
  recursive?: boolean;
}
export interface RmOptions extends MkdirOptions {
  force?: boolean;
}
export interface CreateExclusiveOptions {
  mode: number;
  directory?: boolean;
}
export interface IFileSystem {
  readFile(path: string): Promise<string>;
  // Upstream returns an opaque ByteString, which this plugin never interprets.
  readFileBytes?(path: string): Promise<unknown>;
  readFileBuffer(path: string): Promise<Uint8Array>;
  writeFile(path: string, content: FileContent): Promise<void>;
  appendFile(path: string, content: FileContent): Promise<void>;
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<FsStat>;
  mkdir(path: string, options?: MkdirOptions): Promise<void>;
  createExclusive?(
    path: string,
    options: CreateExclusiveOptions,
  ): Promise<void>;
  readdir(path: string): Promise<string[]>;
  rm(path: string, options?: RmOptions): Promise<void>;
  cp(src: string, dest: string, options?: MkdirOptions): Promise<void>;
  mv(src: string, dest: string): Promise<void>;
  resolvePath(base: string, path: string): string;
  getAllPaths(): string[];
  chmod(path: string, mode: number): Promise<void>;
  symlink(target: string, linkPath: string): Promise<void>;
  link(existingPath: string, newPath: string): Promise<void>;
  readlink(path: string): Promise<string>;
  lstat(path: string): Promise<FsStat>;
  realpath(path: string): Promise<string>;
  utimes(path: string, atime: Date, mtime: Date): Promise<void>;
}
export interface InMemoryFsOptions {
  maxTotalBytes?: number;
}
export declare class InMemoryFs implements IFileSystem {
  constructor(
    initialFiles?: Record<string, FileContent>,
    options?: InMemoryFsOptions,
  );
  readFile(path: string): Promise<string>;
  readFileBytes(path: string): Promise<unknown>;
  readFileBuffer(path: string): Promise<Uint8Array>;
  writeFile(path: string, content: FileContent): Promise<void>;
  writeFileSync(path: string, content: FileContent): void;
  writeFileLazy(
    path: string,
    lazy: () => FileContent | Promise<FileContent>,
  ): void;
  appendFile(path: string, content: FileContent): Promise<void>;
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<FsStat>;
  mkdir(path: string, options?: MkdirOptions): Promise<void>;
  mkdirSync(path: string, options?: MkdirOptions): void;
  createExclusive(path: string, options: CreateExclusiveOptions): Promise<void>;
  readdir(path: string): Promise<string[]>;
  rm(path: string, options?: RmOptions): Promise<void>;
  cp(src: string, dest: string, options?: MkdirOptions): Promise<void>;
  mv(src: string, dest: string): Promise<void>;
  resolvePath(base: string, path: string): string;
  getAllPaths(): string[];
  chmod(path: string, mode: number): Promise<void>;
  symlink(target: string, linkPath: string): Promise<void>;
  link(existingPath: string, newPath: string): Promise<void>;
  readlink(path: string): Promise<string>;
  lstat(path: string): Promise<FsStat>;
  realpath(path: string): Promise<string>;
  utimes(path: string, atime: Date, mtime: Date): Promise<void>;
}
export interface CommandContext {
  readonly fs: IFileSystem;
  readonly cwd: string;
  readonly exportedEnv?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
}
export interface Command {
  name: string;
  trusted?: boolean;
  execute(args: string[], ctx: CommandContext): Promise<ExecResult>;
}
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
  customCommands?: Command[];
  python?: false;
  javascript?: false;
}
export interface ExecOptions {
  signal?: AbortSignal;
}
export declare class Bash {
  constructor(options?: BashOptions);
  exec(commandLine: string, options?: ExecOptions): Promise<BashExecResult>;
}
export declare function getCommandNames(): CommandName[];
export declare function defineCommand(
  name: string,
  execute: (args: string[], ctx: CommandContext) => Promise<ExecResult>,
): Command;
export declare function createCommandContext(options: {
  fs: IFileSystem;
  signal?: AbortSignal;
}): CommandContext;
