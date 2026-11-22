#!/usr/bin/env node
/**
 * Regenerates the `agent-chat` block (`registry/agents/agent-chat/`) from the agents plugin's panel
 * (`packages/plugins/app-plugin-agents/client/panel/`), which is its source: the plugin ships the panel, and the block is
 * the copy an application installs only to replace the whole panel.
 *
 * The plugin's imports are turned back into what an installed copy resolves: the plugin's shadcn components into
 * `#components/ui/<name>`, its copies of UI Library items (`client/panel/components/`, `client/components/agent-picker`)
 * into `#components/<name>`, the plugin's chat entry and its extension points into
 * `@nocobase/app-plugin-agents/client/chat`, `shared/<name>` into `@nocobase/app-plugin-agents/shared/<name>`, and the
 * panel's wording (`client/locales/panel.<locale>.ts`, read in the plugin's namespace) into the block's own
 * `locales/` in the application's namespace. An import the block cannot reach fails the run.
 *
 *   node scripts/sync-agent-chat.mjs           write the block
 *   node scripts/sync-agent-chat.mjs --check   exit 1 when the block is stale (what `tests/registry` runs)
 *
 * `--check` also holds the plugin's copies of UI Library items (`client/panel/components/*`) equal to the items.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as prettier from 'prettier';

const libraryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const repositoryRoot = path.resolve(libraryRoot, '..');
const pluginRoot = path.join(
  repositoryRoot,
  'packages/plugins/app-plugin-agents',
);
const panelRoot = path.join(pluginRoot, 'client/panel');
const blockRoot = path.join(libraryRoot, 'registry/agents/agent-chat');

const CHAT_ENTRY = '@nocobase/app-plugin-agents/client/chat';
/** Plugin-only files: the lazy entry the plugin loads, which an installed block does not need. */
const PLUGIN_ONLY = new Set(['index.ts']);
/** Kept in the block, never generated. */
const BLOCK_ONLY = new Set(['README.md']);
/** The plugin's copies of UI Library items, and the item each one is. */
const ITEM_COPIES = {
  'agent-composer.tsx': 'registry/agents/agent-composer.tsx',
  'agent-run-history.tsx': 'registry/agents/agent-run-history.tsx',
  'attachment-list.tsx': 'registry/components/attachment-list.tsx',
  'markdown-view.tsx': 'registry/components/markdown-view.tsx',
  'remark-cjk-autolink.ts': 'registry/components/remark-cjk-autolink.ts',
};

const sharedExports = new Set(
  Object.keys(
    JSON.parse(readFileSync(path.join(pluginRoot, 'package.json'), 'utf8'))
      .exports,
  )
    .filter((key) => key.startsWith('./shared/'))
    .map((key) => key.slice('./shared/'.length)),
);

/** Rewrites one module specifier of a panel file (`depth` 0) or of a copied item (`depth` 1). */
function specifier(value, file, depth) {
  const up = depth ? '../' : '';
  let match;
  if (
    (match = new RegExp(`^${up}\\.\\./components/ui/([\\w-]+)\\.js$`, 'u').exec(
      value,
    ))
  )
    return `#components/ui/${match[1]}`;
  if (value === `${up}../components/agent-picker.js`)
    return '#components/agent-picker';
  if (!depth && (match = /^\.\/components\/([\w-]+)\.js$/u.exec(value)))
    return `#components/${match[1]}`;
  if (value === `${up}../chat.js` || value === `${up}../ui-slots.js`)
    return CHAT_ENTRY;
  if (
    (match = new RegExp(`^${up}\\.\\./\\.\\./shared/([\\w-]+)\\.js$`, 'u').exec(
      value,
    ))
  ) {
    if (!sharedExports.has(match[1]))
      throw new Error(
        `${file}: ${value} is not exported by the agents plugin (./shared/${match[1]}).`,
      );
    return `@nocobase/app-plugin-agents/shared/${match[1]}`;
  }
  if (!depth && value === '../locales/panel.en-US.js')
    return './locales/en-US.js';
  if (value.startsWith('../'))
    throw new Error(
      `${file}: ${value} is private to the agents plugin; export it from ${CHAT_ENTRY} first.`,
    );
  return value;
}

function rewrite(source, file, depth) {
  return source.replace(
    /(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|\bvi\.mock\(\s*)'([^']+)'/gu,
    (whole, head, value) => `${head}'${specifier(value, file, depth)}'`,
  );
}

