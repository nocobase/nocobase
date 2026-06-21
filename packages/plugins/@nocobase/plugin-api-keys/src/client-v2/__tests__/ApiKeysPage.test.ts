/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';
import { type ApiKeyFormValues, type ApiKeyResource, deleteApiKey, submitApiKeyForm } from '../pages/ApiKeysPage';
import { diffToExpiresIn, formatExpiresReadOnly } from '../pages/ExpiresField';

function makeResource(overrides: Partial<ApiKeyResource> = {}): ApiKeyResource {
  return {
    create: vi.fn().mockResolvedValue({ data: { data: { token: 'tok_test' } } }),
    destroy: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('plugin-api-keys submit pipeline', () => {
  it('should fire resource.create with the form values and surface the returned token', async () => {
    const resource = makeResource();
    const onCreated = vi.fn();

    await submitApiKeyForm({
      values: { name: 'k1', role: { name: 'admin' }, expiresIn: '30d' },
      resource,
      onCreated,
    });

    expect(resource.create).toHaveBeenCalledTimes(1);
    expect(resource.create).toHaveBeenCalledWith({
      values: { name: 'k1', role: { name: 'admin' }, expiresIn: '30d' },
    });
    // Token from `response.data.data.token` must reach the caller so the post-
    // create success modal can show the one-time copyable token to the user.
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(onCreated).toHaveBeenCalledWith('tok_test');
  });

  it('should not invoke onCreated when resource.create rejects', async () => {
    const resource = makeResource({ create: vi.fn().mockRejectedValue(new Error('boom')) });
    const onCreated = vi.fn();

    await expect(
      submitApiKeyForm({
        values: { name: 'k', expiresIn: '30d' } as ApiKeyFormValues,
        resource,
        onCreated,
      }),
    ).rejects.toThrow(/boom/);
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('should fire resource.destroy with the numeric `id` as filterByTk on row delete', async () => {
    // Pin the filterByTk source. `apiKeys` collection's primary key is the
    // bigInt `id`, NOT `name` — guarding against the silent-fallthrough class
    // of regression documented in references/settings-page-crud.md.
    const resource = makeResource();
    const onDeleted = vi.fn();

    await deleteApiKey({ resource, filterByTk: 42, onDeleted });

    expect(resource.destroy).toHaveBeenCalledTimes(1);
    expect(resource.destroy).toHaveBeenCalledWith({ filterByTk: 42 });
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('should not invoke onDeleted when resource.destroy rejects', async () => {
    const resource = makeResource({ destroy: vi.fn().mockRejectedValue(new Error('nope')) });
    const onDeleted = vi.fn();

    await expect(deleteApiKey({ resource, filterByTk: 1, onDeleted })).rejects.toThrow(/nope/);
    expect(onDeleted).not.toHaveBeenCalled();
  });
});

describe('plugin-api-keys ExpiresField helpers', () => {
  it('formats `never` as the localized "Never expires" label', () => {
    expect(formatExpiresReadOnly({ expiresIn: 'never', createdAt: '2026-01-01T00:00:00Z' }, 'Never expires')).toBe(
      'Never expires',
    );
  });

  it('adds the day delta to createdAt and formats it as YYYY-MM-DD HH:mm:ss', () => {
    // 30 days after 2026-01-01 00:00:00 UTC.
    const out = formatExpiresReadOnly({ expiresIn: '30d', createdAt: '2026-01-01T00:00:00Z' }, 'never');
    expect(out).toBe(dayjs('2026-01-01T00:00:00Z').add(30, 'days').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns "" when createdAt is missing (e.g. unsaved row in test fixtures)', () => {
    expect(formatExpiresReadOnly({ expiresIn: '30d' }, 'never')).toBe('');
  });

  it('diffToExpiresIn converts a future dayjs date into "Xd" relative to now', () => {
    const now = dayjs('2026-05-01T12:00:00Z');
    const target = dayjs('2026-05-11T12:00:00Z');
    expect(diffToExpiresIn(target, now)).toBe('10d');
  });

  it('diffToExpiresIn zeroes out second/ms to match the v1 day rounding rule', () => {
    // Without the millisecond/second strip, dayjs.diff(unit:'d') would round
    // sub-day deltas down differently depending on the wall clock at submit time.
    const now = dayjs('2026-05-01T12:00:30.500Z');
    const target = dayjs('2026-05-02T12:00:00.000Z');
    expect(diffToExpiresIn(target, now)).toBe('1d');
  });
});
