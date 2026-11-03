/** A bounded diagnostic that keeps the command and the end of the process output. */
export function startupDetail(
  command: string,
  args: readonly string[],
  error: unknown,
): string {
  const quote = (value: string): string =>
    /^[\w./:@=+-]+$/u.test(value) ? value : JSON.stringify(value);
  const launch = `Command: ${[command, ...args].map(quote).join(' ')}`;
  const reason = error instanceof Error ? error.message : String(error);
  const heading = launch.length > 900 ? `${launch.slice(0, 899)}…` : launch;
  const budget = 2000 - heading.length - 1;
  return `${heading}\n${reason.length > budget ? `…${reason.slice(-(budget - 1))}` : reason}`;
}
