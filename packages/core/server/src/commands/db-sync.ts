import Application from '../application';

export default (app: Application) => {
  app
    .command('db:sync')
    .auth()
    .preload()
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;
      console.log('db sync...');

      const Collection = app.db.getCollection('collections');
      if (Collection) {
        // @ts-ignore
        await Collection.repository.load();
      }

      const force = false;
      await app.db.sync({
        force,
        alter: {
          drop: force,
        },
      });
    });
};
