// Reading a command line against a manifest command (`kind: 'rest'`): the words after the command are its positional
// parameters, in order, and its flags, each a path, query or body parameter, or a file to send.
//
// Flags: `--name value` or `--name=value`; a boolean is `--name` or `--no-name`; an array repeats; a `json` value is
// JSON text, or `key=value` repeated for an object. A parameter with `contentFile` also takes `--<name>-file <path>`,
// parsed as JSON for a `json` parameter. A command whose body may come from a file takes `--<body.file> <path.json>`,
// whose fields the flags then override. An upload parameter (`in: 'file'`) is `--<name> <path>`, repeated when it takes
// several files; a ticket parameter is `--<name> <path>`, one file; a changed-files parameter is the boolean `--<name>`;
// a binary body field takes a path. A `download` command takes `--out <path>`. A command with a `fromEnv` parameter
// takes `--from-env`, which fills it from the environment variable named by another parameter's value. A parameter with
// `env` defaults, left off the line, takes the first of them the environment has (`envDefaultOf`). `--json`, `--help`
// (`-h`) and `--yes` (`-y`) are read wherever they appear.
//
// It touches no file, environment or terminal itself: `CliParseIo` does, so the CLI on a machine and an online run's
// shell read a line the same way.
import {
  DOWNLOAD_OUT_FLAG,
  EXIT_CODES,
  type ExitCode,
} from '@nocobase/agent-protocol';
import type { CommandSuggestion } from '@nocobase/cli-envelope';

import type { CliCommand, CliEnvDefault, CliParameter } from './manifest.ts';

/** A line the command cannot take, with what the cli-envelope says of it. */
export class CliParseError extends Error {
  readonly code: string;
  readonly exit: ExitCode;
  readonly suggestions: readonly CommandSuggestion[];
  readonly details: unknown;

  constructor(
    code: string,
    message: string,
    options: {
      readonly exit?: ExitCode;
      readonly suggestions?: readonly CommandSuggestion[];
      readonly details?: unknown;
    } = {},
  ) {
    super(message);
    this.name = 'CliParseError';
    this.code = code;
    this.exit = options.exit ?? EXIT_CODES.validation;
    this.suggestions = options.suggestions ?? [];
    this.details = options.details;
  }
}

/** A file to send, as the environment found it. */
export interface CliFileRef {
  /** Its base name, or for a changed file its path inside the directory. */
  readonly name: string;
  readonly size: number;
}

/** Where a line's files, environment and answers come from. */
export interface CliParseIo<F extends CliFileRef = CliFileRef> {
  /** A text file's content; undefined when it cannot be read. */
  readText(path: string): Promise<string | undefined>;
  /** An environment variable; undefined when it is not set. */
  env(name: string): string | undefined;
  /** A file to send; undefined when it is not a file. Absent where there are no files to send: such flags are refused. */
  file?(path: string): Promise<F | undefined>;
  /** The changed files of a directory (`changed`); `flag` names them in errors. */
  changed?(
    spec: NonNullable<CliParameter['changed']>,
    flag: string,
  ): Promise<readonly F[]>;
  /** Asks for a missing value; present only where someone can answer. */
  ask?(parameter: CliParameter): Promise<string>;
}

export interface CliParseOptions<F extends CliFileRef = CliFileRef> {
  /** The CLI's command name, for messages. */
  readonly bin: string;
  readonly io: CliParseIo<F>;
  /** `--yes` was given before the command. */
  readonly yes?: boolean;
  /** `--dry-run` was given: the command's own `dry-run` flag is set, and a command without one is refused. */
  readonly dryRun?: boolean;
}

/** What a line asks of a command. */
export interface CliCall<F extends CliFileRef = CliFileRef> {
  /** The value of each parameter given; a binary body field holds its files. */
  readonly values: ReadonlyMap<CliParameter, unknown>;
  /** The body's file, read: an object whose fields the flags override. */
  readonly bodyFile?: Readonly<Record<string, unknown>>;
  /** The files of each upload parameter. */
  readonly uploads: ReadonlyMap<CliParameter, readonly F[]>;
  /** The file streamed to the ticket the request answers. */
  readonly ticket?: F;
  /** Changed files sent with the request, by the field they fill. */
  readonly changed?: {
    readonly field: string;
    readonly files: readonly F[];
  };
  /** `--out`, as typed. */
  readonly out?: string;
  readonly yes: boolean;
  readonly json: boolean;
  readonly help: boolean;
}

