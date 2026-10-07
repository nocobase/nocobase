/**
 * The one line that says what a tool call did, shown in the transcript without expanding it: the shell command for a
 * command tool, otherwise the file, pattern, URL or query the call was about. Null when the input has none of these.
 */
export function toolSummary(input: unknown): string | null {
  if (typeof input === 'string') return firstLine(input) || null;
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;

  const command = record.command ?? record.cmd;
  if (typeof command === 'string' && command.trim())
    return `$ ${firstLine(command)}`;
  if (
    Array.isArray(command) &&
    command.every((part) => typeof part === 'string')
  ) {
    const parts: readonly string[] = command;
    // `["bash", "-lc", "npm test"]` reads better as the script it runs.
    const script =
      parts.length === 3 &&
      /^(ba|z)?sh$/u.test(parts[0] ?? '') &&
      (parts[1] ?? '').startsWith('-')
        ? (parts[2] ?? '')
        : parts.join(' ');
    return script.trim() ? `$ ${firstLine(script)}` : null;
  }

  for (const key of [
    'file_path',
    'filePath',
    'path',
    'pattern',
    'url',
    'query',
    'description',
  ]) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return firstLine(value);
  }
  return null;
}

function firstLine(text: string): string {
  const line = text.trim().split('\n', 1)[0] ?? '';
  return line.length > 200 ? `${line.slice(0, 199)}…` : line;
}
