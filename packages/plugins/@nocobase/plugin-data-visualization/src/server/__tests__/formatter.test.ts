import { vi } from 'vitest';
import { dateFormatFn } from '../actions/formatter';

describe('formatter', () => {
  const field = 'field';
  const format = 'YYYY-MM-DD hh:mm:ss';
  describe('dateFormatFn', () => {
    it('should return correct format for sqlite', () => {
      const sequelize = {
        fn: vi.fn().mockImplementation((fn: string, format: string, field: string) => ({
          fn,
          format,
          field,
        })),
        col: vi.fn().mockImplementation((field: string) => field),
      };
      const dialect = 'sqlite';
      const result = dateFormatFn(sequelize, dialect, field, format);
      expect(result.format).toEqual('%Y-%m-%d %H:%M:%S');
    });

    it('should return correct format for mysql', () => {
      const sequelize = {
        fn: vi.fn().mockImplementation((fn: string, field: string, format: string) => ({
          fn,
          format,
          field,
        })),
        col: vi.fn().mockImplementation((field: string) => field),
      };
      const dialect = 'mysql';
      const result = dateFormatFn(sequelize, dialect, field, format);
      expect(result.format).toEqual('%Y-%m-%d %H:%i:%S');
    });

    it('should return correct format for postgres', () => {
      const sequelize = {
        fn: vi.fn().mockImplementation((fn: string, field: string, format: string) => ({
          fn,
          format,
          field,
        })),
        col: vi.fn().mockImplementation((field: string) => field),
      };
      const dialect = 'postgres';
      const result = dateFormatFn(sequelize, dialect, field, format);
      expect(result.format).toEqual('YYYY-MM-DD HH24:MI:SS');
    });
  });
});
