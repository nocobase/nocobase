import { RecordV2 } from '../../../../data-source/record/Record';

describe('Record', () => {
  test('should works', () => {
    const record = new RecordV2<{ id: number }, { name: string }>({ data: { id: 1 } });
    expect(record.data.id).toBe(1);

    record.setData({ id: 2 });
    expect(record.data.id).toBe(2);

    record.setParentRecord(new RecordV2({ data: { name: 'a' } }));
    expect(record.parentRecord.data.name).toBe('a');
  });
});
