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

  it('should not allow to create collections when global allow create', async () => {
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
});
