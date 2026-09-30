// Generates the `package.json` and `pnpm-workspace.yaml` a deployable `dist/` installs from.
//
// The manifest lists what this application declares in `dependencies`, and nothing else. `pnpm install` resolves
// the rest: a plugin's own `dependencies` come along transitively, its `peerDependencies` are skipped because the
// generated workspace sets `autoInstallPeers: false`, and `devDependencies` were never published. Every rule that
// decides what reaches a server is the package manager's, applied to declarations that are already correct.
//
// This used to walk the built output for bare imports and expand every transitive dependency by hand, because the
// application declared its server packages in `devDependencies` and nothing else could tell which of them a
// deployment needed. Once those moved to `dependencies` the walk had nothing left to discover, and a scan that
// resolves specifiers is a scan that can miss one.
//
// Workspace packages are the exception and are vendored rather than installed: a `workspace:` range means nothing
// to a deployment. Their compiled output is copied into `dist/vendor` and referenced by a `file:` path, so a plugin
// developed in this repository deploys the same way as one installed from a registry.
import fs from 'node:fs';
import path from 'node:path';

import { listWorkspacePackages } from './workspace-packages.mjs';

const rootDir = path.resolve(process.env.NOCOBASE_TOOL_ROOT || process.cwd());
const distDir = path.join(rootDir, 'dist');
const rootPackagePath = path.join(rootDir, 'package.json');
const distPackagePath = path.join(distDir, 'package.json');
const distWorkspacePath = path.join(distDir, 'pnpm-workspace.yaml');
const vendorDir = path.join(distDir, 'vendor');
const databaseRuntimeDrivers = [
  'better-sqlite3',
  'pg',
  'mysql2',
  'oracledb',
  'tedious',
];
const declaredDatabaseRuntimeDrivers = () =>
  databaseRuntimeDrivers.filter((driver) =>
    getDeclaredVersion(rootPackage, driver),
  );