const invalid = (message: string): CliParseError =>
  new CliParseError('INVALID_USAGE', message);

/** A command's words, such as `issue comment add`. */
export function commandWords(command: Pick<CliCommand, 'id'>): string {
  return command.id.split(':').join(' ');
}

/** The parameters a person types without a flag, in order. */
export function positionalOf(command: CliCommand): CliParameter[] {
  return command.parameters
    .filter((parameter) => parameter.position !== undefined)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

/** How a parameter is named on the line: `<issue>` or `--title`. */
export function parameterLabel(parameter: CliParameter): string {
  return parameter.position === undefined
    ? `--${parameter.name}`
    : `<${parameter.name}>`;
}

/** Whether running the command sends a file of the caller's, or saves one. */
export function needsLocalFiles(command: CliCommand): boolean {
  return (
    command.output.kind === 'download' ||
    command.parameters.some(
      (parameter) =>
        (parameter.in === 'file' || parameter.binary === true) &&
        parameter.required,
    )
  );
}

/** Whether a file name fits `accept` (extensions such as `.log`; media types are left to the server). */
export function accepts(accept: readonly string[], file: string): boolean {
  const extensions = accept.filter((entry) => entry.startsWith('.'));
  if (extensions.length === 0 || extensions.length < accept.length) return true;
  return extensions.some((extension) =>
    file.toLowerCase().endsWith(extension.toLowerCase()),
  );
}

/** A dot-separated path into parsed JSON, as text when it ends at a string or a number. */
function fieldAt(value: unknown, path: string): string | undefined {
  let at = value;
  for (const key of path.split('.')) {
    if (!at || typeof at !== 'object' || Array.isArray(at)) return undefined;
    at = (at as Record<string, unknown>)[key];
  }
  if (typeof at === 'number' && Number.isFinite(at)) return String(at);
  return typeof at === 'string' ? at : undefined;
}

/**
 * The first of `sources` the environment has: a variable that is set and not empty, or the field of the JSON file a
 * variable names. Undefined when none is; an unreadable file or a missing field falls through to the next source.
 */
export async function envDefaultOf(
  sources: readonly CliEnvDefault[],
  io: Pick<CliParseIo, 'env' | 'readText'>,
): Promise<string | undefined> {
  for (const source of sources) {
    if (typeof source === 'string') {
      const value = io.env(source);
      if (value) return value;
      continue;
    }
    const file = io.env(source.file);
    if (!file) continue;
    const text = await io.readText(file);
    if (text === undefined) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      continue;
    }
    const value = fieldAt(parsed, source.path);
    if (value) return value;
  }
  return undefined;
}

function scalar(parameter: CliParameter, raw: string): unknown {
  const label = parameterLabel(parameter);
  switch (parameter.type) {
    case 'number':
    case 'integer':
    case 'number[]': {
      const value = Number(raw);
      if (raw.trim() === '' || !Number.isFinite(value))
        throw invalid(`${label} must be a number.`);
      if (parameter.type === 'integer' && !Number.isInteger(value))
        throw invalid(`${label} must be a whole number.`);
      return value;
    }
    case 'boolean':
      if (raw === 'true' || raw === 'false') return raw === 'true';
      throw invalid(`${label} must be true or false.`);
    case 'json':
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return raw;
      }
    default:
      if (parameter.enum && !parameter.enum.includes(raw))
        throw invalid(`${label} must be one of ${parameter.enum.join(', ')}.`);
      return raw;
  }
}

