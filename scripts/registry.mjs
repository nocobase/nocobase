import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRepoRoot = path.resolve(path.dirname(scriptPath), '..');
const packageNamePattern = /^(?:@[^/]+\/)?[^/]+$/u;
const sourcePrefix = 'registry/';
const targetPrefix = 'client/extensions/';

const help = `Build and materialize package-owned shadcn Registry items.

Usage:
  pnpm registry build [--package <package-or-directory> | --all] [--item <name>]
  pnpm registry materialize --package <package-or-directory> [--item <name>] [--output-root <directory>]

Options:
  --package <value>       Package name or directory owning registry.config.json
  --all                   Build every workspace package with registry.config.json
  --item <name>           Select one Registry item
  --output-root <path>    Application root used by materialize
  -h, --help              Show this help

Build output is written to <owner>/public/r. Materialization refuses to
overwrite an existing extension target.`;

export function parseRegistryArgs(args) {
  const options = {
    action: undefined,
    all: false,
    help: false,
    item: undefined,
    outputRoot: undefined,
    package: undefined,
  };
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (argument === '--all') {
      options.all = true;
      continue;
    }
    if (
      argument === '--package' ||
      argument === '--item' ||
      argument === '--output-root'
    ) {
      const value = args[index + 1];
      if (value === undefined || value.startsWith('-')) {
        throw new Error(`${argument} requires a value.`);
      }
      if (argument === '--package') {
        options.package = value;
      } else if (argument === '--item') {
        options.item = value;
      } else {
        options.outputRoot = value;
      }
      index += 1;
      continue;
    }
    if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`);
    }
    positionals.push(argument);
  }

  if (positionals.length > 1) {
    throw new Error('Expected one action: build or materialize.');
  }
  options.action = positionals[0];
  if (!options.help && !new Set(['build', 'materialize']).has(options.action)) {
    throw new Error('Expected one action: build or materialize.');
  }
  if (options.all && options.package) {
    throw new Error('--all and --package cannot be used together.');
  }
  if (options.action === 'materialize' && options.all) {
    throw new Error('materialize does not support --all.');
  }
  if (options.all && options.item) {
    throw new Error('--item cannot be combined with --all.');
  }
  if (options.action === 'build' && options.outputRoot) {
    throw new Error('--output-root is available only for materialize.');
  }

  return options;
}

export function buildRegistry({
  item,
  ownerRoot,
  outputDirectory = path.join(ownerRoot, 'public/r'),
  repoRoot = defaultRepoRoot,
}) {
  const registry = loadRegistry({ item, ownerRoot, repoRoot });
  if (!item) {
    fs.rmSync(outputDirectory, { force: true, recursive: true });
  }
  fs.mkdirSync(outputDirectory, { recursive: true });

  const indexItems = [];
  for (const sourceItem of registry.items) {
    const registryItem = createRegistryItem(sourceItem);
    const outputPath = path.join(outputDirectory, `${registryItem.name}.json`);
    fs.writeFileSync(outputPath, `${JSON.stringify(registryItem, null, 2)}\n`);
    indexItems.push(stripFileContents(registryItem));
  }

  const index = {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    ...registry.metadata,
    items: indexItems,
  };
  fs.writeFileSync(
    path.join(outputDirectory, 'registry.json'),
    `${JSON.stringify(index, null, 2)}\n`,
  );

  return {
    items: registry.items.map(({ item: registryItem, includedFiles }) => ({
      files: includedFiles.length,
      name: registryItem.name,
    })),
    outputDirectory,
    ownerRoot,
  };
}

export function materializeRegistry({
  item,
  outputRoot = process.cwd(),
  ownerRoot,
  repoRoot = defaultRepoRoot,
}) {
  const registry = loadRegistry({ item, ownerRoot, repoRoot });
  const mappings = new Map();

  for (const sourceItem of registry.items) {
    const { source } = sourceItem.item;
    const key = `${sourceItem.sourceRoot}\0${source.target}`;
    const mapping = mappings.get(key) ?? {
      include: new Set(),
      root: sourceItem.sourceRoot,
      target: source.target,
    };
    source.include.forEach((entry) => mapping.include.add(entry));
    mappings.set(key, mapping);
  }

  const resolvedOutputRoot = path.resolve(outputRoot);
  for (const mapping of mappings.values()) {
    if (fs.existsSync(path.join(resolvedOutputRoot, mapping.target))) {
      throw new Error(`Registry target already exists: ${mapping.target}`);
    }
  }

  const materialized = [];
  for (const mapping of mappings.values()) {
    const files = walkFiles(mapping.root).filter((file) =>
      isIncluded(file, [...mapping.include]),
    );
    for (const file of files) {
      const targetFile = path.join(resolvedOutputRoot, mapping.target, file);
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      fs.copyFileSync(path.join(mapping.root, file), targetFile);
    }
    materialized.push({ files: files.length, target: mapping.target });
  }

  return { materialized, outputRoot: resolvedOutputRoot, ownerRoot };
}

export function resolveRegistryOwner(
  selector,
  { cwd = process.cwd(), repoRoot = defaultRepoRoot } = {},
) {
  if (!selector) {
    if (fs.existsSync(path.join(cwd, 'registry.config.json'))) {
      return path.resolve(cwd);
    }
    throw new Error(
      'No registry.config.json in the current directory. Use --package.',
    );
  }

  const directoryCandidate = path.resolve(cwd, selector);
  if (fs.existsSync(path.join(directoryCandidate, 'package.json'))) {
    return directoryCandidate;
  }
  const repoDirectoryCandidate = path.resolve(repoRoot, selector);
  if (fs.existsSync(path.join(repoDirectoryCandidate, 'package.json'))) {
    return repoDirectoryCandidate;
  }
  if (!packageNamePattern.test(selector)) {
    throw new Error(`Invalid Registry package or directory: ${selector}`);
  }

  const matchingPackage = findWorkspacePackages(repoRoot).find(
    ({ packageJson }) => packageJson.name === selector,
  );
  if (!matchingPackage) {
    throw new Error(`Unable to find Registry package: ${selector}`);
  }
  return matchingPackage.root;
}

export function findRegistryOwners(repoRoot = defaultRepoRoot) {
  return findWorkspacePackages(repoRoot)
    .map(({ root }) => root)
    .filter((root) => fs.existsSync(path.join(root, 'registry.config.json')))
    .sort((left, right) => left.localeCompare(right));
}

function loadRegistry({ item: selectedItemName, ownerRoot, repoRoot }) {
  const configPath = path.join(ownerRoot, 'registry.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Registry config does not exist: ${configPath}`);
  }
  const config = readJson(configPath);
  if (!Array.isArray(config.items)) {
    throw new Error(
      `Registry config must define an items array: ${configPath}`,
    );
  }
  const { items: configuredItems, ...metadata } = config;
  const selectedItems = selectedItemName
    ? configuredItems.filter(({ name }) => name === selectedItemName)
    : configuredItems;
  if (selectedItemName && selectedItems.length === 0) {
    throw new Error(`Unknown Registry item: ${selectedItemName}`);
  }

  const itemNames = new Set();
  const filesByRoot = new Map();
  const packageJson = readJson(path.join(ownerRoot, 'package.json'));
  const declaredItems = packageJson.nocobase?.registry?.items;
  const items = selectedItems.map((registryItem) => {
    if (!registryItem.name || itemNames.has(registryItem.name)) {
      throw new Error(
        `Registry item name must be non-empty and unique: ${registryItem.name}`,
      );
    }
    itemNames.add(registryItem.name);
    const source = registryItem.source;
    if (!source) {
      throw new Error(
        `Registry item ${registryItem.name} is missing its source mapping.`,
      );
    }
    assertSafePath(source.root, sourcePrefix, 'source');
    assertSafePath(source.target, targetPrefix, 'target');
    if (!Array.isArray(source.include) || source.include.length === 0) {
      throw new Error(
        `Registry item ${registryItem.name} must include at least one path.`,
      );
    }

    const sourceOwnerRoot = source.package
      ? resolveRegistryOwner(source.package, { cwd: ownerRoot, repoRoot })
      : ownerRoot;
    const sourceRoot = resolveContainedPath(
      sourceOwnerRoot,
      source.root,
      'source',
    );
    if (!fs.existsSync(sourceRoot)) {
      throw new Error(
        `Registry source does not exist: ${source.package ? `${source.package}/` : ''}${source.root}`,
      );
    }

    if (!source.package && declaredItems) {
      const declaredPath = normalizeDeclaredPath(
        declaredItems[registryItem.name],
      );
      if (declaredPath !== source.root) {
        throw new Error(
          `Package ${packageJson.name} must declare Registry item ${registryItem.name} at ./${source.root}.`,
        );
      }
    }

    const allFiles = filesByRoot.get(sourceRoot) ?? walkFiles(sourceRoot);
    filesByRoot.set(sourceRoot, allFiles);
    const includedFiles = allFiles.filter((file) =>
      isIncluded(file, source.include),
    );
    if (includedFiles.length === 0) {
      throw new Error(
        `Registry item ${registryItem.name} include paths did not match any files.`,
      );
    }
    return { includedFiles, item: registryItem, sourceRoot };
  });

  return { items, metadata };
}

