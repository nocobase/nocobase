/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Snowflake } from '../snowflake-id';

describe('Snowflake', () => {
  it('should generate a numeric ID', () => {
    const sf = new Snowflake({ workerId: 1 });
    const id = sf.generate();
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('should generate unique IDs within the same second', () => {
    const sf = new Snowflake({ workerId: 1 });
    const ids = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const id = sf.generate();
      ids.add(id);
    }
    expect(ids.size).toBe(1000);
  });

  it('should increment sequence within the same second', () => {
    const sf = new Snowflake({ workerId: 2 });
    const id1 = sf.generate();
    const id2 = sf.generate();
    const parsed1 = sf.parse(id1);
    const parsed2 = sf.parse(id2);

    expect(parsed2.sequence).toBe(parsed1.sequence + 1);
    expect(parsed2.workerId).toBe(2);
  });

  it('should produce larger IDs in later seconds', async () => {
    const sf = new Snowflake({ workerId: 3 });
    const id1 = sf.generate();
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const id2 = sf.generate();

    expect(id2).toBeGreaterThan(id1);
  });

  it('should parse ID back to components', () => {
    const sf = new Snowflake({ workerId: 4 });
    const id = sf.generate();
    const parsed = sf.parse(id);

    expect(parsed.id).toBe(id);
    expect(parsed.workerId).toBe(4);
    expect(typeof parsed.timestamp).toBe('number');
    expect(typeof parsed.sequence).toBe('number');
  });

  it('should accept epoch in seconds', () => {
    const sf = new Snowflake({ workerId: 0 });
    const id = sf.generate();
    const parsed = sf.parse(id);

    expect(parsed.timestamp).toBeGreaterThanOrEqual(1605024000);
  });

  it('should accept epoch in milliseconds', () => {
    const sf = new Snowflake({ workerId: 0 });
    const id = sf.generate();
    const parsed = sf.parse(id);

    expect(parsed.timestamp).toBeGreaterThanOrEqual(1605024000);
  });

  it('should generate unique IDs across multiple workers', () => {
    const sf1 = new Snowflake({ workerId: 1 });
    const sf2 = new Snowflake({ workerId: 2 });

    const id1 = sf1.generate();
    const id2 = sf2.generate();

    expect(id1).not.toBe(id2);
    expect(sf1.parse(id1).workerId).toBe(1);
    expect(sf2.parse(id2).workerId).toBe(2);
  });

  it('should throw error for invalid workerId', () => {
    expect(() => new Snowflake({ workerId: -1 })).toThrow();
    expect(() => new Snowflake({ workerId: 32 })).toThrow();
  });
});
