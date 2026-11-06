// Bundles the part of `just-bash` an online run's shell uses (`server/vendor/just-bash.js`) into
// `dist/server/vendor/just-bash.js`, beside its declaration and the licenses of what the bundle contains, so the
// published plugin does not depend on `just-bash` and its 30–90 MB of dependencies (Python and QuickJS runtimes,
// TypeScript, sql.js, native decompressors).
//
// What the shell never runs is replaced with a stub: Python, JavaScript, SQLite, curl and html-to-markdown answer
// "not available in this shell", and the packages behind them, the network layer and the optional xz and zstd
// decompressors fail to load, which `just-bash` reports as the feature missing.
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  realpath,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import * as esbuild from 'esbuild';

const packageDirectory = path.resolve(import.meta.dirname, '..');
const vendorSource = path.join(packageDirectory, 'server', 'vendor');

/** `just-bash`'s lazily loaded commands that need what the bundle leaves out. */
const UNAVAILABLE_COMMANDS = [
  'python3',
  'js-exec',
  'sqlite3',
  'curl',
  'html-to-markdown',
];
const UNAVAILABLE_CHUNK = new RegExp(
  `[\\\\/]just-bash[\\\\/]dist[\\\\/]bundle[\\\\/]chunks[\\\\/](${UNAVAILABLE_COMMANDS.join('|')})-[A-Z0-9]+\\.js$`,
);

/** Packages left out of the bundle: only the commands above, the network and xz/zstd archives reach them. */
export const EXCLUDED_PACKAGES = [
  'run',
  'typescript',
  'sql.js',
  'turndown',
  'guarded-fetch',
  '@mongodb-js/zstd',
  'node-liblzma',
];

const commandOf = (exportName) =>
  exportName
    .replace(/(Stub)?Command$/u, '')
    .replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);

/** Replaces the lazily loaded commands and packages the shell does without. */
const stubs = {
  name: 'just-bash-stubs',
  setup(build) {
    const excluded = new RegExp(
      `^(${EXCLUDED_PACKAGES.map((name) => name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')).join('|')})(/.*)?$`,
    );
    build.onResolve({ filter: excluded }, (args) => ({
      path: args.path,
      namespace: 'unavailable-package',
    }));
    build.onLoad(
      { filter: /.*/, namespace: 'unavailable-package' },
      (args) => ({
        contents: `throw new Error(${JSON.stringify(`${args.path} is not available in this shell.`)});\n`,
        loader: 'js',
      }),
    );
    build.onLoad({ filter: UNAVAILABLE_CHUNK }, async (args) => {
      const source = await readFile(args.path, 'utf8');
      const clause = /export\s*\{([^}]*)\}\s*;?\s*$/u.exec(source);
      if (!clause) throw new Error(`Cannot read the exports of ${args.path}.`);
      const names = clause[1].split(',').map((entry) =>
        entry
          .trim()
          .split(/\s+as\s+/u)
          .pop(),
      );
      const lines = names.map((name) =>
        name.endsWith('Command')
          ? `export const ${name} = unavailable(${JSON.stringify(commandOf(name))});`
          : `export const ${name} = () => undefined;`,
      );
      return {
        contents: [
          'const unavailable = (name) => ({',
          '  name,',
          '  async execute() {',
          '    return { stdout: "", stderr: `${name}: not available in this shell\\n`, exitCode: 127 };',
          '  },',
          '});',
          ...lines,
          '',
        ].join('\n'),
        loader: 'js',
      };
    });
    // The xz and zstd decompressors are excluded, not missing: say so instead of how to install them.
    build.onLoad(
      { filter: /[\\/]just-bash[\\/]dist[\\/]bundle[\\/].*\.js$/ },
      async (args) => {
        const source = await readFile(args.path, 'utf8');
        return {
          contents: source.replace(
            /"(xz|zstd) compression requires [^"]*"/gu,
            '"$1 compression is not available in this shell"',
          ),
          loader: 'js',
        };
      },
    );
  },
};

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/** The directory of the package a bundled file belongs to: the nearest `node_modules/<name>` with its manifest. */
async function packageDirectoryOf(file) {
  for (
    let directory = path.dirname(file);
    directory !== path.dirname(directory);
    directory = path.dirname(directory)
  ) {
    const manifest = path.join(directory, 'package.json');
    if (!(await exists(manifest))) continue;
    const { name } = JSON.parse(await readFile(manifest, 'utf8'));
    if (
      name &&
      directory.endsWith(path.join('node_modules', ...name.split('/')))
    )
      return directory;
  }
  return undefined;
}

/** Where `name` resolves from `directory`, the way Node looks it up. */
async function locate(name, directory) {
  for (
    let current = directory;
    current !== path.dirname(current);
    current = path.dirname(current)
  ) {
    if (path.basename(current) === 'node_modules') continue;
    const candidate = path.join(current, 'node_modules', ...name.split('/'));
    if (await exists(path.join(candidate, 'package.json')))
      return realpath(candidate);
  }
  return undefined;
}

/** Bare specifiers a pre-bundled package's build left as imports in `directory`; its other dependencies are inside. */
async function externalsOf(directory) {
  const externals = new Set();
  const walk = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') await walk(file);
      } else if (/\.[cm]?js$/u.test(entry.name)) {
        const source = await readFile(file, 'utf8');
        for (const match of source.matchAll(
          /(?:from|import|require)\s*\(?\s*["']([^"'./][^"']*)["']/gu,
        )) {
          const segments = match[1].split('/');
          externals.add(
            match[1].startsWith('@')
              ? segments.slice(0, 2).join('/')
              : segments[0],
          );
        }
      }
    }
  };
  await walk(directory);
  return externals;
}

