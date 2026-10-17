// Fails when a workspace package reads another workspace package's directory by a relative path instead of through a
// declared dependency.
//
// pnpm only knows the edges a manifest declares. A test that imports `../../../tools/create-plugin/src/…`, a Vitest
// configuration that copies `../../templates/app-template-default/client/components`, or a stylesheet that imports a
// template's CSS by path all depend on that package without saying so: the dependency graph misses the edge, so
// `pnpm --filter …...` misses the reader, and the Quality scope selection (`scripts/select-quality-scope.mjs`), which
// runs a changed package and the packages depending on it, never reruns the reader when the package it reads changes.
//
// A package that needs another package's files either declares it (a devDependency is enough for a test, and the
// relative read then stays visible to the graph) or builds the fixture it needs in a temporary directory.
//
// The scan reads each package's TypeScript, JavaScript and CSS, its tsconfigs and its `package.json` scripts, and
// resolves every relative module specifier, every string literal beginning with `./` or `../` (also the run of
// literal arguments of a call such as `path.resolve(root, '..', '..', 'templates')`) and every repository-relative
// `packages/<group>/<name>` literal. A literal is resolved from its file's directory and, because tests and
// configurations resolve against `process.cwd()`, also from the package root.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

import { readWorkspace } from './select-quality-scope.mjs';

const dependencyFields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.turbo',
  '.vite',
  'storage',
  'test-results',
  'playwright-report',
]);

const SCRIPT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

/**
 * Reads that cannot be expressed as a dependency, by the reading package and a path prefix inside it. Each entry says
 * why; the check fails once an entry no longer covers a violation, so the list only shrinks.
 */
export const EXEMPTIONS = [
  // The Registry tests of file and notification materialize their recipe into a stand-in receiving application, which
  // needs the shadcn primitives an application owns (`#components/ui/*`) and a `node_modules` that resolves them. They
  // copy those from the default template, and notification also from the agents plugin. Neither can be declared: the
  // template depends on both plugins, so a devDependency would be a cycle, and no package publishes the primitives,
  // which every application owns as copied source. `scripts/select-quality-scope.mjs` keeps a path mapping for these
  // reads instead, so a change to those components still runs the two plugins' tests.
  {
    packageName: '@nocobase/app-plugin-file',
    path: 'vitest.config.ts',
    reason:
      'Copies the default template’s button, dialog and spinner primitives into the Registry test application and links the template’s node_modules; see the comment above.',
  },
  {
    packageName: '@nocobase/app-plugin-file',
    path: 'tests/agent-workflow.test.ts',
    reason:
      'Builds the same stand-in application from the default template’s primitives and node_modules, and type-checks it against the template’s vite-env.d.ts; see the comment above.',
  },
  {
    packageName: '@nocobase/app-plugin-notification',
    path: 'vitest.config.ts',
    reason:
      'Copies the agents plugin’s alert, badge, button, card and table primitives into the Registry test application and links the default template’s node_modules; see the comment above.',
  },
  {
    packageName: '@nocobase/app-plugin-mail',
    path: 'tests/fixtures/production-acceptance/',
    reason:
      'A manual acceptance harness (see its README) that builds the default template and the examples template into a production bundle. No Vitest project or CI job runs it, and a plugin cannot declare the templates that install it without a dependency cycle.',
  },
  {
    packageName: '@nocobase/app-plugin-mail',
    path: 'tests/fixtures/workspace-browser/',
    reason:
      'The browser harness of the same manual acceptance run, which bundles a page with the default template’s stylesheet. No Vitest project or CI job runs it, and a plugin cannot declare the templates that install it without a dependency cycle.',
  },
];

const isRelative = (text) => text.startsWith('./') || text.startsWith('../');
const isLiteral = (node) =>
  ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);

/**
 * Path references in a TypeScript or JavaScript source: `module` specifiers resolve from the file's directory, `path`
 * literals from the file's directory or the package root, and `repository` literals from the repository root.
 */
