import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_NATIVE_DRIVER,
  syncSkills,
  verifyDriver,
} from '../src/lib/install.ts';

const created: string[] = [];

afterEach(async () => {
  await Promise.all(
    created
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

/**
 * A stand-in project whose `nocobase` is whatever the test needs it to be. The real one is the CLI's bin, run against
 * installed NocoBase packages, which needs a full install; what this function has to cover is how the caller reacts
 * to it succeeding or failing. pnpm resolves `pnpm nocobase` to a script of that name before a bin, so a script is
 * enough.
 */
async function createProject(script: string): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'create-app-skills-'));
  created.push(directory);

  await writeFile(
    path.join(directory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'app',
        version: '0.0.0',
        scripts: { nocobase: script },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  return directory;
}

describe('syncSkills', () => {
  it('runs the app-side CLI and reports success', async () => {
    const directory = await createProject(
      `node -e "require('node:fs').writeFileSync('marker', 'ran')"`,
    );

    await expect(syncSkills(directory)).resolves.toEqual({ ok: true });
    await expect(
      readFile(path.join(directory, 'marker'), 'utf8'),
    ).resolves.toBe('ran');
  });

  it('reports a failure with the command the user can run themselves', async () => {
    const directory = await createProject('node -e "process.exit(1)"');

    const result = await syncSkills(directory);

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('pnpm nocobase skills sync');
  });
});

describe('verifyDriver', () => {
  /**
   * The driver is no longer named in any manifest this command writes — it reaches the tree through the template's own
   * dialect package — so its absence means the template does not use SQLite, not that the install went wrong. An
   * install that genuinely failed has already been reported by then.
   */
  it('passes when the driver is not part of the project', async () => {
    const directory = await createProject('true');

    await expect(verifyDriver(directory)).resolves.toEqual({ ok: true });
  });

  /** A stand-in driver package whose entry point is whatever the test needs loading it to do. */
  async function installDriver(entry: string): Promise<string> {
    const directory = await createProject('true');
    const driver = path.join(directory, 'node_modules', DEFAULT_NATIVE_DRIVER);

    await mkdir(driver, { recursive: true });
    await writeFile(
      path.join(driver, 'package.json'),
      JSON.stringify({ name: DEFAULT_NATIVE_DRIVER, main: 'index.js' }),
    );
    await writeFile(path.join(driver, 'index.js'), entry);

    return directory;
  }

  it('passes when the driver loads', async () => {
    const directory = await installDriver(
      'module.exports = class { close() {} };',
    );

    await expect(verifyDriver(directory)).resolves.toEqual({ ok: true });
  });

  /**
   * The generated `allowBuilds` skips the driver's build, so `pnpm rebuild` would skip it as well. The only remedy is
   * the user opting in to compiling it, which is what the message has to say.
   */
  it('explains how to compile the driver when no prebuilt binary loads', async () => {
    const directory = await installDriver(
      "throw new Error('Could not locate the bindings file.');",
    );

    const result = await verifyDriver(directory);

    expect(result.ok).toBe(false);
    expect(result.reason).toContain(`${process.platform}-${process.arch}`);
    expect(result.reason).toContain(`${DEFAULT_NATIVE_DRIVER}: true`);
    expect(result.reason).toContain('rm -rf node_modules && pnpm install');
    expect(result.reason).not.toContain('pnpm rebuild');
  });

  it('defaults to the driver every template pulls in through @nocobase/db-sqlite', () => {
    expect(DEFAULT_NATIVE_DRIVER).toBe('better-sqlite3');
  });
});
