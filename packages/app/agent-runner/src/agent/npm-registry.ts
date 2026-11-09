// What the npm launcher (npm-launcher.ts) decides about NocoBase's private npm registry, as pure functions over the
// text of npmrc files and of an install's output. It imports nothing but Node's own modules, because the launcher loads
// it on every install the agent runs.
//
// Keys and values are read as npm and pnpm read them: with their `${VAR}` references resolved (`expandEnv`), and a
// registry URL compared without its scheme, quotes, trailing slashes or the case of its host.
//
// - `maskPrivate` removes from a machine's own npm and pnpm configuration every line that would send `@nocobase/*` (or
//   any scope, or every package) to the private registry, and its credentials: the machine's mirror, `cafile`, proxy
//   and other settings stay. So a project that does not need the private registry is never sent there by the machine.
// - `declaration` reads the `.npmrc` files a repository commits: one pointing a scope or the whole registry at the
//   private registry declares that the project needs it, and the launcher asks for the token before installing.
// - `notFoundPackage` reads an install's output for an `@nocobase/*` package that pnpm or npm did not find on another
//   registry, the only failure after which the launcher asks for the token and retries once with the private registry.
// - `privateRefused` reads it for the private registry refusing the token.

/** `NOCOBASE_NPM_REGISTRY` of the protocol; a test keeps the two equal. */
export const DEFAULT_PRIVATE_REGISTRY = 'https://pkg-v3.nocobase.com/';

/** Points the launcher at another private registry, for tests: the runner's own environment only. */
export const PRIVATE_REGISTRY_ENV = 'NOCOBASE_RUNNER_NPM_REGISTRY';

/** The run's private directory for the npm configuration the launcher writes (removed when the run ends). */
export const NPM_DIR_ENV = 'NOCOBASE_RUNNER_NPM_DIR';

/** The scope whose packages the private registry serves and the launcher retries with. */
export const NOCOBASE_SCOPE = '@nocobase';

type Env = Readonly<Record<string, string | undefined>>;

/**
 * `text` with its environment references replaced as npm and pnpm replace them in an npmrc's keys and values before
 * reading them: `${NAME}`, npm's `${NAME?}` (empty when unset) and pnpm's `${NAME:-default}`; an odd number of
 * backslashes before `$` keeps the reference as text. A reference to an unset variable stays as it is, as npm keeps it.
 */
export function expandEnv(text: string, env: Env): string {
  return text.replace(
    /(\\*)\$\{([^${}?:]+)(\?|:-([^}]*))?\}/gu,
    (
      whole,
      escapes: string,
      name: string,
      modifier?: string,
      fallback?: string,
    ) => {
      if (escapes.length % 2 === 1)
        return whole.slice((escapes.length + 1) / 2);
      const value = env[name];
      let replaced: string;
      if (fallback !== undefined) replaced = value ? value : fallback;
      else if (value !== undefined) replaced = value;
      else replaced = modifier === '?' ? '' : `\${${name}}`;
      return escapes.slice(escapes.length / 2) + replaced;
    },
  );
}

