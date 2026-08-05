/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import { describe, expect, it } from 'vitest';
import { analyzeVariableTemplate, type VariablePathRef } from '../template/variable-expression';
import {
  createNestedRecordSlotResolver,
  getRecordSlotResolverRegistry,
  RecordSlotResolverRegistry,
  type RecordSlotResolverRegistration,
} from '../variables/record-slot-resolvers';

function getPath(expression: string): VariablePathRef {
  const path = analyzeVariableTemplate(expression).paths[0];
  if (!path) throw new Error(`Expected a static variable path in ${expression}`);
  return path;
}

function createApp(): Application {
  return {} as Application;
}

function resolvedRegistration(
  id: string,
  result: ReturnType<RecordSlotResolverRegistration['resolve']>,
): RecordSlotResolverRegistration {
  return {
    owner: 'test',
    id,
    match: () => true,
    resolve: () => result,
  };
}

describe('RecordSlotResolverRegistry', () => {
  it('isolates applications and disposes registrations without stale loads', async () => {
    const appA = createApp();
    const appB = createApp();
    const registryA = getRecordSlotResolverRegistry(appA);
    const registryB = getRecordSlotResolverRegistry(appB);
    const path = getPath('{{ ctx.backend.record.name }}');
    const oldDispose = registryA.register(
      createNestedRecordSlotResolver({ owner: 'plugin-a', id: 'backend', varName: 'backend' }),
    );

    expect(getRecordSlotResolverRegistry(appA)).toBe(registryA);
    expect(registryB).not.toBe(registryA);
    expect(await registryA.resolve({ path })).toEqual({ status: 'resolved', slot: ['record'] });
    expect(await registryB.resolve({ path })).toBeUndefined();

    const currentDispose = registryA.register(
      createNestedRecordSlotResolver({ owner: 'plugin-a', id: 'backend', varName: 'backend' }),
    );
    oldDispose();
    expect(await registryA.resolve({ path })).toBeDefined();
    currentDispose();
    currentDispose();
    expect(await registryA.resolve({ path })).toBeUndefined();
  });

  it('materializes a whole or nested Record only for the opted-in static slot', async () => {
    const registry = new RecordSlotResolverRegistry();
    registry.register(createNestedRecordSlotResolver({ owner: 'test', id: 'backend', varName: 'backend' }));

    for (const expression of ['{{ ctx.backend.record }}', '{{ ctx.backend.record.name }}']) {
      const resolution = await registry.resolve({ path: getPath(expression) });
      expect(resolution).toEqual({ status: 'resolved', slot: ['record'] });
      expect(Object.isFrozen(resolution)).toBe(true);
      expect(Object.isFrozen(resolution?.slot)).toBe(true);
    }
    expect(await registry.resolve({ path: getPath('{{ ctx.view.record.name }}') })).toBeUndefined();
    expect(await registry.resolve({ path: getPath('{{ ctx.backend }}') })).toBeUndefined();
    expect(await registry.resolve({ path: getPath('{{ ctx.backend.name }}') })).toBeUndefined();
  });

  it.each([
    ['wildcard slot', { status: 'resolved', slot: ['record', '*'] } as const],
    ['negative numeric slot', { status: 'resolved', slot: ['record', -1] } as const],
  ])('fails closed for a %s', async (_name, result) => {
    const registry = new RecordSlotResolverRegistry();
    registry.register(resolvedRegistration('invalid', result));
    expect(await registry.resolve({ path: getPath('{{ ctx.backend.record.name }}') })).toBeUndefined();
  });

  it('treats resolver and matcher exceptions as deny', async () => {
    const path = getPath('{{ ctx.backend.record.name }}');
    for (const registration of [
      {
        owner: 'test',
        id: 'match',
        match: () => {
          throw new Error('match');
        },
        resolve: () => ({ status: 'abstain' as const }),
      },
      {
        owner: 'test',
        id: 'resolve',
        match: () => true,
        resolve: () => {
          throw new Error('resolve');
        },
      },
    ]) {
      const registry = new RecordSlotResolverRegistry();
      registry.register(registration);
      expect(await registry.resolve({ path })).toBeUndefined();
    }
  });

  it('accepts identical slots from independent resolvers', async () => {
    const registry = new RecordSlotResolverRegistry();
    registry.register(resolvedRegistration('metadata-missing', { status: 'abstain' }));
    registry.register(resolvedRegistration('first', { status: 'resolved', slot: ['record'] }));
    registry.register(resolvedRegistration('second', { status: 'resolved', slot: ['record'] }));

    expect(await registry.resolve({ path: getPath('{{ ctx.backend.record.name }}') })).toEqual({
      status: 'resolved',
      slot: ['record'],
    });
  });

  it.each([
    ['different slots', { status: 'resolved', slot: ['record', 'owner'] } as const],
    ['a deny', { status: 'deny' } as const],
  ])('fails closed independent of registration order for %s', async (_name, conflicting) => {
    const first = resolvedRegistration('first', { status: 'resolved', slot: ['record'] });
    const second = resolvedRegistration('second', conflicting);
    const path = getPath('{{ ctx.backend.record.name }}');

    for (const registrations of [
      [first, second],
      [second, first],
    ]) {
      const registry = new RecordSlotResolverRegistry();
      registrations.forEach((registration) => registry.register(registration));
      expect(await registry.resolve({ path })).toBeUndefined();
    }
  });
});
