import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import ts from 'typescript';

const directory = path.dirname(fileURLToPath(import.meta.url));
const signatures = path.join(directory, 'signatures');
const db = path.resolve(directory, '../..');
const input = path.resolve(db, '../repository-input');
const roots = [
  { declarations: path.join(db, 'dist/src'), source: path.join(db, 'src') },
  { declarations: path.join(input, 'dist'), source: path.join(input, 'src') },
];
const entries = [
  {
    name: '@nocobase/db',
    key: '.',
    file: path.join(roots[0].declarations, 'index.d.ts'),
  },
  {
    name: '@nocobase/db/testing',
    key: './testing',
    file: path.join(roots[0].declarations, 'testing.d.ts'),
  },
];
const groups = {
  'database-manager': [
    'DatabaseManager',
    'Configure named connections, register drivers, create the application manager and resolve its service token.',
    'database-manager',
  ],
  connection: [
    'Connection',
    'Configure a connection, obtain its handles, manage its lifecycle and inspect native access. Permission, transaction and event semantics have dedicated chapters.',
    'connection',
  ],
  migration: [
    'Migrations and task locks',
    'Define, load, validate and execute immutable migrations; inspect history, repair checksums deliberately, and inspect or release task locks. Take schema/data handles from the migration context.',
    'migration-and-seed',
  ],
  seed: [
    'Seeds and sample data',
    'Define and run installation seeds, record history and execute pending sample seeds. Seed contexts provide data access without a schema builder.',
    'migration-and-seed',
  ],
  builder: [
    'Collection schema and builders',
    'Declare and change logical Collections, Fields, Relations, indexes and constraints. Obtain CollectionBuilder through a manager or connection; its class is a type-only root export. Schema changes belong in migrations.',
    'collection-and-schema',
  ],
  collections: [
    'Resolved collections',
    'Read resolved logical Collection definitions and manage the shared registry cache. These operations inspect or refresh definitions; they do not create tables.',
    'collection-and-schema',
  ],
  schema: [
    'Physical schema inspection',
    'Inspect physical schemas, tables, columns, indexes and constraints. Names here are physical identities, unlike logical Collection names. Shared normalization helpers and BaseSchemaInspector primarily support dialect implementations.',
    'collection-and-schema',
  ],
  metadata: [
    'Collection metadata',
    'Define, validate, store and patch supplemental Collection metadata. Obtain the metadata service from connection.collectionMetadata; it is not a root-exported constructor. Store revisions support conflict detection.',
    'collection-and-schema',
  ],
  artifacts: [
    'Collection artifacts',
    'Serialize resolved schema and supplemental metadata into portable Collection artifacts and manifests, and validate their directory names.',
    'collection-and-schema',
  ],
  query: [
    'Query and expressions',
    'Compose portable database queries using connection naming rather than Collection-level naming overrides. Execution can inspect resolved numeric field metadata; Repository policies are not applied. Use execute/executeTakeFirst/value/pluck to execute and compile to inspect SQL and bindings.',
    'query',
  ],
  repository: [
    'Repository operations',
    'Read and mutate Collection records with field conversion, relations, policy enforcement, optimistic locking and mutation events. RepositoryQuery is both PromiseLike and AsyncIterable; consume a query in one mode.',
    'repository',
  ],
  inputs: [
    'Repository inputs and result types',
    'Describe filters, projections, ordering, aggregation, scalar mutations and relation mutations. Builder callbacks receive their builders from repository methods. A type export alone does not provide a runtime constructor or a build function.',
    'repository',
  ],
  policies: [
    'Repository policies',
    'Bind read/create/update/delete permissions, normalize policies, narrow them and expand explicit read references. Row scopes, field allowlists, relation rules and create defaults have distinct roles. Method-level writePolicy is an additional write restriction.',
    'permissions',
  ],
  transactions: [
    'Transactions',
    'Transaction methods are declared on DatabaseManager, DatabaseConnection and DatabaseScope. This page contains the shared callback phase contract; the chapter explains propagation, savepoints and completion callbacks.',
    'transactions',
  ],
  events: [
    'Repository mutation events',
    'Subscribe through a full connection, describe event delivery, define typed metadata and inspect write execution strategy. QueryAdapter and raw client writes do not produce Repository mutation events.',
    'events',
  ],
  testing: [
    'Testing entry point',
    'Import these values and types from @nocobase/db/testing. They support dialect tests and database provisioning; runtime application code normally uses the root entry.',
    'testing',
  ],
  drivers: [
    'Driver and runtime extension',
    'Implement dialect descriptors and runtime strategies, inspect capabilities, or perform explicit physical-row upserts. These are low-level extension contracts, not the usual application CRUD entry points.',
    'driver-extension',
  ],
  values: [
    'Value normalization and errors',
    'Inspect structured repository errors, discover supported field operations, normalize temporal values and work with portable JSON values. Error status metadata is a library contract; this reference does not document HTTP routes.',
    'errors-and-values',
  ],
};

