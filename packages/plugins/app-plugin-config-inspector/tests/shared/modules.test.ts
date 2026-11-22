import { expect, it } from 'vitest';

import { diffLines, foldUnchanged } from '../../shared/line-diff.js';
import { buildModules } from '../../shared/modules.js';
import type {
  ConfigInspectorSnapshot,
  InspectedSetting,
} from '../../shared/snapshot.js';

const setting = (
  path: string,
  overrides: Partial<InspectedSetting> = {},
): InspectedSetting => ({
  path,
  value: 'x',
  source: 'default',
  secret: false,
  customized: false,
  ...overrides,
});

it('assigns settings to curated modules and lists the remaining sections', () => {
  const snapshot: ConfigInspectorSnapshot = {
    file: { path: 'config.yml', exists: true, text: '' },
    example: null,
    loadedAt: null,
    reloads: 0,
    variables: [],
    sections: [
      { key: 'finder', comment: 'Bootstrap only.', inExample: true },
      { key: 'api', inExample: true },
    ],
    settings: [
      setting('users.initialAdmin.username', { source: 'file' }),
      setting('users.locale', { source: 'file' }),
      setting('i18n.defaultLocale', {
        source: 'environment',
        customized: true,
      }),
      setting('api.timeout'),
    ],
  };
  const modules = new Map(
    buildModules(snapshot).map((module) => [module.key, module]),
  );
  expect(
    modules.get('initialAdmin')?.settings.map((item) => item.path),
  ).toEqual(['users.initialAdmin.username']);
  expect(modules.get('initialAdmin')?.firstStartOnly).toBe(true);
  expect(modules.get('users')).toMatchObject({ group: 'other' });
  expect(modules.get('appearance')).toMatchObject({
    customized: 1,
    fromEnvironment: 1,
  });
  expect(modules.get('api')).toMatchObject({ off: true, empty: false });
  expect(modules.get('finder')).toMatchObject({
    group: 'other',
    comment: 'Bootstrap only.',
    empty: true,
  });
  expect(modules.has('database')).toBe(true);
});

it('diffs lines, numbering the new text', () => {
  expect(diffLines('a\nb\nc\n', 'a\nB\nc\nd\n')).toEqual([
    { kind: 'same', text: 'a', line: 1 },
    { kind: 'removed', text: 'b' },
    { kind: 'added', text: 'B', line: 2 },
    { kind: 'same', text: 'c', line: 3 },
    { kind: 'added', text: 'd', line: 4 },
  ]);
});

it('folds long runs of unchanged lines', () => {
  const before = Array.from({ length: 20 }, (_, index) => `line ${index}`).join(
    '\n',
  );
  const after = before.replace('line 10', 'changed');
  const rows = foldUnchanged(diffLines(before, after)!);
  expect(rows.filter((row) => row.kind === 'skipped')).toEqual([
    { kind: 'skipped', count: 7 },
    { kind: 'skipped', count: 6 },
  ]);
  expect(
    rows.filter((row) => row.kind !== 'same' && row.kind !== 'skipped'),
  ).toHaveLength(2);
});

it('does not compare texts too long to diff in a browser', () => {
  const long = Array.from({ length: 2100 }, (_, index) => `line ${index}`).join(
    '\n',
  );
  expect(diffLines(long, long)).toBeUndefined();
});