export function collectScriptReferences(source, fileName = 'source.ts') {
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const references = [];
  const moduleNodes = new Set();
  const add = (kind, text) => references.push({ kind, text });
  const visit = (node) => {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      specifier = node.moduleSpecifier;
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      specifier = node.moduleReference.expression;
    } else if (ts.isImportTypeNode(node)) {
      const argument = node.argument;
      if (ts.isLiteralTypeNode(argument)) specifier = argument.literal;
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require'))
    ) {
      specifier = node.arguments[0];
    }
    if (specifier && isLiteral(specifier)) {
      moduleNodes.add(specifier);
      if (specifier.text.startsWith('.')) add('module', specifier.text);
    }

    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      // `path.resolve(dir, '..', '..', 'templates', 'name')`: join each run of literal arguments.
      let run = [];
      const flush = () => {
        if (run.length > 1) {
          const joined = path.posix.join(...run);
          if (isRelative(joined)) add('path', joined);
        }
        run = [];
      };
      for (const argument of node.arguments ?? []) {
        if (isLiteral(argument)) run.push(argument.text);
        else flush();
      }
      flush();
    }

    if (ts.isTemplateExpression(node) && isRelative(node.head.text)) {
      // `../other-package/${name}.tsx`: the literal head already names the directory.
      add('path', node.head.text);
    }

    if (isLiteral(node) && !moduleNodes.has(node)) {
      if (isRelative(node.text)) add('path', node.text);
      else if (/^packages\/[^/]+\/[^/]+(?:\/|$)/u.test(node.text)) {
        add('repository', node.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return references;
}

/** Path references in a stylesheet: `@import`, `@source`, `@plugin`, `@config`, `@reference` and `url()`. */
export function collectStyleReferences(source) {
  const references = [];
  const text = source.replace(/\/\*[\s\S]*?\*\//gu, '');
  for (const match of text.matchAll(
    /(?:@(?:import|source|plugin|config|reference)\s+(?:url\(\s*)?|url\(\s*)['"]?([^'")\s;]+)/gu,
  )) {
    if (match[1].startsWith('.')) {
      references.push({ kind: 'module', text: match[1] });
    }
  }
  return references;
}

/** Path references in a tsconfig: `extends`, `include`, `files`, `references` and `paths`. */
export function collectJsonReferences(source) {
  const references = [];
  for (const match of source.matchAll(/"(\.\.?\/[^"]*)"/gu)) {
    references.push({ kind: 'module', text: match[1] });
  }
  return references;
}

/** Relative paths in `package.json` scripts, which run from the package root. */
export function collectManifestReferences(manifest) {
  const references = [];
  for (const command of Object.values(manifest.scripts ?? {})) {
    for (const token of String(command).split(/[\s'"=]+/u)) {
      if (isRelative(token)) references.push({ kind: 'root', text: token });
    }
  }
  return references;
}

async function collectFiles(directory) {
  const files = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        files.push(...(await collectFiles(absolute)));
      }
    } else if (
      SCRIPT_EXTENSIONS.has(path.extname(entry.name)) ||
      entry.name.endsWith('.css') ||
      /^tsconfig(?:\.[^/]+)?\.json$/u.test(entry.name)
    ) {
      files.push(absolute);
    }
  }
  return files;
}

function ownerOf(absolute, packages, repositoryRoot) {
  const relative = path.relative(repositoryRoot, absolute).split(path.sep);
  let owner;
  for (const info of packages.values()) {
    const directory = info.directory.split('/');
    if (
      directory.every((part, index) => relative[index] === part) &&
      (!owner || info.directory.length > owner.directory.length)
    ) {
      owner = info;
    }
  }
  return owner;
}

/**
 * Every undeclared read of another workspace package, as `{ packageName, file, reference, target }`, with the
 * exemptions applied. `unusedExemptions` lists the entries that covered nothing.
 */
export async function findCrossPackageReads(
  repositoryRoot,
  { packages = readWorkspace(repositoryRoot), exemptions = EXEMPTIONS } = {},
) {
  const violations = [];
  const used = new Set();
  for (const info of packages.values()) {
    const packageRoot = path.join(repositoryRoot, info.directory);
    const declared = new Set(
      dependencyFields.flatMap((field) =>
        Object.keys(info.manifest[field] ?? {}),
      ),
    );
    const sources = [
      {
        file: path.join(packageRoot, 'package.json'),
        references: collectManifestReferences(info.manifest),
      },
    ];
    for (const file of await collectFiles(packageRoot)) {
      if (ownerOf(file, packages, repositoryRoot) !== info) continue;
      const source = await readFile(file, 'utf8');
      const references = file.endsWith('.css')
        ? collectStyleReferences(source)
        : file.endsWith('.json')
          ? collectJsonReferences(source)
          : collectScriptReferences(source, file);
      sources.push({ file, references });
    }

    for (const { file, references } of sources) {
      const relativeFile = path
        .relative(packageRoot, file)
        .split(path.sep)
        .join('/');
      const exemption = exemptions.find(
        (entry) =>
          entry.packageName === info.name &&
          relativeFile.startsWith(entry.path),
      );
      const reported = new Set();
      for (const reference of references) {
        const bases =
          reference.kind === 'module'
            ? [path.dirname(file)]
            : reference.kind === 'root'
              ? [packageRoot]
              : reference.kind === 'repository'
                ? [repositoryRoot]
                : [path.dirname(file), packageRoot];
        for (const base of bases) {
          const target = ownerOf(
            path.resolve(base, reference.text),
            packages,
            repositoryRoot,
          );
          if (!target || target === info || declared.has(target.name)) {
            continue;
          }
          if (exemption) {
            used.add(exemption);
            continue;
          }
          const key = `${reference.text}\0${target.name}`;
          if (reported.has(key)) continue;
          reported.add(key);
          violations.push({
            packageName: info.name,
            directory: info.directory,
            file: `${info.directory}/${relativeFile}`,
            reference: reference.text,
            target: target.name,
          });
        }
      }
    }
  }
  return {
    violations,
    unusedExemptions: exemptions.filter((entry) => !used.has(entry)),
  };
}

async function main() {
  const repositoryRoot = path.resolve(import.meta.dirname, '..');
  const { violations, unusedExemptions } =
    await findCrossPackageReads(repositoryRoot);
  for (const violation of violations) {
    const message = `${violation.packageName} reads ${violation.target} through "${violation.reference}" without declaring it`;
    console.error(`${violation.file}: ${message}`);
    if (process.env.GITHUB_ACTIONS) {
      console.error(`::error file=${violation.file}::${message}`);
    }
  }
  for (const entry of unusedExemptions) {
    console.error(
      `EXEMPTIONS in scripts/check-cross-package-paths.mjs: ${entry.packageName} ${entry.path} no longer reads another package; remove the entry.`,
    );
  }
  if (violations.length > 0 || unusedExemptions.length > 0) {
    if (violations.length > 0) {
      console.error(
        '\nDeclare the package you read (a devDependency is enough for tests and configuration), or build the fixture the test needs in a temporary directory. See .agents/rules/package-dependencies.md, "Reading Another Package\'s Files".',
      );
    }
    process.exit(1);
  }
  console.log(
    'No workspace package reads another one by a relative path without declaring it.',
  );
}

if (process.argv[1] === import.meta.filename) {
  await main();
}
