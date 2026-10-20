import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  compareResources,
  i18nCheck,
  SUPPORTED_LOCALES,
} from '../../scripts/i18n-check.mjs';

test('requires a missing language even when all existing files are complete', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'locale-check-'));
  try {
    await writeFile(path.join(repoRoot, 'package.json'), '{"type":"module"}');
    const directory = path.join(
      repoRoot,
      'packages/plugins/demo/client/locales',
    );
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, 'en-US.ts'),
      'export default { label: "Language" };',
    );
    await writeFile(
      path.join(directory, 'zh-CN.ts'),
      'export default { label: "语言" };',
    );
    const { reports } = await i18nCheck({ repoRoot });
    assert.equal(
      reports.filter((report) =>
        report.invalid.includes('locale file is missing'),
      ).length,
      8,
    );
    assert.ok(
      reports.every((report) =>
        report.invalid.includes('locale manifest is missing'),
      ),
    );
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('evaluates composed resources and verifies what each manifest loader returns', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'locale-check-'));
  try {
    await writeFile(path.join(repoRoot, 'package.json'), '{"type":"module"}');
    const directory = path.join(
      repoRoot,
      'packages/examples/demo/client/locales',
    );
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, 'shared.ts'),
      'export default { composed: "Shared value" };',
    );
    await writeFile(
      path.join(directory, 'en-US.ts'),
      'import shared from "./shared.js"; export default { ...shared, label: "Language" };',
    );
    for (const locale of SUPPORTED_LOCALES.slice(1)) {
      await writeFile(
        path.join(directory, `${locale}.ts`),
        'export default { label: "Translated" };',
      );
    }
    await writeFile(
      path.join(directory, 'index.ts'),
      `export default { ${SUPPORTED_LOCALES.map((locale) => `'${locale}': () => import('./en-US.js')`).join(',')} };`,
    );
    const { reports } = await i18nCheck({ repoRoot });
    assert.equal(reports.length, 9);
    assert.ok(reports.every((report) => report.missing.includes('composed')));
    assert.ok(
      reports.every((report) =>
        report.invalid.includes('loader returns a different resource'),
      ),
    );
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('keeps application templates exempt from the ten-language requirement', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'locale-check-'));
  try {
    await writeFile(path.join(repoRoot, 'package.json'), '{"type":"module"}');
    const directory = path.join(
      repoRoot,
      'packages/templates/demo/client/locales',
    );
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, 'en-US.ts'),
      'export default { label: "Language" };',
    );
    await writeFile(
      path.join(directory, 'index.ts'),
      "export default { 'en-US': () => import('./en-US.js') };",
    );
    assert.deepEqual((await i18nCheck({ repoRoot })).reports, []);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('checks repeated placeholders, markup, empty text and locale-specific plurals', () => {
  const source = {
    count_one: '{{count}} item',
    count_other: '{{count}} items',
    html: '<b>{{name}}</b> {{name}}',
    code: 'Use `pnpm install`',
  };
  const translated = {
    count_one: '{{count}} élément',
    count_other: '{{count}} éléments',
    html: '<i>{{name}}</i>',
    code: '',
  };
  const report = compareResources(source, translated, 'fr-FR');
  assert.deepEqual(report.missing, ['count_many']);
  assert.deepEqual(report.invalid, [
    'html: interpolation differs',
    'html: markup differs',
    'code: expected a non-empty string',
  ]);
  assert.deepEqual(
    compareResources(
      { count_other: '{{count}} items', count_one: '{{count}} item' },
      {
        count_other: '{{count}} éléments',
        count_one: '{{count}} élément',
        count_many: '{{count}} éléments',
      },
      'fr-FR',
    ),
    { missing: [], extra: [], invalid: [] },
  );
});

test('preserves structured Markdown and input syntax while allowing translated prose to wrap', () => {
  const source = {
    sample: '# Sign-in\n- Form [high] #frontend\n  - Email @stage2',
  };
  const translated = {
    sample: '# Connexion\n- Formulaire [high] #frontend\n  - E-mail @stage2',
  };
  assert.deepEqual(compareResources(source, translated, 'fr-FR'), {
    missing: [],
    extra: [],
    invalid: [],
  });
  assert.ok(
    compareResources(
      source,
      {
        sample: '# Connexion\n- Formulaire [élevé] #frontend\n- E-mail @stage2',
      },
      'fr-FR',
    ).invalid.includes('sample: multiline formatting differs'),
  );
  assert.ok(
    compareResources(
      source,
      {
        sample:
          '# Connexion\n- Formulaire [élevé] #frontend\n  - E-mail @stage2',
      },
      'fr-FR',
    ).invalid.includes('sample: syntax tokens differ'),
  );
  assert.deepEqual(
    compareResources({ text: 'Prose' }, { text: 'Du\ntexte' }, 'fr-FR').invalid,
    [],
  );
});

test('requires zero overrides where a literal singular would describe zero occurrences as once', () => {
  const source = {
    search_one: 'searched once',
    search_other: 'searched {{count}} times',
  };
  assert.deepEqual(
    compareResources(
      source,
      {
        search_one: 'recherché une fois',
        search_other: 'recherché {{count}} fois',
      },
      'fr-FR',
    ).missing,
    ['search_zero', 'search_many'],
  );
  assert.deepEqual(
    compareResources(
      source,
      {
        search_one: 'recherché une fois',
        search_other: 'recherché {{count}} fois',
        search_many: 'recherché {{count}} fois',
        search_zero: 'recherché {{count}} fois',
      },
      'fr-FR',
    ).missing,
    [],
  );
});
