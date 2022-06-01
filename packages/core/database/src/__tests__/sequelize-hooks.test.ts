import { Database } from '../database';
import { mockDatabase } from './index';

// TODO
describe('sequelize-hooks', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('afterSync', () => {
    test('singular name', async () => {
      const collection = db.collection({
        name: 't_test',
      });
      const spy = jest.fn();
      db.on('t_test.afterSync', () => {
        spy('afterSync');
      });
      await collection.sync();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('plural name', async () => {
      const collection = db.collection({
        name: 't_tests',
      });
      const spy = jest.fn();
      db.on('t_tests.afterSync', () => {
        spy('afterSync');
      });
      await collection.sync();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
