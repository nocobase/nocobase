// Bundles the ACP adapters for Codex and Claude Code into `dist/adapters/`, one file each, so the bridge runs them
// with the Node.js running it rather than fetching them with npx on first use. Each runs the agent installed on the
// computer, which the bridge names to it (`CODEX_PATH`, `CLAUDE_CODE_EXECUTABLE`), so neither bundle carries the
// agent's own platform binary. The licenses of everything bundled are written beside them.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const outdir = path.join(import.meta.dirname, '..', 'dist', 'adapters');

/** The adapters, by the file name `src/agents.ts` runs them as. */
const ADAPTERS = {
  'codex-acp.mjs': '@agentclientprotocol/codex-acp',
  'claude-agent-acp.mjs': '@agentclientprotocol/claude-agent-acp',
};

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const bundled = new Map();
for (const [file, name] of Object.entries(ADAPTERS)) {
  const manifest = require.resolve(`${name}/package.json`);
  const { bin } = JSON.parse(await readFile(manifest, 'utf8'));
  const entry = path.join(
    path.dirname(manifest),
    typeof bin === 'string' ? bin : Object.values(bin)[0],
  );
  const result = await build({
    entryPoints: [entry],
    outfile: path.join(outdir, file),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    minify: true,
    legalComments: 'none',
    metafile: true,
    logLevel: 'warning',
    // Bundled CommonJS modules call `require`, which an ES module does not have.
    banner: {
      js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
    },
  });
  for (const input of Object.keys(result.metafile.inputs)) {
    const root = packageRoot(path.resolve(input));
    if (root) bundled.set(root, (bundled.get(root) ?? new Set()).add(file));
  }
}

const notices = [];
for (const [root, files] of [...bundled].sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  const manifest = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8'),
  );
  const license = await licenseText(root);
  notices.push(
    [
      `${manifest.name}@${manifest.version} (${manifest.license ?? 'no license field'}), in ${[...files].join(', ')}`,
      license ?? '',
    ]
      .join('\n\n')
      .trim(),
  );
}
await writeFile(
  path.join(outdir, 'THIRD_PARTY_LICENSES.txt'),
  `The adapters in this directory bundle the following packages.\n\n${notices.join(`\n\n${'-'.repeat(80)}\n\n`)}\n`,
);

/** The directory of the npm package that holds `file`. */
function packageRoot(file) {
  const parts = file.split(path.sep);
  const at = parts.lastIndexOf('node_modules');
  if (at < 0) return undefined;
  const length = parts[at + 1]?.startsWith('@') ? 3 : 2;
  return parts.slice(0, at + length).join(path.sep);
}

async function licenseText(root) {
  for (const name of [
    'LICENSE',
    'LICENSE.md',
    'LICENSE.txt',
    'license',
    'LICENCE',
    'LICENSE-MIT',
  ]) {
    try {
      return await readFile(path.join(root, name), 'utf8');
    } catch {
      // Try the next name.
    }
  }
  return undefined;
}