const toPosix = (value) => value.split(path.sep).join('/');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const writeJson = (file, value) => {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

const getInstalledVersion = (packageName, fromDir = rootDir) => {
  const packagePath = path.join(
    fromDir,
    'node_modules',
    ...packageName.split('/'),
    'package.json',
  );

  if (!fs.existsSync(packagePath)) return undefined;
  return readJson(packagePath).version;
};

const getDeclaredVersion = (packageJson, packageName) => {
  const version =
    packageJson.dependencies?.[packageName] ??
    packageJson.optionalDependencies?.[packageName] ??
    packageJson.devDependencies?.[packageName] ??
    packageJson.peerDependencies?.[packageName];

  if (!version) return undefined;
  return version.replace(/^[~^]/, '');
};

const isWorkspaceVersion = (version) => version?.startsWith('workspace:');

const getVendorPackagePath = (packageName) =>
  path.join(vendorDir, ...packageName.split('/'));

const createRuntimePackageJson = (packageJson) => ({
  name: packageJson.name,
  displayName: packageJson.displayName,
  description: packageJson.description,
  version: packageJson.version ?? '0.0.0',
  private: true,
  type: packageJson.type,
  main: packageJson.main,
  types: packageJson.types,
  exports: packageJson.publishConfig?.exports ?? packageJson.exports,
  engines: packageJson.engines,
  nocobase: packageJson.nocobase,
});

/**
 * The paths a workspace package publishes, which is what its vendored copy has to hold: `dist` always, and whatever
 * else `files` names. A package may keep a published file beside `dist` and reach it through `exports` —
 * `@nocobase/cli-envelope` ships `node-guard.js` that way, so that a `bin/run.js` can load it on a Node.js that
 * cannot load the rest — and copying `dist` alone left that export pointing at nothing. A glob in `files` is not
 * expanded here; `pack:check` keeps `files` to plain paths.
 */
const publishedPaths = (packageJson) => {
  const paths = new Set(['dist']);
  for (const entry of packageJson.files ?? []) {
    const normalized = entry.replace(/^\.\//, '').replace(/\/+$/, '');
    if (
      normalized === '' ||
      normalized.startsWith('..') ||
      path.isAbsolute(normalized) ||
      /[*?[\]{}!]/.test(normalized)
    )
      continue;
    paths.add(normalized);
  }
  return paths;
};

const copyWorkspacePackage = (packageName, packageDir) => {
  const packageJson = readJson(path.join(packageDir, 'package.json'));
  const sourceDistDir = path.join(packageDir, 'dist');

  if (!fs.existsSync(sourceDistDir)) {
    throw new Error(
      `Missing ${path.relative(rootDir, sourceDistDir)}. Build ${packageName} before generating the server package.`,
    );
  }

  const targetDir = getVendorPackagePath(packageName);
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of publishedPaths(packageJson)) {
    const source = path.join(packageDir, entry);
    if (!fs.existsSync(source)) continue;
    fs.cpSync(source, path.join(targetDir, entry), { recursive: true });
  }
  writeJson(
    path.join(targetDir, 'package.json'),
    createRuntimePackageJson(packageJson),
  );
};

/**
 * Writes the pnpm settings the deployable `dist/` is installed with.
 *
 * Its presence also makes pnpm treat `dist/` as its own root rather than a member of whatever workspace encloses it,
 * which is what keeps the deployment tree self-contained when the application is built inside this monorepo.
 *
 * `nodeLinker: hoisted` produces the flat `node_modules` a deployment expects. pnpm's default isolated layout works
 * too — its symlinks are relative and survive being archived — but it spends a few thousand links to express a tree
 * that is copied once and never resolved against anything else.
 *
 * `allowBuilds` is the load-bearing part. pnpm 11 skips the install script of any package absent from that list and
 * still reports success, so a native driver such as `oracledb` would install without compiling and fail on the
 * deployed server with a missing native module — a runtime error naming nothing that points back here.
 * `better-sqlite3` is skipped deliberately: it loads the prebuilt binary it ships for the target, and its implicit
 * `node-gyp rebuild` would compile nothing yet fail on a server image without `make`. The entries mirror the
 * application's own `pnpm-workspace.yaml` so both decide the same packages the same way.
 */
const writeDistWorkspace = () => {
  fs.writeFileSync(
    distWorkspacePath,
    [
      '# Generated by scripts/utils/build-server-dist-package.mjs. Edits are overwritten on the next build.',
      '#',
      '# Also marks dist/ as its own pnpm root, so installing here never reaches an enclosing workspace.',
      'nodeLinker: hoisted',
      '',
      '# Client packages are declared by plugins as peer dependencies, so an application installs one shared copy',
      '# and its Vite build resolves them. A server deployment has no client build and never requires them, so it',
      '# opts out of installing peers rather than carrying tens of megabytes it cannot use. `dependencies` are',
      '# unaffected: everything the server actually loads is declared there and installs normally.',
      'autoInstallPeers: false',
      '',
      '# A deployment runs its own scripts — pnpm start, pnpm nocobase config init — against the tree the',
      '# build installed, so pnpm must not decide to install before running one.',
      'verifyDepsBeforeRun: false',
      '',
      '# Which dependencies may run install scripts: true compiles a native addon, false skips a script',
      '# this application does not need. A package left out here installs without building and fails at runtime.',
      '# better-sqlite3 loads the prebuilt binary it ships, so its build would only need make and compile nothing.',
      'allowBuilds:',
      '  better-sqlite3: false',
      '  oracledb: true',
      '  esbuild: true',
      '  tesseract.js: false',
      '',
      '# Use msgpackr without its optional native accelerator or platform binary packages.',
      'ignoredOptionalDependencies:',
      '  - msgpackr-extract',
      '',
    ].join('\n'),
  );
};

/**
 * Carries the application's registry settings into `dist/.npmrc`.
 *
 * `dist/` is a pnpm root of its own, so installing there never reads the application's `.npmrc` — which is where
 * `create-app` records the registry `@nocobase` packages come from. Without this the install falls through to the
 * public npm and fails with a 404 on every machine whose user configuration does not happen to name the same
 * registry: a CI runner, a fresh server, a container build.
 *
 * Only registry lines are copied. `dist/` is shipped in the deployment archive and the Docker image, and auth tokens
 * belong to the machine that builds, not to every place the build is deployed.
 */
const writeDistNpmrc = () => {
  const source = path.join(rootDir, '.npmrc');
  if (!fs.existsSync(source)) return;
  const registries = fs
    .readFileSync(source, 'utf8')
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => /^(?:@[^\s:=]+:)?registry\s*=/u.test(line));
  if (registries.length === 0) return;
  fs.writeFileSync(
    path.join(distDir, '.npmrc'),
    [
      "# Generated by scripts/utils/build-server-dist-package.mjs from the application's .npmrc: registry lines only.",
      ...registries,
      '',
    ].join('\n'),
  );
};

if (!fs.existsSync(path.join(distDir, 'server'))) {
  throw new Error('Missing dist/server. Run pnpm build first.');
}

