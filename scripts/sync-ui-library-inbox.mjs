/**
 * Generates the UI Library's `inbox` block from the in-app notification plugin's inbox page.
 *
 * The plugin owns the inbox page (`packages/plugins/app-plugin-notification-in-app/client/inbox-page/`) and registers it
 * itself; the block is only the means for an application that wants to copy the page out and own it. This script copies
 * the plugin's files into `ui-library/registry/inbox/inbox/`, rewrites their imports to what an installed copy resolves
 * (`#components/...` primitives and the plugin's public entries), and formats them. The extension lists stay the
 * plugin's: a copy imports `inboxRenderersToken`, `inboxSourcesToken` and their hooks from the plugin, so what other
 * plugins register still reaches it.
 *
 * Usage:
 *   node ./scripts/sync-ui-library-inbox.mjs           # rewrite the block, print what changed
 *   node ./scripts/sync-ui-library-inbox.mjs --check   # exit 1 if the block is stale, change nothing
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as prettier from 'prettier';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const SOURCE_RELATIVE =
  'packages/plugins/app-plugin-notification-in-app/client/inbox-page';
const SOURCE = path.join(repoRoot, SOURCE_RELATIVE);
const TARGET = path.join(repoRoot, 'ui-library/registry/inbox/inbox');
const PLUGIN_CLIENT = '@nocobase/app-plugin-notification-in-app/client';
const PLUGIN_INBOX = '@nocobase/app-plugin-notification-in-app/client/inbox';

/** Plugin files a copy imports from the plugin instead of copying: the extension lists must stay shared. */
const SHARED = new Map([['extensions', PLUGIN_CLIENT]]);
/** Files in the target the script does not generate. */
const KEPT = new Set(['README.md']);

const checkOnly = process.argv.includes('--check');

function rewriteSpecifier(specifier) {
  const ui = /^\.\.\/components\/ui\/([\w-]+)\.js$/u.exec(specifier);
  if (ui) return `#components/ui/${ui[1]}`;
  if (specifier === '../components/page-header.js')
    return '#components/page-header';
  if (/^\.\.\/inbox\/(index|use-inbox|keys)\.js$/u.test(specifier))
    return PLUGIN_INBOX;
  if (specifier === '../i18n.js' || specifier === '../api.js')
    return PLUGIN_CLIENT;
  const local = /^\.\/([\w-]+)\.js$/u.exec(specifier);
  if (local && SHARED.has(local[1])) return SHARED.get(local[1]);
  if (specifier.startsWith('../'))
    throw new Error(
      `No installed equivalent for "${specifier}"; add one to scripts/sync-ui-library-inbox.mjs.`,
    );
  return specifier;
}

async function generate(file) {
  const source = readFileSync(path.join(SOURCE, file), 'utf8');
  const rewritten = source.replace(
    /(\bfrom\s+|\bimport\s*\(\s*|^import\s+)'([^']+)'/gmu,
    (_match, lead, specifier) => `${lead}'${rewriteSpecifier(specifier)}'`,
  );
  const header = `// Generated from ${SOURCE_RELATIVE}/${file}: edit it there, then run \`node scripts/sync-ui-library-inbox.mjs\`.\n`;
  const filepath = path.join(TARGET, file);
  const options = (await prettier.resolveConfig(filepath)) ?? {};
  return prettier.format(header + rewritten, { ...options, filepath });
}

function listTarget(directory, prefix = '') {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    return statSync(full).isDirectory()
      ? listTarget(full, relative)
      : [relative];
  });
}

const sources = readdirSync(SOURCE)
  .filter((file) => /\.tsx?$/u.test(file))
  .filter((file) => !SHARED.has(file.replace(/\.tsx?$/u, '')))
  .sort();

const stale = [];
const expected = new Set(sources);
for (const file of sources) {
  const content = await generate(file);
  const target = path.join(TARGET, file);
  if (existsSync(target) && readFileSync(target, 'utf8') === content) continue;
  stale.push(file);
  if (!checkOnly) {
    mkdirSync(TARGET, { recursive: true });
    writeFileSync(target, content);
  }
}
const extra = listTarget(TARGET).filter(
  (file) => !expected.has(file) && !KEPT.has(file),
);
if (!checkOnly)
  for (const file of extra) rmSync(path.join(TARGET, file), { force: true });
if (!checkOnly)
  for (const entry of readdirSync(TARGET)) {
    const full = path.join(TARGET, entry);
    if (statSync(full).isDirectory() && listTarget(full).length === 0)
      rmSync(full, { recursive: true });
  }

if (stale.length === 0 && extra.length === 0) {
  console.log('ui-library inbox block is up to date.');
} else if (checkOnly) {
  for (const file of stale)
    console.error(`stale: ui-library/registry/inbox/inbox/${file}`);
  for (const file of extra)
    console.error(`to delete: ui-library/registry/inbox/inbox/${file}`);
  console.error(
    'The UI Library inbox block is out of date; run `node scripts/sync-ui-library-inbox.mjs`.',
  );
  process.exit(1);
} else {
  for (const file of stale)
    console.log(`updated: ui-library/registry/inbox/inbox/${file}`);
  for (const file of extra)
    console.log(`deleted: ui-library/registry/inbox/inbox/${file}`);
}
