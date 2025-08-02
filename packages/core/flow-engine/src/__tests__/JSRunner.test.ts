/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JSRunner } from '../JSRunner';

describe('JSRunner', () => {
  it('should run simple code successfully', async () => {
    const runner = new JSRunner();
    const result = await runner.run(`
      const x = 10;
      return x + 5;    
    `);
    expect(result.success).toBe(true);
    expect(result.value).toBe(15);
  });

  it('should handle syntax errors in the code', async () => {
    const runner = new JSRunner();
    const result = await runner.run('const x = 10 x + 5;'); // Syntax error
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(SyntaxError);
  });

  it('should handle runtime errors in the code', async () => {
    const runner = new JSRunner();
    const result = await runner.run(`
      const x = 10;
      throw new Error('Test error');
    `);
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Test error');
  });

  it('should handle timeout errors', async () => {
    const runner = new JSRunner({ timeoutMs: 100 }); // Set a short timeout
    const result = await runner.run(`
      await new Promise(resolve => setTimeout(resolve, 500)); // Exceeds timeout
      return 'Done';
    `);
    console.log(result);
    expect(result.success).toBe(false);
    expect(result.timeout).toBe(true);
    expect(result.error.message).toBe('Execution timed out');
  });

  it('should use registered globals', async () => {
    const runner = new JSRunner();
    runner.register('globalVar', 42);
    const result = await runner.run(`
      return globalVar + 8;
    `);
    expect(result.success).toBe(true);
    expect(result.value).toBe(50);
  });

  it('should handle code with async/await', async () => {
    const runner = new JSRunner();
    const result = await runner.run(`
      const fetchData = async () => {
        return new Promise(resolve => setTimeout(() => resolve(100), 50));
      };
      const data = await fetchData();
      return data + 50;
    `);
    expect(result.success).toBe(true);
    expect(result.value).toBe(150);
  });

  it('should handle empty code', async () => {
    const runner = new JSRunner();
    const result = await runner.run('');
    expect(result.success).toBe(true);
    expect(result.value).toBe(undefined);
  });

  it('should handle code returning undefined explicitly', async () => {
    const runner = new JSRunner();
    const result = await runner.run(`
      const x = 10;
      return undefined;
    `);
    expect(result.success).toBe(true);
    expect(result.value).toBe(undefined);
  });
});
