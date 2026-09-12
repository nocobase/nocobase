#!/usr/bin/env node
/**
 * 校对：_meta.json 侧边栏链接检查（与可选自动修复）
 *
 * 扫所有语言（或 --langs 过滤），检查 _meta.json 里的 link 字段是否可解析；
 * 默认 dry-run，`--write` 应用修复；`--remove-unresolved-meta` 在 write
 * 模式下删掉解析不到的叶子条目。
 *
 * Markdown 链接的死链交给 rspress 内置 checkDeadLinks（build 时强制）。
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
// 脚本位于 docs/scripts/，docs 根目录是其上一级的 docs/。
const defaultDocsRoot = path.join(scriptDir, '..', 'docs');
const removeMarker = Symbol('remove');

// 暂不维护的语言；显式 --langs ar 仍可强制检查（用于查现状）。
// 与 docs/scripts/ 下其他对齐脚本保持一致。
const SKIP_LANGS = new Set(['ar']);

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const docsRoot = path.resolve(options.root || defaultDocsRoot);
const languages = options.langs || listLanguageDirs(docsRoot);

const results = [];
for (const lang of languages) {
  const langRoot = path.join(docsRoot, lang);
  if (!fs.existsSync(langRoot)) {
    results.push({ lang, error: `missing language directory: ${langRoot}` });
    continue;
  }
  results.push({
    lang,
    meta: normalizeMetaLinks(langRoot, {
      write: options.write,
      removeUnresolved: options.removeUnresolvedMeta,
    }),
  });
}

printReport(results, { docsRoot, languages, options });

if (results.some(hasFatalIssue)) {
  console.error('\nDead sidebar links or fatal errors were found. Exit with code 1.');
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {
    help: false,
    langs: null,
    removeUnresolvedMeta: false,
    root: null,
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
  console.log(`Usage (run from docs/):
  node ./scripts/normalize-doc-links.mjs                              # dry-run, all langs
  node ./scripts/normalize-doc-links.mjs --langs cn,fr                # filter languages
  node ./scripts/normalize-doc-links.mjs --write                      # apply auto-fix
  node ./scripts/normalize-doc-links.mjs --write --remove-unresolved-meta

Options:
  --langs <list>              Comma-separated language list, e.g. cn,fr.
  --root <path>               Docs root. Defaults to docs/docs relative to this script.
  --remove-unresolved-meta    Remove unresolved leaf entries from _meta.json in write mode.
  --write                     Apply changes. Default mode only reports.

Notes:
  - Only checks _meta.json sidebar links.
  - Markdown link dead-link checking is enforced by rspress at build time
    (via markdown.link.checkDeadLinks in rspress.config.ts).
  - 'ar' is skipped by default (deferred maintenance). Pass --langs ar to force.
`);
}

function listLanguageDirs(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter(entry =>
      entry.isDirectory() &&
      !entry.name.startsWith('.') &&
      entry.name !== 'public' &&
      !SKIP_LANGS.has(entry.name),
    )
    .map(entry => entry.name)
    .sort();
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

function isMetaInternal(target) {
  if (!target.startsWith('/') || target.startsWith('//')) return false;
  return !/^[a-z][a-z0-9+.-]*:/i.test(target);
}

function splitSuffix(target) {
  let cut = target.length;
  for (const char of ['#', '?']) {
    const index = target.indexOf(char);
    if (index !== -1 && index < cut) cut = index;
  }
  return { base: target.slice(0, cut), suffix: target.slice(cut) };
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

function summarizeChanges(changes, keys) {
  const summary = {};
  for (const key of keys) summary[key] = changes.filter(change => change.type === key).length;
  return { summary, changes };
}

function printReport(results, context) {
  const mode = context.options.write ? 'write' : 'dry run';

  console.log(`Sidebar (_meta.json) link check (${mode})`);
  console.log(`Root: ${context.docsRoot}`);
  console.log(`Languages: ${context.languages.join(', ')}`);

  for (const result of results) {
    console.log(`\n## ${result.lang}`);
    if (result.error) {
      console.log(`  ERROR: ${result.error}`);
      continue;
    }
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
    ambiguous: 'Ambiguous route, review manually',
    explicitIndex: 'Replace /index route with directory route',
    extraSlash: 'Remove extra trailing slash',
    missingSlash: 'Add trailing slash to directory routes',
    removedUnresolved: 'Remove dead sidebar entries',
    unresolved: 'Dead sidebar links',
  };
  return labels[type] || type;
}

function formatChange(change) {
  const target = change.to ? `${change.from} -> ${change.to}` : change.from;
  return `${change.file}: ${target}`;
}

function hasFatalIssue(result) {
  if (result.error) return true;
  return (result.meta?.summary.unresolved || 0) > 0;
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

function relative(file) {
  return path.relative(process.cwd(), file);
}
