// An application's CLI as its `package.json` declares it, under `nocobase.cli`: the JSON a packaged CLI carries in its
// own `package.json` (`nocobase cli build` and `nocobase cli link` of `@nocobase/app-cli` write it), which
// `runAppCliPackage` turns into the `AppCliConfig` it runs with. Only plain data: everything a function would decide
// is derived here, such as `selfUpdate`, which a packaged CLI always has.
import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { AppCliAuth, AppCliConfig } from './config.ts';
import { runAppCli } from './run.ts';

/** `nocobase.cli` in an application's `package.json`. */
export interface AppCliBrand {
  /** The command, such as `acme`; also the product the application serves it as. */
  readonly bin: string;
  /** The application's name in messages, such as `Acme`; `bin` when left out. */
  readonly displayName?: string;
  /** The root help's description; the packaged CLI's `description` when left out. */
  readonly description?: string;
  /** The directory under the home directory the CLI keeps its state in; `.<bin>` when left out. */
  readonly stateDir?: string;
  /** An environment variable that moves the state directory, such as `ACME_HOME`. */
  readonly homeEnv?: string;
  /** The prefix of the environment variables that act without signing in, such as `ACME` for `ACME_SERVER`. */
  readonly envPrefix?: string;
  /** An environment variable whose value `off` turns the keychain off, such as `ACME_KEYCHAIN`. */
  readonly keychainEnv?: string;
  /** The keychain service of the person's credential; `<bin>-cli` when left out. */
  readonly keychainService?: string;
  /** Where a runner puts a run's credentials, relative to the run's directory; `<stateDir>/run.json` when left out. */
  readonly runCredentialsFile?: string;
  /** Shown as `<bin> login --server <example>`. */
  readonly exampleServer?: string;
  /** Signing in through the browser: the device authorization client id the server accepts, and its routes. */
  readonly auth?: AppCliAuth;
  /** The command manifest's path below the server's address; `CLI_ROUTES.manifest` when left out. */
  readonly manifestPath?: string;
  /**
   * Skill directories, relative to the application, that the packaged CLI ships in its `skills/` (each a directory with
   * a `SKILL.md`, or a directory of them): the runner gives them to every run whose CLI it is. Read when packaging only.
   */
  readonly skills?: readonly string[];
  /** The packaged CLI's version; the application's when left out. Read when packaging only. */
  readonly version?: string;
}

/** What a packaged CLI is, beside its brand. */
export interface AppCliPackageInfo {
  /** The root of the packaged CLI, `<prefix>/versions/<version>` once the install script installed it. */
  readonly packageRoot: string;
  readonly version: string;
  readonly description?: string;
}

/** The configuration a packaged CLI runs with. */
export function appCliConfigOf(
  brand: AppCliBrand,
  info: AppCliPackageInfo,
): AppCliConfig {
  const stateDir = brand.stateDir ?? `.${brand.bin}`;
  const description = brand.description ?? info.description;
  return {
    bin: brand.bin,
    displayName: brand.displayName ?? brand.bin,
    stateDir,
    runCredentialsFile:
      brand.runCredentialsFile ?? path.posix.join(stateDir, 'run.json'),
    ...(brand.homeEnv === undefined ? {} : { homeEnv: brand.homeEnv }),
    ...(brand.envPrefix === undefined ? {} : { envPrefix: brand.envPrefix }),
    ...(brand.keychainEnv === undefined
      ? {}
      : { keychainEnv: brand.keychainEnv }),
    ...(brand.keychainService === undefined
      ? {}
      : { keychainService: brand.keychainService }),
    ...(brand.exampleServer === undefined
      ? {}
      : { exampleServer: brand.exampleServer }),
    ...(brand.auth === undefined ? {} : { auth: brand.auth }),
    ...(brand.manifestPath === undefined
      ? {}
      : { manifestPath: brand.manifestPath }),
    ...(description === undefined ? {} : { description }),
    version: info.version,
    selfUpdate: { packageRoot: info.packageRoot, product: brand.bin },
  };
}

interface PackagedManifest {
  version?: unknown;
  description?: unknown;
  nocobase?: { cli?: unknown };
}

/** The brand and package information of the packaged CLI at `packageRoot`, from its `package.json`. */
export function readAppCliPackage(packageRoot: string): {
  brand: AppCliBrand;
  info: AppCliPackageInfo;
} {
  const manifest = JSON.parse(
    readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
  ) as PackagedManifest;
  const brand = manifest.nocobase?.cli as AppCliBrand | undefined;
  if (
    brand === undefined ||
    typeof brand !== 'object' ||
    typeof brand.bin !== 'string'
  )
    throw new Error(
      `${path.join(packageRoot, 'package.json')} names no CLI under nocobase.cli.`,
    );
  return {
    brand,
    info: {
      packageRoot,
      version:
        typeof manifest.version === 'string' ? manifest.version : '0.0.0',
      ...(typeof manifest.description === 'string'
        ? { description: manifest.description }
        : {}),
    },
  };
}

/** Runs the packaged CLI at `packageRoot`: the entry `nocobase cli build` and `nocobase cli link` generate. */
export async function runAppCliPackage(
  packageRoot: string,
  argv: string[] = process.argv.slice(2),
): Promise<void> {
  const { brand, info } = readAppCliPackage(packageRoot);
  await runAppCli(appCliConfigOf(brand, info), argv);
}
