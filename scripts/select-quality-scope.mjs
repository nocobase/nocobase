import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Decides how much of the Quality workflow (nocobase3-quality.yml in chenos/nocobase-ci) a change needs. A pull request
// runs only the packages it touches and the packages depending on them; a push, a change without a usable comparison, or
// a change to what every package is built, linted or tested with runs everything, exactly as before this selection.

// Paths whose change reaches every package: dependency resolution, shared configuration, the root scripts and their
// tests, the CI inputs, and `dev/db`, which the root `db:typecheck` and `db:test` cover.
export const fullFiles = new Set([
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.npmrc',
  '.pnpmfile.cjs',
  'pnpmfile.cjs',
  '.gitignore',
  'eslint.config.js',
  'lint-staged.config.mjs',
]);

export const fullDirectories = [
  '.github/',
  'dev/',
  'packages/tools/dev-config/',
  'patches/',
  'scripts/',
  'tests/',
];

// The reads of another package's directory that cannot be declared as a dependency, which the workspace graph
// therefore does not see. A change under `path` (a directory when it ends with `/`) selects `consumers`, but not their
// dependents: every such read is in a consumer's test configuration, so what the consumer publishes does not change.
// Every other cross-package read is a declared dependency, which `pnpm deps:check` enforces
// (`scripts/check-cross-package-paths.mjs`); each consumer here has an entry in that script's `EXEMPTIONS` saying why
// it cannot declare the package, and `tests/scripts/select-quality-scope.test.mjs` fails when a path, a consumer or
// that exemption no longer exists.
export const pathDependencies = [
  {
    // The Registry tests of file and notification build their stand-in application from the default template's
    // shadcn primitives and node_modules; the template depends on both plugins, so neither can declare it.
    path: 'packages/templates/app-template-default/',
    consumers: [
      '@nocobase/app-plugin-file',
      '@nocobase/app-plugin-notification',
    ],
  },
  {
    // notification's vitest.config.ts copies the shadcn primitives its Registry item imports.
    path: 'packages/plugins/app-plugin-agents/client/components/ui/',
    consumers: ['@nocobase/app-plugin-notification'],
  },
  // The installed-client regression reads each template's actual Vitest configuration and setup. Both templates
  // depend on app-testing, so it cannot declare them without a cycle.
  ...['app-template-default', 'app-template-examples'].flatMap((template) =>
    ['vitest.config.ts', 'tests/setup/client-config.ts'].map((file) => ({
      path: `packages/templates/${template}/${file}`,
      consumers: ['@nocobase/app-testing'],
    })),
  ),
];

// Packages whose change needs the generated-application smoke tests, which install every packed workspace package.
export const createAppPackages = [
  '@nocobase/app-template-default',
  '@nocobase/app-template-examples',
  '@nocobase/create-app',
];

// Packages whose change needs the app-installer smoke test, which installs a deployment archive of the default
// template.
export const appInstallerPackages = [
  '@nocobase/app-installer',
  '@nocobase/app-template-default',
];

const dependencyFields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

const matches = (file, guarded) =>
  guarded.endsWith('/') ? file.startsWith(guarded) : file === guarded;

export function isFullPath(file) {
  return (
    fullFiles.has(file) ||
    fullDirectories.some((directory) => file.startsWith(directory))
  );
}

