import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, type ParseError } from 'jsonc-parser';
import { isRecord } from './util.ts';

const configFiles = ['opencode.json', 'opencode.jsonc', 'config.json'];

function configHome(env: NodeJS.ProcessEnv): string | undefined {
  return (
    env.XDG_CONFIG_HOME ??
    (env.HOME ? path.join(env.HOME, '.config') : undefined)
  );
}

/** The person's own OpenCode configuration file, when it needs to be named explicitly. */
export function globalOpencodeConfig(home: string): string | undefined {
  return configFiles
    .map((name) => path.join(home, 'opencode', name))
    .find((file) => existsSync(file));
}

export function globalConfigFor(env: NodeJS.ProcessEnv): string | undefined {
  const home = configHome(env);
  return home && globalOpencodeConfig(home);
}

export function parseOpencodeConfig(
  text: string,
): Record<string, unknown> | undefined {
  const errors: ParseError[] = [];
  const config: unknown = parse(text, errors, { allowTrailingComma: true });
  return errors.length === 0 && isRecord(config) ? config : undefined;
}

function hasKey(
  providers: unknown,
  field: string,
  env: NodeJS.ProcessEnv,
): boolean {
  return (
    isRecord(providers) &&
    Object.values(providers).some((provider) => {
      if (!isRecord(provider)) return false;
      const options = provider[field];
      if (!isRecord(options) || typeof options.apiKey !== 'string')
        return false;
      const key = options.apiKey.trim();
      const reference = /^\{env:([^}]+)\}$/u.exec(key);
      if (reference) {
        const value = env[reference[1]];
        return typeof value === 'string' && value.trim() !== '';
      }
      // File substitutions cannot be confirmed without opening the referenced secret file.
      return key !== '' && !key.startsWith('{file:');
    })
  );
}

/** Inspect only the presence of provider keys. Raw config and key values never leave this check. */
export async function hasConfiguredKey(
  env: NodeJS.ProcessEnv,
  signal?: AbortSignal,
): Promise<boolean> {
  const home = configHome(env);
  const files = new Set([
    ...(env.OPENCODE_CONFIG ? [env.OPENCODE_CONFIG] : []),
    ...[env.OPENCODE_CONFIG_DIR, home && path.join(home, 'opencode')]
      .filter((dir): dir is string => Boolean(dir))
      .flatMap((dir) => configFiles.map((name) => path.join(dir, name))),
  ]);
  for (const file of files) {
    signal?.throwIfAborted();
    const text = await readFile(file, { encoding: 'utf8', signal }).catch(
      () => undefined,
    );
    signal?.throwIfAborted();
    if (text === undefined) continue;
    const config = parseOpencodeConfig(text);
    if (
      config &&
      (hasKey(config.providers, 'settings', env) ||
        hasKey(config.provider, 'options', env))
    )
      return true;
  }
  return false;
}
