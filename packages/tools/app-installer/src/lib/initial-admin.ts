import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

/** The `config.yml` section the application creates its first administrator from. */
export const INITIAL_ADMIN_KEY = 'users.initialAdmin';

/** Who signs in first, as far as it can be said without handing out the password. */
export interface InitialAdmin {
  /** Where the account is configured, password included. */
  key: typeof INITIAL_ADMIN_KEY;
  username: string | null;
  email: string | null;
  /**
   * Whether the password is still the one the template's `config.example.yml` ships, which anyone who has read the
   * template knows; `null` when either file could not be read.
   */
  defaultPassword: boolean | null;
}

interface InitialAdminSection {
  username?: unknown;
  email?: unknown;
  password?: unknown;
}

async function readSection(
  file: string,
): Promise<InitialAdminSection | undefined> {
  try {
    const document = parse(await readFile(file, 'utf8'), {
      logLevel: 'silent',
    }) as { users?: { initialAdmin?: InitialAdminSection } } | null;
    return document?.users?.initialAdmin ?? undefined;
  } catch {
    return undefined;
  }
}

function text(value: unknown): string | null {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : null;
}

/**
 * Reads the first administrator from `config.yml`, and compares its password with the one in the release's
 * `config.example.yml`, which `config init` copies unless `--set` replaced it. The password itself never leaves here.
 */
export async function readInitialAdmin(
  configFile: string,
  exampleFile: string,
): Promise<InitialAdmin> {
  const configured = await readSection(configFile);
  const example = await readSection(exampleFile);
  const password = text(configured?.password);
  const examplePassword = text(example?.password);
  return {
    key: INITIAL_ADMIN_KEY,
    username: text(configured?.username),
    email: text(configured?.email),
    defaultPassword:
      password === null || examplePassword === null
        ? null
        : password === examplePassword,
  };
}
