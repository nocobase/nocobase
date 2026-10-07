// Refuses to run an application that has nowhere to read its configuration from.
//
// Without this the failure is silent in the one place it matters most. `pnpm dev` runs the server under `tsx watch`,
// which prints the startup error and then waits for a file to change instead of exiting, while Vite carries on and
// prints a URL. The command looks like it worked, it exits with nothing, and the page it points at cannot reach an
// API. An agent following the output has no signal at all that something is wrong.
//
// What this checks is that a configuration source exists, not that its contents are valid. Validity is the runtime's
// job and it already does it well: a placeholder secret copied from the example, a missing `secrets.keys`, a dialect
// with no driver — each is reported with the key and the command that fixes it. Those errors are worth reaching, so
// anything that could legitimately supply configuration passes here.
//
// Only `dev` needs it. `start` and a deployment's own `pnpm start` run the server directly, and a server with no
// secret already exits at once with an error naming `nocobase config init` — the problem is only ever the
// watcher that keeps that error from ending the command. `build` is left alone too: it compiles, generates
// `dist/package.json` and installs production dependencies, none of which reads a secret, and requiring one would
// break a template's own `pnpm check` and any image build that builds before its configuration exists.
import { existsSync } from 'node:fs';
import path from 'node:path';

/** The extensions the runtime accepts, in the order it probes them. */
const CONFIG_EXTENSIONS = ['.yml', '.yaml', '.toml', '.json'];

/**
 * The configuration source this application would read, or `undefined` when it has none.
 *
 * `APP_CONFIG_FILE` is answered even when the file is absent, because the runtime loads a configured path
 * non-optionally: naming a file that is not there is an error worth reporting rather than a reason to keep looking.
 */
export function findConfigurationSource(rootDir, env) {
  const configured = env.APP_CONFIG_FILE;

  if (configured) {
    const file = path.resolve(rootDir, configured);
    return {
      kind: 'file',
      file,
      configured: true,
      exists: existsSync(file),
    };
  }

  for (const extension of CONFIG_EXTENSIONS) {
    const file = path.join(rootDir, `config${extension}`);
    if (existsSync(file)) {
      return { kind: 'file', file, configured: false, exists: true };
    }
  }

  // An application whose secrets come from the environment needs no file at all. Only `SECRETS_KEYS`, and the older
  // `AUTH_SECRET`, are looked for: an application that has one and not the rest gets the runtime's own error naming
  // exactly which is missing. `env` is the environment as the application loads it, `.env` files included.
  if (
    (env.SECRETS_KEYS ?? '').trim() !== '' ||
    (env.AUTH_SECRET ?? '').trim() !== ''
  ) {
    return {
      kind: 'environment',
      file: undefined,
      configured: false,
      exists: true,
    };
  }

  return undefined;
}

/** Stops with something the reader can run, rather than letting the server fail where nothing will show it. */
export function assertConfigurationPresent(rootDir, env, label) {
  const source = findConfigurationSource(rootDir, env);

  if (source?.exists) {
    return;
  }

  // Worded like the runtime's own message for a start without a secret, so the two entry points read as one rule.
  // Only SECRETS_KEYS is named: it is what the application cannot start without, and `config check` explains the rest.
  const lines =
    source === undefined
      ? [
          `[${label}] This application is not configured: it has no configuration file, and SECRETS_KEYS is not set.`,
          '',
          'Create the configuration with:',
          '  pnpm nocobase config init',
        ]
      : [
          `[${label}] This application is not configured: APP_CONFIG_FILE points at a file that does not exist.`,
          `  ${source.file}`,
        ];

  console.error(lines.join('\n'));
  process.exit(1);
}