for (const entry of entries) await readFile(entry.file);
const program = ts.createProgram(
  entries.map((entry) => entry.file),
  {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    skipLibCheck: true,
    paths: {
      '@nocobase/repository-input': [path.join(input, 'dist/index.d.ts')],
      '@nocobase/repository-input/internal/*': [
        path.join(input, 'dist/*.d.ts'),
      ],
    },
  },
);
const checker = program.getTypeChecker();
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  throw new Error(
    ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => db,
      getNewLine: () => '\n',
    }),
  );
}
const records = new Map();
const exports = [];
const baseline = JSON.parse(
  await readFile(path.join(db, 'scripts/public-api.json'), 'utf8'),
);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const prettierConfig = await resolveConfig(path.join(directory, 'README.md'));
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function target(symbol) {
  return symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}

function owned(file) {
  return roots.find((root) => file.startsWith(`${root.declarations}/`));
}

function topLevel(node) {
  return (
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    (ts.isVariableDeclaration(node) &&
      ts.isVariableDeclarationList(node.parent) &&
      ts.isVariableStatement(node.parent.parent) &&
      ts.isSourceFile(node.parent.parent.parent))
  );
}

function recordFor(symbol) {
  symbol = target(symbol);
  if (records.has(symbol)) return records.get(symbol);
  const nodes = symbol
    .getDeclarations()
    ?.filter((node) => topLevel(node) && owned(node.getSourceFile().fileName));
  if (!nodes?.length) return undefined;
  const file = nodes[0].getSourceFile().fileName;
  const root = owned(file);
  const relative = path
    .relative(root.declarations, file)
    .replace(/\.d\.ts$/, '.ts');
  const record = {
    symbol,
    name: symbol.getName(),
    nodes,
    source: path.join(root.source, relative),
    relative,
    root,
    exports: [],
    refs: new Set(),
  };
  records.set(symbol, record);
  return record;
}

for (const entry of entries) {
  const source = program.getSourceFile(entry.file);
  const names = [];
  for (const symbol of checker.getExportsOfModule(
    checker.getSymbolAtLocation(source),
  )) {
    const name = symbol.getName();
    const record = recordFor(symbol);
    if (!record)
      throw new Error(`No owned declaration for ${entry.name}:${name}`);
    const typeOnly = symbol.declarations?.some((declaration) =>
      ts.isExportSpecifier(declaration)
        ? declaration.isTypeOnly || declaration.parent.parent.isTypeOnly
        : ts.isExportDeclaration(declaration) && declaration.isTypeOnly,
    );
    const kind =
      !typeOnly && target(symbol).flags & ts.SymbolFlags.Value
        ? 'value'
        : 'type';
    if (
      !baseline.entries[entry.key][
        kind === 'value' ? 'values' : 'types'
      ].includes(name)
    ) {
      throw new Error(
        `Export kind differs from baseline: ${entry.name}:${name}`,
      );
    }
    const item = { name, kind, entry, record };
    record.exports.push(item);
    exports.push(item);
    names.push(name);
  }
  const expected = [
    ...baseline.entries[entry.key].values,
    ...baseline.entries[entry.key].types,
  ].sort(compare);
  if (JSON.stringify(names.sort(compare)) !== JSON.stringify(expected)) {
    throw new Error(
      `${entry.name} declarations do not match the public API baseline. Rebuild and run api:check.`,
    );
  }
}

