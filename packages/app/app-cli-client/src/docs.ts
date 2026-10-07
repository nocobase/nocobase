// `<bin> docs [command]`: a command's documentation, read from the server's manifest (or the cached one offline): its
// help with what it answers, who may run it and the action it needs, and its examples; without a command, how the CLI
// works and the commands by area. `--json` answers the same as data.
import { Args, Help, type Command } from '@oclif/core';

import { EXIT_CODES } from '@nocobase/agent-protocol';

import type { AppCliConfig } from './config.ts';
import {
  loadDynamic,
  resolveCommand,
  withheldCommand,
} from './dynamic/index.ts';
import type { CliCommand, CliManifest } from './dynamic/manifest.ts';
import { renderCommandHelp } from './dynamic/output.ts';
import { AppCommand, UsageError } from './lib/command.ts';
import { GLOBAL_FLAG_HELP } from './lib/globals.ts';

const words = (id: string): string => id.split(':').join(' ');

/** What the command answers, in words. */
function outputText(command: CliCommand): string {
  switch (command.output.kind) {
    case 'list':
      return `A list${command.output.columns?.length ? `, shown as a table of ${command.output.columns.join(', ')}` : ''}; \`--json\` has every field in \`result.data\` and paging in \`result.meta\`.`;
    case 'download':
      return 'A file, saved in the current directory under its own name or where `--out` says; `--json` answers where it went.';
    case 'empty':
      return 'Nothing: "Done." on success.';
    default:
      return 'One record, field by field; `--json` has it in `result.data`.';
  }
}

/** A command's documentation as text. */
export function commandDocs(command: CliCommand, bin: string): string {
  const who = command.identities.includes('run')
    ? command.identities.includes('person')
      ? 'People, and agents in a run'
      : 'Only agents in a run'
    : 'People (a sign-in or an API key)';
  return [
    renderCommandHelp(command),
    '',
    'OUTPUT',
    `  ${outputText(command)}`,
    '',
    'WHO',
    `  ${who}${command.action ? `, holding the action ${command.action}` : ''}.`,
    ...(command.confirm
      ? [
          '',
          'CONFIRMATION',
          `  Asks "${command.confirm}" unless --yes is given.`,
        ]
      : []),
    '',
    'REQUEST',
    `  ${command.method} ${command.path}${command.operationId ? ` (${command.operationId})` : ''}`,
    '',
    `Run \`${bin} ${words(command.id)} --json\` for the result as one JSON document.`,
  ].join('\n');
}

/** How the CLI works, and the commands by area. */
export function overviewDocs(manifest: CliManifest, app: AppCliConfig): string {
  const areas = new Map<string, number>();
  for (const command of manifest.commands) {
    const area = command.id.split(':')[0];
    areas.set(area, (areas.get(area) ?? 0) + 1);
  }
  const width = Math.max(...[...areas.keys()].map((area) => area.length), 4);
  return [
    `${app.displayName} on the command line: every command below is one API route, offered to ${manifest.identity.displayName}.`,
    '',
    'GETTING ABOUT',
    `  ${app.bin} <area> --help              the commands of an area`,
    `  ${app.bin} docs <command words>       a command's arguments, output, permission and examples`,
    `  ${app.bin} whoami [--missing]         who you act as, and what needs an action you lack`,
    `  ${app.bin} login | logout | profile   signing in, one profile per server`,
    `  ${app.bin} completion zsh|bash|fish   shell completion`,
    '',
    'GLOBAL FLAGS',
    ...GLOBAL_FLAG_HELP.map(([flag, text]) => `  ${flag.padEnd(18)}  ${text}`),
    '',
    'AREAS',
    ...[...areas]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([area, count]) =>
          `  ${area.padEnd(width)}  ${count} command${count === 1 ? '' : 's'}`,
      ),
  ].join('\n');
}

export function docsCommand(app: AppCliConfig): Command.Class {
  return class Docs extends AppCommand {
    static override summary =
      'Show the documentation of a command, or of the CLI.';
    static override strict = false;
    static override args = {
      command: Args.string({
        description: "The command's words, such as `issue comment add`.",
      }),
    };
    static override examples = [
      '<%= config.bin %> docs',
      '<%= config.bin %> docs issue comment add',
      '<%= config.bin %> docs issue comment add --json',
    ];

    async run(): Promise<unknown> {
      const { argv } = await this.parse(Docs);
      const typed = (argv as string[]).filter((word) => !word.startsWith('-'));
      const id = typed.join(':');
      const own = this.config.findCommand(id);
      if (typed.length > 0 && own && !own.hidden) {
        if (!this.jsonEnabled()) await new Help(this.config).showHelp(typed);
        return {
          command: own.id,
          summary: own.summary ?? null,
          description: own.description ?? null,
          examples: (own.examples ?? []).map(String),
          flags: Object.keys(own.flags ?? {}),
        };
      }
      const context = await loadDynamic({ offline: true });
      if (!context)
        throw new UsageError(
          `Not signed in: the commands come from the server. Run \`${app.bin} login\` first.`,
          EXIT_CODES.auth,
        );
      if (typed.length === 0) {
        this.log(overviewDocs(context.manifest, app));
        return {
          identity: context.manifest.identity,
          commands: context.manifest.commands.map((command) => ({
            command: words(command.id),
            summary: command.summary,
          })),
        };
      }
      const resolved = resolveCommand(context.manifest, typed);
      if (!resolved) {
        const withheld = withheldCommand(context.manifest, typed);
        if (withheld) throw withheld;
        const area = context.manifest.commands.filter((command) =>
          command.id.startsWith(`${id}:`),
        );
        if (area.length === 0)
          throw new UsageError(
            `No command \`${app.bin} ${typed.join(' ')}\`. \`${app.bin} docs\` lists the areas.`,
            EXIT_CODES.notFound,
          );
        for (const command of area)
          this.log(
            `${app.bin} ${words(command.id).padEnd(32)}  ${command.summary}`,
          );
        return {
          commands: area.map((command) => ({
            command: words(command.id),
            summary: command.summary,
          })),
        };
      }
      const text = commandDocs(resolved.command, app.bin);
      this.log(text);
      return { command: resolved.command, text };
    }
  };
}
