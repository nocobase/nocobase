import { setConfigValue, splitConfigPath } from '../path.js';
import type {
  ConfigMap,
  ConfigProvider,
  ConfigProviderResult,
  ConfigValue,
} from '../types.js';
import { createConfigRecord } from '../value.js';

export type Environment = Readonly<Record<string, string | undefined>>;

/** How a deployment can produce a value for a variable it was not given. */
export type EnvironmentValueGenerator = 'secret' | 'secretKeys' | 'password';

/**
 * What a variable means to whoever deploys the application. None of it changes how the variable is read; it is what
 * `pnpm nocobase config variables` lists and what a deployment tool shows when it asks for a value.
 */
export interface EnvironmentMetadata {
  /** One sentence saying what the variable sets. */
  readonly description?: string;
  /** The value is a secret: never shown back, entered masked. Inferred from the path's last word when left out. */
  readonly secret?: boolean;
  /** Forces whether a deployment must supply a value. Inferred from defaults and the example file when left out. */
  readonly required?: boolean;
  /**
   * A deployment may generate the value instead of asking for one: `secret` is 32 random bytes in base64url,
   * `secretKeys` a `SECRETS_KEYS` list holding one new key, `password` 16 random letters and digits.
   */
  readonly generate?: EnvironmentValueGenerator;
  /** Read only on the first start, such as the initial administrator; changing it later has no effect. */
  readonly firstStartOnly?: boolean;
}

export interface EnvironmentMapping extends EnvironmentMetadata {
  readonly path: string;
  /** The shape of the value, such as `integer` or `boolean`; the helpers set it. A string when left out. */
  readonly type?: string;
  readonly parse?: (value: string) => ConfigValue;
}

export interface EnvironmentProviderOptions {
  readonly name?: string;
  readonly prefix?: string;
  readonly keyDelimiter?: string;
  readonly pathDelimiter?: string;
  readonly mappings?: Readonly<Record<string, EnvironmentMapping>>;
  readonly transform?: (
    key: string,
    value: string,
  ) => readonly [path: string, value: ConfigValue] | undefined;
}

export function environmentProvider(
  environment: Environment,
  options: EnvironmentProviderOptions = {},
): ConfigProvider {
  return {
    name: options.name ?? 'environment',
    read: async (): Promise<ConfigProviderResult> => ({
      kind: 'map',
      value: readEnvironment(environment, options),
    }),
  };
}

export function envString(
  path: string,
  metadata: EnvironmentMetadata = {},
): EnvironmentMapping {
  return { ...metadata, path, type: 'string' };
}

export function envInteger(
  path: string,
  metadata: EnvironmentMetadata = {},
): EnvironmentMapping {
  return {
    ...metadata,
    path,
    type: 'integer',
    parse(value: string): number {
      if (!/^-?\d+$/.test(value.trim())) {
        throw new Error(`Expected an integer, received "${value}".`);
      }
      return Number(value);
    },
  };
}

export function envBoolean(
  path: string,
  metadata: EnvironmentMetadata = {},
): EnvironmentMapping {
  return {
    ...metadata,
    path,
    type: 'boolean',
    parse(value: string): boolean {
      if (/^(true|1|yes|on)$/i.test(value.trim())) return true;
      if (/^(false|0|no|off)$/i.test(value.trim())) return false;
      throw new Error(`Expected a boolean, received "${value}".`);
    },
  };
}

export function envStrings(
  path: string,
  separator: string = ',',
  metadata: EnvironmentMetadata = {},
): EnvironmentMapping {
  return {
    ...metadata,
    path,
    type: 'strings',
    parse: (value: string): string[] =>
      value
        .split(separator)
        .map((item) => item.trim())
        .filter(Boolean),
  };
}

const SECRET_WORDS = new Set([
  'password',
  'passwd',
  'pwd',
  'pass',
  'passphrase',
  'pin',
  'secret',
  'token',
  'key',
  'dsn',
  'credential',
  'salt',
  'authorization',
  'cookie',
  // Keys written as one lowercase word.
  'apikey',
  'privatekey',
  'secretkey',
  'accesskey',
  'accesstoken',
  'refreshtoken',
  'authtoken',
  'clientsecret',
]);

/** `<word> key` names that are not secrets. */
const PUBLIC_KEY_WORDS = new Set([
  'public',
  'primary',
  'foreign',
  'sort',
  'partition',
]);

/**
 * Whether a configuration path names a secret, judged by the last word of its last segment: `password`, `secret`,
 * `token`, `key` and the like (`auth.secret`, `users.initialAdmin.password`, `ai.apiKeys`), except names that are not
 * secret (`publicKey`, `primaryKey`). It errs on the side of a secret.
 */
export function isSecretPath(path: string): boolean {
  const key = path.split('.').at(-1) ?? '';
  const words = key
    .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter(Boolean);
  const last = words.at(-1);
  if (!last) return false;
  const word = SECRET_WORDS.has(last)
    ? last
    : last.length > 3 &&
        last.endsWith('s') &&
        SECRET_WORDS.has(last.slice(0, -1))
      ? last.slice(0, -1)
      : undefined;
  if (!word) return false;
  return !(
    word === 'key' &&
    words.length > 1 &&
    PUBLIC_KEY_WORDS.has(words.at(-2)!)
  );
}

function readEnvironment(
  environment: Environment,
  options: EnvironmentProviderOptions,
): ConfigMap {
  const output = createConfigRecord();
  const pathDelimiter = options.pathDelimiter ?? '.';

  if (options.mappings) {
    for (const [key, mapping] of Object.entries(options.mappings)) {
      const value = environment[key];
      if (value === undefined) continue;
      setConfigValue(
        output,
        splitConfigPath(mapping.path, pathDelimiter),
        mapping.parse ? mapping.parse(value) : value,
      );
    }
    return output;
  }

  const prefix = options.prefix ?? '';
  const keyDelimiter = options.keyDelimiter ?? '__';
  for (const [key, value] of Object.entries(environment)) {
    if (value === undefined || !key.startsWith(prefix)) continue;
    const transformed = options.transform?.(key, value);
    if (transformed) {
      setConfigValue(
        output,
        splitConfigPath(transformed[0], pathDelimiter),
        transformed[1],
      );
      continue;
    }
    const path = key
      .slice(prefix.length)
      .toLowerCase()
      .split(keyDelimiter)
      .join(pathDelimiter);
    if (!path) continue;
    setConfigValue(output, splitConfigPath(path, pathDelimiter), value);
  }
  return output;
}
