// The two identities the CLI acts as:
//
// - a run: inside a run's working directory, the token in the run's credentials file, which the runner wrote there
//   (`AppCliConfig.runCredentialsFile`) and deletes when the run ends, found through `AGENT_RUN_CREDENTIALS` or by
//   walking up from the working directory;
// - a person: anywhere else, `<PREFIX>_API_KEY` (with `<PREFIX>_SERVER`) when set, which is how CI acts without
//   signing in, else the credential of the selected profile, which `<bin> login` stored in the system keychain (or,
//   where there is none, in `<state dir>/config.json`, 0600): the session token a sign-in through the browser received,
//   sent as `Authorization: Bearer`, or an API key given with `--api-key-stdin`, sent as `x-api-key`. `config.json`
//   names each profile's server, what its credential is and where, and which profile is current; `--profile` and
//   `<PREFIX>_PROFILE` choose another.
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  EXIT_CODES,
  HEADERS,
  RUN_CREDENTIALS_ENV,
  RunCliCredentialSchema,
  type RunCliCredential,
} from '@nocobase/agent-protocol';
import { z } from 'zod';

import {
  appCliConfig,
  appCliPaths,
  type AppCliConfig,
  type AppCliPaths,
} from '../config.ts';
import { UsageError } from './command.ts';
import { readJson, writeJsonAtomic } from './files.ts';
import { ApiClient } from './http.ts';
import {
  defaultSecretStore,
  describeStorage,
  keychainAccount,
  keychainDisabled,
  keychainLabel,
  keychainService,
  type KeyStorage,
  type SecretStore,
} from './secrets/index.ts';

/** What a profile's credential is: a session token from a sign-in through the browser, or an API key. */
export type CredentialKind = 'session' | 'apiKey';

const CredentialKindSchema = z.enum(['session', 'apiKey']);

/** What a profile's credential is and where: a keychain, or `config.json` itself. */
const StoredAuthSchema = z.discriminatedUnion('storage', [
  z.object({
    kind: CredentialKindSchema,
    storage: z.enum(['keychain', 'secret-service', 'credential-manager']),
  }),
  z.object({
    kind: CredentialKindSchema,
    storage: z.literal('file'),
    key: z.string().min(1),
  }),
]);

/** One signed-in server: its address, where its key is, and what the server named the key. */
const StoredProfileSchema = z.object({
  server: z.string().min(1),
  auth: StoredAuthSchema,
  keyId: z.string().optional(),
  keyName: z.string().optional(),
});

/** `config.json`: the profiles by name, and the current one. */
const StoredConfigSchema = z.object({
  current: z.string().optional(),
  profiles: z.record(z.string(), StoredProfileSchema),
});

type StoredProfile = z.infer<typeof StoredProfileSchema>;
type StoredConfig = z.infer<typeof StoredConfigSchema>;

/** The profile a sign-in goes to when none is named. */
export const DEFAULT_PROFILE = 'default';

const PROFILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u;

/** A credential the CLI holds, what it is, and where it came from. */
export interface UserConfig {
  readonly server: string;
  /** The session token or the API key. */
  readonly key: string;
  /** A session token is sent as `Authorization: Bearer`, an API key as `x-api-key`. */
  readonly kind: CredentialKind;
  readonly storage: KeyStorage | 'env';
  /** The profile, or undefined for a key from the environment. */
  readonly profile?: string | undefined;
  readonly keyId?: string | undefined;
  readonly keyName?: string | undefined;
}

/** A profile as `profile list` shows it: never its key. */
export interface ProfileSummary {
  readonly name: string;
  readonly server: string;
  readonly storage: KeyStorage;
  readonly kind: CredentialKind;
  readonly keyName?: string | undefined;
  readonly current: boolean;
}

export interface UserConfigOptions {
  paths?: AppCliPaths;
  config?: AppCliConfig;
  /** The keychain; the platform's own by default, undefined for none. */
  store?: SecretStore | undefined;
  env?: NodeJS.ProcessEnv;
  /** The profile to use; `--profile`, else `<PREFIX>_PROFILE`, else the current one. */
  profile?: string | undefined;
}

interface Resolved {
  readonly config: AppCliConfig;
  readonly env: NodeJS.ProcessEnv;
  readonly paths: AppCliPaths;
  readonly store: SecretStore | undefined;
}

