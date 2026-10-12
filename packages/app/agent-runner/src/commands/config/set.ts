import { Args, type Interfaces } from '@oclif/core';

import type { AgentTools } from '../../agent/runner-tools.ts';
import { RunnerCommand, UsageError } from '../../lib/command.ts';
import {
  ARTIFACT_PATTERN,
  DEFAULT_ARTIFACT_PATTERNS,
  readSettings,
  writeSettings,
} from '../../lib/config.ts';
import {
  DEFAULT_MIN_FREE_DISK,
  formatFreeSpace,
  parseFreeSpace,
  type FreeSpace,
} from '../../lib/size.ts';

/** The settings `config set` changes, by the name it takes. */
const KEYS = [
  'min-free-disk',
  'agent-tools',
  'artifact-ttl',
  'artifact-patterns',
] as const;

const UNITS: Readonly<Record<string, number>> = {
  m: 60_000,
  h: 60 * 60_000,
  d: 24 * 60 * 60_000,
};

/** `12h`, `30m`, `2d`, or `off` (0): how long a working directory stays unused before its artifacts go. */
export function parseArtifactTtl(value: string): number {
  const text = value.trim().toLowerCase();
  if (text === 'off' || text === '0') return 0;
  const match = /^(\d+)([mhd])$/u.exec(text);
  const amount = match ? Number(match[1]) : Number.NaN;
  if (!match || !Number.isSafeInteger(amount) || amount <= 0)
    throw new UsageError(
      `artifact-ttl is a duration such as 12h, 30m or 2d, or off; not ${value}.`,
    );
  return amount * UNITS[match[2]];
}

/** A comma-separated list of directory names, or `default`. */
export function parseArtifactPatterns(value: string): string[] {
  if (value.trim().toLowerCase() === 'default')
    return [...DEFAULT_ARTIFACT_PATTERNS];
  const names = [
    ...new Set(
      value
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ];
  const bad = names.find((name) => !ARTIFACT_PATTERN.test(name));
  if (bad !== undefined || names.length === 0)
    throw new UsageError(
      `artifact-patterns is a comma-separated list of directory names (such as node_modules,.next,.turbo), or default; not ${value}.`,
    );
  return names;
}
const AGENT_TOOLS: readonly AgentTools[] = ['runner', 'system'];

export default class ConfigSet extends RunnerCommand {
  static override summary: string = 'Change a runner setting.';
  static override description: string =
    '`min-free-disk` is how much of the disk holding the working directories to keep free: a size (20G, 512M), a ' +
    `share of the disk (10%), or off; ${formatFreeSpace(DEFAULT_MIN_FREE_DISK)} by default. The runner removes only ` +
    'directories whose work is over on its own; below the threshold it warns which are left for `gc` to remove. A ' +
    'running runner reads it at its next collection.\n\n' +
    '`agent-tools` is which Node.js and pnpm agents get: `runner` (the default), the runner’s own, first on their ' +
    'PATH, so a run does not depend on what the machine has installed; or `system`, whatever the machine has on its ' +
    'PATH. Runs started afterwards use it.\n\n' +
    '`artifact-ttl` is how long a working directory stays unused before its regenerable build artifacts are removed ' +
    '(12h by default; 30m, 2d, or off); the checkout itself stays. `artifact-patterns` names those directories, ' +
    'comma-separated (node_modules,.next,.turbo by default, or default); every directory with such a name inside the ' +
    'checkout goes, without following symbolic links. A running runner reads them at its next collection.';
  static override examples: string[] = [
    '<%= config.bin %> config set min-free-disk 20G',
    '<%= config.bin %> config set min-free-disk 10%',
    '<%= config.bin %> config set min-free-disk off',
    '<%= config.bin %> config set agent-tools system',
    '<%= config.bin %> config set artifact-ttl 24h',
    '<%= config.bin %> config set artifact-patterns node_modules,.next,.turbo,dist',
  ];
  static override args: {
    key: Interfaces.Arg<string>;
    value: Interfaces.Arg<string>;
  } = {
    key: Args.string({
      description: 'The setting.',
      required: true,
      options: [...KEYS],
    }),
    value: Args.string({ description: 'Its new value.', required: true }),
  };

  async run(): Promise<
    | { key: string; minFreeDisk: FreeSpace | null }
    | { key: string; agentTools: AgentTools }
    | { key: string; artifactTtlMs: number }
    | { key: string; artifactPatterns: string[] }
  > {
    const { args } = await this.parse(ConfigSet);
    if (!(KEYS as readonly string[]).includes(args.key))
      throw new UsageError(`Unknown setting ${args.key}.`);
    const settings = await readSettings(this.paths);
    if (args.key === 'artifact-ttl') {
      const ttl = parseArtifactTtl(args.value);
      settings.artifactTtlMs = ttl;
      await writeSettings(settings, this.paths);
      this.log(
        ttl === 0
          ? 'The runner keeps the build artifacts of unused working directories.'
          : `The runner removes the build artifacts of working directories unused for ${args.value.trim()}.`,
      );
      return { key: args.key, artifactTtlMs: ttl };
    }
    if (args.key === 'artifact-patterns') {
      const patterns = parseArtifactPatterns(args.value);
      settings.artifactPatterns = patterns;
      await writeSettings(settings, this.paths);
      this.log(`Build artifacts removed: ${patterns.join(', ')}.`);
      return { key: args.key, artifactPatterns: patterns };
    }
    if (args.key === 'agent-tools') {
      const value = args.value as AgentTools;
      if (!AGENT_TOOLS.includes(value))
        throw new UsageError(
          `agent-tools is one of ${AGENT_TOOLS.join(', ')}, not ${args.value}.`,
        );
      settings.agentTools = value;
      await writeSettings(settings, this.paths);
      this.log(
        value === 'runner'
          ? 'Agents get the runner’s own Node.js and pnpm.'
          : 'Agents get the Node.js and pnpm on the machine’s PATH.',
      );
      return { key: args.key, agentTools: value };
    }
    const threshold = parseFreeSpace(args.value, 'min-free-disk');
    settings.minFreeDisk = threshold;
    await writeSettings(settings, this.paths);
    this.log(
      threshold === null
        ? 'The runner removes no working directory for want of disk space.'
        : `The runner keeps ${formatFreeSpace(threshold)} of the disk free.`,
    );
    return { key: args.key, minFreeDisk: threshold };
  }
}
