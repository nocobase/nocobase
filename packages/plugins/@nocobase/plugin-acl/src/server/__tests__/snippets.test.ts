import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('snippet', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await prepareApp();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it.skip('should not allow to create collections when global allow create', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'testRole',
        strategy: { actions: ['view', 'update:own', 'destroy:own', 'create'] },
        snippets: ['!ui.*', '!pm', '!pm.*'],
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    const userPlugin: any = app.getPlugin('users');
    const userAgent: any = app.agent().login(user);
    const createCollectionResponse = await userAgent.resource('collections').create({});

    expect(createCollectionResponse.statusCode).toEqual(403);
  });

  it('should allowed when snippet not allowed but resource allowed', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'testRole',
        strategy: { actions: ['view'] },
        snippets: ['!ui.*', '!pm', '!pm.*'],
      },
    });

    const testUser = await app.db.getRepository('users').create({
      values: {
        roles: ['testRole'],
      },
    });

    const userAgent: any = app.agent().login(testUser);

    const listResp = await userAgent.resource('users').list();

    expect(listResp.statusCode).toEqual(200);
  });
});
