import { MockServer } from '@nocobase/test';
import { createApp } from '../index';
import { uid } from '@nocobase/utils';

describe('view collection', () => {
  let app: MockServer;
  let agent;

  beforeEach(async () => {
    app = await createApp();
    agent = app.agent();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should list views', async () => {
    const viewName = `view_${uid(6)}`;
    const viewSQL = `CREATE OR REPLACE VIEW ${viewName} AS select 1+1 as result`;
    await app.db.sequelize.query(viewSQL);

    const response = await agent.resource('views').list();
    expect(response.status).toBe(200);
    expect(response.body.data.find((item) => item.viewname === viewName)).toBeTruthy();
  });
});
