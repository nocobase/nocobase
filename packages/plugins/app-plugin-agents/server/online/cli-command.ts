/**
 * The application's CLI inside an online run's shell (`sandbox.ts`): `acme` (or whatever the CLI is called) built from
 * the same command manifest the real CLI reads, each command one request to its route, sent through the application
 * itself with the run's token. A route checks the run's identity as it would any request, so what the run may do is
 * exactly what the CLI would let it do.
 *
 * Help works offline from the manifest: `acme --help`, `acme <area> --help`, `acme <command> --help`, and
 * `acme docs [command]`. A command prints what a person reads by default and the cli-envelope with `--json`, and
 * exits with the CLI's codes. A line is read by the CLI's own parser (`@nocobase/app-cli-client/parse`), over the
 * shell: `--<flag>-file` and the body's `--file` read the shell's files, and `--from-env` its exported variables.
 * Commands that upload, stream or download files are refused: an online run has no files of its own to send.
 */
import {
  EXIT_CODES,
  readErrorBody,
  type ExitCode,
} from '@nocobase/agent-protocol';
import {
  apiExitCode,
  CliParseError,
  commandWords,
  helpColumns,
  needsLocalFiles,
  parseCommandLine,
  renderCommandHelp,
  renderTopicHelp,
  type CliCall,
  type CliParseIo,
} from '@nocobase/app-cli-client/parse';
import { fillRequest, requestText } from '@nocobase/app-cli-client/request';
import type { CliCommand } from '@nocobase/app-server/router';
import {
  commandFailureJson,
  commandSuccessJson,
  type CommandErrorJson,
} from '@nocobase/cli-envelope';
import {
  defineCommand,
  type Command,
  type CommandContext,
  type ExecResult,
} from '../vendor/just-bash.js';

/** What the shell's `acme` reaches: the run's commands, and the application answering them as the run. */
export interface CommandSurface {
  /** The command's name, such as `acme`. */
  readonly bin: string;
  readonly commands: readonly CliCommand[];
  /**
   * Sends a request as the run; `path` is the command's, below the server's origin. A JSON body is a string; a
   * `multipart/form-data` body is a form, whose content type the request sets.
   */
  send(request: {
    readonly method: string;
    readonly path: string;
    readonly body?: string | FormData;
  }): Promise<Response>;
}

const words = (id: string): string => id.split(':').join(' ');

class Failure extends Error {
  public constructor(
    public readonly error: CommandErrorJson,
    public readonly exit: ExitCode,
  ) {
    super(error.message);
  }
}

const usage = (message: string, code = 'INVALID_USAGE'): Failure =>
  new Failure({ code, message, suggestions: [] }, EXIT_CODES.validation);

/** The flags every command of the shell takes. */
const SHELL_FLAGS: readonly (readonly [string, string])[] = [
  ['--json', 'Print the answer as one JSON document.'],
];

function commandList(
  bin: string,
  commands: readonly CliCommand[],
  prefix: readonly string[],
): string | null {
  const topic = renderTopicHelp(bin, commands, prefix);
  if (topic === undefined) return null;
  return `${topic}\n\nRun \`${bin} <command> --help\` for a command's arguments and flags, \`${bin} docs <command>\` for all it does. Add --json to read an answer as JSON.`;
}

function commandHelp(bin: string, command: CliCommand): string {
  return renderCommandHelp(command, {
    bin,
    globalFlags: SHELL_FLAGS,
    localFiles: false,
  });
}

function commandDocs(bin: string, command: CliCommand): string {
  const output =
    command.output.kind === 'list'
      ? 'A list; `--json` has the items in `result.data` and paging in `result.meta`.'
      : command.output.kind === 'empty'
        ? 'Nothing: "Done." on success.'
        : 'One record; `--json` has it in `result.data`.';
  return [
    commandHelp(bin, command),
    '',
    'OUTPUT',
    `  ${output}`,
    '',
    'REQUEST',
    `  ${command.method} ${command.path}`,
    ...(command.action ? ['', 'ACTION', `  ${command.action}`] : []),
    ...(needsLocalFiles(command)
      ? [
          '',
          'NOTE',
          '  It needs a file on your machine, or saves one there: not available in this shell.',
        ]
      : []),
  ].join('\n');
}

