import type { DatabaseCapabilities } from '@nocobase/db';
import {
  resolveDatabaseCapabilities,
  type TestDatabaseEnvironment,
  type TestDatabaseProvisioner,
} from '@nocobase/db/testing';

/** The variable that selects the dialect; unset means SQLite. */
export const TEST_DATABASE_DIALECT_VARIABLE: string =
  'NOCOBASE_TEST_DB_DIALECT';

export const DEFAULT_TEST_DATABASE_DIALECT: string = 'sqlite';

/** Raised when the environment selects a dialect that cannot be used. */
export class TestDatabaseConfigurationError extends Error {
  override readonly name: string = 'TestDatabaseConfigurationError';
}

/** The dialect the environment selects, read synchronously so tests can branch at collection time. */
export function testDatabaseDialect(
  env: TestDatabaseEnvironment = process.env,
): string {
  const value = env[TEST_DATABASE_DIALECT_VARIABLE]?.trim();
  if (!value) return DEFAULT_TEST_DATABASE_DIALECT;
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    throw new TestDatabaseConfigurationError(
      `${TEST_DATABASE_DIALECT_VARIABLE}="${value}" is not a dialect name. Use a lower-case name such as "postgres".`,
    );
  }
  return value;
}

/** The package that owns a dialect, which also exports its test provisioner. */
export function testDatabasePackage(dialect: string): string {
  return `@nocobase/db-${dialect}`;
}

/**
 * The capabilities of the selected dialect, known before any database exists,
 * so a test file can skip what the dialect cannot do while tests are being
 * collected:
 *
 *     const capabilities = await testDatabaseCapabilities();
 *     test.skipIf(!capabilities.partialIndexes)('…', async () => {});
 */
export async function testDatabaseCapabilities(
  env: TestDatabaseEnvironment = process.env,
): Promise<DatabaseCapabilities> {
  const provisioner = await loadTestDatabaseProvisioner(
    testDatabaseDialect(env),
  );
  return resolveDatabaseCapabilities(provisioner.capabilities);
}

interface ProvisionerModule {
  readonly testDatabaseProvisioner?: TestDatabaseProvisioner;
}

const provisioners = new Map<string, Promise<TestDatabaseProvisioner>>();

/**
 * Loads the provisioner from `@nocobase/db-<dialect>/testing`. The dialect
 * packages are optional peers, so only the selected one has to be installed.
 */
export function loadTestDatabaseProvisioner(
  dialect: string,
): Promise<TestDatabaseProvisioner> {
  let pending = provisioners.get(dialect);
  if (!pending) {
    pending = importProvisioner(dialect);
    provisioners.set(dialect, pending);
    pending.catch(() => provisioners.delete(dialect));
  }
  return pending;
}

async function importProvisioner(
  dialect: string,
): Promise<TestDatabaseProvisioner> {
  const packageName = testDatabasePackage(dialect);
  let module: ProvisionerModule;
  try {
    module = (await import(`${packageName}/testing`)) as ProvisionerModule;
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    const text = String(error);
    // The dialect package is installed but predates its ./testing entry: Node refuses the subpath, not the
    // package, and adding the package again would not help.
    if (
      code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' ||
      text.includes('is not defined by "exports"')
    ) {
      throw new TestDatabaseConfigurationError(
        `Testing on "${dialect}" needs a version of ${packageName} that exports ./testing; the installed one does not. Upgrade it, or unset ${TEST_DATABASE_DIALECT_VARIABLE} to test on SQLite.`,
        { cause: error },
      );
    }
    // Node and Vite word a missing package differently; both name it. A module missing deeper inside the dialect
    // package names something else and is rethrown as it is.
    if (code === 'ERR_MODULE_NOT_FOUND' || text.includes(packageName)) {
      throw new TestDatabaseConfigurationError(
        `Testing on "${dialect}" needs ${packageName} with a ./testing entry. Add it to the devDependencies of the package under test, or unset ${TEST_DATABASE_DIALECT_VARIABLE} to test on SQLite.`,
        { cause: error },
      );
    }
    throw error;
  }
  const provisioner = module.testDatabaseProvisioner;
  if (!provisioner || provisioner.dialect !== dialect) {
    throw new TestDatabaseConfigurationError(
      `${packageName}/testing does not export a testDatabaseProvisioner for "${dialect}".`,
    );
  }
  return provisioner;
}