function resolveOptions(options: UserConfigOptions): Resolved {
  const config = options.config ?? appCliConfig();
  const env = options.env ?? process.env;
  return {
    config,
    env,
    paths: options.paths ?? appCliPaths(),
    store: 'store' in options ? options.store : defaultSecretStore(config, env),
  };
}

/** `<PREFIX>_<name>`, such as `ACME_API_KEY`; undefined when the CLI has no prefix or the variable is empty. */
export function envValue(
  config: AppCliConfig,
  env: NodeJS.ProcessEnv,
  name: 'SERVER' | 'API_KEY' | 'PROFILE',
): string | undefined {
  if (config.envPrefix === undefined) return undefined;
  const value = env[`${config.envPrefix}_${name}`];
  return value === undefined || value.trim() === '' ? undefined : value.trim();
}

/** The keychain account of a profile: the state directory, and the profile's name after `#` beside the default. */
export function profileAccount(home: string, profile: string): string {
  const account = keychainAccount(home);
  return profile === DEFAULT_PROFILE ? account : `${account}#${profile}`;
}

/** Reads `config.json`; a file written before profiles is the default profile. */
async function readStored(paths: AppCliPaths): Promise<StoredConfig> {
  const raw = await readJson<unknown>(paths.userConfig);
  const parsed = StoredConfigSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const legacy = StoredProfileSchema.safeParse(raw);
  if (legacy.success)
    return {
      current: DEFAULT_PROFILE,
      profiles: { [DEFAULT_PROFILE]: legacy.data },
    };
  return { profiles: {} };
}

async function writeStored(
  paths: AppCliPaths,
  stored: StoredConfig,
): Promise<void> {
  await writeJsonAtomic(paths.userConfig, stored);
}

/** The profile a command acts as: `--profile`, `<PREFIX>_PROFILE`, the current one, or `default`. */
export function selectedProfile(
  stored: { readonly current?: string | undefined },
  options: Pick<UserConfigOptions, 'profile'>,
  config: AppCliConfig,
  env: NodeJS.ProcessEnv,
): string {
  return (
    options.profile ??
    envValue(config, env, 'PROFILE') ??
    stored.current ??
    DEFAULT_PROFILE
  );
}

/** Refuses a name a profile cannot have. */
export function checkProfileName(name: string): string {
  if (!PROFILE_NAME.test(name))
    throw new UsageError(
      `Not a profile name: ${name}. Use letters, digits, ".", "_" and "-".`,
    );
  return name;
}

/**
 * The key the CLI acts with, or undefined when nobody is signed in: `<PREFIX>_API_KEY` (with `<PREFIX>_SERVER`, or the
 * profile's server), else the selected profile's. Throws a `UsageError` when the key is in a keychain that cannot be
 * read or no longer has it, and inside an agent run, which never acts as the person.
 */
export async function readUserConfig(
  options: UserConfigOptions = {},
): Promise<UserConfig | undefined> {
  const { config, env, paths, store } = resolveOptions(options);
  const named = env[RUN_CREDENTIALS_ENV];
  if (named !== undefined && named !== '')
    throw new UsageError(
      `This is an agent run, and its credentials file (${named}) is gone: the run has ended.`,
      EXIT_CODES.auth,
    );
  const stored = await readStored(paths);
  const profile = selectedProfile(stored, options, config, env);
  const entry = stored.profiles[profile];
  const envKey = envValue(config, env, 'API_KEY');
  if (envKey !== undefined) {
    const server = envValue(config, env, 'SERVER') ?? entry?.server;
    if (server === undefined)
      throw new UsageError(
        `${config.envPrefix}_API_KEY is set without a server: set ${config.envPrefix}_SERVER too.`,
        EXIT_CODES.auth,
      );
    return {
      server: normalizeServer(server),
      key: envKey,
      kind: 'apiKey',
      storage: 'env',
    };
  }
  if (entry === undefined) {
    if (
      options.profile !== undefined &&
      Object.keys(stored.profiles).length > 0
    )
      throw new UsageError(
        `There is no profile ${profile}. \`${config.bin} profile list\` shows them.`,
        EXIT_CODES.auth,
      );
    return undefined;
  }
  const server = envValue(config, env, 'SERVER') ?? entry.server;
  const known = {
    profile,
    kind: entry.auth.kind,
    ...(entry.keyId ? { keyId: entry.keyId } : {}),
    ...(entry.keyName ? { keyName: entry.keyName } : {}),
  };
  if (entry.auth.storage === 'file')
    return { server, key: entry.auth.key, storage: 'file', ...known };
  const where = describeStorage(entry.auth.storage, paths.userConfig);
  const again = `Run \`${config.bin} login${profile === DEFAULT_PROFILE ? '' : ` --profile ${profile}`}\` again.`;
  if (store?.kind !== entry.auth.storage)
    throw new UsageError(
      `The credential is in ${where}, which this process cannot use${config.keychainEnv === undefined ? '' : ` (${config.keychainEnv}=off?)`}. ${again}`,
      EXIT_CODES.auth,
    );
  let key: string | undefined;
  try {
    key = await store.get(
      keychainService(config),
      profileAccount(paths.home, profile),
    );
  } catch (error) {
    throw new UsageError(
      `${error instanceof Error ? error.message : String(error)}. Unlock it, or ${again.toLowerCase()}`,
      EXIT_CODES.auth,
    );
  }
  if (key === undefined)
    throw new UsageError(
      `The credential is gone from ${where}. ${again}`,
      EXIT_CODES.auth,
    );
  return { server, key, storage: entry.auth.storage, ...known };
}

