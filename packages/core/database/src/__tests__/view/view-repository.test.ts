import { Database, mockDatabase } from '@nocobase/database';
import { uid } from '@nocobase/utils';

describe('view repository', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      tablePrefix: '',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should support find view without primary key', async () => {
    const viewName = `t_${uid(6)}`;
    const dropSQL = `DROP VIEW IF EXISTS ${viewName};`;
    await db.sequelize.query(dropSQL);

    const viewSQL = `CREATE VIEW ${viewName} AS
     WITH RECURSIVE numbers (number) AS (
  SELECT 1
  UNION ALL

  SELECT number + 1
  FROM numbers
  WHERE number < 100
)
SELECT * FROM numbers`;

    await db.sequelize.query(viewSQL);

    const viewCollection = db.collection({
      name: viewName,
      view: true,
      fields: [
        {
          type: 'integer',
          name: 'number',
        },
      ],
    });

    const results = await viewCollection.repository.findAndCount({
      offset: 20,
      limit: 10,
    });

    console.log({ results });
  });
});
