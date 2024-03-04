import { CollectionRecord } from '../../collection-record';

describe('Record', () => {
  test('should works', () => {
    const record = new CollectionRecord<{ id: number }, { name: string }>({ data: { id: 1 } });
    expect(record.data.id).toBe(1);

    record.setData({ id: 2 });
    expect(record.data.id).toBe(2);

    record.setParentRecord(new CollectionRecord({ data: { name: 'a' } }));
    expect(record.parentRecord.data.name).toBe('a');
  });
});