/**
 * The server and profile a command would act as, read without its key (no keychain is touched): what completion needs
 * to find the cached manifest. Undefined when nobody is signed in.
 */
export async function peekUserConfig(
  options: UserConfigOptions = {},
): Promise<{ readonly server: string; readonly profile?: string } | undefined> {
  const { config, env, paths } = resolveOptions(options);
  const stored = await readStored(paths).catch((): StoredConfig => ({
    profiles: {},
  }));
  const profile = selectedProfile(stored, options, config, env);
  const entry = stored.profiles[profile];
  if (envValue(config, env, 'API_KEY') !== undefined) {
    const server = envValue(config, env, 'SERVER') ?? entry?.server;
    return server === undefined
      ? undefined
      : { server: normalizeServer(server) };
  }
  if (entry === undefined) return undefined;
  return { server: envValue(config, env, 'SERVER') ?? entry.server, profile };
}

export interface SavedUserConfig {
  storage: KeyStorage;
  profile: string;
  /** Set when the key had to go into `config.json`. */
  warning?: string;
}

/** What the credential is, and what the server said of a key, kept beside the profile. */
export interface SavedKeyInfo {
  /** `apiKey` when left out. */
  readonly kind?: CredentialKind | undefined;
  readonly keyId?: string | undefined;
  readonly keyName?: string | undefined;
}

/**
 * Stores the credential of `server` as a profile (the selected one, `default` at first) and makes it current: in the
 * keychain, or in `config.json` (0600) with a warning when there is no usable keychain.
 */
export async function saveUserConfig(
  server: string,
  key: string,
  options: UserConfigOptions & SavedKeyInfo = {},
): Promise<SavedUserConfig> {
  const { config, env, paths, store } = resolveOptions(options);
  const stored = await readStored(paths);
  const profile = checkProfileName(
    options.profile ??
      envValue(config, env, 'PROFILE') ??
      stored.current ??
      DEFAULT_PROFILE,
  );
  const service = keychainService(config);
  const account = profileAccount(paths.home, profile);
  const kind: CredentialKind = options.kind ?? 'apiKey';
  const info = {
    ...(options.keyId ? { keyId: options.keyId } : {}),
    ...(options.keyName ? { keyName: options.keyName } : {}),
  };
  const save = async (entry: StoredProfile) =>
    writeStored(paths, {
      current: profile,
      profiles: { ...stored.profiles, [profile]: entry },
    });
  let reason =
    keychainDisabled(config, env) && config.keychainEnv !== undefined
      ? `${config.keychainEnv} turns the system keychain off`
      : 'There is no usable system keychain here';
  if (store !== undefined && (await store.available())) {
    try {
      await store.set(service, account, key, keychainLabel(config, server));
      await save({
        server,
        auth: { kind, storage: store.kind },
        ...info,
      });
      return { storage: store.kind, profile };
    } catch (error) {
      reason = error instanceof Error ? error.message : String(error);
    }
  }
  await save({
    server,
    auth: { kind, storage: 'file', key },
    ...info,
  });
  // A key an earlier login kept in the keychain is not the one in use any more.
  if (store !== undefined)
    await store.delete(service, account).catch(() => undefined);
  return {
    storage: 'file',
    profile,
    warning: `${reason.replace(/\.$/u, '')}; the ${kind === 'session' ? 'session token' : 'API key'} is stored in ${describeStorage('file', paths.userConfig)}.`,
  };
}

