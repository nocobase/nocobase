import { isNewRecord, markRecordAsNew } from '../../collection-record/isNewRecord';

describe('recordUtilities', () => {
  let record: any;

  beforeEach(() => {
    record = {};
  });

  describe('isNewRecord', () => {
    it('should return false for a record that has not been marked as new', () => {
      expect(isNewRecord(record)).toBe(false);
    });

    it('should return true for a record that has been marked as new', () => {
      markRecordAsNew(record);
      expect(isNewRecord(record)).toBe(true);
    });

    it('should return false for non-object types', () => {
      expect(isNewRecord(null)).toBe(false);
      expect(isNewRecord(undefined)).toBe(false);
      // @ts-ignore
      expect(isNewRecord(42)).toBe(false);
      // @ts-ignore
      expect(isNewRecord('not an object')).toBe(false);
    });

    it('should not be fooled by properties that mimic the internal Symbol key', () => {
      const fakeKey = 'Symbol(isNewRecord)';
      record[fakeKey] = true;
      expect(isNewRecord(record)).toBe(false);
    });
  });

  describe('markRecordAsNew', () => {
    it('should mark an object as new', () => {
      const markedRecord = markRecordAsNew(record);
      expect(markedRecord).toBe(record);
      expect(isNewRecord(record)).toBe(true);
    });

    it('should not affect other properties of the object', () => {
      record.someProperty = 'some value';
      markRecordAsNew(record);
      expect(record.someProperty).toBe('some value');
    });

    it('should throw an error when trying to mark non-object types as new', () => {
      expect(() => markRecordAsNew(null)).toThrow();
      expect(() => markRecordAsNew(undefined)).toThrow();
      // @ts-ignore
      expect(() => markRecordAsNew(42)).toThrow();
      // @ts-ignore
      expect(() => markRecordAsNew('not an object')).toThrow();
    });
  });
});
