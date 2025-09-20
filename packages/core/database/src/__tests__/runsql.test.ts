/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

describe('runSQL', function () {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    // Create test table
    const Test = db.collection({
      name: 'test',
      timestamps: false,
      fields: [
        { type: 'integer', name: 'num' },
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await Test.sync();

    // Insert test data
    await db.getRepository('test').create({
      values: [
        { num: 1, name: 'Alice', age: 25 },
        { num: 2, name: 'Bob', age: 30 },
        { num: 3, name: 'Charlie', age: 35 },
      ],
    });
    if (db.isPostgresCompatibleDialect()) {
      if (db.options.schema) {
        await db.runSQL(`SET search_path TO ${db.options.schema}`);
      }
    }
  });

  afterEach(async () => {
    await db.close();
  });

  describe('basic queries', () => {
    test('should execute simple SELECT query', async () => {
      const result = await db.runSQL(`SELECT * FROM test ORDER BY num`);
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ num: 1, name: 'Alice', age: 25 });
    });

    test('should execute COUNT query', async () => {
      const result = await db.runSQL(`SELECT COUNT(*) as total FROM test`);
      expect(result).toHaveLength(1);
      expect(result[0].total).toBe(3);
    });
  });

  describe('parameter binding', () => {
    test('should bind parameters using object format', async () => {
      const result = await db.runSQL('SELECT * FROM test WHERE num = $num', { bind: { num: 2 } });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ num: 2, name: 'Bob' });
    });

    test('should bind parameters using array format', async () => {
      const result = await db.runSQL('SELECT * FROM test WHERE age > $1 AND name = $2', { bind: [25, 'Bob'] });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: 'Bob', age: 30 });
    });

    test('should bind multiple named parameters', async () => {
      const result = await db.runSQL('SELECT * FROM test WHERE age BETWEEN $minAge AND $maxAge', {
        bind: { minAge: 25, maxAge: 30 },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('return type control', () => {
    test('should return single value when type is selectVar', async () => {
      const result = await db.runSQL('SELECT COUNT(*) as total FROM test', { type: 'selectVar' });
      expect(typeof result).toBe('number');
      expect(result).toBe(3);
    });

    test('should return single row when type is selectRow', async () => {
      const result = await db.runSQL('SELECT * FROM test WHERE num = 1', { type: 'selectRow' });
      expect(result).toMatchObject({ num: 1, name: 'Alice', age: 25 });
    });

    test('should return multiple rows when type is selectRows (default)', async () => {
      const result = await db.runSQL('SELECT * FROM test ORDER BY num', { type: 'selectRows' });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });

    test('should return null when selectRow finds no results', async () => {
      const result = await db.runSQL('SELECT * FROM test WHERE num = 999', { type: 'selectRow' });
      expect(result).toBeNull();
    });

    test('should return empty array when selectRows finds no results', async () => {
      const result = await db.runSQL('SELECT * FROM test WHERE num = 999', { type: 'selectRows' });
      expect(result).toEqual([]);
    });
  });

  describe('filter support', () => {
    test('should apply basic filter', async () => {
      const result = await db.runSQL('SELECT * FROM test', {
        filter: {
          age: { $gt: 25 },
        },
      });
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.age > 25)).toBe(true);
    });

    test('should apply complex filter with AND condition', async () => {
      const result = await db.runSQL('SELECT * FROM test', {
        filter: {
          $and: [{ age: { $gte: 25 } }, { name: { $ne: 'Charlie' } }],
        },
      });
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.name !== 'Charlie')).toBe(true);
    });

    test('should append filter to existing WHERE clause', async () => {
      const result = await db.runSQL('SELECT * FROM test WHERE num > 1', {
        filter: {
          age: { $lt: 35 },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: 'Bob', age: 30 });
    });

    test('should add WHERE clause when none exists', async () => {
      const result = await db.runSQL('SELECT * FROM test ORDER BY num', {
        filter: {
          age: 30,
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: 'Bob', age: 30 });
    });

    test('should handle filter with ORDER BY clause', async () => {
      const result = await db.runSQL('SELECT * FROM test ORDER BY age DESC', {
        filter: {
          age: { $gte: 30 },
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ name: 'Charlie', age: 35 });
      expect(result[1]).toMatchObject({ name: 'Bob', age: 30 });
    });

    test('should handle filter with GROUP BY clause', async () => {
      const result = await db.runSQL('SELECT age, COUNT(*) as count FROM test GROUP BY age', {
        filter: {
          age: { $gte: 30 },
        },
      });
      expect(result).toHaveLength(2);
      expect(result.some((item) => item.age === 30 && item.count === 1)).toBe(true);
      expect(result.some((item) => item.age === 35 && item.count === 1)).toBe(true);
    });

    test('should handle filter with HAVING clause', async () => {
      const result = await db.runSQL('SELECT age, COUNT(*) as count FROM test GROUP BY age HAVING COUNT(*) > 0', {
        filter: {
          age: { $lt: 35 },
        },
      });
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.age < 35)).toBe(true);
    });

    test('should handle filter with LIMIT clause', async () => {
      const result = await db.runSQL('SELECT * FROM test LIMIT 2', {
        filter: {
          age: { $gte: 25 },
        },
      });
      expect(result).toHaveLength(2);
    });

    test('should handle filter with multiple clauses', async () => {
      const result = await db.runSQL('SELECT * FROM test ORDER BY age DESC LIMIT 2', {
        filter: {
          age: { $gte: 25 },
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].age).toBeGreaterThanOrEqual(result[1].age);
    });

    test('should handle filter with existing WHERE and ORDER BY', async () => {
      const result = await db.runSQL('SELECT * FROM test WHERE num > 1 ORDER BY age', {
        filter: {
          name: { $ne: 'Charlie' },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: 'Bob', age: 30 });
    });

    test('should handle filter with SQL ending with semicolon', async () => {
      const result = await db.runSQL('SELECT * FROM test;', {
        filter: {
          age: 30,
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: 'Bob', age: 30 });
    });

    test('should handle filter with SQL ending with semicolon and ORDER BY', async () => {
      const result = await db.runSQL('SELECT * FROM test ORDER BY num;', {
        filter: {
          age: { $gte: 30 },
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ name: 'Bob', age: 30 });
      expect(result[1]).toMatchObject({ name: 'Charlie', age: 35 });
    });
  });

  describe('SQL clause parsing', () => {
    test('should correctly identify WHERE clause with case variations', async () => {
      const result = await db.runSQL('SELECT * FROM test where num > 1', {
        filter: {
          age: { $lt: 35 },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: 'Bob', age: 30 });
    });

    test('should handle multiple spaces between keywords', async () => {
      const result = await db.runSQL('SELECT   *   FROM   test   ORDER   BY   num', {
        filter: {
          age: 30,
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: 'Bob', age: 30 });
    });

    test('should handle newlines in SQL', async () => {
      const result = await db.runSQL(
        `
        SELECT *
        FROM test
        ORDER BY num
      `,
        {
          filter: {
            age: { $gte: 30 },
          },
        },
      );
      expect(result).toHaveLength(2);
    });

    test('should handle complex SQL with subquery', async () => {
      const result = await db.runSQL('SELECT * FROM test WHERE age >= (SELECT AVG(age) FROM test) ORDER BY num', {
        filter: {
          name: { $ne: 'Charlie' },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: 'Bob', age: 30 });
    });
  });

  describe('combined parameters', () => {
    test('should work with parameter binding + filter + return type', async () => {
      const result = await db.runSQL('SELECT * FROM test WHERE name = $name', {
        bind: { name: 'Bob' },
        filter: { age: { $gte: 25 } },
        type: 'selectRow',
      });
      expect(result).toMatchObject({ name: 'Bob', age: 30 });
    });

    test('should work with array parameters + filter', async () => {
      const result = await db.runSQL('SELECT name, COUNT(*) as total FROM test WHERE age > $1 GROUP BY name', {
        bind: [20],
        filter: { name: { $in: ['Alice', 'Bob'] } },
        type: 'selectRows',
      });
      expect(result).toMatchObject([{ name: 'Alice' }, { name: 'Bob' }]);
    });
  });

  describe('transaction support', () => {
    test('should execute SQL within transaction', async () => {
      const transaction = await db.sequelize.transaction();

      try {
        // Insert data within transaction
        await db.runSQL('INSERT INTO test (num, name, age) VALUES ($num, $name, $age)', {
          bind: { num: 4, name: 'David', age: 40 },
          transaction,
        });

        // Query data within transaction
        const result = await db.runSQL('SELECT COUNT(*) as total FROM test', {
          type: 'selectVar',
          transaction,
        });

        expect(result).toBe(4);

        await transaction.rollback();

        // Verify data was not committed after rollback
        const finalCount = await db.runSQL('SELECT COUNT(*) as total FROM test', { type: 'selectVar' });
        expect(finalCount).toBe(3);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  });

  describe('error handling', () => {
    test('should throw error for invalid SQL syntax', async () => {
      await expect(
        db.runSQL('SELECT * FORM test'), // Intentional typo in FROM
      ).rejects.toThrow();
    });

    test('should throw error for non-existent table', async () => {
      await expect(db.runSQL('SELECT * FROM nonexistent_table')).rejects.toThrow();
    });

    test('should throw error for mismatched parameter binding', async () => {
      await expect(
        db.runSQL(
          'SELECT * FROM test WHERE num = $invalidParam',
          { bind: { num: 1 } }, // Parameter name mismatch
        ),
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    test('should throw error for empty SQL string', async () => {
      await expect(db.runSQL('')).rejects.toThrow();
    });

    test('should throw error for whitespace-only SQL', async () => {
      await expect(db.runSQL('   ')).rejects.toThrow();
    });

    test('should work with empty parameter binding', async () => {
      const result = await db.runSQL('SELECT * FROM test ORDER BY num', { bind: {} });
      expect(result).toHaveLength(3);
    });

    test('should work with empty filter', async () => {
      const result = await db.runSQL('SELECT * FROM test ORDER BY num', { filter: {} });
      expect(result).toHaveLength(3);
    });

    test('should handle null values in results', async () => {
      await db.runSQL('INSERT INTO test (num, name) VALUES (4, NULL)');
      const result = await db.runSQL('SELECT * FROM test WHERE num = 4', { type: 'selectRow' });
      expect(result.name).toBeNull();
    });

    test('should work with mixed parameter types', async () => {
      const result = await db.runSQL('SELECT * FROM test WHERE num = $1 AND age > $2', {
        bind: [2, 25],
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ num: 2, name: 'Bob', age: 30 });
    });
  });
});

describe('runSQL + underscored=false', function () {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({
      underscored: true,
    });
    await db.clean({ drop: true });

    // Create test table
    const Test = db.collection({
      name: 'aTest',
      timestamps: false,
      underscored: false,
      fields: [
        { type: 'integer', name: 'aNum' },
        { type: 'string', name: 'aName' },
        { type: 'integer', name: 'aAge' },
      ],
    });

    await Test.sync();

    // Insert test data
    await db.getRepository('aTest').create({
      values: [
        { aNum: 1, aName: 'Alice', aAge: 25 },
        { aNum: 2, aName: 'Bob', aAge: 30 },
        { aNum: 3, aName: 'Charlie', aAge: 35 },
      ],
    });

    if (db.isPostgresCompatibleDialect()) {
      if (db.options.schema) {
        await db.runSQL(`SET search_path TO ${db.options.schema}`);
      }
    }
  });

  afterEach(async () => {
    await db.close();
  });

  describe('basic queries', () => {
    test('should execute simple SELECT query', async () => {
      const aTest = db.quoteIdentifier('aTest');
      const aNum = db.quoteIdentifier('aNum');
      const result = await db.runSQL(`SELECT * FROM ${aTest} ORDER BY ${aNum}`);
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ aNum: 1, aName: 'Alice', aAge: 25 });
    });
    test('should apply complex filter with AND condition', async () => {
      const aTest = db.quoteIdentifier('aTest');
      const result = await db.runSQL(`SELECT * FROM ${aTest}`, {
        filter: {
          $and: [{ aAge: { $gte: 25 } }, { aName: { $ne: 'Charlie' } }],
        },
      });
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.aName !== 'Charlie')).toBe(true);
    });
  });
});
