// The application's update hint (`AppCliConfig.updateHint`, or the built-in one of `selfUpdate`): asked as the
// signed-in person, printed on stderr at most once per process, so `--json` keeps stdout to its one document. A hint
// that fails says nothing.
import { appCliConfig, type AppCliSession } from '../config.ts';
import { updateEnvironment, updateHint } from '../update.ts';

let printed = false;

/** Starts asking; the answer is printed by `printUpdateHint`. */
export function askUpdateHint(
  session: AppCliSession,
): Promise<string | undefined> {
  if (printed) return Promise.resolve(undefined);
  const config = appCliConfig();
  if (config.updateHint !== undefined)
    return config.updateHint(session).catch(() => undefined);
  const environment = updateEnvironment(config);
  if (environment === undefined) return Promise.resolve(undefined);
  return updateHint(session, environment).catch(() => undefined);
}

export async function printUpdateHint(
  pending: Promise<string | undefined>,
  write: (line: string) => void = (line) => process.stderr.write(`${line}\n`),
): Promise<void> {
  const line = await pending;
  if (line === undefined || line === '' || printed) return;
  printed = true;
  write(line);
}
