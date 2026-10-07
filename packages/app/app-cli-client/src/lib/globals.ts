// The flags every command takes, wherever they appear on the line (before `--`): `--profile <name>`, `--yes` (`-y`),
// `--dry-run`, `--quiet` (`-q`) and `--no-color`. `runAppCli` takes them off the line before oclif or a business
// command reads it, so each command sees only its own flags; `--json` and `--help` stay where they are.

export interface GlobalFlags {
  /** The profile to act as, over `<PREFIX>_PROFILE` and the current one. */
  readonly profile?: string | undefined;
  /** Go ahead without asking. */
  readonly yes: boolean;
  /** Ask the server what would happen and change nothing; refused where the server offers no dry run. */
  readonly dryRun: boolean;
  /** Print nothing on success but what a script needs; failures still go to stderr. */
  readonly quiet: boolean;
  /** Plain text, without colors. */
  readonly noColor: boolean;
}

const NONE: GlobalFlags = {
  yes: false,
  dryRun: false,
  quiet: false,
  noColor: false,
};

let current: GlobalFlags = NONE;

export class GlobalFlagError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GlobalFlagError';
  }
}

/** The line without the global flags, and the flags. */
export function extractGlobalFlags(argv: readonly string[]): {
  readonly argv: string[];
  readonly flags: GlobalFlags;
} {
  const rest: string[] = [];
  let profile: string | undefined;
  let yes = false;
  let dryRun = false;
  let quiet = false;
  let noColor = false;
  for (let index = 0; index < argv.length; index += 1) {
    const word = argv[index];
    if (word === '--') {
      rest.push(...argv.slice(index));
      break;
    }
    if (word === '--profile' || word.startsWith('--profile=')) {
      const value =
        word === '--profile'
          ? argv[(index += 1)]
          : word.slice('--profile='.length);
      if (value === undefined || value === '' || value.startsWith('-'))
        throw new GlobalFlagError('--profile needs a profile name.');
      profile = value;
      continue;
    }
    if (word === '--yes' || word === '-y') yes = true;
    else if (word === '--dry-run') dryRun = true;
    else if (word === '--quiet' || word === '-q') quiet = true;
    else if (word === '--no-color') noColor = true;
    else rest.push(word);
  }
  return {
    argv: rest,
    flags: {
      ...(profile === undefined ? {} : { profile }),
      yes,
      dryRun,
      quiet,
      noColor,
    },
  };
}

export function setGlobalFlags(flags: GlobalFlags): void {
  current = flags;
}

export function globalFlags(): GlobalFlags {
  return current;
}

/** The global flags as help lists them. */
export const GLOBAL_FLAG_HELP: readonly (readonly [string, string])[] = [
  ['--json', 'Print the result as one JSON document (the cli-envelope).'],
  ['--profile <name>', 'Act as this signed-in profile.'],
  ['-y, --yes', 'Go ahead without asking.'],
  ['--dry-run', 'Change nothing; refused where the server offers no dry run.'],
  ['-q, --quiet', 'Print only what a script needs.'],
  ['--no-color', 'Plain text, without colors.'],
];
