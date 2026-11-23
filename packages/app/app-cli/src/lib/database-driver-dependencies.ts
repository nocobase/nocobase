import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

import { quoteForShell } from '@nocobase/cli-envelope';
import { resolveDatabaseDriver } from '@nocobase/db';
import {
  OFFICIAL_DIALECTS,
  type AppDatabaseConfig,
} from '@nocobase/app-server/database';
import type { AppCommandRuntime } from '../context.ts';
import { CommandError } from '../command/errors.ts';
import { activeConfigFile } from './config-keys.ts';
import {
  driverPackage,
  findInstalledPackage,
  installSpecifier,
  type ConfigInitMode,
} from './config-init.ts';

export interface DriverDependencyFinding {
  readonly level: 'error';
  readonly code: 'driver-dependency';
  readonly key: string;
  readonly connections: string[];
  readonly dialect: string;
  readonly packageName?: string;
  readonly state:
    'development' | 'indirect' | 'missing' | 'not-installed' | 'unregistered';
  readonly message: string;
  readonly fix: string;
  readonly retry: string;
}

export function inspectDatabaseDrivers(
  runtime: AppCommandRuntime,
  mode: ConfigInitMode,
  retry: string,
  build = false,
): { findings: DriverDependencyFinding[]; available: string[] } {
  const findings: DriverDependencyFinding[] = [];
  const database = runtime.config.get<AppDatabaseConfig>('database');
  if (!database || database.default === 'none')
    return { findings, available: [] };
  const required = new Map<string, string[]>();
  for (const [name, connection] of Object.entries(database.connections ?? {})) {
    const explicit = resolveDatabaseDriver(
      {
        dialect: connection.dialect,
        databaseDriver: connection.databaseDriver,
      },
      database.drivers,
      name,
    );
    if (
      explicit &&
      (!OFFICIAL_DIALECTS.some((dialect) => dialect === connection.dialect) ||
        explicit.packageName !== `@nocobase/db-${connection.dialect}`)
    )
      continue;
    const names = required.get(connection.dialect) ?? [];
    names.push(name);
    required.set(connection.dialect, names);
  }
  const root = runtime.paths.rootDir;
  if (!required.size) return { findings, available: [] };
  const manifest = JSON.parse(
    readFileSync(path.join(root, 'package.json'), 'utf8'),
  ) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const available = OFFICIAL_DIALECTS.filter(
    (d) => manifest.dependencies?.[driverPackage(d)],
  );
  // A deployment may set a mapped dialect when it starts. File values and environment overrides already in
  // effect, and connections with a fixed code dialect, still have to be satisfied by this build.
  const canDefer =
    build &&
    available.length > 0 &&
    !existsSync(
      activeConfigFile(
        root,
        runtime.paths.deploymentRootDir,
        runtime,
        runtime.env ?? process.env,
      ),
    );
  const mappings = canDefer ? runtime.config.sectionEnvironmentVariables() : {};
  const overrides = canDefer
    ? (runtime.config.layers().overrides.database as
        Partial<AppDatabaseConfig> | undefined)
    : undefined;
  for (const [dialect, names] of required) {
    const connections = names.filter(
      (name) =>
        !canDefer ||
        overrides?.connections?.[name]?.dialect !== undefined ||
        !Object.values(mappings).includes(
          `database.connections.${name}.dialect`,
        ),
    );
    if (!connections.length) continue;
    const key = `database.connections.${connections[0]}.dialect`;
    const official = OFFICIAL_DIALECTS.find((d) => d === dialect);
    if (!official) {
      findings.push({
        level: 'error',
        code: 'driver-dependency',
        key,
        connections,
        dialect,
        state: 'unregistered',
        message: `Connections ${connections.join(', ')} use the unregistered dialect "${dialect}".`,
        fix: `Register its driver in database.drivers in the application sources.${mode === 'deployment' ? ' Rebuild and redeploy.' : ''}`,
        retry,
      });
      continue;
    }
    const packageName = driverPackage(official);
    const direct = findInstalledPackage(root, packageName);
    if (manifest.dependencies?.[packageName] && direct) continue;
    const devRange = manifest.devDependencies?.[packageName];
    const server = findInstalledPackage(root, '@nocobase/app-server');
    const indirect =
      direct ||
      (server && findInstalledPackage(realpathSync(server), packageName));
    const state = manifest.dependencies?.[packageName]
      ? 'not-installed'
      : devRange
        ? 'development'
        : indirect
          ? 'indirect'
          : 'missing';
    const status = {
      development: 'declared only in devDependencies',
      indirect: 'available only indirectly',
      missing: 'missing',
      'not-installed': 'declared in dependencies but not installed',
    }[state];
    const spec = devRange
      ? `${packageName}@${devRange}`
      : installSpecifier(root, packageName);
    const command =
      state === 'not-installed'
        ? 'pnpm install'
        : `pnpm add --save-prod ${quoteForShell(spec)}`;
    const fix =
      mode === 'deployment'
        ? `In the application sources, run ${command}, rebuild and redeploy.`
        : `Run ${command} in the application sources.`;
    findings.push({
      level: 'error',
      code: 'driver-dependency',
      key,
      connections,
      dialect,
      packageName,
      state,
      message: `${connections.length === 1 ? 'Connection' : 'Connections'} ${connections.join(', ')} (${dialect}): ${packageName} is ${status}.`,
      fix,
      retry,
    });
  }
  return { findings, available };
}

export function assertDatabaseDrivers(
  findings: DriverDependencyFinding[],
): void {
  if (findings.length) {
    throw new CommandError(findings.map((f) => f.message).join('\n'), {
      code: 'DATABASE_DRIVER_DEPENDENCY',
      details: { findings },
      suggestions: [
        ...new Set([
          ...findings.map((f) => f.fix),
          `Retry: ${findings[0].retry}`,
        ]),
      ],
    });
  }
}