/** The profiles, current first, without their keys. */
export async function listProfiles(
  options: UserConfigOptions = {},
): Promise<ProfileSummary[]> {
  const { config, env, paths } = resolveOptions(options);
  const stored = await readStored(paths);
  const current = selectedProfile(stored, options, config, env);
  return Object.entries(stored.profiles)
    .map(([name, entry]) => ({
      name,
      server: entry.server,
      storage: entry.auth.storage,
      kind: entry.auth.kind,
      ...(entry.keyName ? { keyName: entry.keyName } : {}),
      current: name === current,
    }))
    .sort((a, b) =>
      a.current === b.current
        ? a.name.localeCompare(b.name)
        : a.current
          ? -1
          : 1,
    );
}

/** Makes `name` the current profile. */
export async function useProfile(
  name: string,
  options: UserConfigOptions = {},
): Promise<void> {
  const { config, paths } = resolveOptions(options);
  const stored = await readStored(paths);
  if (!(name in stored.profiles))
    throw new UsageError(
      `There is no profile ${name}. \`${config.bin} profile list\` shows them.`,
      EXIT_CODES.notFound,
    );
  await writeStored(paths, { ...stored, current: name });
}

/**
 * Forgets a profile: its key leaves the keychain and `config.json`. The current profile becomes the first one left.
 * Answers what was forgotten, or undefined when there was no such profile.
 */
export async function removeProfile(
  name: string,
  options: UserConfigOptions = {},
): Promise<{ readonly server: string } | undefined> {
  const { config, paths, store } = resolveOptions(options);
  const stored = await readStored(paths);
  const entry = stored.profiles[name];
  if (entry === undefined) return undefined;
  const profiles = { ...stored.profiles };
  delete profiles[name];
  if (store !== undefined)
    await store
      .delete(keychainService(config), profileAccount(paths.home, name))
      .catch(() => undefined);
  const left = Object.keys(profiles).sort();
  const current = stored.current === name ? left[0] : stored.current;
  await writeStored(paths, {
    ...(current === undefined ? {} : { current }),
    profiles,
  });
  return { server: entry.server };
}

/** The headers a credential authenticates with: `Authorization: Bearer` for a session token, `x-api-key` for a key. */
export function credentialHeaders(
  credential: Pick<UserConfig, 'key'> & { readonly kind?: CredentialKind },
): Record<string, string> {
  return credential.kind === 'session'
    ? { authorization: `Bearer ${credential.key}` }
    : { [HEADERS.apiKey]: credential.key };
}

export function userClient(
  config: Pick<UserConfig, 'server' | 'key'> & {
    readonly kind?: CredentialKind;
  },
): ApiClient {
  return new ApiClient({
    server: config.server,
    headers: credentialHeaders(config),
  });
}

export function runClient(credential: RunCliCredential): ApiClient {
  return new ApiClient({
    server: credential.server,
    headers: { [HEADERS.runToken]: credential.token },
  });
}

/** Accepts `https://host/path` and `host:port`; drops a trailing slash. */
export function normalizeServer(server: string): string {
  const withScheme = /^https?:\/\//.test(server) ? server : `http://${server}`;
  const url = new URL(withScheme);
  return url.href.replace(/\/+$/, '');
}

/**
 * The run's credentials file: the one the runner names for this process (`AGENT_RUN_CREDENTIALS`, set only for the CLI
 * by the command the runner puts on the agent's PATH, so it works from a directory outside the run's own), else the
 * nearest one at or above `from`.
 */
export function findRunCredentials(
  from: string,
  config: AppCliConfig = appCliConfig(),
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const named = env[RUN_CREDENTIALS_ENV];
  if (named !== undefined && named !== '' && existsSync(named))
    return path.resolve(named);
  let current = path.resolve(from);
  for (;;) {
    const candidate = path.join(current, config.runCredentialsFile);
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

export async function readRunCredentials(
  file: string,
): Promise<RunCliCredential> {
  return RunCliCredentialSchema.parse(
    JSON.parse(await readFile(file, 'utf8')) as unknown,
  );
}
