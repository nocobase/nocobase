// Verifies that every package the server half of a shipped module imports is declared as a runtime dependency.
//
// What makes this a real failure is that server code is deployed unbundled. `pnpm build` emits `dist/server` with its
// bare imports intact and installs a `node_modules` beside it from the generated `dist/package.json`, which is built
// by following `dependencies` alone. A server module importing something declared only as a devDependency therefore
// resolves in every development checkout and is simply absent on the deployed server.
// `@nocobase/app-plugin-workflow` shipped exactly that: `server/loader/source-parser.ts` imports `typescript`, which
// was a devDependency, so a built application crashed on start with `Cannot find package 'typescript'`.
//
// Client code fails the same way, one step later. A plugin's `client/` is not bundled by the plugin — `build` is
// `tsc`, so `dist/client/*.js` keeps its bare imports and the consuming application's Vite build resolves them.
// That application installed the plugin from a registry and has only what the published manifest declares, so a
// client import left in `devDependencies` fails there with `Could not resolve "…"`. `sonner` and `@xyflow/react`
// both shipped that way.
//
// Neither failure reproduces here: a workspace install links every devDependency into the plugin's own
// `node_modules`, so both resolve in development and fail only once installed from a registry.
//
// So the rule is one question: does someone outside this repository resolve this import? See AGENTS.md,
// "Declaring Dependencies by How They Are Used".
//
// Only value imports count. `import type` and type-only named bindings are erased before anything runs.
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

/** Groups whose packages ship code to a consumer. Templates are applications; they are the end of the line. */
const CHECKED_GROUPS = ['plugins', 'examples', 'libs', 'app', 'tools'];

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.mjs',
]);

/**
 * Directories never scanned, at any depth, whatever a manifest says about them.
 *
 * They hold tests and fixtures, which are excluded from every package here by its `files` field — their imports of
 * `vitest` and of fixture-only packages are correctly devDependencies.
 */
const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  'tests',
  'e2e',
  'fixtures',
  '__tests__',
  '__fixtures__',
  // `registry` is shadcn-style source copied into an application and compiled there against that application's own
  // `react` and `@/` alias, which the plugin cannot resolve at all. `client` is checked — see below.
  'registry',
  // `template` is the same shape one level up: `@nocobase/create-plugin` ships it as the source of a generated
  // plugin, which compiles it against the manifest `src/lib/template.ts` writes for that plugin. The generator
  // resolves none of those imports itself, so declaring them here would claim dependencies it does not have.
  'template',
]);

/**
 * Top-level directories a package publishes, derived from `files`.
 *
 * `files` is the authoritative answer to whether code ships, so the scan follows it rather than a list maintained
 * here — tooling that runs from a checkout, such as `app-plugin-workflow`'s `skill-evals`, is excluded because the
 * manifest already excludes it, not because this script knows its name.
 *
 * A package that ships `dist` is checked through the source files in its emitting TypeScript projects instead; see
 * `compiledSourceFiles`. Reading TypeScript keeps `import type` distinguishable from a value import.
 */