/** A registry URL as compared: no quotes, no trailing slashes, lower-case scheme and host. */
export function normalizeRegistry(value: string): string {
  const trimmed = value.trim().replace(/^["']|["']$/gu, '');
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/u, '')}`;
  } catch {
    return trimmed.replace(/\/+$/u, '');
  }
}

/** Whether `value`, a registry URL, is the private registry or a path under it, over HTTP or HTTPS. */
export function isPrivate(value: string, registry: string): boolean {
  return credentialPrefix(value).startsWith(credentialPrefix(registry));
}

/** `//host/path/`, the prefix npm keys the private registry's credentials with. */
export function credentialPrefix(registry: string): string {
  return `${normalizeRegistry(registry).replace(/^[a-z]+:/u, '')}/`;
}

export interface NpmrcEntry {
  readonly key: string;
  readonly value: string;
}

/** One `key=value` line, its key and value with the environment references `env` resolves, or null for a comment, a
 * section or a blank line. */
export function entryOf(line: string, env: Env = {}): NpmrcEntry | null {
  const text = line.trim();
  if (text === '' || text.startsWith('#') || text.startsWith(';')) return null;
  const equals = text.indexOf('=');
  if (equals <= 0) return null;
  return {
    key: expandEnv(text.slice(0, equals).trim(), env),
    value: expandEnv(text.slice(equals + 1).trim(), env),
  };
}

const isRegistryKey = (key: string): boolean =>
  /^(?:@[^:\s]+:)?registry$/iu.test(key);

/** Whether a line sends packages to the private registry or carries its credentials. */
function pointsAtPrivate(entry: NpmrcEntry, registry: string): boolean {
  if (isRegistryKey(entry.key)) return isPrivate(entry.value, registry);
  const prefix = credentialPrefix(registry).toLowerCase();
  const key = entry.key.toLowerCase();
  return key.startsWith(prefix) || key.startsWith(prefix.slice(0, -1) + ':');
}

/** `text` without its private-registry lines, and how many there were. */
export function maskPrivate(
  text: string,
  registry: string,
  env: Env = {},
): { readonly text: string; readonly masked: number } {
  let masked = 0;
  const kept = text.split(/\r?\n/u).filter((line) => {
    const entry = entryOf(line, env);
    if (entry === null || !pointsAtPrivate(entry, registry)) return true;
    masked += 1;
    return false;
  });
  return { text: kept.join('\n'), masked };
}

export interface Declaration {
  /** A committed `.npmrc` points a scope or the whole registry at the private registry. */
  readonly private: boolean;
  /** One points `@nocobase` at another registry: the project chose it, and the launcher does not retry. */
  readonly nocobaseElsewhere: boolean;
}

/** What a repository's committed `.npmrc` files say about the private registry. */
export function declaration(
  texts: readonly string[],
  registry: string,
  env: Env = {},
): Declaration {
  let declared = false;
  let elsewhere = false;
  for (const text of texts)
    for (const line of text.split(/\r?\n/u)) {
      const entry = entryOf(line, env);
      if (entry === null || !isRegistryKey(entry.key)) continue;
      if (isPrivate(entry.value, registry)) declared = true;
      else if (entry.key.toLowerCase() === `${NOCOBASE_SCOPE}:registry`)
        elsewhere = true;
    }
  return { private: declared, nocobaseElsewhere: elsewhere };
}

/** The lines the launcher adds to the run's user configuration. */
export function privateLines(
  registry: string,
  token: string | null,
  scope: boolean,
): string[] {
  return [
    ...(scope ? [`${NOCOBASE_SCOPE}:registry=${registry}`] : []),
    ...(token === null
      ? []
      : [`${credentialPrefix(registry)}:_authToken=${token}`]),
  ];
}

export interface MissingPackage {
  /** `@nocobase/<name>`. */
  readonly name: string;
  /** The wanted version or range, when the output says. */
  readonly spec?: string;
}

/** `@nocobase/<name>` and its registry from a request URL, such as `https://registry.npmjs.org/@nocobase%2Fx`. */
function packageOfUrl(
  url: string,
): { readonly name: string; readonly registry: string } | null {
  const match = /^(\S*?\/)@nocobase(?:%2f|\/)([a-z0-9][a-z0-9._-]*)/iu.exec(
    url,
  );
  return match ? { registry: match[1], name: `@nocobase/${match[2]}` } : null;
}

/**
 * The `@nocobase/*` package an install could not find on a registry other than the private one: pnpm's
 * `ERR_PNPM_FETCH_404 GET <url>` and `ERR_PNPM_NO_MATCHING_VERSION … while fetching it from <registry>`, npm's
 * `404 Not Found - GET <url>` and `No matching version found for …` (`ETARGET`). Null for anything else, including a
 * package of another scope, and a 404 of the private registry itself.
 */
export function notFoundPackage(
  output: string,
  registry: string,
): MissingPackage | null {
  for (const match of output.matchAll(
    /No matching version found for (@nocobase\/[a-z0-9][a-z0-9._-]*)@(\S+?)(?: while fetching it from (\S+))?\.?(?:\s|$)/giu,
  )) {
    const from = match[3];
    if (from !== undefined && isPrivate(from, registry)) continue;
    return { name: match[1], spec: match[2] };
  }
  for (const match of output.matchAll(
    /(?:ERR_PNPM_FETCH_404\]?\s+GET|404 Not Found - GET)\s+(\S+?):?(?:\s|$)/gu,
  )) {
    const found = packageOfUrl(match[1]);
    if (found === null || isPrivate(found.registry, registry)) continue;
    return { name: found.name };
  }
  return null;
}

/** Whether the private registry refused the request: pnpm's `ERR_PNPM_FETCH_401/403`, npm's `E401`/`E403`. */
export function privateRefused(output: string, registry: string): boolean {
  const host = new URL(normalizeRegistry(registry)).host;
  return output
    .split(/\r?\n/u)
    .some(
      (line) =>
        /ERR_PNPM_FETCH_40[13]|\b40[13] (?:Unauthorized|Forbidden)|\bE40[13]\b/u.test(
          line,
        ) && line.includes(host),
    );
}

/** The words a pnpm or npm call reaches a registry with; any other call runs without the launcher. */
export const REGISTRY_COMMANDS: Readonly<
  Record<'pnpm' | 'npm', readonly string[]>
> = {
  pnpm: [
    'install',
    'i',
    'add',
    'update',
    'up',
    'upgrade',
    'dlx',
    'fetch',
    'install-test',
    'it',
  ],
  npm: [
    'install',
    'i',
    'ci',
    'add',
    'update',
    'up',
    'exec',
    'x',
    'install-test',
    'it',
  ],
};
