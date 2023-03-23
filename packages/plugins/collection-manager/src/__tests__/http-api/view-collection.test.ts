import { MockServer } from '@nocobase/test';
import { createApp } from '../index';
import { uid } from '@nocobase/utils';

describe('view collection', () => {
  let app: MockServer;
  let agent;
  let testViewName;

  beforeEach(async () => {
    app = await createApp();
    agent = app.agent();
    testViewName = `view_${uid(6)}`;
    const viewSQL = `CREATE OR REPLACE VIEW ${testViewName} AS WITH RECURSIVE numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 20
)
SELECT * FROM numbers;
`;
    await app.db.sequelize.query(viewSQL);
  });

  afterEach(async () => {
    await app.db.sequelize.query(`DROP VIEW IF EXISTS ${testViewName}`);
    await app.destroy();
  });

  it('should list views', async () => {
    const response = await agent.resource('dbViews').list();
    expect(response.status).toBe(200);
    expect(response.body.data.find((item) => item.name === testViewName)).toBeTruthy();
  });

  it('should query views data', async () => {
    const response = await agent.resource('dbViews').query({
      filterByTk: testViewName,
      pageSize: 20,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(20);
  });

  it('should list views fields', async () => {
    const response = await agent.resource('dbViews').get({
      filterByTk: testViewName,
    });

    expect(response.status).toBe(200);
    const data = response.body.data;
    expect(data.fields.n.type).toBeTruthy();
  });
});
