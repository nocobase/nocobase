/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { describe, expect, it } from 'vitest';
import { getAccessibleAIEmployee, listAccessibleAIEmployees } from '../shared';

type Employee = {
  username: string;
  enabled: boolean;
  category: string;
  deprecated: boolean;
};

const employees: Employee[] = [
  { username: 'atlas', enabled: true, category: 'business', deprecated: false },
  { username: 'dex', enabled: true, category: 'business', deprecated: false },
  { username: 'finn', enabled: true, category: 'business', deprecated: false },
  { username: 'off', enabled: false, category: 'business', deprecated: false },
  { username: 'old', enabled: true, category: 'business', deprecated: true },
  { username: 'nathan', enabled: true, category: 'developer', deprecated: false },
];

// Minimal evaluation of the filter subset used here: plain keys (an array means "any of") and $and.
function matches(filter: Record<string, any>, row: Record<string, any>): boolean {
  return Object.entries(filter).every(([key, value]) => {
    if (key === '$and') {
      return (value as Record<string, any>[]).every((item) => matches(item, row));
    }
    return Array.isArray(value) ? value.includes(row[key]) : row[key] === value;
  });
}

// `grants` maps a role name to the employees an administrator granted to that role.
function createContext(currentRoles: string[], grants: Record<string, string[]>) {
  const repositories: Record<string, unknown> = {
    rolesAiEmployees: {
      find: async ({ filter }: { filter: { roleName: string[] } }) =>
        Object.entries(grants)
          .filter(([roleName]) => filter.roleName.includes(roleName))
          .flatMap(([roleName, usernames]) => usernames.map((aiEmployee) => ({ roleName, aiEmployee }))),
    },
    aiEmployees: {
      find: async ({ filter }: { filter: Record<string, any> }) => employees.filter((row) => matches(filter, row)),
      findOne: async ({ filter }: { filter: Record<string, any> }) =>
        employees.find((row) => matches(filter, row)) ?? null,
    },
  };
  return {
    state: { currentRoles },
    db: { getRepository: (name: string) => repositories[name] },
  } as unknown as Context;
}

const usernameOf = (employee: unknown) => (employee as Employee | null)?.username ?? null;

describe('getAccessibleAIEmployee', () => {
  const grants = { member: ['atlas', 'dex'], finance: ['finn'] };

  it('returns an employee granted to one of the caller roles', async () => {
    const ctx = createContext(['member'], grants);

    expect(usernameOf(await getAccessibleAIEmployee(ctx, 'dex'))).toBe('dex');
    expect(usernameOf(await getAccessibleAIEmployee(ctx, 'atlas'))).toBe('atlas');
  });

  it('does not resolve an enabled business employee that is not granted to the caller roles', async () => {
    const ctx = createContext(['member'], grants);

    expect(await getAccessibleAIEmployee(ctx, 'finn')).toBeNull();
  });

  it('combines the grants of all caller roles', async () => {
    const ctx = createContext(['member', 'finance'], grants);

    expect(usernameOf(await getAccessibleAIEmployee(ctx, 'finn'))).toBe('finn');
    expect(usernameOf(await getAccessibleAIEmployee(ctx, 'dex'))).toBe('dex');
  });

  it('resolves nothing when no employee is granted to the caller roles', async () => {
    const ctx = createContext(['guest'], grants);

    expect(await getAccessibleAIEmployee(ctx, 'dex')).toBeNull();
    expect(await getAccessibleAIEmployee(ctx, '__NO_ACCESSIBLE_AI_EMPLOYEE__')).toBeNull();
  });

  it('keeps the enabled, business and not-deprecated constraints on a granted employee', async () => {
    const ctx = createContext(['member'], { member: ['off', 'old', 'nathan', 'dex'] });

    expect(await getAccessibleAIEmployee(ctx, 'off')).toBeNull();
    expect(await getAccessibleAIEmployee(ctx, 'old')).toBeNull();
    expect(await getAccessibleAIEmployee(ctx, 'nathan')).toBeNull();
    expect(usernameOf(await getAccessibleAIEmployee(ctx, 'dex'))).toBe('dex');
  });

  it('rejects a username that is not a plain non-empty string', async () => {
    const ctx = createContext(['member'], grants);

    expect(await getAccessibleAIEmployee(ctx, '')).toBeNull();
    expect(await getAccessibleAIEmployee(ctx, { $ne: 'zzz' } as unknown as string)).toBeNull();
    expect(await getAccessibleAIEmployee(ctx, ['dex', 'finn'] as unknown as string)).toBeNull();
  });

  it('lets root resolve any enabled business employee', async () => {
    const ctx = createContext(['root'], {});

    expect(usernameOf(await getAccessibleAIEmployee(ctx, 'finn'))).toBe('finn');
    expect(await getAccessibleAIEmployee(ctx, 'nathan')).toBeNull();
  });
});

describe('listAccessibleAIEmployees', () => {
  it('lists only the employees granted to the caller roles', async () => {
    const ctx = createContext(['member'], { member: ['atlas', 'dex'], finance: ['finn'] });

    const listed = await listAccessibleAIEmployees(ctx);

    expect(listed.map(usernameOf)).toEqual(['atlas', 'dex']);
  });
});
