import { mockDatabase } from '../';
import { Database } from '../../database';
import { Repository } from '../../repository';
describe('time field', () => {
  let db: Database;
  let repository: Repository;

  beforeEach(async () => {
    db = mockDatabase();
    db.collection({
      name: 'tests',
      fields: [{ name: 'date1', type: 'date' }],
    });
    await db.sync();
    repository = db.getRepository('tests');
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create time field with default value', async () => {
    const Test = db.collection({
      name: 'test',
      fields: [
        {
          name: 'date1',
          type: 'time',
          defaultValue: '{{$date.now}}',
        },
        {
          name: 'date2',
          type: 'time',
          defaultValue: '{{ $date.now }}',
        },
      ],
    });

    await db.sync();

    const t1 = await Test.repository.create({});
    expect(t1.get('date1')).toBeDefined();
    expect(t1.get('date2')).toBeDefined();
  });
});
