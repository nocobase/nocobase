import { afterEach, describe, expect, it } from 'vitest';
import { idGeneratorToken } from '@nocobase/app-server';
import { ServiceContainer } from '@nocobase/service-provider';
import type { DatabaseConnection, SeedContext } from '@nocobase/db';
import { seedSkill } from '../server/index.js';
import { createHarness, skillMd, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  await h?.close();
});
const container = new ServiceContainer();
let nextId = 0;
container.instance(idGeneratorToken, {
  generate: () => ++nextId,
  generateString: () => `seed-${++nextId}`,
});
const context = (
  conn: DatabaseConnection,
  freshInstall: boolean,
): SeedContext => ({
  repository: (name) => conn.repository(name),
  query: conn.query,
  connection: conn as unknown as SeedContext['connection'],
  config: { get: () => undefined },
  container,
  freshInstall,
});
const content = skillMd('installed-method', 'A bundled method.');

describe('transactional skill installation', () => {
  it('creates an editable library version and a fresh-install global attachment', async () => {
    h = await createHarness();
    const result = await h.database
      .connection()
      .transaction((conn) =>
        seedSkill(context(conn, true), { content, globalDefault: true }),
      );
    expect(result.created).toBe(true);
    expect(
      await h.services.skills.attached({ scope: 'global', scopeId: 'default' }),
    ).toEqual([result.id]);
    const current = await h.services.skills.get(result.id);
    expect(current).toMatchObject({ version: 1, content, files: [] });
    await h.services.skills.save(result.id, 'alice', {
      content: content + '\nEdited online.',
      files: [],
      expectedRevision: 1,
    });
    const before = await h.services.skills.get(result.id);
    const history = await h.services.skills.versions(result.id);
    await h.services.skills.attach({ scope: 'global', scopeId: 'default' }, []);
    expect(
      await seedSkill(context(h.database.connection(), true), {
        content,
        globalDefault: true,
      }),
    ).toEqual({ id: result.id, created: false });
    expect(await h.services.skills.get(result.id)).toEqual({
      ...before,
      attachments: [],
    });
    expect(await h.services.skills.versions(result.id)).toEqual(history);
  });

  it('does not attach new skills on an upgrade and rolls every write back with the caller', async () => {
    h = await createHarness();
    const conn = h.database.connection();
    await expect(
      conn.transaction(async (trx) => {
        await seedSkill(context(trx, true), { content, globalDefault: true });
        throw new Error('Abort installation');
      }),
    ).rejects.toThrow('Abort installation');
    expect(await h.services.skills.list()).toEqual([]);
    expect(
      await h.services.skills.attached({ scope: 'global', scopeId: 'default' }),
    ).toEqual([]);
    await seedSkill(context(conn, false), { content, globalDefault: true });
    expect(
      await h.services.skills.attached({ scope: 'global', scopeId: 'default' }),
    ).toEqual([]);
  });

  it('uses the ordinary front matter validation before creating a record', async () => {
    h = await createHarness();
    await expect(
      seedSkill(context(h.database.connection(), true), {
        content: 'Invalid markdown',
      }),
    ).rejects.toThrow('SKILL.md');
    expect(await h.services.skills.list()).toEqual([]);
  });
});