function visibleNodes(record) {
  const runtimeClass = record.exports.some((item) => item.kind === 'value');
  return record.nodes.map((node) => {
    if (!ts.isClassDeclaration(node)) return node;
    const members = node.members.filter((member) => {
      const flags = ts.getCombinedModifierFlags(member);
      if (
        flags & ts.ModifierFlags.Private ||
        (member.name && ts.isPrivateIdentifier(member.name))
      )
        return false;
      return (
        runtimeClass ||
        !(
          ts.isConstructorDeclaration(member) ||
          flags & ts.ModifierFlags.Protected
        )
      );
    });
    return ts.factory.updateClassDeclaration(
      node,
      node.modifiers,
      node.name,
      node.typeParameters,
      node.heritageClauses,
      members,
    );
  });
}

// Map iteration visits dependencies added during the walk, closing over all
// owned named contracts in visible declarations without following method bodies.
for (const record of records.values()) {
  function visit(node) {
    if (ts.isIdentifier(node)) {
      const symbol = checker.getSymbolAtLocation(node);
      const dependency = symbol && recordFor(symbol);
      if (dependency && dependency !== record) record.refs.add(dependency);
    }
    ts.forEachChild(node, visit);
  }
  for (const node of visibleNodes(record)) visit(node);
}

function groupFor(record) {
  if (
    record.exports.length &&
    record.exports.every((item) => item.entry.key === './testing')
  )
    return 'testing';
  const file = record.relative;
  if (record.root === roots[1])
    return /errors|json/.test(file) ? 'values' : 'inputs';
  if (
    [
      'DatabaseScope',
      'DatabaseScopePolicies',
      'ScopedDatabaseConnection',
      'PolicyRecord',
      'RepositoryOperations',
      'ScopedRepository',
    ].includes(record.name)
  )
    return 'policies';
  if (
    file.startsWith('repository/policy/') ||
    file === 'repository/write-policy.ts'
  )
    return 'policies';
  if (file.startsWith('repository/events/')) return 'events';
  if (file === 'repository/types.ts') return 'repository';
  if (file.startsWith('repository/')) return 'values';
  if (file.startsWith('query/')) return 'query';
  if (file.startsWith('collection/artifact/')) return 'artifacts';
  if (/^collection\/(registry|resolver)\//.test(file)) return 'collections';
  if (file.startsWith('collection/')) return 'builder';
  if (file.startsWith('metadata/')) return 'metadata';
  if (file.startsWith('schema/inspector/')) return 'schema';
  if (file.startsWith('schema/')) return 'drivers';
  if (file.startsWith('migration/') || file === 'task-config.ts')
    return 'migration';
  if (file.startsWith('seed/')) return 'seed';
  if (/^database\/(runtime|resolve-driver|upsert-physical-row)/.test(file))
    return 'drivers';
  if (
    file.startsWith('database/test-provisioner') ||
    file.startsWith('database/internal/knex/')
  )
    return 'testing';
  if (file === 'database/internal/transaction-callbacks.ts')
    return 'transactions';
  if (file === 'database/manager.ts' || file === 'database/token.ts')
    return 'database-manager';
  if (file === 'database/config.ts') {
    if (
      [
        'DatabaseDriverDefinition',
        'DatabaseDriverFactory',
        'DatabaseDriverRegistration',
      ].includes(record.name)
    )
      return 'drivers';
    if (
      [
        'DatabaseConfig',
        'ExtensibleDatabaseConfig',
        'DatabaseConfigFromDrivers',
        'ConnectionConfigFromDrivers',
        'DriverConnectionConfig',
        'ValidatedDriverRegistrations',
        'defineDatabase',
      ].includes(record.name)
    )
      return 'database-manager';
  }
  if (file.startsWith('database/')) return 'connection';
  if (file === 'json.ts') return 'values';
  throw new Error(`Unclassified declaration: ${file}:${record.name}`);
}

const ordered = [...records.values()].sort(
  (a, b) => compare(a.name, b.name) || compare(a.source, b.source),
);
const anchors = new Map();
for (const record of ordered) {
  record.group = groupFor(record);
  const base = record.name.toLowerCase();
  const key = `${record.group}/${base}`;
  const count = anchors.get(key) ?? 0;
  record.anchor = count ? `${base}-${count}` : base;
  anchors.set(key, count + 1);
}
function link(record, label = record.name, prefix = './') {
  return `[${label}](${prefix}${record.group}.md#${record.anchor})`;
}
function sourceLink(record) {
  return `[Source](${path.relative(signatures, record.source).split(path.sep).join('/')})`;
}
function codeFor(record) {
  return visibleNodes(record)
    .map((node) => {
      const printable = ts.isVariableDeclaration(node)
        ? node.parent.parent
        : node;
      return printer.printNode(
        ts.EmitHint.Unspecified,
        printable,
        node.getSourceFile(),
      );
    })
    .join('\n');
}

const outputs = new Map();
for (const [group, [title, intro, chapter]] of Object.entries(groups)) {
  const items = ordered.filter((record) => record.group === group);
  const lines = [
    `# ${title}: signatures`,
    '',
    intro,
    '',
    `[Chapter](../${chapter}.md) · [Contents](../README.md) · [All exports](../exports.md)`,
    '',
    'Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.',
    '',
    '| Declaration | Access |',
    '| --- | --- |',
  ];
  for (const record of items) {
    lines.push(
      `| [${record.name}](#${record.anchor}) | ${record.exports.length ? record.exports.map((item) => `\`${item.entry.name}\` ${item.kind}`).join('; ') : 'Supporting contract'} |`,
    );
  }
  for (const record of items) {
    lines.push('', `## ${record.name}`, '', sourceLink(record), '');
    if (record.exports.length) {
      for (const item of record.exports)
        lines.push(
          `Import: \`import ${item.kind === 'type' ? 'type ' : ''}{ ${item.name} } from '${item.entry.name}'\`.`,
          '',
        );
    } else {
      lines.push(
        'Access: supporting contract reached through a public signature; no package-entry import.',
        '',
      );
    }
    const comment = ts
      .displayPartsToString(record.symbol.getDocumentationComment(checker))
      .replace(/\s+/g, ' ')
      .trim();
    if (comment) lines.push(comment, '');
    lines.push('```ts', codeFor(record).trim(), '```');
    if (record.refs.size)
      lines.push(
        '',
        `Related declarations: ${[...record.refs]
          .sort((a, b) => compare(a.name, b.name))
          .map((ref) => link(ref))
          .join(', ')}.`,
      );
  }
  outputs.set(`signatures/${group}.md`, lines.join('\n') + '\n');
}

