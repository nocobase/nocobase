/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import type { ResourcerContext } from '@nocobase/resourcer';
import { describe, expect, it, vi } from 'vitest';
import { analyzeVariableTemplate, type VariablePathRef } from '../template/variable-expression';
import {
  createNestedRecordSlotResolver,
  getRecordSlotResolverRegistry,
  normalizeRecordSlotTarget,
  RecordSlotResolverRegistry,
  type RecordSlotResolverRegistration,
  type RecordSlotTargetCapability,
} from '../variables/record-slot-resolvers';

const usersTarget = { kind: 'fixed', dataSourceKey: 'main', collection: 'users' } as const;

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
  it('isolates applications and disposes registrations without leaving stale loads', async () => {
    const appA = createApp();
    const appB = createApp();
    const registryA = getRecordSlotResolverRegistry(appA);
    const registryB = getRecordSlotResolverRegistry(appB);
    const path = getPath('{{ ctx.backend.record.name }}');
    const oldDispose = registryA.register(
      createNestedRecordSlotResolver({ owner: 'plugin-a', id: 'backend', varName: 'backend', target: usersTarget }),
    );

    expect(getRecordSlotResolverRegistry(appA)).toBe(registryA);
    expect(registryB).not.toBe(registryA);
    expect(await registryA.resolve({ path })).toMatchObject({ slot: ['record'], target: usersTarget });
    expect(await registryB.resolve({ path })).toBeUndefined();

    const currentDispose = registryA.register(
      createNestedRecordSlotResolver({
        owner: 'plugin-a',
        id: 'backend',
        varName: 'backend',
        target: { kind: 'fixed', collection: 'posts' },
      }),
    );
    oldDispose();
    expect((await registryA.resolve({ path }))?.target).toMatchObject({ collection: 'posts' });
    currentDispose();
    currentDispose();
    expect(await registryA.resolve({ path })).toBeUndefined();

    const enabledDispose = registryA.register(
      createNestedRecordSlotResolver({ owner: 'plugin-a', id: 'backend', varName: 'backend', target: usersTarget }),
    );
    expect(await registryA.resolve({ path })).toBeDefined();
    enabledDispose();
  });

  it('materializes only an opted-in nested record slot from the static path', async () => {
    const registry = new RecordSlotResolverRegistry();
    registry.register(
      createNestedRecordSlotResolver({ owner: 'test', id: 'backend', varName: 'backend', target: usersTarget }),
    );

    const resolution = await registry.resolve({ path: getPath('{{ ctx.backend.record.name }}') });
    expect(resolution).toMatchObject({ slot: ['record'], target: usersTarget });
    expect(Object.isFrozen(resolution)).toBe(true);
    expect(Object.isFrozen(resolution?.slot)).toBe(true);
    expect(await registry.resolve({ path: getPath('{{ ctx.view.record.name }}') })).toBeUndefined();
    expect(await registry.resolve({ path: getPath('{{ ctx.backend.name }}') })).toBeUndefined();
    expect(await registry.resolve({ path: getPath('{{ ctx.backend.record }}') })).toBeUndefined();
  });

  it('does not use a client descriptor to select the nested record prefix', async () => {
    const registry = new RecordSlotResolverRegistry();
    const resolver = createNestedRecordSlotResolver({
      owner: 'test',
      id: 'backend',
      varName: 'backend',
      target: usersTarget,
    });
    registry.register(resolver);

    const resolution = await registry.resolve({ path: getPath('{{ ctx.backend.record.name }}') });
    if (!resolution) throw new Error('Expected an opted-in nested Record resolution');
    const normalized = await normalizeRecordSlotTarget(resolution.target, {} as ResourcerContext, {
      collection: 'secrets',
      dataSourceKey: 'external',
      associationName: 'secrets.owner',
      filterByTk: 1,
      sourceId: 9,
    });

    expect(resolution?.slot).toEqual(['record']);
    expect(normalized).toMatchObject({ collection: 'users', dataSourceKey: 'main', filterByTk: 1 });
    expect(normalized?.associationName).toBeUndefined();
    expect(normalized?.sourceId).toBeUndefined();
  });

  it.each([
    ['wildcard slot', { status: 'resolved', slot: ['record', '*'], target: usersTarget } as const],
    [
      'missing collection target',
      { status: 'resolved', slot: ['record'], target: { kind: 'fixed', collection: '' } } as const,
    ],
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

  it('accepts identical normalized results from independent resolvers', async () => {
    const registry = new RecordSlotResolverRegistry();
    registry.register(resolvedRegistration('metadata-missing', { status: 'abstain' }));
    registry.register(
      resolvedRegistration('first', { status: 'resolved', slot: ['record'], target: { ...usersTarget } }),
    );
    registry.register(
      resolvedRegistration('second', {
        status: 'resolved',
        slot: ['record'],
        target: { kind: 'fixed', collection: 'users' },
      }),
    );

    expect(await registry.resolve({ path: getPath('{{ ctx.backend.record.name }}') })).toMatchObject({
      slot: ['record'],
      target: usersTarget,
    });
  });

  it.each([
    ['different slots', { status: 'resolved', slot: ['record', 'owner'], target: usersTarget } as const],
    [
      'different targets',
      { status: 'resolved', slot: ['record'], target: { kind: 'fixed', collection: 'posts' } } as const,
    ],
    ['a deny', { status: 'deny' } as const],
  ])('fails closed independent of registration order for %s', async (_name, conflicting) => {
    const first = resolvedRegistration('first', { status: 'resolved', slot: ['record'], target: usersTarget });
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

  it('compares explicit target capabilities instead of only their slot', async () => {
    const normalize = vi.fn(async () => ({ collection: 'users', filterByTk: 1 }));
    const first: RecordSlotTargetCapability = { kind: 'capability', id: 'first', normalize };
    const second: RecordSlotTargetCapability = { kind: 'capability', id: 'second', normalize };
    const registry = new RecordSlotResolverRegistry();
    registry.register(resolvedRegistration('first', { status: 'resolved', slot: ['record'], target: first }));
    registry.register(resolvedRegistration('second', { status: 'resolved', slot: ['record'], target: second }));

    expect(await registry.resolve({ path: getPath('{{ ctx.backend.record.name }}') })).toBeUndefined();
  });

  it('fails closed when an explicit target capability cannot validate the descriptor', async () => {
    const target: RecordSlotTargetCapability = {
      kind: 'capability',
      id: 'request-bound',
      normalize: () => undefined,
    };

    expect(
      await normalizeRecordSlotTarget(target, {} as ResourcerContext, {
        collection: 'secrets',
        dataSourceKey: 'external',
        filterByTk: 1,
      }),
    ).toBeUndefined();
  });
});