/** Adds a typed value to what the parameter holds: arrays collect, a `json` object collects `key=value` pairs. */
function collect(
  parameter: CliParameter,
  previous: unknown,
  raw: string,
): unknown {
  if (parameter.type === 'string[]' || parameter.type === 'number[]')
    return [
      ...((previous as unknown[] | undefined) ?? []),
      scalar(parameter, raw),
    ];
  if (parameter.type === 'json') {
    const at = raw.indexOf('=');
    const parsed = scalar(parameter, raw);
    if (typeof parsed === 'string' && at > 0)
      return {
        ...(previous && typeof previous === 'object' && !Array.isArray(previous)
          ? previous
          : {}),
        [raw.slice(0, at)]: raw.slice(at + 1),
      };
    return parsed;
  }
  return scalar(parameter, raw);
}

/** A value a person can type at a prompt: not a file. */
const askable = (parameter: CliParameter): boolean =>
  parameter.in !== 'file' && !parameter.binary;

/** What a line without its required arguments is told, and how to see them all. */
export function missingArguments(
  bin: string,
  command: CliCommand,
  missing: readonly CliParameter[],
): CliParseError {
  const hint = (parameter: CliParameter): string => {
    if (parameter.ticket) return `--${parameter.name} <file>`;
    if (parameter.position !== undefined) return `<${parameter.name}>`;
    return parameter.contentFile
      ? `--${parameter.name} (or --${parameter.name}-file <path>)`
      : `--${parameter.name}`;
  };
  return new CliParseError(
    'MISSING_ARGUMENT',
    `${bin} ${commandWords(command)} needs ${missing.map(hint).join(', ')}.`,
    {
      suggestions: [
        ...missing.map((parameter) => ({
          message: `Pass ${hint(parameter)}${parameter.description ? `: ${parameter.description}` : '.'}`,
        })),
        {
          message: 'See its arguments and flags.',
          run: { command: bin, args: [...command.id.split(':'), '--help'] },
        },
      ],
      details: { missing: missing.map((parameter) => parameter.name) },
    },
  );
}

