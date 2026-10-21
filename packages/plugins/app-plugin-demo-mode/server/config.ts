import type { AppConfigAccessor } from '@nocobase/app-server/config';

/**
 * - `off`: the plugin does nothing.
 * - `read-only`: every database write an HTTP request causes is refused before it reaches the database.
 * - `observe`: nothing is refused; each write a request would have been refused is logged, to find what to allow.
 */
export type DemoMode = 'off' | 'read-only' | 'observe';

export interface DemoModeSettings {
  readonly mode: DemoMode;
  /** Physical table names, lower-cased, whose writes requests may still make, such as sign-in sessions. */
  readonly allowTables: ReadonlySet<string>;
  /** Whether visitors may sign in as the imported demo accounts without a password, while demo mode is on. */
  readonly quickSignIn: boolean;
  readonly data: DemoDataSettings;
}

/** How the demo dataset an application registers is imported, answered by models and reset on a schedule. */
export interface DemoDataSettings {
  /** Whether startup provisions the dedicated environment model as the default chat model. */
  readonly models: boolean;
  /** Where the model gateway reaches this application's simulated model; derived from the server address when absent. */
  readonly modelBaseUrl?: string;
}

/** The configuration section an application may declare; the environment variables below override it. */
export interface DemoModeConfig {
  readonly mode?: DemoMode;
  readonly allowTables?: readonly string[];
  readonly quickSignIn?: boolean;
  readonly data?: {
    readonly models?: boolean;
    readonly modelBaseUrl?: string;
  };
}

export const DEMO_MODE_ENV = 'NOCOBASE_DEMO_MODE';
export const DEMO_MODE_ALLOW_TABLES_ENV = 'NOCOBASE_DEMO_ALLOW_TABLES';
export const DEMO_QUICK_SIGN_IN_ENV = 'NOCOBASE_DEMO_QUICK_SIGN_IN';
export const DEMO_DATA_MODELS_ENV = 'NOCOBASE_DEMO_DATA_MODELS';
export const DEMO_DATA_MODEL_BASE_URL_ENV = 'NOCOBASE_DEMO_DATA_MODEL_BASE_URL';

/**
 * Tables official plugins write while someone only signs in, signs out or browses: Better Auth's session rows, and
 * its verification rows for one-time codes. Anything else is refused until a deployment allows it.
 */
export const DEFAULT_ALLOW_TABLES: readonly string[] = [
  'session',
  'verification',
];

const MODES: readonly DemoMode[] = ['off', 'read-only', 'observe'];

export class DemoModeConfigError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'DemoModeConfigError';
  }
}

export function resolveDemoModeSettings(
  config: Pick<AppConfigAccessor, 'get'>,
  env: NodeJS.ProcessEnv = process.env,
): DemoModeSettings {
  const section = config.get<DemoModeConfig>('demoMode') ?? {};
  const mode = env[DEMO_MODE_ENV]?.trim() || section.mode || 'off';
  if (!MODES.includes(mode as DemoMode)) {
    throw new DemoModeConfigError(
      `${DEMO_MODE_ENV} must be one of ${MODES.join(', ')}; got "${mode}".`,
    );
  }
  const extra =
    env[DEMO_MODE_ALLOW_TABLES_ENV]?.split(',') ?? section.allowTables ?? [];
  const allowTables = new Set(
    [...DEFAULT_ALLOW_TABLES, ...extra]
      .map((table) => table.trim().toLowerCase())
      .filter((table) => table !== ''),
  );
  return {
    mode: mode as DemoMode,
    allowTables,
    quickSignIn: booleanFlag(
      DEMO_QUICK_SIGN_IN_ENV,
      env[DEMO_QUICK_SIGN_IN_ENV],
      section.quickSignIn !== false,
    ),
    data: resolveDataSettings(section.data ?? {}, env),
  };
}

function resolveDataSettings(
  section: NonNullable<DemoModeConfig['data']>,
  env: NodeJS.ProcessEnv,
): DemoDataSettings {
  const modelBaseUrl =
    env[DEMO_DATA_MODEL_BASE_URL_ENV]?.trim() || section.modelBaseUrl;
  if (modelBaseUrl && !/^https?:\/\//u.test(modelBaseUrl)) {
    throw new DemoModeConfigError(
      `The demo model base URL must start with http:// or https://; got "${modelBaseUrl}".`,
    );
  }
  return {
    models: booleanFlag(
      DEMO_DATA_MODELS_ENV,
      env[DEMO_DATA_MODELS_ENV],
      section.models !== false,
    ),
    ...(modelBaseUrl
      ? { modelBaseUrl: modelBaseUrl.replace(/\/+$/u, '') }
      : {}),
  };
}

/** A `true`/`false` environment variable, or `fallback` when it is unset. */
function booleanFlag(
  name: string,
  value: string | undefined,
  fallback: boolean,
): boolean {
  const flag = value?.trim().toLowerCase();
  if (!flag) return fallback;
  if (!['true', 'false'].includes(flag))
    throw new DemoModeConfigError(
      `${name} must be true or false; got "${flag}".`,
    );
  return flag === 'true';
}
