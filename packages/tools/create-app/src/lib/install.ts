import { access } from 'node:fs/promises';
import path from 'node:path';
import { CommandFailedError, runCommand } from './run-command.ts';

const INSTALL_TIMEOUT_MS = 10 * 60 * 1000;
const VERIFY_TIMEOUT_MS = 60 * 1000;

export interface InstallOptions {
  directory: string;
  registry?: string;
  onOutput?: (chunk: string) => void;
}

/** Installs the generated project's dependencies. */
export async function installDependencies(
  options: InstallOptions,
): Promise<void> {
  const args = ['install'];

  if (options.registry) {
    args.push(`--registry=${options.registry}`);
  }

  try {
    await runCommand('pnpm', args, {
      cwd: options.directory,
      timeoutMs: INSTALL_TIMEOUT_MS,
      onOutput: options.onOutput,
    });
  } catch (error) {
    if (error instanceof CommandFailedError) {
      throw new Error(
        `Installing dependencies failed.\n${error.stderr || error.message}`,
        { cause: error },
      );
    }

    throw error;
  }
}

export interface DriverVerification {
  ok: boolean;
  /** Set when the driver installed but cannot be loaded, with an explanation of the likely cause. */
  reason?: string;
}

/**
 * The native package every template's default database connection needs.
 *
 * It arrives transitively rather than being installed by name: each template depends on `@nocobase/db-sqlite`, which
 * depends on `better-sqlite3`. That makes it the one native addon a generated project is guaranteed to need, and the
 * only addon this verifier checks. An application that adds another driver later, for another dialect, is on its own
 * for that driver's runtime readiness; database connectivity is never verified here.
 */
export const DEFAULT_NATIVE_DRIVER = 'better-sqlite3';

/**
 * Confirms the native driver actually loads.
 *
 * `better-sqlite3` ships prebuilt binaries for Linux (glibc and musl), macOS and Windows on x64 and arm64, and the
 * generated `allowBuilds` skips its build because those binaries make compiling unnecessary. On any other platform
 * nothing matches, the package directory still exists and `pnpm install` reports success, but the first query fails
 * with "Could not locate the bindings file" — an error that points at nothing actionable. Catching it here turns that
 * into a message that names the cause.
 *
 * Nothing is retried automatically: while `allowBuilds` skips the driver, `pnpm rebuild` skips it too, and compiling
 * it needs a C++ toolchain this command cannot assume. The user has to opt in to the build.
 */
export async function verifyDriver(
  directory: string,
  driver: string = DEFAULT_NATIVE_DRIVER,
): Promise<DriverVerification> {
  try {
    await access(path.join(directory, 'node_modules', driver));
  } catch {
    // Nothing to verify. The driver is not named in any manifest this command writes — it reaches the tree through
    // the template's own dialect package — so a template that does not use SQLite legitimately has no copy of it,
    // and an install that genuinely failed already reported so.
    return { ok: true };
  }

  if (await driverLoads(directory, driver)) {
    return { ok: true };
  }

  return { ok: false, reason: explainLoadFailure(driver) };
}

/** Loads the driver in a child process, which is the only way to know its native addon is actually present. */
async function driverLoads(
  directory: string,
  driver: string,
): Promise<boolean> {
  try {
    await runCommand(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import('${driver}').then((m) => new m.default(':memory:').close())`,
      ],
      { cwd: directory, timeoutMs: VERIFY_TIMEOUT_MS },
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Reinstalling from scratch is the remedy, not `pnpm rebuild`: once pnpm has installed the package with its build
 * skipped, neither `pnpm rebuild` nor a second `pnpm install` runs the build after the entry is flipped to `true`.
 */
function explainLoadFailure(driver: string): string {
  return [
    `${driver} installed but its native addon could not be loaded.`,
    `No prebuilt binary matches this platform (${process.platform}-${process.arch}), so it has to be compiled.`,
    '',
    'To compile it, install a C++ toolchain (make, a C++ compiler and Python), then inside the app directory',
    `set \`${driver}: true\` under allowBuilds in pnpm-workspace.yaml and reinstall:`,
    '  rm -rf node_modules && pnpm install',
  ].join('\n');
}

const SKILLS_SYNC_TIMEOUT_MS = 2 * 60 * 1000;

export interface SkillsSyncResult {
  ok: boolean;
  /** Set when the sync did not run to completion, with something the user can act on. */
  reason?: string;
}

/**
 * Copies the skills of the app's NocoBase dependencies into `.agents/skills/`.
 *
 * This only works once the dependencies are installed, because the packages the sync reads from are resolved out of
 * `node_modules`. The template depends on the CLI behind it, so the generated app owns the command and running it here
 * is the same thing the user would run themselves after a package upgrade.
 *
 * Skills are an assistive layer rather than something the app needs to boot, so a failure is reported and the
 * generated project is still usable — the caller warns instead of aborting.
 */
export async function syncSkills(directory: string): Promise<SkillsSyncResult> {
  try {
    await runCommand('pnpm', ['nocobase', 'skills', 'sync'], {
      cwd: directory,
      timeoutMs: SKILLS_SYNC_TIMEOUT_MS,
    });

    return { ok: true };
  } catch (error) {
    const detail =
      error instanceof CommandFailedError
        ? error.stderr || error.message
        : (error as Error).message;

    return {
      ok: false,
      reason: [
        'Could not synchronize NocoBase package skills into .agents/skills.',
        detail,
        '',
        'To do it later, run this inside the app directory:',
        '  pnpm nocobase skills sync',
      ].join('\n'),
    };
  }
}
