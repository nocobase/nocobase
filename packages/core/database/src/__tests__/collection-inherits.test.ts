import { Collection } from '../collection';
import Database from '../database';
import { mockDatabase } from './index';

describe('collection inherits', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should inherit from Collection', async () => {
    const person = db.collection({
      name: 'person',
      fields: [{ name: 'name', type: 'string' }],
    });

    const student = db.collection({
      name: 'student',
      inherits: 'person',
    });

    await db.sync();

    const StudentRepository = student.repository;

    await StudentRepository.create({
      values: { name: 'student1' },
    });

    expect(await person.repository.count()).toBe(1);
  });
});