/** Reads the rest of the line, after the command's words, against the command's parameters. */
export async function parseCommandLine<F extends CliFileRef>(
  command: CliCommand,
  rest: readonly string[],
  options: CliParseOptions<F>,
): Promise<CliCall<F>> {
  const { bin, io } = options;
  const values = new Map<CliParameter, unknown>();
  const uploads = new Map<CliParameter, F[]>();
  const contentFiles = new Map<CliParameter, string>();
  const positional = positionalOf(command);
  const flags = new Map<string, CliParameter>();
  for (const parameter of command.parameters)
    if (parameter.position === undefined) {
      flags.set(parameter.name, parameter);
      if (parameter.alias) flags.set(parameter.alias, parameter);
    }
  const args: string[] = [];
  let bodyPath: string | undefined;
  let out: string | undefined;
  let yes = options.yes ?? false;
  let json = false;
  let help = false;
  const fileUploads: [CliParameter, string][] = [];
  const binaries: [CliParameter, string][] = [];
  let ticketPath: [CliParameter, string] | undefined;
  let changedFlag: CliParameter | undefined;
  const fromEnvTarget = command.parameters.find(
    (parameter) => parameter.fromEnv !== undefined,
  );
  let fromEnv = false;
  const unavailable = (name: string): CliParseError =>
    new CliParseError(
      'FILES_UNAVAILABLE',
      `--${name} sends a file from this machine; there are no files to send here.`,
    );

  for (let index = 0; index < rest.length; index += 1) {
    const word = rest[index];
    if (word === '--') {
      args.push(...rest.slice(index + 1));
      break;
    }
    if (word === '--help' || word === '-h') {
      help = true;
      continue;
    }
    if (word === '--json') {
      json = true;
      continue;
    }
    if (word === '--yes' || word === '-y') {
      yes = true;
      continue;
    }
    if (word === '--from-env' && fromEnvTarget) {
      fromEnv = true;
      continue;
    }
    if (!word.startsWith('-') || word === '-') {
      args.push(word);
      continue;
    }
    const long = word.startsWith('--');
    const equals = word.indexOf('=');
    const name = word.slice(long ? 2 : 1, equals === -1 ? undefined : equals);
    const inline = equals === -1 ? undefined : word.slice(equals + 1);
    const value = (): string => {
      if (inline !== undefined) return inline;
      const next = rest[index + 1];
      if (next === undefined) throw invalid(`--${name} needs a value.`);
      index += 1;
      return next;
    };
    const parameter = flags.get(name);
    if (parameter) {
      if ((parameter.in === 'file' || parameter.binary) && !io.file)
        throw unavailable(name);
      if (parameter.changed) {
        if (inline === undefined || inline === 'true') changedFlag = parameter;
        else if (inline === 'false') changedFlag = undefined;
        else throw invalid(`--${name} must be true or false.`);
      } else if (parameter.ticket) {
        if (ticketPath) throw invalid(`--${name} takes one file.`);
        ticketPath = [parameter, value()];
      } else if (parameter.in === 'file')
        fileUploads.push([parameter, value()]);
      else if (parameter.binary) binaries.push([parameter, value()]);
      else if (parameter.type === 'boolean' && inline === undefined)
        values.set(parameter, true);
      else
        values.set(
          parameter,
          collect(parameter, values.get(parameter), value()),
        );
      continue;
    }
    const negated = name.startsWith('no-')
      ? flags.get(name.slice(3))
      : undefined;
    if (negated?.changed) {
      changedFlag = undefined;
      continue;
    }
    if (negated?.type === 'boolean') {
      values.set(negated, false);
      continue;
    }
    const content = name.endsWith('-file')
      ? command.parameters.find(
          (candidate) =>
            candidate.contentFile && `${candidate.name}-file` === name,
        )
      : undefined;
    if (content) {
      contentFiles.set(content, value());
      continue;
    }
    if (command.body?.file !== undefined && name === command.body.file) {
      bodyPath = value();
      continue;
    }
    if (command.output.kind === 'download' && name === DOWNLOAD_OUT_FLAG) {
      out = value();
      continue;
    }
    throw invalid(
      `Unknown flag ${word.split('=')[0]}. Run \`${bin} ${commandWords(command)} --help\`.`,
    );
  }

  if (help)
    return {
      values,
      uploads,
      yes,
      json,
      help,
      ...(out === undefined ? {} : { out }),
    };

  if (args.length > positional.length)
    throw invalid(
      `Too many arguments: ${bin} ${commandWords(command)} takes ${positional.length}.`,
    );
  positional.forEach((parameter, index) => {
    const raw = args[index];
    if (raw !== undefined) values.set(parameter, scalar(parameter, raw));
  });
  for (const [parameter, file] of contentFiles) {
    if (values.has(parameter))
      throw invalid(
        `Give --${parameter.name} or --${parameter.name}-file, not both.`,
      );
    const text = await io.readText(file);
    if (text === undefined)
      throw invalid(`--${parameter.name}-file: cannot read ${file}.`);
    if (parameter.type !== 'json') {
      values.set(parameter, text);
      continue;
    }
    try {
      values.set(parameter, JSON.parse(text) as unknown);
    } catch {
      throw invalid(`--${parameter.name}-file: ${file} is not valid JSON.`);
    }
  }
  if (fromEnv && fromEnvTarget) {
    // The value is read here and goes only into the request: no message below repeats it.
    if (values.has(fromEnvTarget))
      throw invalid(
        `Give ${parameterLabel(fromEnvTarget)} or --from-env, not both.`,
      );
    const source = command.parameters.find(
      (parameter) => parameter.field === fromEnvTarget.fromEnv,
    );
    const variable = source ? values.get(source) : undefined;
    if (typeof variable !== 'string' || variable === '')
      throw invalid(
        `--from-env reads the environment variable named by ${source ? parameterLabel(source) : fromEnvTarget.fromEnv}; give it.`,
      );
    const value = io.env(variable);
    if (value === undefined)
      throw invalid(`--from-env: ${variable} is not set in this environment.`);
    values.set(fromEnvTarget, value);
  }
  const localFile = async (
    file: string,
    maxBytes?: number,
    accept?: readonly string[],
  ): Promise<F> => {
    const found = await io.file?.(file);
    if (!found) throw invalid(`${file} is not a file.`);
    if (maxBytes !== undefined && found.size > maxBytes)
      throw invalid(`${file} is larger than ${maxBytes} bytes.`);
    if (accept?.length && !accepts(accept, file))
      throw invalid(`${file} is not one of ${accept.join(', ')}.`);
    return found;
  };
  for (const [parameter, file] of fileUploads) {
    const list = uploads.get(parameter) ?? [];
    if (list.length > 0 && !parameter.upload?.multiple)
      throw invalid(`--${parameter.name} takes one file.`);
    list.push(await localFile(file, parameter.upload?.maxBytes));
    uploads.set(parameter, list);
  }
  for (const [parameter, file] of binaries) {
    const previous = (values.get(parameter) as F[] | undefined) ?? [];
    values.set(parameter, [...previous, await localFile(file)]);
  }
  const ticket = ticketPath
    ? await localFile(
        ticketPath[1],
        ticketPath[0].ticket?.maxBytes,
        ticketPath[0].ticket?.accept,
      )
    : undefined;
  let changed: CliCall<F>['changed'];
  if (changedFlag?.changed !== undefined) {
    if (!io.changed) throw unavailable(changedFlag.name);
    changed = {
      field: changedFlag.field,
      files: await io.changed(changedFlag.changed, changedFlag.name),
    };
  }

  let bodyFile: Record<string, unknown> | undefined;
  if (bodyPath !== undefined) {
    const text = await io.readText(bodyPath);
    if (text === undefined)
      throw invalid(
        `--${command.body?.file ?? 'file'}: cannot read ${bodyPath}.`,
      );
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      throw invalid(`${bodyPath} is not valid JSON.`);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw invalid(`${bodyPath} must hold a JSON object.`);
    bodyFile = parsed as Record<string, unknown>;
  }

  // What CI already knows, such as the repository and the commit, for what neither the line nor the body file gives.
  for (const parameter of command.parameters) {
    if (!parameter.env?.length || values.has(parameter)) continue;
    if (parameter.in === 'body' && bodyFile?.[parameter.field] !== undefined)
      continue;
    const value = await envDefaultOf(parameter.env, io);
    if (value !== undefined)
      values.set(parameter, collect(parameter, undefined, value));
  }

  if (options.dryRun) {
    const flag = command.parameters.find(
      (parameter) =>
        parameter.name === 'dry-run' && parameter.type === 'boolean',
    );
    if (!flag)
      throw new CliParseError(
        'DRY_RUN_UNSUPPORTED',
        `The server offers no dry run of \`${bin} ${commandWords(command)}\`; nothing was sent.`,
        {
          suggestions: [
            {
              message: 'Read what it does before running it without --dry-run.',
              run: { command: bin, args: [...command.id.split(':'), '--help'] },
            },
          ],
        },
      );
    values.set(flag, true);
  }

  const missing: CliParameter[] = [];
  for (const parameter of command.parameters) {
    if (!parameter.required || values.has(parameter)) continue;
    if (parameter.ticket) {
      if (ticket) continue;
      missing.push(parameter);
      continue;
    }
    if (parameter.in === 'body' && bodyFile?.[parameter.field] !== undefined)
      continue;
    if (parameter.default !== undefined) continue;
    if (askable(parameter) && io.ask) {
      values.set(
        parameter,
        collect(parameter, undefined, await io.ask(parameter)),
      );
      continue;
    }
    missing.push(parameter);
  }
  if (missing.length > 0) throw missingArguments(bin, command, missing);
  if (
    command.body?.file !== undefined &&
    command.body.required &&
    bodyFile === undefined &&
    !command.parameters.some(
      (parameter) => parameter.in === 'body' && values.has(parameter),
    )
  )
    throw invalid(`--${command.body.file} <file.json> is required.`);
  return {
    values,
    ...(bodyFile ? { bodyFile } : {}),
    uploads,
    ...(ticket ? { ticket } : {}),
    ...(changed ? { changed } : {}),
    ...(out === undefined ? {} : { out }),
    yes,
    json,
    help,
  };
}