const rootPackage = readJson(rootPackagePath);
const workspacePackages = listWorkspacePackages(rootDir);
const workspacePackageNames = new Set();
const externalPackageNames = new Map();

const addExternalPackage = (
  packageName,
  sourcePackageDir = rootDir,
  sourcePackage = rootPackage,
) => {
  if (externalPackageNames.has(packageName)) return;

  const version =
    getInstalledVersion(packageName, sourcePackageDir) ??
    getInstalledVersion(packageName) ??
    getDeclaredVersion(sourcePackage, packageName) ??
    getDeclaredVersion(rootPackage, packageName);

  if (!version) {
    throw new Error(
      `Could not find a declared or installed version for ${packageName}`,
    );
  }

  externalPackageNames.set(packageName, version);
};

const addPackage = (packageName) => {
  const packageDir = workspacePackages.get(packageName);
  if (!packageDir) {
    addExternalPackage(packageName);
    return;
  }

  if (workspacePackageNames.has(packageName)) return;
  workspacePackageNames.add(packageName);

  const packageJson = readJson(path.join(packageDir, 'package.json'));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.optionalDependencies,
  };

  for (const [dependencyName, dependencyVersion] of Object.entries(
    dependencies,
  )) {
    if (isWorkspaceVersion(dependencyVersion)) {
      addPackage(dependencyName);
    } else {
      addExternalPackage(dependencyName, packageDir, packageJson);
    }
  }

  if (packageName === '@nocobase/db') {
    for (const driver of declaredDatabaseRuntimeDrivers()) {
      addExternalPackage(driver, packageDir, packageJson);
    }
  }
};

/**
 * Adds the database drivers this application declares.
 *
 * A driver reaches the server through knex, which loads it by name at runtime rather than importing it, so the scan
 * over `dist` never sees the specifier and `@nocobase/db` — the package that would otherwise pull the drivers in —
 * arrives as a transitive dependency of `@nocobase/app-server` rather than a direct one, so `addPackage` resolves it
 * through `addExternalPackage` and never recurses into it. Without this the generated `dist/package.json` lists no
 * driver at all: the install succeeds, and the deployed server fails on its first query with a module it cannot find.
 *
 * Only what the application actually declares is added. `create-app` installs exactly one driver for the dialect the
 * app was created with, so listing the other two would make every deployment carry drivers it never loads.
 */
const addDeclaredDatabaseDrivers = () => {
  for (const driver of declaredDatabaseRuntimeDrivers()) {
    addExternalPackage(driver);
  }
};

// Start from what the application declares. `addPackage` follows workspace packages into `dist/vendor` and
// records everything else for pnpm to install.
for (const packageName of Object.keys(rootPackage.dependencies ?? {})) {
  addPackage(packageName);
}

addDeclaredDatabaseDrivers();

for (const packageName of workspacePackageNames) {
  copyWorkspacePackage(packageName, workspacePackages.get(packageName));
}

const workspaceDependencies = Object.fromEntries(
  [...workspacePackageNames]
    .sort((left, right) => left.localeCompare(right))
    .map((packageName) => [
      packageName,
      `file:${toPosix(path.relative(distDir, getVendorPackagePath(packageName)))}`,
    ]),
);

const dependencies = Object.fromEntries([
  ...[...externalPackageNames.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  ),
  ...Object.entries(workspaceDependencies),
]);

const distPackage = {
  name: rootPackage.name,
  version: rootPackage.version ?? '0.0.0',
  private: true,
  type: 'module',
  nocobase: rootPackage.nocobase,
  main: './server/embedded.js',
  exports: {
    '.': './server/embedded.js',
    './embedded': './server/embedded.js',
    './standalone': './server/standalone.js',
  },
  scripts: {
    start: 'node ./server/standalone.js',
    // The one script alias a deployment keeps: `dist/` has no `.bin`, so without it `pnpm nocobase` would not
    // resolve, and `pnpm nocobase config init` is the same line the source checkout's documentation gives.
    nocobase: 'node ./cli/index.js',
  },
  engines: rootPackage.engines ?? {
    node: '>=20',
  },
  dependencies,
};

writeJson(distPackagePath, distPackage);
writeDistWorkspace();
writeDistNpmrc();

console.log(
  `Generated ${toPosix(path.relative(rootDir, distPackagePath))} with ${
    Object.keys(dependencies).length
  } production dependencies and ${workspacePackageNames.size} vendored workspace packages.`,
);