async function describe(directory, origin) {
  const manifest = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  );
  const entries = await readdir(directory);
  const read = async (pattern) => {
    const texts = [];
    for (const entry of entries.filter((name) => pattern.test(name)).sort())
      texts.push((await readFile(path.join(directory, entry), 'utf8')).trim());
    return texts.join('\n\n');
  };
  const license =
    typeof manifest.license === 'string'
      ? manifest.license
      : (manifest.license?.type ?? 'UNKNOWN');
  return {
    name: manifest.name,
    version: manifest.version,
    license,
    licenseText: await read(/^(licen[cs]e|copying)(\..*)?$/iu),
    notice: await read(/^notice(\..*)?$/iu),
    origin,
    dependencies: Object.keys(manifest.dependencies ?? {}),
  };
}

/**
 * The packages in the bundle: those whose files esbuild included, and, for `just-bash`, which ships a bundle of its
 * own, the dependencies that bundle inlines (all it does not import, other than the packages excluded here, and theirs
 * in turn). The second list may name a package whose code was tree-shaken away; it never misses one.
 */
async function includedPackages(metafile) {
  const found = new Map();
  const filesOf = new Map();
  for (const input of Object.keys(metafile.inputs)) {
    if (!input.includes('node_modules')) continue;
    const file = path.resolve(packageDirectory, input);
    const directory = await packageDirectoryOf(file);
    if (!directory)
      throw new Error(`Cannot tell which package ${input} belongs to.`);
    if (!found.has(directory))
      found.set(directory, await describe(directory, 'bundled'));
    filesOf.set(directory, [...(filesOf.get(directory) ?? []), file]);
  }
  const prebundled = [...found].filter(([, item]) => item.name === 'just-bash');
  for (const [directory, item] of prebundled) {
    // Its bundle's directory: the shallowest of its files the bundle includes.
    const [entry] = filesOf
      .get(directory)
      .sort((a, b) => a.split(path.sep).length - b.split(path.sep).length);
    const skip = new Set([
      ...(await externalsOf(path.dirname(entry))),
      ...EXCLUDED_PACKAGES,
    ]);
    const queue = item.dependencies
      .filter((name) => !skip.has(name))
      .map((name) => [name, directory]);
    while (queue.length > 0) {
      const [name, from] = queue.shift();
      const location = await locate(name, from);
      if (!location)
        throw new Error(
          `Cannot find ${name}, a dependency inlined in just-bash.`,
        );
      if (found.has(location)) continue;
      const described = await describe(location, 'inlined in just-bash');
      found.set(location, described);
      for (const dependency of described.dependencies)
        if (!skip.has(dependency)) queue.push([dependency, location]);
    }
  }
  return [...found.values()].sort(
    (a, b) =>
      a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
  );
}

function licensesText(packages) {
  const header = [
    'Third-party software in just-bash.js',
    '',
    'just-bash.js bundles the following packages. Each is listed with its version, its license and the license text',
    'it ships; packages marked "inlined in just-bash" are part of just-bash\'s own published bundle.',
    '',
  ];
  const sections = packages.map((item) =>
    [
      '='.repeat(100),
      `${item.name}@${item.version} — ${item.license}${item.origin === 'bundled' ? '' : ` (${item.origin})`}`,
      '='.repeat(100),
      item.licenseText ||
        `(The package ships no license file; its manifest names ${item.license}.)`,
      ...(item.notice ? ['', '--- NOTICE ---', item.notice] : []),
      '',
    ].join('\n'),
  );
  return [...header, ...sections].join('\n');
}

/**
 * Writes `just-bash.js`, `just-bash.d.ts` and `THIRD_PARTY_LICENSES.txt` to `outdir`, and returns what the bundle
 * contains and what it still imports.
 */
export async function bundleJustBash({
  outdir = path.join(packageDirectory, 'dist', 'server', 'vendor'),
} = {}) {
  await mkdir(outdir, { recursive: true });
  const outfile = path.join(outdir, 'just-bash.js');
  const result = await esbuild.build({
    absWorkingDir: packageDirectory,
    entryPoints: [path.join(vendorSource, 'just-bash.js')],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node24',
    // CommonJS dependencies require Node's builtins.
    banner: {
      js: 'import { createRequire as __createRequire } from "node:module";\nconst require = __createRequire(import.meta.url);',
    },
    legalComments: 'eof',
    metafile: true,
    minifyWhitespace: true,
    minifySyntax: true,
    logLevel: 'warning',
    plugins: [stubs],
  });
  const packages = await includedPackages(result.metafile);
  await writeFile(
    path.join(outdir, 'THIRD_PARTY_LICENSES.txt'),
    licensesText(packages),
  );
  await copyFile(
    path.join(vendorSource, 'just-bash.d.ts'),
    path.join(outdir, 'just-bash.d.ts'),
  );
  const imports = Object.values(result.metafile.outputs).flatMap((output) =>
    output.imports.map((item) => item.path),
  );
  return {
    file: outfile,
    bytes: (await stat(outfile)).size,
    packages,
    imports: [...new Set(imports)].sort(),
  };
}

if (process.argv[1] === import.meta.filename) {
  const { bytes, packages } = await bundleJustBash();
  console.log(
    `Bundled just-bash: ${(bytes / 1024).toFixed(0)} KB, ${packages.length} packages (dist/server/vendor/THIRD_PARTY_LICENSES.txt).`,
  );
}