// Expands the `packages` globs of pnpm-workspace.yaml. Only whole-segment `*` is supported; anything else fails
// loudly rather than leaving packages out of the graph.
export function readWorkspacePatterns(cwd) {
  const text = readFileSync(path.join(cwd, 'pnpm-workspace.yaml'), 'utf8');
  const patterns = [];
  let inPackages = false;
  for (const line of text.split('\n')) {
    if (/^packages:\s*$/u.test(line)) {
      inPackages = true;
      continue;
    }
    if (!inPackages) continue;
    const item = /^\s+-\s+['"]?([^'"#\s]+)['"]?\s*(?:#.*)?$/u.exec(line);
    if (item) {
      patterns.push(item[1]);
    } else if (line.trim() !== '' && !line.trim().startsWith('#')) {
      break;
    }
  }
  for (const pattern of patterns) {
    if (
      pattern.startsWith('!') ||
      pattern.split('/').some((part) => part.includes('*') && part !== '*')
    ) {
      throw new Error(
        `Unsupported pnpm-workspace.yaml package pattern: ${pattern}`,
      );
    }
  }
  return patterns;
}

function expandPattern(cwd, pattern) {
  let directories = [''];
  for (const part of pattern.split('/')) {
    const next = [];
    for (const directory of directories) {
      if (part === '*') {
        const absolute = path.join(cwd, directory);
        if (!existsSync(absolute)) continue;
        for (const entry of readdirSync(absolute, { withFileTypes: true })) {
          if (entry.isDirectory() && entry.name !== 'node_modules') {
            next.push(directory ? `${directory}/${entry.name}` : entry.name);
          }
        }
      } else {
        next.push(directory ? `${directory}/${part}` : part);
      }
    }
    directories = next;
  }
  return directories.filter((directory) =>
    existsSync(path.join(cwd, directory, 'package.json')),
  );
}

// Every workspace package with its directory and the workspace packages it depends on in any dependency field.
export function readWorkspace(cwd) {
  const packages = new Map();
  for (const pattern of readWorkspacePatterns(cwd)) {
    for (const directory of expandPattern(cwd, pattern)) {
      const manifest = JSON.parse(
        readFileSync(path.join(cwd, directory, 'package.json'), 'utf8'),
      );
      packages.set(manifest.name, { name: manifest.name, directory, manifest });
    }
  }
  for (const info of packages.values()) {
    info.dependencies = new Set(
      dependencyFields
        .flatMap((field) => Object.keys(info.manifest[field] ?? {}))
        .filter((name) => packages.has(name) && name !== info.name),
    );
  }
  return packages;
}

// The workspace packages `dev/db` imports, whose change needs the root `db:typecheck` and `db:test`.
export function readDevDbPackages(cwd) {
  const names = new Set();
  const visit = (directory) => {
    const absolute = path.join(cwd, directory);
    if (!existsSync(absolute)) return;
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      if (['node_modules', 'tmp', 'results'].includes(entry.name)) continue;
      const relative = `${directory}/${entry.name}`;
      if (entry.isDirectory()) visit(relative);
      else if (/\.[cm]?[jt]sx?$/u.test(entry.name)) {
        const text = readFileSync(path.join(cwd, relative), 'utf8');
        for (const match of text.matchAll(
          /['"](@nocobase\/[a-z0-9-]+)(?:\/[^'"]*)?['"]/gu,
        )) {
          names.add(match[1]);
        }
      }
    }
  };
  visit('dev/db');
  return names;
}

export function packageOfFile(file, packages) {
  let owner;
  for (const info of packages.values()) {
    if (
      file.startsWith(`${info.directory}/`) &&
      (!owner || info.directory.length > owner.directory.length)
    ) {
      owner = info;
    }
  }
  return owner;
}

// The packages a change touches (`owners`) and the packages reading a changed path without depending on it
// (`consumers`). Returns `undefined` for a file in what looks like a package directory that is no longer a workspace
// package, which the caller treats as a full run.
export function selectChangedPackages(changedPaths, packages) {
  const owners = new Set();
  const consumers = new Set();
  for (const file of changedPaths) {
    const owner = packageOfFile(file, packages);
    if (owner) {
      owners.add(owner.name);
    } else if (/^packages\/[^/]+\/[^/]+\/./u.test(file)) {
      return undefined;
    }
    for (const dependency of pathDependencies) {
      if (matches(file, dependency.path)) {
        for (const consumer of dependency.consumers) consumers.add(consumer);
      }
    }
  }
  return { owners, consumers };
}

export function withDependents(names, packages) {
  const dependents = new Map();
  for (const info of packages.values()) {
    for (const dependency of info.dependencies) {
      if (!dependents.has(dependency)) dependents.set(dependency, new Set());
      dependents.get(dependency).add(info.name);
    }
  }
  const affected = new Set(names);
  const pending = [...names];
  while (pending.length > 0) {
    for (const dependent of dependents.get(pending.pop()) ?? []) {
      if (!affected.has(dependent)) {
        affected.add(dependent);
        pending.push(dependent);
      }
    }
  }
  return affected;
}

function fullPlan(packages, reason) {
  return {
    full: true,
    reason,
    changedPackages: [],
    packages: [...packages.keys()].sort(),
    runDbChecks: true,
    runBuild: true,
    buildFull: true,
    runCreateApp: true,
    runAppInstaller: true,
    packPackages: [],
  };
}

// Builds the plan from the changed paths alone, without git. `packages` is the result of `readWorkspace()`.
export function planFromChanges(changedPaths, { packages, devDbPackages }) {
  const fullPath = changedPaths.find(isFullPath);
  if (fullPath) {
    return fullPlan(
      packages,
      `${fullPath} reaches every package; running everything.`,
    );
  }
  const changed = selectChangedPackages(changedPaths, packages);
  if (!changed) {
    return fullPlan(
      packages,
      'A changed file belongs to no workspace package; running everything.',
    );
  }
  const affected = [
    ...new Set([
      ...withDependents(changed.owners, packages),
      ...changed.consumers,
    ]),
  ].sort();
  const changedCount = new Set([...changed.owners, ...changed.consumers]).size;
  const has = (name) => affected.includes(name);
  const runCreateApp = createAppPackages.some(has);
  const runAppInstaller = appInstallerPackages.some(has);
  const buildFull = runCreateApp || runAppInstaller;
  return {
    full: false,
    reason: affected.length
      ? `${changedCount} changed and ${affected.length - changedCount} dependent packages selected.`
      : 'No workspace package changed.',
    changedPackages: [
      ...new Set([...changed.owners, ...changed.consumers]),
    ].sort(),
    packages: affected,
    runDbChecks: affected.some((name) => devDbPackages.has(name)),
    runBuild: affected.length > 0,
    buildFull,
    runCreateApp,
    runAppInstaller,
    // Only what `pnpm pack:check` packs: the publishable packages under packages/.
    packPackages: buildFull
      ? []
      : affected.filter((name) =>
          packages.get(name).directory.startsWith('packages/'),
        ),
  };
}

