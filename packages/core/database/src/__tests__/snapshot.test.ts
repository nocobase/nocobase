import { Database } from '../database';
import { mockDatabase } from './index';
import { cleanupSnapshots } from '../snapshot';

describe('snapshot test', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    cleanupSnapshots(db);
  });

  afterEach(async () => {
    await db.close();
  });

  describe('test skip model sync', () => {
    it('should not skip model sync for the first time', async () => {
      const collection = db.collection({
        name: 't_test',
      });

      const spy = jest.fn();
      db.on('t_test.afterSync', () => {
        spy('afterSync');
      });

      await db.sync();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should skip model sync for the second time without change', async () => {
      const collection = db.collection({
        name: 't_test',
      });
      await db.sync();

      const spy = jest.fn();
      db.on('t_test.afterSync', () => {
        spy('afterSync');
      });

      await db.sync();
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should not skip model sync with option force is true without change', async () => {
      const collection = db.collection({
        name: 't_test',
      });
      await db.sync();

      const spy = jest.fn();
      db.on('t_test.afterSync', () => {
        spy('afterSync');
      });

      await db.sync({ force: true });
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not skip model sync with field change', async () => {
      const collection = db.collection({
        name: 't_test',
      });
      await db.sync();

      const spy = jest.fn();
      db.on('t_test.afterSync', () => {
        spy('afterSync');
      });

      collection.setField('test', {
        type: 'string',
      });

      await db.sync();
      expect(spy).toHaveBeenCalledTimes(1);

      collection.removeField('test');

      await db.sync();
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should not skip model sync with index change', async () => {
      const collection = db.collection({
        name: 't_test',
      });
      collection.setField('test', {
        type: 'string',
      });
      await db.sync();

      const spy = jest.fn();
      db.on('t_test.afterSync', () => {
        spy('afterSync');
      });

      collection.addIndex({
        fields: ['test'],
        unique: true
      });

      await db.sync();
      expect(spy).toHaveBeenCalledTimes(1);

      collection.removeIndex(['test']);

      await db.sync();
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});