const index = [
  '# Appendix C. Complete export index',
  '',
  'This index covers every name exported by the two package entries. A value can be imported at runtime; a type requires a type import. Additional contracts reached through their signatures appear in the linked module pages and are not advertised as root exports.',
  '',
  '[Contents](./README.md) · [Previous: errors and values](./errors-and-values.md)',
  '',
];
for (const entry of entries) {
  const items = exports
    .filter((item) => item.entry === entry)
    .sort((a, b) => compare(a.name, b.name));
  const values = items.filter((item) => item.kind === 'value').length;
  index.push(
    `## ${entry.name}`,
    '',
    `${items.length} exports: ${values} values and ${items.length - values} types.`,
    '',
    '| Export | Kind | Topic |',
    '| --- | --- | --- |',
  );
  for (const item of items)
    index.push(
      `| ${link(item.record, item.name, './signatures/')} | ${item.kind} | [${groups[item.record.group][0]}](./${groups[item.record.group][2]}.md) |`,
    );
  index.push('');
}
outputs.set('exports.md', index.join('\n'));

const check = process.argv.includes('--check');
if (!check) await mkdir(signatures, { recursive: true });
for (const [file, content] of outputs) {
  const destination = path.join(directory, file);
  const formatted = await format(content, {
    ...prettierConfig,
    filepath: destination,
    proseWrap: 'preserve',
  });
  if (check) {
    if ((await readFile(destination, 'utf8')) !== formatted)
      throw new Error(`Outdated reference: ${file}`);
  } else {
    await writeFile(destination, formatted);
  }
}
console.log(
  `${check ? 'Verified' : 'Generated'} ${exports.length} exports and ${ordered.filter((record) => !record.exports.length).length} supporting contracts across ${outputs.size} pages.`,
);
