// Verifies that tests outside the database packages do not choose a dialect.
//
// A test that needs a database gets it from `@nocobase/db-testing`, which runs it on SQLite by default and on the
// dialect `NOCOBASE_TEST_DB_DIALECT` names otherwise. A test that configures SQLite itself, or asserts on SQL only
// SQLite understands, passes on every default run and fails only once someone selects another database — which is
// how the plugins' migrations went unchecked on PostgreSQL and MySQL until `@nocobase/db-testing` existed. See
// AGENTS.md, "Database Tests Do Not Choose a Dialect".
//
// A test whose subject is a dialect — the SQLite driver, configuration that names one — says so in its first lines:
//
//   // db-test-portability: sqlite-only — <why>
//   // db-test-portability: dialect-specific — <why>
//
// Files that cannot carry the marker are listed below with the reason.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

/** Groups whose tests are checked. The database packages own their dialects and are skipped below. */
const CHECKED_GROUPS = [
  'plugins',
  'examples',
  'app',
  'templates',
  'tools',
  'libs',
];

/** `@nocobase/db`, `@nocobase/db-testkit`, `@nocobase/db-testing` and the dialect packages test dialects on purpose. */
const SKIPPED_LIBRARIES = /^db(?:-[a-z]+)?$/;

const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
]);

const TEST_FILE = /\.test\.(?:[cm]?[jt]sx?)$/;

const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/;

const DIALECTS = 'sqlite|postgres|mysql|oracle|mssql|kingbase|oceanbase|dameng';

