import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'packages/templates/app-template-examples');
const skill = path.join(
  root,
  'packages/app/app-skills/skills/nocobase-app-development/assets',
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
const procurement = [
  'shared/procurement.ts',
  'client/pages/procurement/index.tsx',
  'client/pages/procurement/detail.tsx',
  'client/pages/procurement/reference.tsx',
  'client/pages/procurement/locales.ts',
  'server/routes/procurement.ts',
  'server/providers/procurement.ts',
  'server/providers/procurement-registration.ts',
  'server/providers/procurement-reset.ts',
  'server/lifecycles/procurement.ts',
  'database/main/migrations/202611040001_create_procurement.ts',
  'database/main/seeds/202611040001_procurement.ts',
  'database/main/seeds/202611040002_procurement_samples.ts',
  'cli/commands/procurement-reset.ts',
  'tests/client/procurement.test.tsx',
  'tests/server/procurement.test.ts',
  'tests/database/procurement.test.ts',
  'tests/playwright/procurement.test.ts',
  'docs/procurement.md',
];
const customerContacts = [
  'client/pages/customer-contacts/index.tsx',
  'client/pages/customer-contacts/detail.tsx',
  'client/pages/customer-contacts/edit.tsx',
  'client/pages/customer-contacts/batch.tsx',
  'client/pages/customer-contacts/model.ts',
  'client/pages/customer-contacts/shared.tsx',
  'client/pages/customer-contacts/relation-picker.tsx',
  'client/pages/customer-contacts/locales.ts',
  'server/routes/customer-contacts.ts',
  'server/providers/customer-contacts.ts',
  'server/providers/customer-contacts-authorization.ts',
  'server/providers/customer-contacts-data.ts',
  'database/main/migrations/202611030002_create_customer_contacts.ts',
  'database/main/seeds/202611030002_customer_contacts.ts',
  'tests/client/customer-contacts.test.tsx',
  'tests/server/customer-contacts.test.ts',
  'tests/database/customer-contacts-migration.test.ts',
];
const mappings = [
  ...files.map((file) => [file, `list-edit-example/${file}`]),
  ...customerContacts.map((file) => [
    file,
    `customer-contacts-example/${file}`,
  ]),
  ...procurement.map((file) => [file, `business-examples/procurement/${file}`]),
  ['docs/business-examples/index.json', 'business-examples/index.json'],
];
if (process.argv.slice(2).some((arg) => arg !== '--check'))
  throw new Error('Usage: node scripts/sync-app-skill-examples.mjs [--check]');
const check = process.argv.includes('--check');
let stale = false;
for (const [file, relative] of mappings) {
  const content = await readFile(path.join(source, file), 'utf8');
  const target = path.join(skill, relative);
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
for (const directory of [
  'list-edit-example',
  'customer-contacts-example',
  'business-examples',
]) {
  for (const file of await list(path.join(skill, directory))) {
    if (!mappings.some(([, target]) => target === `${directory}/${file}`)) {
      console.error(`Unexpected Skill example file: ${directory}/${file}`);
      stale = true;
    }
  }
}
if (stale) {
  console.error(
    'Edit the Examples source, then run node scripts/sync-app-skill-examples.mjs. Remove obsolete copies explicitly.',
  );
  process.exitCode = 1;
} else
  console.log(
    `${check ? 'Checked' : 'Synchronized'} ${mappings.length} executable Skill example files.`,
  );