function createRegistryItem({ includedFiles, item, sourceRoot }) {
  const { source, ...registryItem } = item;
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    ...registryItem,
    files: includedFiles.map((file) => ({
      path: path.posix.join(source.root, file),
      content: fs.readFileSync(path.join(sourceRoot, file), 'utf8'),
      type: 'registry:file',
      target: path.posix.join(source.target, file),
    })),
  };
}

function stripFileContents(item) {
  return {
    ...item,
    $schema: undefined,
    files: item.files.map((file) => {
      const fileWithoutContent = { ...file };
      delete fileWithoutContent.content;
      return fileWithoutContent;
    }),
  };
}

// packages/ groups its packages one level deep, as packages/<category>/<package>, and a category directory has no
// package.json of its own. Scanning only the top level would find nothing, so `registry build --all` would report that
// no workspace Registry packages exist.
function findWorkspacePackages(repoRoot) {
  const packagesRoot = path.join(repoRoot, 'packages');
  if (!fs.existsSync(packagesRoot)) {
    return [];
  }
  return fs
    .readdirSync(packagesRoot, { withFileTypes: true })
    .filter((category) => category.isDirectory())
    .flatMap((category) => {
      const categoryRoot = path.join(packagesRoot, category.name);
      return fs
        .readdirSync(categoryRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .flatMap((entry) => {
          const root = path.join(categoryRoot, entry.name);
          const packageJsonPath = path.join(root, 'package.json');
          return fs.existsSync(packageJsonPath)
            ? [{ packageJson: readJson(packageJsonPath), root }]
            : [];
        });
    });
}

function walkFiles(directory, root = directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? walkFiles(entryPath, root)
        : [toPosix(path.relative(root, entryPath))];
    })
    .sort((left, right) => left.localeCompare(right));
}

