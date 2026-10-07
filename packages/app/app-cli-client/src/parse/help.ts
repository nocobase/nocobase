// The help of a manifest command, and the list of an area's commands, as text: what the CLI on a machine and an online
// run's shell both print.
import { DOWNLOAD_OUT_FLAG } from '@nocobase/agent-protocol';

import { commandWords, parameterLabel, positionalOf } from './arguments.ts';
import type { CliCommand, CliEnvDefault, CliParameter } from './manifest.ts';

/** A help row: the flag as typed, and what it does. */
export type HelpRow = readonly [string, string];

export interface CommandHelpOptions {
  /** The CLI's command name. */
  readonly bin: string;
  /** Listed under GLOBAL FLAGS; the section is left out when empty. */
  readonly globalFlags?: readonly HelpRow[];
  /** Whether the flags that send or save a file of the caller's are offered; true by default. */
  readonly localFiles?: boolean;
}

/** Rows as two aligned columns, indented. */
export function helpColumns(rows: readonly HelpRow[]): string[] {
  const width = Math.max(...rows.map(([left]) => left.length));
  return rows.map(([left, right]) =>
    `  ${left.padEnd(width)}  ${right}`.trimEnd(),
  );
}

/** Where a default comes from, as help names it: `$GITHUB_REPOSITORY or $CI_PROJECT_PATH`. */
function envLabel(sources: readonly CliEnvDefault[]): string {
  return sources
    .map((source) =>
      typeof source === 'string'
        ? `$${source}`
        : `${source.path} of $${source.file}`,
    )
    .join(' or ');
}

function valueHint(parameter: CliParameter): string {
  if (parameter.type === 'boolean') return '';
  if (parameter.in === 'file' || parameter.binary) return ' <path>';
  if (parameter.enum) return ` <${parameter.enum.join('|')}>`;
  if (parameter.type === 'string[]' || parameter.type === 'number[]')
    return ' <value>…';
  if (parameter.type === 'json') return ' <json|key=value>';
  return ` <${parameter.type}>`;
}

/** The FLAGS rows of a command. */
export function flagRows(
  command: CliCommand,
  localFiles: boolean = true,
): HelpRow[] {
  const lines: HelpRow[] = [];
  for (const parameter of command.parameters) {
    if (parameter.position !== undefined) continue;
    if (!localFiles && (parameter.in === 'file' || parameter.binary)) continue;
    const notes = [
      parameter.required ? 'required' : '',
      parameter.default !== undefined
        ? `default: ${JSON.stringify(parameter.default)}`
        : '',
      parameter.env?.length ? `default from ${envLabel(parameter.env)}` : '',
      parameter.upload?.multiple ? 'repeat for more' : '',
      parameter.ticket
        ? `streamed; at most ${parameter.ticket.maxBytes} bytes`
        : '',
      parameter.changed
        ? `sends the files changed in ${parameter.changed.dir}, at most ${parameter.changed.maxFiles}`
        : '',
      (parameter.type === 'string[]' || parameter.type === 'number[]') &&
      !parameter.upload
        ? 'repeat for more'
        : '',
    ].filter(Boolean);
    lines.push([
      `${parameter.alias ? `-${parameter.alias}, ` : ''}--${parameter.name}${valueHint(parameter)}`,
      `${parameter.description ?? ''}${notes.length > 0 ? ` (${notes.join(', ')})` : ''}`.trim(),
    ]);
    if (parameter.contentFile)
      lines.push([
        `--${parameter.name}-file <path>`,
        `Read --${parameter.name} from a file.`,
      ]);
  }
  const fromEnv = command.parameters.find(
    (parameter) => parameter.fromEnv !== undefined,
  );
  if (fromEnv) {
    const source = command.parameters.find(
      (parameter) => parameter.field === fromEnv.fromEnv,
    );
    lines.push([
      '--from-env',
      `Read ${parameterLabel(fromEnv)} from the environment variable named by ${source ? parameterLabel(source) : fromEnv.fromEnv}, keeping it off the command line.`,
    ]);
  }
  if (command.body?.file)
    lines.push([
      `--${command.body.file} <file.json>`,
      'The request body as a JSON object; the flags override its fields.',
    ]);
  if (localFiles && command.output.kind === 'download')
    lines.push([
      `--${DOWNLOAD_OUT_FLAG} <path>`,
      'Where to save the file: a path, or a directory to save it into (default: the current directory, under its own name).',
    ]);
  return lines;
}

/** A command's help: usage, arguments, flags, description and examples. */
export function renderCommandHelp(
  command: CliCommand,
  options: CommandHelpOptions,
): string {
  const { bin } = options;
  const positional = positionalOf(command);
  const flags = flagRows(command, options.localFiles ?? true);
  const globals = options.globalFlags ?? [];
  const usage = [
    bin,
    commandWords(command),
    ...positional.map((parameter) =>
      parameter.required ? `<${parameter.name}>` : `[<${parameter.name}>]`,
    ),
    '[flags]',
  ].join(' ');
  return [
    command.summary,
    '',
    'USAGE',
    `  $ ${usage}`,
    ...(positional.length > 0
      ? [
          '',
          'ARGUMENTS',
          ...helpColumns(
            positional.map((parameter) => [
              parameter.name,
              `${parameter.description ?? ''}${parameter.required ? '' : ' (optional)'}`.trim(),
            ]),
          ),
        ]
      : []),
    ...(flags.length > 0 ? ['', 'FLAGS', ...helpColumns(flags)] : []),
    ...(globals.length > 0
      ? ['', 'GLOBAL FLAGS', ...helpColumns(globals)]
      : []),
    ...(command.description
      ? ['', 'DESCRIPTION', `  ${command.description}`]
      : []),
    ...(command.examples?.length
      ? [
          '',
          'EXAMPLES',
          ...command.examples.map((example) => `  $ ${bin} ${example}`),
        ]
      : []),
  ].join('\n');
}

/** The commands under `prefix` (all with an empty prefix), one line each; undefined when there are none. */
export function renderCommandList(
  commands: readonly CliCommand[],
  prefix: readonly string[] = [],
): string | undefined {
  const start = prefix.join(':');
  const listed = commands.filter(
    (command) =>
      !start || command.id === start || command.id.startsWith(`${start}:`),
  );
  if (listed.length === 0) return undefined;
  return helpColumns(
    listed.map((command) => [commandWords(command), command.summary]),
  ).join('\n');
}

/** The help of the commands under `prefix`; undefined when there are none. */
export function renderTopicHelp(
  bin: string,
  commands: readonly CliCommand[],
  prefix: readonly string[],
): string | undefined {
  const list = renderCommandList(commands, prefix);
  if (!list) return undefined;
  return [
    'USAGE',
    `  $ ${[bin, ...prefix, 'COMMAND'].join(' ')}`,
    '',
    'COMMANDS',
    list,
  ].join('\n');
}
