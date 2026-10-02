import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../../../helpers.js';

describeIntegrationDatabases('Repository hasOne nested create', (context) => {
  async function prepare(nullableForeignKey: boolean): Promise<void> {
    await context.builder.createCollections([
      {
        name: 'oneProfiles',
        definition: (c) => {
          c.string('code').primary().notNull();
          c.string('summary').notNull();
          c.string('tenant').nullable();
          if (nullableForeignKey) c.string('projectCode').nullable();
          else c.string('projectCode').notNull();
          c.unique(['projectCode']);
        },
      },
      {
        name: 'oneProjects',
        definition: (c) => {
          c.string('code').primary().notNull();
          c.string('name').notNull();
          c.hasOne('profile', 'oneProfiles')
            .sourceKey('code')
            .foreignKey('projectCode');
        },
      },
    ]);
    await context.database.repository('oneProjects').createOne({
      values: {
        code: 'P',
        name: 'Project',
        profile: { create: { code: 'OLD', summary: 'old', tenant: 'T2' } },
      },
    });
  }

  /** The caller may only reach profiles of `tenant`. */
  const scopedTo = (tenant: string) =>
    context.database.repository('oneProjects').withPolicy({
      read: { scope: true, fields: ['code'] },
      create: { scope: true },
      update: {
        scope: true,
        relations: {
          profile: {
            scope: { tenant },
            create: { fields: ['code', 'summary', 'tenant'] },
            connect: {},
          },
        },
      },
      delete: { scope: true },
    });

  const profiles = () =>
    context
      .db(context.table('oneProfiles'))
      .select('code', 'project_code')
      .orderBy('code');

  it('replaces the current target, detaching it before the new one is inserted', async () => {
    await prepare(true);

    await context.database.repository('oneProjects').updateOne({
      filter: { code: 'P' },
      values: { profile: { create: { code: 'NEW', summary: 'new' } } },
    });

    expect(await profiles()).toEqual([
      { code: 'NEW', project_code: 'P' },
      { code: 'OLD', project_code: null },
    ]);
  });

  it('refuses the replacement when the foreign key cannot be cleared, and writes nothing', async () => {
    await prepare(false);
    const before = await profiles();

    await expect(
      context.database.repository('oneProjects').updateOne({
        filter: { code: 'P' },
        values: { profile: { create: { code: 'NEW', summary: 'new' } } },
      }),
    ).rejects.toMatchObject({ code: 'RELATION_ACTION_NOT_ALLOWED' });

    expect(await profiles()).toEqual(before);
  });

  // Letting go of the current target is still reaching for a row, so the
  // relation scope has to locate it, as it does for clear and replace.
  it('refuses to replace a current target that lies outside the relation scope, and writes nothing', async () => {
    await prepare(true);
    const before = await profiles();

    await expect(
      scopedTo('T1').updateOne({
        filter: { code: 'P' },
        values: {
          profile: { create: { code: 'NEW', summary: 'new', tenant: 'T1' } },
        },
      }),
    ).rejects.toMatchObject({ code: 'RELATION_TARGET_NOT_FOUND' });

    await context.database.repository('oneProfiles').createOne({
      values: { code: 'NEW', summary: 'new', tenant: 'T1' },
    });
    await expect(
      scopedTo('T1').updateOne({
        filter: { code: 'P' },
        values: { profile: { connect: { code: 'NEW' } } },
      }),
    ).rejects.toMatchObject({ code: 'RELATION_TARGET_NOT_FOUND' });

    expect(await profiles()).toEqual([
      { code: 'NEW', project_code: null },
      ...before,
    ]);
  });

  it('replaces a current target the relation scope can locate', async () => {
    await prepare(true);

    await scopedTo('T2').updateOne({
      filter: { code: 'P' },
      values: {
        profile: { create: { code: 'NEW', summary: 'new', tenant: 'T2' } },
      },
    });

    expect(await profiles()).toEqual([
      { code: 'NEW', project_code: 'P' },
      { code: 'OLD', project_code: null },
    ]);
  });
});
