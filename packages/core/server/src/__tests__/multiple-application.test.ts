import { AppSupervisor } from '@nocobase/server';
import { mockServer, MockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import Application from '../application';

describe('multiple application', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer({
      acl: false,
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should add multiple apps', async () => {
    const sub1 = `a_${uid()}`;
    const sub2 = `a_${uid()}`;
    const sub3 = `a_${uid()}`;

    const subApp1 = new Application({
      database: app.db,
      acl: false,
      name: sub1,
    });

    subApp1.resourcer.define({
      name: 'test',
      actions: {
        async test(ctx) {
          ctx.body = sub1;
        },
      },
    });

    const subApp2 = new Application({
      database: app.db,
      acl: false,
      name: sub2,
    });

    subApp2.resourcer.define({
      name: 'test',
      actions: {
        async test(ctx) {
          ctx.body = sub2;
        },
      },
    });

    expect(AppSupervisor.getInstance().hasApp(sub1)).toBeTruthy();
    expect(AppSupervisor.getInstance().hasApp(sub2)).toBeTruthy();
    expect(AppSupervisor.getInstance().hasApp(sub3)).toBeFalsy();
  });
});
