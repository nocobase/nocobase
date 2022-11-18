import { Application } from '@nocobase/server';
import config from './config';

const app = new Application(config);

app.command('sync-inherits').action(async () => {
  const transaction = await app.db.sequelize.transaction();

  const collections = await app.db.getCollection('collections').repository.find({
    transaction,
  });

  for (const collection of collections) {
    const parentsQuery = await app.db.sequelize.query(
      `
    SELECT pg_inherits.*, c.relname AS child, p.relname AS parent
    FROM
    pg_inherits JOIN pg_class AS c ON (inhrelid=c.oid)
    JOIN pg_class as p ON (inhparent=p.oid)
    WHERE c.relname = '${collection.name}'
    `,
      {
        transaction,
      },
    );

    const parents = parentsQuery[0].map((record) => record['parent']);
    if (parents.length > 0) {
      collection.set('inherits', parents);
      await collection.save({
        transaction,
      });
      app.log.info(`collection ${collection.name} inherits ${parents.join(',')}`);
    }
  }

  await transaction.commit();
  await app.stop();
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
