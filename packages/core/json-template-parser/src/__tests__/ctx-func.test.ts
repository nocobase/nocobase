/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import get from 'lodash/get';
import { createJSONTemplateParser } from '../parser';
import { extractTemplateVariable } from '../utils';

const parser = createJSONTemplateParser();

describe('ctx function', () => {
  it('should handle basic context function', () => {
    const template = '{{}}';
    const variable = extractTemplateVariable(template);
    expect(variable).toBe(null);
  });

  it('should handle basic context function with state', async () => {
    const template = '{{$user.id}} - {{$user.name}}';
    const data = {
      async $user({ fields, context }) {
        if (context.state.userId) {
          return (field) => 1;
        } else return (field) => 2;
      },
      state: {
        userId: 1,
      },
    };
    const result = await parser.render(template, data, data);
    expect(result).toEqual('1 - 1');
  });

  it('should handle context function without state', async () => {
    const template = '{{$user.id}} - {{$user.name}}';
    const data = {
      $user({ fields, context }) {
        return (field) => 2;
      },
      state: {},
    };
    const result = await parser.render(template, data);
    expect(result).toEqual('2 - 2');
  });

  it('should handle nested context values', async () => {
    const template = '{{$user.profile.email}} - {{$user.profile.address.city}}';
    const data = {
      $user({ fields, context }) {
        return (field) => {
          const map = {
            'profile.email': 'test@example.com',
            'profile.address.city': 'New York',
          };
          return map[field] || null;
        };
      },
    };
    const result = await parser.render(template, data);
    expect(result).toEqual('test@example.com - New York');
  });

  it('should handle multiple context functions', async () => {
    const template = '{{$user.name}} works at {{$company.name}}';
    const data = {
      $user({ fields, context }) {
        return (field) => 'John';
      },
      $company({ fields, context }) {
        return (field) => 'NocoBase';
      },
    };
    const result = await parser.render(template, data);
    expect(result).toEqual('John works at NocoBase');
  });

  it('should handle undefined context values', async () => {
    const template = '{{$user.nonexistent}}';
    const data = {
      $user({ fields, context }) {
        return (field) => undefined;
      },
    };
    const result = await parser.render(template, data);
    expect(result).toBeUndefined();
  });

  it('should handle context function with array values', async () => {
    const template = '{{$user.roles[0]}} and {{$user.roles.1}}';
    const data = {
      $user({ fields, context }) {
        return (field) => {
          const data = { roles: ['admin', 'user'] };
          const result = get(data, field);
          return result;
        };
      },
    };
    const result = await parser.render(template, data);
    expect(result).toEqual('admin and user');
  });

  it('should escape array', async () => {
    const template = ' {{$user.id}} - {{$user.name}} ';

    const data = {
      $user({ fields, context }) {
        if (context.state.userId) {
          return (field) => 1;
        } else return (field) => 2;
      },
    };

    const context = {
      state: {
        userId: 1,
      },
    };
    const result = await parser.render(template, data, context);
    expect(result).toEqual(' 1 - 1 ');
  });
});
