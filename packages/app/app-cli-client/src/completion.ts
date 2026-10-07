// Shell completion: `<bin> completion zsh|bash|fish` prints a script that asks `<bin> __complete` for the words that
// may come next. Those come from the static commands and the cached command manifest (`dynamic/manifest.ts`), never
// from the network, so completing is quick and works offline; the cache is refreshed by any command that runs.
import { Args, Command as OclifCommand, type Command } from '@oclif/core';

import type { AppCliConfig } from './config.ts';
import { readCachedManifest, type CliCommand } from './dynamic/manifest.ts';
import { peekSession } from './dynamic/session.ts';
import { AppCommand } from './lib/command.ts';
import { GLOBAL_FLAG_HELP } from './lib/globals.ts';

export const SHELLS: readonly string[] = ['zsh', 'bash', 'fish'];

/** The script for `shell`, which calls `<bin> __complete -- <words…> <current>`. */
export function completionScript(bin: string, shell: string): string {
  const fn = `_${bin.replace(/[^A-Za-z0-9_]/gu, '_')}`;
  switch (shell) {
    case 'zsh':
      return `#compdef ${bin}
${fn}() {
  local -a completions
  completions=("\${(@f)$(${bin} __complete -- "\${(@)words[2,CURRENT-1]}" "\${words[CURRENT]}" 2>/dev/null)}")
  compadd -a completions
}
compdef ${fn} ${bin}
`;
    case 'bash':
      return `${fn}() {
  local IFS=$'\\n'
  COMPREPLY=($(${bin} __complete -- "\${COMP_WORDS[@]:1:COMP_CWORD-1}" "\${COMP_WORDS[COMP_CWORD]}" 2>/dev/null))
}
complete -o default -F ${fn} ${bin}
`;
    case 'fish':
      return `complete -c ${bin} -f -a '(${bin} __complete -- (commandline -opc)[2..-1] (commandline -ct) 2>/dev/null)'
`;
    default:
      throw new Error(`Not a shell: ${shell}`);
  }
}

const GLOBAL_FLAGS: readonly string[] = GLOBAL_FLAG_HELP.flatMap(([flag]) =>
  flag
    .split(/,\s*/u)
    .map((part) => part.split(' ')[0])
    .filter((part) => part.startsWith('--')),
);

/** The flags of a manifest command, as typed. */
function flagsOf(command: CliCommand): string[] {
  const flags: string[] = [];
  for (const parameter of command.parameters) {
    if (parameter.position !== undefined) continue;
    flags.push(`--${parameter.name}`);
    if (parameter.contentFile) flags.push(`--${parameter.name}-file`);
  }
  if (command.parameters.some((parameter) => parameter.fromEnv !== undefined))
    flags.push('--from-env');
  if (command.body?.file) flags.push(`--${command.body.file}`);
  if (command.output.kind === 'download') flags.push('--out');
  return flags;
}

/**
 * The words that may complete `current` after `words`: the next word of a command, a command's flags, or the values
 * of the flag before it. `statics` are the static commands' ids (`profile:use`) with their flags.
 */
export function completeLine(
  words: readonly string[],
  current: string,
  statics: ReadonlyMap<string, readonly string[]>,
  commands: readonly CliCommand[],
): string[] {
  const typed = words.filter((word) => !word.startsWith('-'));
  const byId = new Map(commands.map((command) => [command.id, command]));
  let resolved: { flags: readonly string[]; command?: CliCommand } | undefined;
  for (let count = typed.length; count > 0 && !resolved; count -= 1) {
    const id = typed.slice(0, count).join(':');
    const command = byId.get(id);
    if (command) resolved = { flags: flagsOf(command), command };
    else if (statics.has(id)) resolved = { flags: statics.get(id)! };
  }
  if (resolved) {
    const previous = words.at(-1);
    const flag = previous?.startsWith('--')
      ? resolved.command?.parameters.find(
          (parameter) => `--${parameter.name}` === previous,
        )
      : undefined;
    if (flag && flag.type !== 'boolean' && !current.startsWith('-'))
      return (flag.enum ?? []).filter((value) => value.startsWith(current));
    if (current !== '' && !current.startsWith('-')) return [];
    return [...new Set([...resolved.flags, ...GLOBAL_FLAGS])]
      .filter((candidate) => candidate.startsWith(current))
      .sort();
  }
  const ids = [...statics.keys(), ...commands.map((command) => command.id)].map(
    (id) => id.split(':'),
  );
  const next = new Set<string>();
  for (const id of ids) {
    if (id.length <= typed.length) continue;
    if (typed.every((word, index) => id[index] === word)) {
      const word = id[typed.length];
      if (word.startsWith(current) && !word.startsWith('_')) next.add(word);
    }
  }
  return [...next].sort();
}

export function completionCommands(
  app: AppCliConfig,
): Record<string, Command.Class> {
  class Completion extends AppCommand {
    static override summary = 'Print a shell completion script.';
    static override description =
      'Completes commands and flags from the commands the server last offered you (the cached manifest), so it ' +
      'works offline and follows your permissions after any command has run.\n\n' +
      `zsh:  ${app.bin} completion zsh > "\${fpath[1]}/_${app.bin}"   (or: source <(${app.bin} completion zsh) in ~/.zshrc)\n` +
      `bash: source <(${app.bin} completion bash)   in ~/.bashrc\n` +
      `fish: ${app.bin} completion fish > ~/.config/fish/completions/${app.bin}.fish`;
    static override args = {
      shell: Args.string({
        description: 'The shell.',
        options: [...SHELLS],
        required: true,
      }),
    };
    static override examples = [`<%= config.bin %> completion zsh`];

    async run(): Promise<{ shell: string; script: string }> {
      const { args } = await this.parse(Completion);
      const script = completionScript(app.bin, args.shell);
      if (!this.jsonEnabled()) process.stdout.write(script);
      return { shell: args.shell, script };
    }
  }

  // Not an AppCommand: it prints bare words for a shell, and never fails loudly.
  class Complete extends OclifCommand {
    static override hidden = true;
    static override strict = false;
    static override summary = 'Answer a completion script.';

    async run(): Promise<void> {
      const argv = [...this.argv];
      if (argv[0] === '--') argv.shift();
      const current = argv.pop() ?? '';
      const statics = new Map<string, string[]>();
      for (const command of this.config.commands) {
        if (command.hidden) continue;
        statics.set(
          command.id,
          Object.keys(command.flags ?? {}).map((name) => `--${name}`),
        );
      }
      let commands: readonly CliCommand[];
      try {
        const session = await peekSession();
        commands = session
          ? ((await readCachedManifest(session))?.commands ?? [])
          : [];
      } catch {
        commands = [];
      }
      for (const word of completeLine(argv, current, statics, commands))
        process.stdout.write(`${word}\n`);
    }
  }

  return { completion: Completion, __complete: Complete };
}