/** The areas of the manifest, with how many commands each has. */
function areas(bin: string, commands: readonly CliCommand[]): string {
  const counts = new Map<string, number>();
  for (const command of commands) {
    const area = command.id.split(':')[0] ?? command.id;
    counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  return [
    `\`${bin} docs <command words>\` documents one command; \`${bin} <area> --help\` lists an area's commands.`,
    '',
    'AREAS',
    ...helpColumns(
      [...counts].map(
        ([area, count]) =>
          [area, `${count} command${count === 1 ? '' : 's'}`] as const,
      ),
    ),
  ].join('\n');
}

/** The command whose words start `args`, the longest one; and the arguments after them. */
function resolve(
  commands: readonly CliCommand[],
  args: readonly string[],
): { command: CliCommand; rest: string[] } | null {
  const leading: string[] = [];
  for (const word of args) {
    if (word.startsWith('-')) break;
    leading.push(word);
  }
  for (let length = leading.length; length > 0; length--) {
    const id = leading.slice(0, length).join(':');
    const command = commands.find((candidate) => candidate.id === id);
    if (command) return { command, rest: args.slice(length) };
  }
  return null;
}

/** The shell, as the parser reads it: its files, and its exported variables. No files to send, and no one to ask. */
function shellIo(ctx: CommandContext): CliParseIo {
  return {
    readText: async (path) => {
      try {
        return await ctx.fs.readFile(ctx.fs.resolvePath(ctx.cwd, path));
      } catch {
        return undefined;
      }
    },
    env: (name) => ctx.exportedEnv?.[name],
  };
}

/** Whether the line asks for help: `--help` or `-h` before any `--`. */
function asksHelp(rest: readonly string[]): boolean {
  for (const word of rest) {
    if (word === '--') return false;
    if (word === '--help' || word === '-h') return true;
  }
  return false;
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text =
    typeof value === 'string'
      ? value
      : typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : JSON.stringify(value);
  const line = text.replace(/\s+/gu, ' ').trim();
  return line.length > 80 ? `${line.slice(0, 79)}…` : line;
}

function valueAt(row: unknown, column: string): unknown {
  let current: unknown = row;
  for (const key of column.split('.')) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

const isScalar = (value: unknown): boolean =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value);

/** What a person reads of an answer: a list as a table, a record field by field, or its message. */
function render(
  command: CliCommand,
  data: unknown,
  meta: Readonly<Record<string, unknown>> | undefined,
): string {
  const message = typeof meta?.message === 'string' ? meta.message : undefined;
  if (Array.isArray(data)) {
    const first: unknown = data[0];
    const keys = command.output.columns?.length
      ? [...command.output.columns]
      : first && typeof first === 'object'
        ? Object.entries(first as Record<string, unknown>)
            .filter(([, value]) => isScalar(value))
            .map(([key]) => key)
            .slice(0, 6)
        : ['value'];
    const rows = data.map((row: unknown) =>
      keys.map((key) => cell(key === 'value' ? row : valueAt(row, key))),
    );
    const widths = keys.map((key, at) =>
      Math.max(key.length, ...rows.map((row) => row[at].length)),
    );
    const line = (cells: readonly string[]) =>
      cells
        .map((value, at) => value.padEnd(widths[at]))
        .join('  ')
        .trimEnd();
    const table =
      data.length === 0
        ? '(none)'
        : [line(keys.map((key) => key.toUpperCase())), ...rows.map(line)].join(
            '\n',
          );
    const more =
      typeof meta?.nextPageToken === 'string'
        ? `\n(more: --page-token ${meta.nextPageToken})`
        : '';
    return `${message ? `${message}\n` : ''}${table}${more}`;
  }
  if (message) return message;
  if (data === null || data === undefined) return 'Done.';
  if (typeof data === 'object')
    return Object.entries(data as Record<string, unknown>)
      .map(
        ([key, value]) =>
          `${key}: ${isScalar(value) ? String(value) : JSON.stringify(value)}`,
      )
      .join('\n');
  return typeof data === 'string' ? data : JSON.stringify(data);
}

function suggestionsFor(
  reason: string,
  bin: string,
): CommandErrorJson['suggestions'] {
  return reason === 'PLAN_REQUIRED'
    ? [
        {
          message: `Propose an operation plan instead: write it to a file under /tmp and run \`${bin} plan create --file /tmp/plan.json\`.`,
        },
      ]
    : [];
}

/** The request body: JSON, or a form for a `multipart/form-data` command (no files: the shell has none to send). */
function bodyOf(
  command: CliCommand,
  fields: Readonly<Record<string, unknown>>,
): string | FormData | undefined {
  if (!command.body) return undefined;
  if (command.body.media !== 'multipart/form-data')
    return JSON.stringify(fields);
  const form = new FormData();
  for (const [field, value] of Object.entries(fields))
    for (const item of Array.isArray(value) ? value : [value])
      if (item !== undefined && item !== null)
        form.append(field, requestText(item));
  return form;
}

async function call(
  surface: CommandSurface,
  command: CliCommand,
  parsed: CliCall,
): Promise<{ data: unknown; meta?: Record<string, unknown> }> {
  const filled = fillRequest(command, parsed.values, parsed.bodyFile);
  const body = bodyOf(command, filled.fields);
  const response = await surface.send({
    method: filled.method,
    path: filled.path,
    ...(body === undefined ? {} : { body }),
  });
  const text = await response.text();
  let answer: unknown;
  try {
    answer = text === '' ? undefined : JSON.parse(text);
  } catch {
    answer = undefined;
  }
  if (!response.ok) {
    const error = readErrorBody(answer);
    const reason = error?.reason ?? `HTTP_${response.status}`;
    throw new Failure(
      {
        code: reason,
        message:
          error?.message ??
          `${filled.method} ${filled.path.split('?')[0]} answered ${response.status}`,
        suggestions: suggestionsFor(reason, surface.bin),
        details: {
          httpStatus: response.status,
          ...(error?.status ? { status: error.status } : {}),
          ...(error?.metadata === undefined
            ? {}
            : { metadata: error.metadata }),
        },
      },
      apiExitCode(response.status, reason, error?.status),
    );
  }
  const record =
    answer && typeof answer === 'object'
      ? (answer as Record<string, unknown>)
      : {};
  return {
    data: record.data ?? null,
    ...(record.meta && typeof record.meta === 'object'
      ? { meta: record.meta as Record<string, unknown> }
      : {}),
  };
}

const out = (stdout: string, exitCode = 0): ExecResult => ({
  stdout: stdout.endsWith('\n') ? stdout : `${stdout}\n`,
  stderr: '',
  exitCode,
});

/** The `acme` command of a run's shell. */
export function cliCommand(surface: CommandSurface): Command {
  const { bin, commands } = surface;
  return defineCommand(bin, async (args, ctx) => {
    const json = args.includes('--json');
    const fail = (name: string, failure: Failure): ExecResult =>
      json
        ? {
            stdout: `${JSON.stringify(commandFailureJson(name, failure.error, []))}\n`,
            stderr: '',
            exitCode: failure.exit,
          }
        : {
            stdout: '',
            stderr: `Error: ${failure.error.message} (${failure.error.code})\n${failure.error.suggestions
              .map((suggestion) => `  ${suggestion.message}\n`)
              .join('')}`,
            exitCode: failure.exit,
          };
    const plain = args.filter((arg) => arg !== '--json');
    if (plain.length === 0 || plain[0] === '--help' || plain[0] === '-h')
      return out(commandList(bin, commands, [])!);
    if (plain[0] === 'docs') {
      const target = plain.slice(1).filter((arg) => !arg.startsWith('-'));
      if (target.length === 0) return out(areas(bin, commands));
      const found = resolve(commands, target);
      if (found && found.rest.length === 0)
        return out(commandDocs(bin, found.command));
      const list = commandList(bin, commands, target);
      if (list) return out(list);
      return fail(
        'docs',
        new Failure(
          {
            code: 'COMMAND_UNKNOWN',
            message: `There is no command ${target.join(' ')}.`,
            suggestions: [
              {
                message: 'List the commands.',
                run: { command: bin, args: ['--help'] },
              },
            ],
          },
          EXIT_CODES.notFound,
        ),
      );
    }
    // The line as typed when it starts with the command's words, so `--json` is read where it stands, as the CLI does.
    const found = resolve(commands, args) ?? resolve(commands, plain);
    if (!found) {
      const prefix = plain.filter((arg) => !arg.startsWith('-'));
      const list = commandList(bin, commands, prefix);
      if (list) return out(list);
      return fail(
        prefix.join(' '),
        new Failure(
          {
            code: 'COMMAND_UNKNOWN',
            message: `There is no command ${prefix.join(' ')} for you. Run \`${bin} --help\` for the ones you may run.`,
            suggestions: [
              {
                message: 'List the commands.',
                run: { command: bin, args: ['--help'] },
              },
            ],
          },
          EXIT_CODES.notFound,
        ),
      );
    }
    const { command, rest } = found;
    const name = words(command.id);
    try {
      if (needsLocalFiles(command) && !asksHelp(rest))
        throw usage(
          `${bin} ${commandWords(command)} needs a file on your machine, or saves one there; not available to an online agent.`,
          'FILES_UNAVAILABLE',
        );
      const parsed = await parseCommandLine(
        command,
        rest.includes('--json') || !json ? rest : [...rest, '--json'],
        { bin, io: shellIo(ctx) },
      );
      if (parsed.help) return out(commandHelp(bin, command));
      const answer = await call(surface, command, parsed);
      return parsed.json
        ? out(JSON.stringify(commandSuccessJson(name, 'success', answer, [])))
        : out(render(command, answer.data, answer.meta));
    } catch (error) {
      if (error instanceof Failure) return fail(name, error);
      if (error instanceof CliParseError)
        return fail(
          name,
          new Failure(
            {
              code: error.code,
              message: error.message,
              suggestions: [...error.suggestions],
              ...(error.details === undefined
                ? {}
                : { details: error.details }),
            },
            error.exit,
          ),
        );
      return fail(
        name,
        new Failure(
          {
            code: 'UNEXPECTED',
            message: error instanceof Error ? error.message : String(error),
            suggestions: [],
          },
          EXIT_CODES.general,
        ),
      );
    }
  });
}