function publishedDirectories(manifest, entries) {
  const files = manifest.files ?? [];
  const named = new Set(
    files
      .map((entry) => entry.replace(/^\.\//u, '').split('/')[0])
      .filter((entry) => entry && entry !== 'dist'),
  );

  return entries.filter(
    (entry) => named.has(entry) && !SKIPPED_DIRECTORIES.has(entry),
  );
}

/** Source files emitted under `dist` by a package's root TypeScript projects. */
async function compiledSourceFiles(packageDirectory) {
  const entries = await readdir(packageDirectory);
  const files = new Set();
  for (const entry of entries) {
    if (!/^tsconfig(?:\.[^/]+)?\.json$/u.test(entry)) continue;
    const configPath = path.join(packageDirectory, entry);
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    if (config.error) {
      throw new Error(
        ts.flattenDiagnosticMessageText(config.error.messageText, '\n'),
      );
    }
    const parsed = ts.parseJsonConfigFileContent(
      config.config,
      ts.sys,
      packageDirectory,
      undefined,
      configPath,
    );
    if (parsed.errors.length > 0) {
      throw new Error(
        `Cannot parse ${configPath}: ${ts.flattenDiagnosticMessageText(parsed.errors[0].messageText, '\n')}`,
      );
    }
    const outDir = parsed.options.outDir;
    if (parsed.options.noEmit || !outDir) continue;
    const relativeOutDir = path.relative(packageDirectory, outDir);
    if (
      relativeOutDir !== 'dist' &&
      !relativeOutDir.startsWith(`dist${path.sep}`)
    )
      continue;
    for (const file of parsed.fileNames) {
      const relative = path.relative(packageDirectory, file);
      if (
        relative === '..' ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
      )
        continue;
      if (
        relative.split(path.sep).some((part) => SKIPPED_DIRECTORIES.has(part))
      )
        continue;
      if (!SOURCE_EXTENSIONS.has(path.extname(file)) || isExcludedFile(file))
        continue;
      files.add(file);
    }
  }
  return [...files];
}

/** A file whose name marks it as tooling or a test rather than shipped code. */
function isExcludedFile(fileName) {
  return (
    /\.(test|spec)\.[cm]?[jt]sx?$/u.test(fileName) ||
    /\.config\.[cm]?[jt]s$/u.test(fileName) ||
    /\.d\.[cm]?ts$/u.test(fileName)
  );
}

/**
 * The package a specifier resolves to, or `undefined` when nothing has to be declared for it.
 *
 * Relative and absolute paths stay inside the package. `node:`-prefixed specifiers are builtins. Unprefixed builtins
 * such as `fs` and `path` are builtins too — they read like packages but resolve without one, and reporting them
 * would be pure noise. Subpath imports (`#internal`) and the `@/` alias are resolved by the consumer, not here.
 *
 * `virtual:` is the Rollup and Vite convention for a module a build plugin supplies. No package publishes one, so
 * there is nothing to declare; the plugin that serves it is what has to be registered in the application's build.
 */
function packageNameOf(specifier, builtinModules) {
  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('#') ||
    specifier.startsWith('@/') ||
    specifier.startsWith('node:') ||
    specifier.startsWith('virtual:')
  ) {
    return undefined;
  }

  const segments = specifier.split('/');
  const name = specifier.startsWith('@')
    ? segments.slice(0, 2).join('/')
    : segments[0];

  return builtinModules.has(name) ? undefined : name;
}

/**
 * Collect actual runtime module references, not import-like text inside prose.
 * Parse using the source filename so TS assertions and TSX elements are distinct.
 * Computed module names remain outside the scope of this static check.
 */
export function collectRuntimeSpecifiers(source, fileName = 'source.tsx') {
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  if (file.parseDiagnostics.length > 0) {
    throw new Error(
      `Cannot scan ${fileName}: ${ts.flattenDiagnosticMessageText(file.parseDiagnostics[0].messageText, '\n')}`,
    );
  }
  const specifiers = new Set();
  const add = (node) => {
    if (
      node &&
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ) {
      specifiers.add(node.text);
    }
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      const bindings = clause?.namedBindings;
      const typeOnly =
        clause?.isTypeOnly ||
        (!clause?.name &&
          bindings &&
          ts.isNamedImports(bindings) &&
          bindings.elements.length > 0 &&
          bindings.elements.every((item) => item.isTypeOnly));
      if (!typeOnly) add(node.moduleSpecifier);
    } else if (ts.isExportDeclaration(node)) {
      const clause = node.exportClause;
      const typeOnly =
        node.isTypeOnly ||
        (clause &&
          ts.isNamedExports(clause) &&
          clause.elements.length > 0 &&
          clause.elements.every((item) => item.isTypeOnly));
      if (!typeOnly) add(node.moduleSpecifier);
    } else if (ts.isImportEqualsDeclaration(node)) {
      if (
        !node.isTypeOnly &&
        ts.isExternalModuleReference(node.moduleReference)
      ) {
        add(node.moduleReference.expression);
      }
    } else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (
        callee.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(callee) && callee.text === 'require')
      ) {
        add(node.arguments[0]);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return specifiers;
}

async function collectSourceFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      files.push(
        ...(await collectSourceFiles(path.join(directory, entry.name))),
      );
      continue;
    }
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue;
    if (isExcludedFile(entry.name)) continue;
    files.push(path.join(directory, entry.name));
  }

  return files;
}