const runGit = (cwd, args) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });

export function planQualityScope({
  baseSha,
  headSha,
  eventName,
  cwd = process.cwd(),
  git = (args) => runGit(cwd, args),
}) {
  const packages = readWorkspace(cwd);
  if (eventName === 'push') {
    return fullPlan(packages, 'A push runs everything.');
  }
  // A new branch, unavailable history, or an event without a base must never skip coverage.
  if (!baseSha || /^0+$/u.test(baseSha) || !headSha) {
    return fullPlan(packages, 'No comparison range; running everything.');
  }

  let base;
  let head;
  try {
    base = git([
      'rev-parse',
      '--verify',
      '--end-of-options',
      `${baseSha}^{commit}`,
    ]).trim();
    head = git([
      'rev-parse',
      '--verify',
      '--end-of-options',
      `${headSha}^{commit}`,
    ]).trim();
  } catch {
    return fullPlan(
      packages,
      'Comparison commits unavailable; running everything.',
    );
  }

  // Renames count as a deletion and an addition, so a move out of a package selects it as well as the destination.
  // Do not catch diff errors: a broken selector must fail the planning job, never report a narrower run.
  const changedPaths = git([
    'diff',
    '--name-only',
    '--no-renames',
    '-z',
    base,
    head,
    '--',
  ])
    .split('\0')
    .filter(Boolean);
  return planFromChanges(changedPaths, {
    packages,
    devDbPackages: readDevDbPackages(cwd),
  });
}

// `--filter=<name>` arguments for pnpm. Package names cannot contain whitespace or shell metacharacters, so the
// workflow expands the string unquoted.
export function filterArguments(names) {
  for (const name of names) {
    if (!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/u.test(name)) {
      throw new Error(`Unexpected package name: ${name}`);
    }
  }
  return names.map((name) => `--filter=${name}`).join(' ');
}

export function formatOutputs(plan) {
  const outputs = {
    full: plan.full,
    packages: JSON.stringify(plan.packages),
    package_count: plan.packages.length,
    filter: plan.full ? '' : filterArguments(plan.packages),
    run_db_checks: plan.runDbChecks,
    run_build: plan.runBuild,
    build_full: plan.buildFull,
    pack_packages: JSON.stringify(plan.packPackages),
    run_create_app: plan.runCreateApp,
    run_app_installer: plan.runAppInstaller,
  };
  return Object.entries(outputs)
    .map(([key, value]) => `${key}=${value}\n`)
    .join('');
}

export function formatSummary(plan) {
  const yesNo = (value) => (value ? 'yes' : 'no');
  const lines = [
    '### Quality scope',
    '',
    plan.reason,
    '',
    `| Full run | Packages | DB checks | Build | Create-app smoke | App-installer smoke |`,
    `| --- | --- | --- | --- | --- | --- |`,
    `| ${yesNo(plan.full)} | ${plan.packages.length} | ${yesNo(plan.runDbChecks)} | ${plan.buildFull ? 'every package' : plan.runBuild ? 'selected packages' : 'no'} | ${yesNo(plan.runCreateApp)} | ${yesNo(plan.runAppInstaller)} |`,
  ];
  if (!plan.full && plan.packages.length > 0) {
    const changed = new Set(plan.changedPackages);
    lines.push(
      '',
      '<details><summary>Selected packages</summary>',
      '',
      ...plan.packages.map(
        (name) => `- ${name}${changed.has(name) ? ' (changed)' : ''}`,
      ),
      '',
      '</details>',
    );
  }
  return `${lines.join('\n')}\n`;
}

if (import.meta.main) {
  const plan = planQualityScope({
    baseSha: process.env.BASE_SHA,
    headSha: process.env.HEAD_SHA,
    eventName: process.env.EVENT_NAME,
  });
  const output = formatOutputs(plan);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, output);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, formatSummary(plan));
  }
  console.log(plan.reason);
  if (!plan.full) {
    console.log(`Changed packages: ${plan.changedPackages.join(', ') || '-'}`);
  }
  process.stdout.write(output);
}