function isIncluded(file, include) {
  return include.some((entry) => {
    const normalized = entry.replace(/^\.\//u, '').replace(/\/$/u, '');
    return (
      normalized === '.' ||
      file === normalized ||
      file.startsWith(`${normalized}/`)
    );
  });
}

function assertSafePath(value, prefix, label) {
  if (
    typeof value !== 'string' ||
    !value.startsWith(prefix) ||
    path.isAbsolute(value) ||
    value.split('/').includes('..')
  ) {
    throw new Error(`Unsafe Registry ${label} path: ${value}`);
  }
}

function resolveContainedPath(root, relativePath, label) {
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Unsafe Registry ${label} path: ${relativePath}`);
  }
  return resolved;
}

function normalizeDeclaredPath(value) {
  return typeof value === 'string' ? value.replace(/^\.\//u, '') : undefined;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

async function main() {
  const options = parseRegistryArgs(process.argv.slice(2));
  if (options.help) {
    console.log(help);
    return;
  }

  const repoRoot = defaultRepoRoot;
  if (options.action === 'build' && options.all) {
    const owners = findRegistryOwners(repoRoot);
    if (owners.length === 0) {
      throw new Error('No workspace Registry packages were found.');
    }
    for (const ownerRoot of owners) {
      printBuildResult(buildRegistry({ ownerRoot, repoRoot }));
    }
    return;
  }

  const ownerRoot = resolveRegistryOwner(options.package, { repoRoot });
  if (options.action === 'build') {
    printBuildResult(
      buildRegistry({ item: options.item, ownerRoot, repoRoot }),
    );
    return;
  }

  const result = materializeRegistry({
    item: options.item,
    outputRoot: options.outputRoot,
    ownerRoot,
    repoRoot,
  });
  for (const mapping of result.materialized) {
    console.log(`${mapping.target}: ${mapping.files} files`);
  }
}

function printBuildResult(result) {
  console.log(path.relative(defaultRepoRoot, result.ownerRoot));
  for (const item of result.items) {
    console.log(`  ${item.name}: ${item.files} files`);
  }
  console.log(`  -> ${path.relative(defaultRepoRoot, result.outputDirectory)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
