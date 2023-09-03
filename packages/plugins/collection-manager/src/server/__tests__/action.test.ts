import { Database, Repository } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import { createApp } from '.';
import Plugin from '../';

describe('action test', () => {
  let db: Database;
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get uiSchema', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    await db.getRepository('fields').create({
      values: {
        name: 'title',
        collectionName: 'posts',
        type: 'string',
        uiSchema: {
          'x-uid': 'test',
        },
      },
    });

    // @ts-ignore
    await db.getRepository('collections').load();
    await db.sync();

    const response = await app
      .agent()
      .resource('collections.fields', 'posts')
      .list({
        pageSize: 5,
        sort: ['sort'],
      });

    expect(response.statusCode).toEqual(200);
    const data = response.body.data;

    expect(data[0].uiSchema).toMatchObject({
      'x-uid': 'test',
    });
  });
});

describe('collection list by role', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let adminAgent: any;

  beforeAll(async () => {
    app = mockServer({
      plugins: ['acl', 'users', 'error-handler', 'auth'],
    });
    app.plugin(Plugin);
    await app.loadAndInstall({ clean: true });
    db = app.db;
    repo = db.getRepository('rolesResources');

    const userRepo = db.getRepository('users');
    const admin = await userRepo.create({
      values: {
        roles: ['admin'],
      },
    });
    adminAgent = app.agent().login(admin);
  });

  afterEach(async () => {
    await repo.destroy({ truncate: true });
  });

  it('should list collections by role', async () => {
    await repo.create({
      values: {
        name: 'users',
        roleName: 'admin',
        usingActionsConfig: true,
      },
    });
    await repo.update({
      filter: {
        name: 'users',
        roleName: 'admin',
      },
      values: {
        actions: [],
      },
    });

    const res = await adminAgent
      .get('/collections:listByRole?paginate=false&appends[]=fields')
      .set({
        'X-Role': 'admin',
      })
      .send();
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
    const users = res.body.data.find((item: any) => item.name === 'users');
    expect(users).toBeUndefined();
  });

  it('should list collections and fields by role', async () => {
    await repo.create({
      values: {
        name: 'users',
        roleName: 'admin',
        usingActionsConfig: true,
      },
    });
    await repo.update({
      filter: {
        name: 'users',
        roleName: 'admin',
      },
      values: {
        actions: [
          {
            name: 'view',
            fields: ['id', 'username', 'roles'],
          },
        ],
      },
    });

    const res = await adminAgent
      .get('/collections:listByRole?paginate=false&appends[]=fields')
      .set({
        'X-Role': 'admin',
      })
      .send();
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
    const users = res.body.data.find((item: any) => item.name === 'users');
    expect(users).toBeDefined();
    expect(users.fields).toBeDefined();
    expect(users.fields.length).toBe(3);
  });
});
