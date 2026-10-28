import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'packages/templates/app-template-examples');
const destination = path.join(
  root,
  'packages/app/app-skills/skills/nocobase-app-development/assets/list-edit-example',
);
const files = [
  'client/pages/skill-projects/index.tsx',
  'client/pages/skill-projects/edit.tsx',
  'client/pages/skill-projects/locales.ts',
  'server/routes/skill-projects.ts',
  'server/providers/skill-projects.ts',
  'database/main/migrations/202611030001_create_skill_projects.ts',
  'tests/client/skill-projects.test.tsx',
  'tests/server/skill-projects.test.ts',
  'tests/database/skill-projects-migration.test.ts',
];
if (process.argv.slice(2).some((arg) => arg !== '--check'))
  throw new Error('Usage: node scripts/sync-app-skill-examples.mjs [--check]');
const check = process.argv.includes('--check');
let stale = false;
for (const file of files) {
  const content = await readFile(path.join(source, file), 'utf8');
  const target = path.join(destination, file);
  if (check) {
    const published = await readFile(target, 'utf8').catch((error) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    if (published !== content) {
      console.error(`Stale Skill example: ${file}`);
      stale = true;
    }
  } else {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
}
async function list(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    },
  );
  const result = [];
  for (const entry of entries) {
    const name = prefix + entry.name;
    if (entry.isDirectory())
      result.push(
        ...(await list(path.join(directory, entry.name), `${name}/`)),
      );
    else result.push(name);
  }
  return result;
}
for (const file of await list(destination)) {
  if (!files.includes(file)) {
    console.error(`Unexpected Skill example file: ${file}`);
    stale = true;
  }
}
if (stale) {
  console.error(
    'Edit the Examples source, then run node scripts/sync-app-skill-examples.mjs. Remove obsolete copies explicitly.',
  );
  process.exitCode = 1;
} else
  console.log(
    `${check ? 'Checked' : 'Synchronized'} ${files.length} executable Skill example files.`,
  );