/**
 * Undeclared runtime imports for one package.
 *
 * `peerDependencies` and `optionalDependencies` count as declared: a peer is provided by the consumer on purpose,
 * which is how every plugin depends on the runtime it plugs into.
 */
export async function findViolations(
  packageDirectory,
  manifest,
  builtinModules,
) {
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);
  const devDependencies = new Set(Object.keys(manifest.devDependencies ?? {}));

  const entries = (
    await readdir(packageDirectory, { withFileTypes: true })
  ).flatMap((entry) => (entry.isDirectory() ? [entry.name] : []));

  const namedFiles = (
    await Promise.all(
      publishedDirectories(manifest, entries).map((directory) =>
        collectSourceFiles(path.join(packageDirectory, directory)),
      ),
    )
  ).flat();
  const shipsDist = (manifest.files ?? []).some(
    (entry) => entry.replace(/^\.\//u, '').split('/')[0] === 'dist',
  );
  const files = new Set([
    ...namedFiles,
    ...(shipsDist ? await compiledSourceFiles(packageDirectory) : []),
  ]);

  const offenders = new Map();
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const specifier of collectRuntimeSpecifiers(source, file)) {
      const name = packageNameOf(specifier, builtinModules);
      if (!name || name === manifest.name || declared.has(name)) continue;
      if (!offenders.has(name)) {
        offenders.set(name, path.relative(packageDirectory, file));
      }
    }
  }

  return [...offenders]
    .map(([dependency, file]) => ({
      dependency,
      file,
      kind: devDependencies.has(dependency) ? 'dev-only' : 'undeclared',
    }))
    .sort((left, right) => left.dependency.localeCompare(right.dependency));
}

export async function collectPackages(repositoryRoot) {
  const packages = [];

  for (const group of CHECKED_GROUPS) {
    const groupDirectory = path.join(repositoryRoot, 'packages', group);
    let entries;
    try {
      entries = await readdir(groupDirectory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const packageDirectory = path.join(groupDirectory, entry.name);
      const manifestPath = path.join(packageDirectory, 'package.json');
      try {
        await stat(manifestPath);
      } catch {
        continue;
      }
      packages.push({
        manifest: JSON.parse(await readFile(manifestPath, 'utf8')),
        manifestPath,
        packageDirectory,
      });
    }
  }

  return packages;
}

function messageFor(violation) {
  return violation.kind === 'dev-only'
    ? `"${violation.dependency}" is imported at runtime by ${violation.file} but declared only in devDependencies, so it is absent wherever this package is installed from a registry`
    : `"${violation.dependency}" is imported at runtime by ${violation.file} but is not declared in dependencies, peerDependencies, or optionalDependencies`;
}

async function main() {
  const repositoryRoot = path.resolve(import.meta.dirname, '..');
  const { builtinModules } = await import('node:module');
  const builtins = new Set(builtinModules);
  const packages = await collectPackages(repositoryRoot);
  let failed = false;

  for (const { manifest, manifestPath, packageDirectory } of packages) {
    const violations = await findViolations(
      packageDirectory,
      manifest,
      builtins,
    );
    if (violations.length === 0) continue;

    failed = true;
    const relativePath = path.relative(repositoryRoot, manifestPath);
    console.error(`\n${relativePath} (${manifest.name})`);
    for (const violation of violations) {
      const message = messageFor(violation);
      console.error(`  - ${message}`);
      if (process.env.GITHUB_ACTIONS) {
        console.error(`::error file=${relativePath}::${message}`);
      }
    }
  }

  if (failed) {
    console.error(
      '\nDeclare each one in dependencies, or stop importing it from shipped code.',
    );
    console.error(
      'See AGENTS.md, "Declaring Dependencies by How They Are Used".',
    );
    process.exit(1);
  }

  console.log(
    `Checked ${packages.length} packages — every runtime import is declared.`,
  );
}

if (process.argv[1] === import.meta.filename) {
  await main();
}
