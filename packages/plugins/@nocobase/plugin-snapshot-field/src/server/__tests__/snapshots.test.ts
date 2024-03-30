import { createMockServer, MockServer } from '@nocobase/test';
import { field_linkto } from './data/field_linkto';
import { field_m2m } from './data/field_m2m';
import { field_o2m } from './data/field_o2m';
import { field_o2o } from './data/field_o2o';
import { snap_linkto } from './data/snap_linkto';
import { snap_m2m } from './data/snap_m2m';
import { snap_o2m } from './data/snap_o2m';
import { snap_o2o } from './data/snap_o2o';
import { table_a } from './data/table_a';
import { table_b } from './data/table_b';
import { table_m2m } from './data/table_m2m';

describe('actions', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: false,
      plugins: ['error-handler', 'users', 'ui-schema-storage', 'collection-manager', 'snapshot-field'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('associations save', async () => {
    const agent = app.agent();

    await agent.resource('collections').create({
      values: table_a,
    });

    await agent.resource('collections').create({
      values: table_b,
    });

    await agent.resource('collections').create({
      values: table_m2m,
    });

    await agent.resource('fields').create({
      values: field_o2m,
    });

    await agent.resource('fields').create({
      values: field_m2m,
    });

    await agent.resource('fields').create({
      values: field_o2o,
    });

    await agent.resource('fields').create({
      values: field_linkto,
    });

    await agent.resource('fields').create({
      values: snap_o2m,
    });

    await agent.resource('fields').create({
      values: snap_m2m,
    });

    await agent.resource('fields').create({
      values: snap_o2o,
    });

    await agent.resource('fields').create({
      values: snap_linkto,
    });

    await agent.resource('table_a').create({
      values: {},
    });

    await agent.resource('table_b').create({
      values: {
        field_o2m: [{ createdById: 1, id: 1, fk_table_b: null }],
        field_m2m: [{ createdById: 1, id: 1, fk_table_b: null }],
        field_o2o: { createdById: 1, id: 1, fk_table_b: null },
        field_linkto: [{ createdById: 1, id: 1, fk_table_b: null }],
      },
    });

    const res = await agent.resource('table_b').list();
    const { snap_o2o: o2o, snap_m2m: m2m, snap_o2m: o2m, snap_linkto: linkto } = res.body.data[0];

    const snapshotItem = { createdById: null, id: 1, fk_table_b: 1 };

    expect(o2o).toMatchObject({
      collectionName: 'table_b',
      data: snapshotItem,
    });
    expect(m2m).toMatchObject({
      collectionName: 'table_b',
      data: [snapshotItem],
    });
    expect(o2m).toMatchObject({
      collectionName: 'table_b',
      data: [snapshotItem],
    });
    expect(linkto).toMatchObject({
      collectionName: 'table_b',
      data: [snapshotItem],
    });

    await agent.resource('table_a').create({
      values: {},
    });

    await agent.resource('collections.fields', 'table_b').destroy({ filter: { name: 'field_o2m' } });

    const { statusCode: code2 } = await agent.resource('table_b').create({
      values: {
        field_m2m: [{ createdById: 1, id: 2, fk_table_b: null }],
        field_o2o: { createdById: 1, id: 2, fk_table_b: null },
        field_linkto: [{ createdById: 1, id: 2, fk_table_b: null }],
      },
    });

    expect(code2).toBe(200);

    const { statusCode: code3 } = await agent
      .resource('collections.fields', 'table_a')
      .destroy({ filter: { name: 'createdBy' } });

    expect(code3).toBe(200);

    const { statusCode: code4 } = await agent.resource('table_a').create({
      values: {},
    });

    expect(code4).toBe(200);

    const { statusCode: code5 } = await agent.resource('table_b').create({
      values: {
        field_m2m: [{ createdById: 1, id: 3, fk_table_b: null }],
        field_o2o: { createdById: 1, id: 3, fk_table_b: null },
        field_linkto: [{ createdById: 1, id: 3, fk_table_b: null }],
      },
    });

    expect(code5).toBe(200);
  });
});
