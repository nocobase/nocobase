import type { CliCommand, CliDescription, CliManifest } from './types.js';

const words = (command: Pick<CliCommand, 'id'>): string =>
  command.id.split(':').join(' ');

/** A command as it is typed: its words, its positional arguments, and its required flags. */
export function cliUsageOf(command: CliCommand, bin?: string): string {
  const parts: string[] = bin ? [bin, words(command)] : [words(command)];
  const positional = command.parameters
    .filter((parameter) => parameter.position !== undefined)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  for (const parameter of positional)
    parts.push(
      parameter.required ? `<${parameter.name}>` : `[<${parameter.name}>]`,
    );
  for (const parameter of command.parameters) {
    if (parameter.position !== undefined || !parameter.required) continue;
    if (parameter.default !== undefined) continue;
    parts.push(
      parameter.type === 'boolean'
        ? `--${parameter.name}`
        : `--${parameter.name} <${parameter.in === 'file' ? 'path' : parameter.type}>`,
    );
  }
  // A body that only a file can give: no flag fills any of its fields.
  if (
    command.body?.file &&
    command.body.required &&
    !command.parameters.some((parameter) => parameter.in === 'body')
  )
    parts.push(`--${command.body.file} <file.json>`);
  return parts.join(' ');
}

/**
 * The caller's commands as compact text an agent reads before using the CLI (`GET /api/cli/llms.txt`): how the CLI
 * answers, then one line per command with its usage, summary, and the action it needs, grouped by its first word.
 */
export function renderCliReference(
  manifest: CliManifest,
  description: CliDescription = {},
): string {
  const bin = description.bin ?? 'cli';
  const title = description.title ?? bin;
  const lines: string[] = [
    `# ${title} command line`,
    '',
    `> The commands \`${bin}\` offers ${manifest.identity.kind === 'run' ? `this agent run (for ${manifest.identity.displayName})` : manifest.identity.displayName}. Each is one API route.`,
    '',
    `- \`${bin} <command> --help\` shows a command's arguments and flags; \`${bin} docs <command>\` adds its examples.`,
    `- \`--json\` prints one JSON document, \`{ schemaVersion, ok, command, status, result | error, warnings }\`; a command's answer is \`result.data\`, a failure's reason \`error.code\`.`,
    '- Exit codes: 0 ok, 1 general, 2 network, 3 authentication or permission, 4 not found, 5 invalid input, 6 conflict, 7 a plan is required.',
    '- A command that asks first takes `--yes`; a long text flag also takes `--<flag>-file <path>`.',
    ...(description.notes ?? []).map((note) => `- ${note}`),
  ];
  const groups = new Map<string, CliCommand[]>();
  for (const command of manifest.commands) {
    const group = command.id.split(':')[0] ?? command.id;
    groups.set(group, [...(groups.get(group) ?? []), command]);
  }
  for (const [group, commands] of [...groups].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    lines.push('', `## ${group}`, '');
    for (const command of commands)
      lines.push(
        `- \`${cliUsageOf(command, bin)}\`: ${command.summary}${command.action ? ` (action \`${command.action}\`)` : ''}${command.confirm ? ' Asks first.' : ''}`,
      );
  }
  if (manifest.withheld.length > 0) {
    const byAction = manifest.withheld.filter(
      (command) => command.reason === 'action',
    );
    if (byAction.length > 0) {
      lines.push(
        '',
        '## Not offered',
        '',
        'These need an action the caller does not hold; ask whoever manages permissions:',
        '',
      );
      for (const command of byAction)
        lines.push(`- \`${words(command)}\`: needs \`${command.action}\``);
    }
  }
  return `${lines.join('\n')}\n`;
}
