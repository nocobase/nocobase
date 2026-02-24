import { describe, it, expect } from 'vitest';
import { parseFilter } from '../parseFilter';

describe('parseFilter', () => {
  it('should correctly parse string format filter conditions', () => {
    const filter = '{"name": "{{$name}}", "age": "{{$age}}"}';
    const ctx = {
      '{{$name}}': 'John',
      '{{$age}}': 30
    };

    const result = parseFilter(filter, ctx);

    expect(result).toEqual({
      name: 'John',
      age: 30
    });
  });

  it('should correctly parse object format filter conditions', () => {
    const filter = {
      name: '$name',
      age: '$age'
    };
    const ctx = {
      $name: 'John',
      $age: 30
    };

    const result = parseFilter(filter, ctx);

    expect(result).toEqual({
      name: 'John',
      age: 30
    });
  });

  it('should handle nested object format filter conditions', () => {
    const filter = {
      $and: [
        { name: '$name' },
        { age: { $gt: '$minAge' } }
      ]
    };
    const ctx = {
      $name: 'John',
      $minAge: 25
    };

    const result = parseFilter(filter, ctx);

    expect(result).toEqual({
      $and: [
        { name: 'John' },
        { age: { $gt: 25 } }
      ]
    });
  });

  it('should handle filter conditions with arrays', () => {
    const filter = {
      status: { $in: '$statuses' }
    };
    const ctx = {
      $statuses: ['active', 'pending']
    };

    const result = parseFilter(filter, ctx);

    expect(result).toEqual({
      status: { $in: ['active', 'pending'] }
    });
  });

  it('should handle variable names with special characters', () => {
    const filter = '{"email": "$user.email"}';
    const ctx = {
      '$user.email': 'john@example.com'
    };

    const result = parseFilter(filter, ctx);

    expect(result).toEqual({
      email: 'john@example.com'
    });
  });

  it('should keep original value when variable does not exist in context', () => {
    const filter = '{"name": "$name", "status": "$status"}';
    const ctx = {
      $name: 'John'
      // $status variable is not defined
    };

    const result = parseFilter(filter, ctx);

    expect(result).toEqual({
      name: 'John',
      status: '$status'
    });
  });

  it('should handle non-string types such as boolean and number', () => {
    const filter = {
      active: '$isActive',
      count: '$count'
    };
    const ctx = {
      $isActive: true,
      $count: 5
    };

    const result = parseFilter(filter, ctx);

    expect(result).toEqual({
      active: true,
      count: 5
    });
  });

  it('should handle empty object case', () => {
    const filter = {};
    const ctx = {
      $name: 'John'
    };

    const result = parseFilter(filter, ctx);

    expect(result).toEqual({});
  });

  it('should handle empty context case', () => {
    const filter = '{"name": "$name"}';
    const ctx = {};

    const result = parseFilter(filter, ctx);

    expect(result).toEqual({
      name: '$name'
    });
  });
});