/** The panel reads its wording in the plugin's namespace; the block reads its own, in the application's. */
function toBlockNamespace(source, file) {
  if (file !== 'chat-i18n.ts') return source;
  const next = source.replace(
    'useTranslation(ACCESS_NAMESPACE)',
    'useTranslation()',
  );
  if (next === source)
    throw new Error('chat-i18n.ts: expected useTranslation(ACCESS_NAMESPACE).');
  return next;
}

async function format(source, target) {
  const options = (await prettier.resolveConfig(target)) ?? {};
  return prettier.format(source, { ...options, filepath: target });
}

/** Every file the block holds, by its path in the block, as generated from the plugin. */
async function generate() {
  const files = new Map();
  for (const name of readdirSync(panelRoot).sort()) {
    if (!/\.tsx?$/u.test(name) || PLUGIN_ONLY.has(name)) continue;
    const source = readFileSync(path.join(panelRoot, name), 'utf8');
    const target = path.join(blockRoot, name);
    files.set(
      name,
      await format(toBlockNamespace(rewrite(source, name, 0), name), target),
    );
  }
  for (const locale of ['en-US', 'zh-CN']) {
    const name = `locales/${locale}.ts`;
    const source = readFileSync(
      path.join(pluginRoot, `client/locales/panel.${locale}.ts`),
      'utf8',
    );
    files.set(
      name,
      await format(
        source.replaceAll('./panel.en-US.js', './en-US.js'),
        path.join(blockRoot, name),
      ),
    );
  }
  return files;
}

/** The plugin's copies of UI Library items that no longer match the item, after the same rewrite. */
async function staleCopies() {
  const stale = [];
  for (const [name, item] of Object.entries(ITEM_COPIES)) {
    const target = path.join(libraryRoot, item);
    const copy = rewrite(
      readFileSync(path.join(panelRoot, 'components', name), 'utf8'),
      name,
      1,
    );
    const expected = await format(copy, target);
    if (expected !== (await format(readFileSync(target, 'utf8'), target)))
      stale.push(`client/panel/components/${name} ≠ ui-library/${item}`);
  }
  return stale;
}

function blockFiles() {
  const listed = [];
  for (const name of readdirSync(blockRoot)) {
    if (BLOCK_ONLY.has(name)) continue;
    if (name === 'locales') {
      for (const locale of readdirSync(path.join(blockRoot, name)))
        listed.push(`locales/${locale}`);
    } else listed.push(name);
  }
  return listed;
}

/** Generated files the block's registry items do not install. */
function unlisted(files) {
  const registry = JSON.parse(
    readFileSync(
      path.join(libraryRoot, 'registry/agents/registry.json'),
      'utf8',
    ),
  );
  const declared = new Set(
    registry.items
      .filter(
        (item) =>
          item.name === 'agent-chat' || item.name === 'agent-chat-details',
      )
      .flatMap((item) =>
        item.files.map((file) => file.path.replace(/^agent-chat\//u, '')),
      ),
  );
  return [...files.keys()].filter((name) => !declared.has(name));
}

const check = process.argv.includes('--check');
const files = await generate();

if (check) {
  const problems = [];
  for (const [name, content] of files) {
    const target = path.join(blockRoot, name);
    if (!existsSync(target)) problems.push(`missing ${name}`);
    else if (readFileSync(target, 'utf8') !== content)
      problems.push(`stale ${name}`);
  }
  for (const name of blockFiles())
    if (!files.has(name)) problems.push(`not in the plugin ${name}`);
  for (const name of unlisted(files))
    problems.push(`not in registry/agents/registry.json ${name}`);
  problems.push(...(await staleCopies()));
  if (problems.length) {
    console.error(
      `registry/agents/agent-chat is out of date with the agents plugin's panel:\n  ${problems.join('\n  ')}\n` +
        'Run `node scripts/sync-agent-chat.mjs` in ui-library (and keep the plugin copies of UI Library items equal to the items).',
    );
    process.exit(1);
  }
  console.log('registry/agents/agent-chat matches the agents plugin.');
} else {
  for (const name of blockFiles())
    if (!files.has(name)) rmSync(path.join(blockRoot, name));
  for (const [name, content] of files)
    writeFileSync(path.join(blockRoot, name), content);
  const missing = unlisted(files);
  if (missing.length)
    console.warn(`Add to registry/agents/registry.json: ${missing.join(', ')}`);
  console.log(`Wrote ${files.size} files to registry/agents/agent-chat.`);
}
