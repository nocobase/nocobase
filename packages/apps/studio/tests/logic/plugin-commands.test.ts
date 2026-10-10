// @vitest-environment node

// Users develop, build and start their app through these scripts. Nothing at runtime depends on them, so dropping or
// renaming one — a bad merge resolution did exactly that once — breaks the documented workflow silently: the app still
// builds, starts, and passes every other test. These assertions are the alarm.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const appRoot = fileURLToPath(new URL('../..', import.meta.url));

interface AppPackageJson {
  readonly files?: readonly string[];
  readonly publishConfig?: unknown;
  readonly scripts?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

const appPackage = JSON.parse(
  readFileSync(path.join(appRoot, 'package.json'), 'utf8'),
) as AppPackageJson;

const scripts = appPackage.scripts ?? {};

/**
 * The scripts an application keeps. Every other command is `pnpm nocobase <topic> <command>`, which pnpm resolves to
 * the `nocobase` bin without a script, so a script alias would only be a second name to keep in step.
 */
const LIFECYCLE_SCRIPTS: Readonly<Record<string, string>> = {
  postinstall: 'nocobase skills sync',
  dev: 'nocobase dev',
  build: 'nocobase build',
  start: 'nocobase start',
};

describe('application scripts', () => {
  it.each(Object.entries(LIFECYCLE_SCRIPTS))('exposes %s', (name, command) => {
    expect(scripts[name]).toBe(command);
  });

  it('keeps no alias for a CLI command', () => {
    const aliases = Object.entries(scripts).filter(
      ([name, command]) =>
        !(name in LIFECYCLE_SCRIPTS) && /(^|&&\s*)nocobase\s/.test(command),
    );
    expect(aliases).toEqual([]);
  });

  it('declares the CLI the scripts invoke', () => {
    // A runtime dependency, not tooling: a deployment runs `dist/cli/index.js`, which imports it, and installs from
    // `dependencies` alone.
    expect(appPackage.dependencies?.['@nocobase/app-cli']).toBeTruthy();
  });

  it('keeps synchronized Agent state out of source control and publication', () => {
    expect(readFileSync(path.join(appRoot, '.gitignore'), 'utf8')).toContain(
      '/.agents/',
    );
    const npmIgnorePath = path.join(appRoot, '.npmignore');
    if (appPackage.publishConfig) {
      expect(existsSync(npmIgnorePath)).toBe(true);
      expect(readFileSync(npmIgnorePath, 'utf8')).toContain('.agents/');
    }
    expect(appPackage.files).not.toContain('.agents');
  });
});
