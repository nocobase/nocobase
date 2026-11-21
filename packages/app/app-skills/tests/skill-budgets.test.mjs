// Keeps the Skills from growing back. Every agent reads the entry files and the frontend guide on most tasks, so their
// size is a cost paid on every task, and a rule repeated in several places drifts into contradictions. Raise a limit
// only together with a deliberate decision about what else to remove.
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { checkLinks, markdownFiles, skillsRoot } from './skill-links.mjs';

const KB = 1024;
const app = path.join(skillsRoot, 'nocobase-app-development');
const frontend = path.join(app, 'references/frontend');
const references = path.join(frontend, 'references');

const caps = {
  'nocobase-app-development/SKILL.md': 16,
  'nocobase-app-plugin-development/SKILL.md': 16,
  'nocobase-deployment/SKILL.md': 15,
  'nocobase-app-upgrade/SKILL.md': 15,
  'nocobase-app-development/references/frontend/ui-workflow.md': 10,
  'nocobase-app-development/references/frontend/ui-guidelines.md': 20,
  'nocobase-app-development/references/frontend/mobile.md': 10,
  'nocobase-app-development/references/frontend/ui-acceptance.md': 5,
  'nocobase-app-development/references/frontend/design-contract.md': 4,
  'nocobase-app-development/references/frontend/references/page.md': 20,
  'nocobase-app-development/references/frontend/references/table.md': 20,
  'nocobase-app-development/references/frontend/references/form.md': 20,
  'nocobase-app-development/references/frontend/references/overlay.md': 20,
  'nocobase-app-development/references/frontend/references/api.md': 20,
  'nocobase-app-development/references/frontend/references/child-routes.md': 20,
  'nocobase-app-development/references/frontend/references/ui-library.md': 12,
};

// What ui-workflow.md lists as required reading for a new CRUD page.
const crudReading = [
  'SKILL.md',
  'references/frontend/ui-workflow.md',
  'references/frontend/ui-guidelines.md',
  'references/frontend/design-contract.md',
  'references/frontend/mobile.md',
  'references/frontend/references/page.md',
  'references/frontend/references/table.md',
  'references/frontend/references/form.md',
  'references/frontend/references/overlay.md',
  'references/frontend/references/api.md',
  'references/frontend/references/executable-list-edit.md',
];

const size = async (file) => (await stat(file)).size;

/** The entry Skill's frontend section: from its `## Frontend` heading to the next `## ` heading. */
function frontendSection(entry) {
  const start = entry.indexOf('\n## Frontend\n');
  if (start === -1) return '';
  const end = entry.indexOf('\n## ', start + 1);
  return entry.slice(start, end === -1 ? undefined : end);
}

describe('Skill size limits', () => {
  for (const [file, cap] of Object.entries(caps))
    it(`${file} stays within ${cap} KB`, async () => {
      expect(await size(path.join(skillsRoot, file))).toBeLessThanOrEqual(
        cap * KB,
      );
    });

  it('the entry Skill keeps its frontend section within 1.2 KB', async () => {
    const entry = await readFile(path.join(app, 'SKILL.md'), 'utf8');
    const section = frontendSection(entry);
    expect(section).not.toBe('');
    expect(Buffer.byteLength(section)).toBeLessThanOrEqual(1.2 * KB);
  });

  it('the worked example stays within 60 KB', async () => {
    const files = [
      path.join(references, 'example.md'),
      ...(await markdownFiles(path.join(references, 'example'))),
    ];
    const total = (await Promise.all(files.map(size))).reduce(
      (sum, value) => sum + value,
      0,
    );
    expect(total).toBeLessThanOrEqual(60 * KB);
  });

  it('the required reading for a new CRUD page stays within 150 KB and is what the workflow lists', async () => {
    const workflow = await readFile(
      path.join(frontend, 'ui-workflow.md'),
      'utf8',
    );
    for (const file of crudReading.slice(2))
      expect(workflow).toContain(path.basename(file));
    const total = (
      await Promise.all(crudReading.map((file) => size(path.join(app, file))))
    ).reduce((sum, value) => sum + value, 0);
    expect(total).toBeLessThanOrEqual(150 * KB);
  });

  it('ships no copy of the upstream shadcn Skill', async () => {
    const entries = await readdir(frontend);
    expect(entries).not.toContain('shadcn');
  });
});

describe('UI rules', () => {
  it('mark at most 30 rules as Must', async () => {
    const files = (await markdownFiles(frontend)).filter(
      (file) => path.basename(file) !== 'ui-library.md',
    );
    let count = 0;
    for (const file of files)
      count += ((await readFile(file, 'utf8')).match(/\bMust\b/gu) ?? [])
        .length;
    const entry = await readFile(path.join(app, 'SKILL.md'), 'utf8');
    count += (frontendSection(entry).match(/\bMust\b/gu) ?? []).length;
    expect(count).toBeLessThanOrEqual(30);
  });
});

describe('Skill links', () => {
  it('every relative link and anchor in the published Skills resolves', async () => {
    const problems = await checkLinks(await markdownFiles(skillsRoot));
    expect(problems).toEqual([]);
  });
});
