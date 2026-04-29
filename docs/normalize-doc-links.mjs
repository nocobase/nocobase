#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultDocsRoot = path.join(scriptDir, 'docs');
const removeMarker = Symbol('remove');

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const docsRoot = path.resolve(options.root || defaultDocsRoot);
const languages = options.langs || listLanguageDirs(docsRoot);
const scanDocs = options.scope !== 'meta';
const scanMeta = options.scope !== 'docs';

const results = [];
for (const lang of languages) {
  const langRoot = path.join(docsRoot, lang);
  if (!fs.existsSync(langRoot)) {
    results.push({ lang, error: `missing language directory: ${langRoot}` });
    continue;
  }

  const result = { lang };
  if (scanDocs) {
    result.docs = normalizeMarkdownLinks(langRoot, {
      docsRoot,
      languages,
      write: options.write,
    });
  }
  if (scanMeta) {
    result.meta = normalizeMetaLinks(langRoot, {
      write: options.write,
      removeUnresolved: options.removeUnresolvedMeta,
    });
  }
  results.push(result);
}

printReport(results, { docsRoot, languages, options, scanDocs, scanMeta });

if (results.some(hasFatalIssue)) {
  console.error('\nDead links or fatal errors were found. Exit with code 1.');
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {
    help: false,
    langs: null,
    removeUnresolvedMeta: false,
    root: null,
    scope: 'all',
    write: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else if (arg === '--write') {
      parsed.write = true;
    } else if (arg === '--remove-unresolved-meta') {
      parsed.removeUnresolvedMeta = true;
    } else if (arg === '--docs-only') {
      parsed.scope = 'docs';
    } else if (arg === '--meta-only') {
      parsed.scope = 'meta';
    } else if (arg === '--langs') {
      parsed.langs = readValue(argv, (index += 1), arg).split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--langs=')) {
      parsed.langs = arg.slice('--langs='.length).split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg === '--root') {
      parsed.root = readValue(argv, (index += 1), arg);
    } else if (arg.startsWith('--root=')) {
      parsed.root = arg.slice('--root='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function readValue(argv, index, arg) {
  const value = argv[index];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
  return value;
}

function printHelp() {
  console.log(`Usage:
  node docs/normalize-doc-links.mjs --langs fr
  node docs/normalize-doc-links.mjs --langs fr --write --remove-unresolved-meta

Options:
  --langs <list>              Comma-separated language list, for example cn,en,ja,fr.
  --root <path>               Docs root. Defaults to docs/docs relative to this script.
  --docs-only                 Only scan Markdown/MDX links that start with ./, ../, or /.
  --meta-only                 Only scan _meta.json links.
  --remove-unresolved-meta    Remove unresolved leaf entries from _meta.json in write mode.
  --write                     Apply changes. Default mode only reports.
`);
}

function listLanguageDirs(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'public')
    .map(entry => entry.name)
    .sort();
}

function normalizeMarkdownLinks(langRoot, options) {
  const files = walk(langRoot, file => /\.mdx?$/.test(file));
  const changes = [];
  const markdownLinkPattern = /(!?\[[^\]\n]*\]\()([^\)\s]+)(\))/g;

  for (const file of files) {
    const before = fs.readFileSync(file, 'utf8');
    let changed = false;
    const after = before.replace(markdownLinkPattern, (match, open, target, close, offset) => {
      if (open.startsWith('!')) return match;

      const replacement = normalizeMarkdownTarget(target, file, langRoot, options);
      if (!replacement) return match;

      changes.push({
        file: relative(file),
        line: lineOf(before, offset),
        from: target,
        reason: replacement.reason,
        to: replacement.to,
        type: replacement.type,
      });

      if (!replacement.to) return match;
      changed = true;
      return `${open}${replacement.to}${close}`;
    });

    if (changed && options.write) fs.writeFileSync(file, after, 'utf8');
  }

  return summarizeChanges(changes, ['addIndex', 'stripSlash', 'deadLink']);
}

function normalizeMarkdownTarget(target, file, langRoot, options) {
  if (!isMarkdownInternal(target)) return null;
  const { base, suffix } = splitSuffix(target);
  if (!base) return null;

  if (base.endsWith('/') && !base.endsWith('/index.md/')) {
    const indexFile = base.startsWith('/')
      ? path.normalize(path.join(langRoot, base.slice(1), 'index.md'))
      : path.normalize(path.join(path.dirname(file), base, 'index.md'));

    if (isInside(indexFile, langRoot) && fs.existsSync(indexFile)) {
      return { type: 'addIndex', to: `${base}index.md${suffix}` };
    }

    const stripped = base.replace(/\/+$/, '');
    if (resolveMarkdownTarget(stripped, file, langRoot, options)) {
      return { type: 'stripSlash', to: `${stripped}${suffix}` };
    }

    return { type: 'deadLink', reason: 'missing index.md and stripped target does not exist' };
  }

  if (resolveMarkdownTarget(base, file, langRoot, options)) return null;
  return { type: 'deadLink', reason: 'target does not exist' };
}

function normalizeMetaLinks(langRoot, options) {
  const files = walk(langRoot, file => path.basename(file) === '_meta.json');
  const changes = [];

  for (const file of files) {
    const before = fs.readFileSync(file, 'utf8');
    const meta = JSON.parse(before);
    const context = {
      changed: false,
      changes,
      file,
      langRoot,
      removeUnresolved: options.removeUnresolved,
    };
    const next = transformMetaValue(meta, context);
    if (context.changed && options.write) {
      fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    }
  }

  return summarizeChanges(changes, [
    'missingSlash',
    'explicitIndex',
    'extraSlash',
    'unresolved',
    'removedUnresolved',
    'ambiguous',
  ]);
}

function transformMetaValue(value, context) {
  if (Array.isArray(value)) {
    let changed = false;
    const next = [];
    for (const item of value) {
      const transformed = transformMetaValue(item, context);
      if (transformed === removeMarker) {
        changed = true;
      } else {
        next.push(transformed);
        if (transformed !== item) changed = true;
      }
    }
    if (changed) {
      context.changed = true;
      return next;
    }
    return value;
  }

  if (!value || typeof value !== 'object') return value;

  let next = value;
  if (Array.isArray(value.items)) {
    const transformedItems = transformMetaValue(value.items, context);
    if (transformedItems !== value.items) {
      next = { ...next, items: transformedItems };
    }
  }

  if (typeof value.link === 'string') {
    const normalized = normalizeMetaTarget(value.link, context.file, context.langRoot);
    if (normalized?.type === 'unresolved') {
      context.changes.push({
        file: relative(context.file),
        from: value.link,
        type: 'unresolved',
      });
      if (context.removeUnresolved) {
        context.changes.push({
          file: relative(context.file),
          from: value.link,
          type: 'removedUnresolved',
        });
        context.changed = true;
        if (!Array.isArray(value.items)) return removeMarker;
        const clone = { ...next };
        delete clone.link;
        next = clone;
      }
    } else if (normalized?.type === 'ambiguous') {
      context.changes.push({
        file: relative(context.file),
        from: value.link,
        type: 'ambiguous',
      });
    } else if (normalized) {
      context.changes.push({
        file: relative(context.file),
        from: value.link,
        to: normalized.to,
        type: normalized.type,
      });
      next = { ...next, link: normalized.to };
      context.changed = true;
    }
  }

  return next;
}

function normalizeMetaTarget(target, file, langRoot) {
  if (!isMetaInternal(target)) return null;
  const { base, suffix } = splitSuffix(target);
  if (!base || base === '/') return null;

  const baseNoSlash = base.replace(/\/+$/, '');
  const absNoSlash = path.join(langRoot, baseNoSlash.slice(1));
  const noSlashFile = existsFile(absNoSlash);
  const indexFile = existsIndex(absNoSlash);

  if (base.endsWith('/')) {
    if (indexFile) return null;
    if (noSlashFile) return { type: 'extraSlash', to: `${baseNoSlash}${suffix}` };
    return { type: 'unresolved' };
  }

  if (base.endsWith('/index')) {
    const exact = existsFile(path.join(langRoot, base.slice(1)));
    const parent = base.slice(0, -'/index'.length) || '/';
    const parentIndex = existsIndex(path.join(langRoot, parent.slice(1)));
    if (exact && parentIndex && path.resolve(exact) === path.resolve(parentIndex)) {
      return { type: 'explicitIndex', to: `${parent}/${suffix}` };
    }
    return null;
  }

  if (indexFile && !noSlashFile) return { type: 'missingSlash', to: `${baseNoSlash}/${suffix}` };
  if (indexFile && noSlashFile) return { type: 'ambiguous' };
  if (!indexFile && !noSlashFile) return { type: 'unresolved' };
  return null;
}

function summarizeChanges(changes, keys) {
  const summary = {};
  for (const key of keys) summary[key] = changes.filter(change => change.type === key).length;
  return { summary, changes };
}

function printReport(results, context) {
  const mode = context.options.write ? 'write' : 'dry run';
  const scopes = [
    context.scanDocs ? 'Markdown/MDX' : null,
    context.scanMeta ? '_meta.json' : null,
  ].filter(Boolean);

  console.log(`Docs link normalization (${mode})`);
  console.log(`Root: ${context.docsRoot}`);
  console.log(`Languages: ${context.languages.join(', ')}`);
  console.log(`Scopes: ${scopes.join(', ')}`);

  for (const result of results) {
    console.log(`\n## ${result.lang}`);
    if (result.error) {
      console.log(`  ERROR: ${result.error}`);
      continue;
    }
    if (result.docs) printSection('Markdown/MDX', result.docs);
    if (result.meta) printSection('_meta.json', result.meta);
  }
}

function printSection(name, section) {
  const total = section.changes.length;
  if (total === 0) {
    console.log(`  ${name}: OK - no fixes needed and no dead links.`);
    return;
  }

  console.log(`  ${name}: ${total} item${total === 1 ? '' : 's'} found`);
  for (const type of Object.keys(section.summary)) {
    const changes = section.changes.filter(change => change.type === type);
    if (changes.length === 0) continue;

    console.log(`    ${labelForType(type)}: ${changes.length}`);
    const maxDetails = 50;
    for (const change of changes.slice(0, maxDetails)) {
      console.log(`      - ${formatChange(change)}`);
    }
    if (changes.length > maxDetails) {
      console.log(`      ... ${changes.length - maxDetails} more`);
    }
  }
}

function labelForType(type) {
  const labels = {
    addIndex: 'Add index.md to trailing-slash Markdown links',
    ambiguous: 'Ambiguous route, review manually',
    deadLink: 'Dead Markdown links',
    explicitIndex: 'Replace /index route with directory route',
    extraSlash: 'Remove extra trailing slash',
    missingSlash: 'Add trailing slash to directory routes',
    removedUnresolved: 'Remove dead sidebar entries',
    stripSlash: 'Remove trailing slash from Markdown links without index.md',
    unresolved: 'Dead sidebar links',
  };
  return labels[type] || type;
}

function formatChange(change) {
  const loc = change.line ? `${change.file}:${change.line}` : change.file;
  const target = change.to ? `${change.from} -> ${change.to}` : change.from;
  return `${loc}: ${target}${change.reason ? ` (${change.reason})` : ''}`;
}

function hasFatalIssue(result) {
  if (result.error) return true;
  const docsDeadLinks = result.docs?.summary.deadLink || 0;
  const metaDeadLinks = result.meta?.summary.unresolved || 0;
  return docsDeadLinks > 0 || metaDeadLinks > 0;
}

function walk(dir, predicate, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

function splitSuffix(target) {
  let cut = target.length;
  for (const char of ['#', '?']) {
    const index = target.indexOf(char);
    if (index !== -1 && index < cut) cut = index;
  }
  return { base: target.slice(0, cut), suffix: target.slice(cut) };
}

function isMarkdownInternal(target) {
  if (!(target.startsWith('../') || target.startsWith('./') || target.startsWith('/'))) return false;
  if (target.startsWith('//') || target.includes('://')) return false;
  return true;
}

function isMetaInternal(target) {
  if (!target.startsWith('/') || target.startsWith('//')) return false;
  return !/^[a-z][a-z0-9+.-]*:/i.test(target);
}

function existsFile(absNoExt) {
  for (const ext of ['.md', '.mdx']) {
    const file = `${absNoExt}${ext}`;
    if (fs.existsSync(file)) return file;
  }
  return null;
}

function existsIndex(absDir) {
  for (const ext of ['.md', '.mdx']) {
    const file = path.join(absDir, `index${ext}`);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

function resolveMarkdownTarget(base, file, langRoot, options) {
  const targetPath = resolveMarkdownPath(base, file, langRoot, options);
  const targetRoot = getTargetRoot(base, langRoot, options);

  if (!isInside(targetPath, targetRoot)) return null;

  if (base.endsWith('/')) return existsIndex(targetPath);

  const ext = path.extname(targetPath);
  if (ext === '.md' || ext === '.mdx') {
    return resolveMarkdownFileRoute(targetPath.slice(0, -ext.length));
  }
  if (ext) return fs.existsSync(targetPath) ? targetPath : null;

  return existsFile(targetPath) || existsIndex(targetPath);
}

function resolveMarkdownFileRoute(absNoExt) {
  return (
    existsFile(absNoExt) ||
    existsIndex(absNoExt) ||
    (path.basename(absNoExt) === 'index' ? existsFile(path.dirname(absNoExt)) : null)
  );
}

function resolveMarkdownPath(base, file, langRoot, options) {
  if (!base.startsWith('/')) return path.normalize(path.join(path.dirname(file), base));
  const targetRoot = getTargetRoot(base, langRoot, options);
  const langPrefix = getAbsoluteLangPrefix(base, options.languages);
  const relativeTarget = langPrefix ? base.slice(1) : base.slice(1);
  return path.normalize(path.join(targetRoot, langPrefix ? relativeTarget.slice(langPrefix.length + 1) : relativeTarget));
}

function getTargetRoot(base, langRoot, options) {
  const langPrefix = getAbsoluteLangPrefix(base, options.languages);
  if (!langPrefix) return langRoot;
  return path.join(options.docsRoot, langPrefix);
}

function getAbsoluteLangPrefix(base, languages) {
  if (!base.startsWith('/')) return null;
  const firstSegment = base.split('/').filter(Boolean)[0];
  return firstSegment && languages.includes(firstSegment) ? firstSegment : null;
}

function isInside(file, dir) {
  const relativePath = path.relative(dir, file);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function lineOf(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

function relative(file) {
  return path.relative(process.cwd(), file);
}