export const RULES = [
  {
    id: 'dialect-import',
    pattern: new RegExp(
      String.raw`(?:\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)['"\`]@nocobase/db-(?:${DIALECTS})(?:/[^'"\`]*)?['"\`]`,
      'm',
    ),
    message:
      'imports a dialect package; take the database from @nocobase/app-testing/server, or @nocobase/db-testing in a library',
  },
  {
    id: 'dynamic-dialect-import',
    // A dialect package named at run time, such as import(`@nocobase/db-${dialect}`).
    pattern: /@nocobase\/db-\$\{/,
    message:
      'imports a dialect package chosen at run time; take the database from @nocobase/app-testing/server, or @nocobase/db-testing in a library',
  },
  {
    id: 'sqlite-driver',
    pattern: new RegExp(
      String.raw`(?:\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)['"\`](?:better-sqlite3|sqlite3)['"\`]|\bclient\s*:\s*['"\`](?:better-sqlite3|sqlite3)['"\`]`,
      'm',
    ),
    message:
      'opens SQLite through its driver; take the database from @nocobase/app-testing/server, or @nocobase/db-testing in a library',
  },
  {
    id: 'memory-database',
    pattern: /['"`]:memory:['"`]/,
    message:
      "configures ':memory:'; take the database from @nocobase/app-testing/server, or @nocobase/db-testing in a library",
  },
  {
    id: 'sqlite-dialect',
    pattern: /\bdialect\s*:\s*['"`]sqlite['"`]/,
    message:
      "configures dialect: 'sqlite'; take the database from @nocobase/app-testing/server, or @nocobase/db-testing in a library",
  },
  {
    id: 'pragma',
    // `pragma <name>` as SQL: followed by its argument, an assignment, the end of the statement or of the string
    // holding it. Prose that mentions PRAGMA, and an HTTP `Pragma` header, are not.
    pattern: /\bpragma\s+[a-z_]+\s*(?:\(|=|;|['"`]|$)/im,
    message:
      'runs a SQLite PRAGMA; assert on the schema with expectCollection() or inspectCollection()',
  },
  {
    id: 'sqlite-catalog',
    pattern: /\bsqlite_(?:master|schema)\b/i,
    message:
      "reads SQLite's catalog; use connection.schemaInspector or expectCollection()",
  },
  {
    id: 'trigger',
    pattern: /\bcreate\s+trigger\b/i,
    message:
      'creates a trigger; make the write fail with vi.spyOn() on the write instead',
  },
];

const MARKER =
  /db-test-portability:\s*(sqlite-only|dialect-specific)\b(?:\s*[—–-]\s*(\S.*))?/;

/**
 * Files that do not carry the marker themselves. A template's tests ship inside the template a user scaffolds, so
 * a note about this repository's checks has no place in them.
 */
export const EXEMPT = new Map([
  [
    'packages/templates/app-template-examples/tests/logic/config.test.ts',
    'the application configuration under test names SQLite connections',
  ],
  [
    'packages/templates/app-template-examples/tests/components/numeric-examples.test.tsx',
    'a client component test whose mocked API data names the SQLite dialect',
  ],
  [
    'packages/templates/app-template-examples/tests/logic/external-crm.test.ts',
    'the external CRM stand-in under test is a SQLite file by design; server/providers/external-crm-sample.ts creates it on SQLite only',
  ],
]);

/**
 * Where an application's or a plugin's tests take their test fixtures from. `@nocobase/app-testing` carries
 * everything `@nocobase/db-testing` and `@nocobase/app-cli/testing` export, so these packages depend on it alone and
 * install one copy of `@nocobase/db-testing`, whose module state — provisioner cache, stale-database cleanup — exists
 * once per copy. Libraries, tools and the application runtime packages themselves use the layers below directly.
 */
const ENTRY_GROUPS = new Set(['plugins', 'examples', 'templates']);

export const ENTRY_RULES = [
  {
    id: 'db-testing-entry',
    pattern:
      /(?:\bfrom\s+|\bimport\s*\(\s*|^\s*import\s+)['"`]@nocobase\/db-testing(?:\/vitest)?['"`]/m,
    message:
      'imports @nocobase/db-testing; an application or a plugin imports it from @nocobase/app-testing/server',
  },
  {
    id: 'app-cli-testing-entry',
    pattern:
      /(?:\bfrom\s+|\bimport\s*\(\s*|^\s*import\s+)['"`]@nocobase\/app-cli\/testing['"`]/m,
    message:
      'imports @nocobase/app-cli/testing; an application or a plugin imports it from @nocobase/app-testing/cli',
  },
];

/** The entry rules a test of an application or a plugin breaks; no marker or listing exempts it from them. */
export function findEntryViolations(relativePath, source) {
  const group = relativePath.split('/')[1];
  if (!ENTRY_GROUPS.has(group)) return [];
  const violations = [];
  for (const rule of ENTRY_RULES) {
    const match = rule.pattern.exec(source);
    if (!match) continue;
    const line = source.slice(0, match.index).split('\n').length;
    violations.push({ rule: rule.id, message: rule.message, line });
  }
  return violations;
}

/** The rules a source breaks, with the 1-based line of the first match of each. */
export function findViolations(source) {
  const violations = [];
  for (const rule of RULES) {
    const match = rule.pattern.exec(source);
    if (!match) continue;
    const line = source.slice(0, match.index).split('\n').length;
    violations.push({ rule: rule.id, message: rule.message, line });
  }
  return violations;
}

/**
 * The marker a file declares in its first lines: `{ kind, reason }`, `{ kind, reason: undefined }` when the reason
 * is missing, or `undefined`.
 */
export function readMarker(source) {
  const head = source.split('\n', 5).join('\n');
  const match = MARKER.exec(head);
  if (!match) return undefined;
  return { kind: match[1], reason: match[2]?.trim() || undefined };
}

/** Test files, and every source file under a `tests` directory: helpers configure databases as often as tests do. */
async function collectTestFiles(directory, files = [], insideTests = false) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return files;
    throw error;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      await collectTestFiles(
        path.join(directory, entry.name),
        files,
        insideTests || entry.name === 'tests' || entry.name === '__tests__',
      );
    } else if (
      SOURCE_FILE.test(entry.name) &&
      (insideTests || TEST_FILE.test(entry.name))
    ) {
      files.push(path.join(directory, entry.name));
    }
  }
  return files;
}

async function checkedPackageDirectories(repositoryRoot) {
  const directories = [];
  for (const group of CHECKED_GROUPS) {
    const groupDirectory = path.join(repositoryRoot, 'packages', group);
    let entries;
    try {
      entries = await readdir(groupDirectory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (group === 'libs' && SKIPPED_LIBRARIES.test(entry.name)) continue;
      directories.push(path.join(groupDirectory, entry.name));
    }
  }
  return directories;
}

/**
 * Every problem in the repository: files breaking a rule without an exemption, markers without a reason, and
 * listed files that no longer need their entry.
 */
export async function checkDbTestPortability({ repositoryRoot }) {
  const problems = [];
  const seen = new Set();
  for (const directory of await checkedPackageDirectories(repositoryRoot)) {
    for (const file of await collectTestFiles(directory)) {
      const relativePath = path
        .relative(repositoryRoot, file)
        .split(path.sep)
        .join('/');
      const source = await readFile(file, 'utf8');
      for (const violation of findEntryViolations(relativePath, source)) {
        problems.push({
          file: relativePath,
          line: violation.line,
          message: violation.message,
        });
      }
      const violations = findViolations(source);
      const marker = readMarker(source);
      const listed = EXEMPT.has(relativePath);
      if (listed) seen.add(relativePath);
      if (marker && !marker.reason) {
        problems.push({
          file: relativePath,
          line: 1,
          message: `its db-test-portability marker gives no reason; write "// db-test-portability: ${marker.kind} — <why>"`,
        });
        continue;
      }
      // Every kind of exemption only shrinks: a listed file or a marker that no longer covers a violation is
      // reported, so the exemption cannot outlive its reason and hide a construct added later.
      if (violations.length === 0) {
        if (listed) {
          problems.push({
            file: relativePath,
            line: 1,
            message:
              'no longer chooses a dialect; remove it from EXEMPT in scripts/check-db-test-portability.mjs',
          });
        } else if (marker) {
          problems.push({
            file: relativePath,
            line: 1,
            message:
              'no longer chooses a dialect; remove its db-test-portability marker',
          });
        }
        continue;
      }
      if (marker && listed) {
        problems.push({
          file: relativePath,
          line: 1,
          message:
            'carries a db-test-portability marker and is also listed in scripts/check-db-test-portability.mjs; remove the entry',
        });
        continue;
      }
      if (marker || listed) continue;
      for (const violation of violations) {
        problems.push({
          file: relativePath,
          line: violation.line,
          message: violation.message,
        });
      }
    }
  }
  for (const listedPath of EXEMPT.keys()) {
    if (!seen.has(listedPath)) {
      problems.push({
        file: listedPath,
        line: 1,
        message:
          'is listed in scripts/check-db-test-portability.mjs but no longer exists; remove the entry',
      });
    }
  }
  return problems;
}

async function main() {
  const repositoryRoot = path.resolve(import.meta.dirname, '..');
  const problems = await checkDbTestPortability({ repositoryRoot });
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`${problem.file}:${problem.line} ${problem.message}`);
      if (process.env.GITHUB_ACTIONS) {
        console.error(
          `::error file=${problem.file},line=${problem.line}::${problem.message}`,
        );
      }
    }
    console.error(
      '\nSee AGENTS.md, "Database Tests Do Not Choose a Dialect", and packages/libs/db-testing/README.md.',
    );
    process.exit(1);
  }
  console.log(
    'Database tests choose no dialect outside the database packages.',
  );
}

if (process.argv[1] === import.meta.filename) {
  await main();
}
