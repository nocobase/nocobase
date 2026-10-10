// @vitest-environment node
/**
 * Studio's preset labels: a new installation gets nine labels named in its default language, a replay adds nothing,
 * and a label that already has a preset's name is left as it is.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import seed from '../../database/main/seeds/202610010060_studio_preset_labels.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

interface Row {
  readonly name: string;
  readonly color: string;
}

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
});
afterEach(() => h.close());

async function run(locale: string | undefined): Promise<void> {
  const conn = h.database.connection();
  await seed.run({
    query: conn.query,
    repository: (name: string) => conn.repository(name),
    config: {
      get: (key: string) => (key === 'i18n.defaultLocale' ? locale : undefined),
    },
  } as never);
}

const sorted = (rows: readonly Row[]): Row[] =>
  [...rows].sort((a, b) => a.name.localeCompare(b.name));

const labels = async (): Promise<Row[]> =>
  sorted(
    (await h.projects.labels.list()).map(({ name, color }) => ({
      name,
      color,
    })),
  );

describe('the preset labels seed', () => {
  it('names the labels in Chinese for a zh locale', async () => {
    await run('zh-CN');
    expect(await labels()).toEqual(
      sorted([
        { name: 'Bug', color: 'red' },
        { name: '功能', color: 'blue' },
        { name: '优化', color: 'green' },
        { name: '文档', color: 'gray' },
        { name: '体验', color: 'purple' },
        { name: '性能', color: 'orange' },
        { name: '安全', color: 'yellow' },
        { name: '前端', color: 'blue' },
        { name: '后端', color: 'purple' },
      ]),
    );
  });

  it('names the labels in English for an English locale', async () => {
    await run('en-US');
    expect(await labels()).toEqual(
      sorted([
        { name: 'Bug', color: 'red' },
        { name: 'Feature', color: 'blue' },
        { name: 'Improvement', color: 'green' },
        { name: 'Docs', color: 'gray' },
        { name: 'UX', color: 'purple' },
        { name: 'Performance', color: 'orange' },
        { name: 'Security', color: 'yellow' },
        { name: 'Frontend', color: 'blue' },
        { name: 'Backend', color: 'purple' },
      ]),
    );
  });

  it('names them in English without a configured locale', async () => {
    await run(undefined);
    expect((await labels()).map((label) => label.name)).toContain('Feature');
  });

  it('adds nothing when run again and keeps a label that already has a preset name', async () => {
    const now = new Date();
    await h.database
      .connection()
      .repository('pmLabels')
      .createOne({
        values: {
          id: 'existing-bug',
          name: 'Bug',
          color: 'gray',
          createdAt: now,
          updatedAt: now,
        },
      });
    await run('en-US');
    await run('en-US');
    const rows = await labels();
    expect(rows).toHaveLength(9);
    expect(rows.find((label) => label.name === 'Bug')).toEqual({
      name: 'Bug',
      color: 'gray',
    });
  });
});
