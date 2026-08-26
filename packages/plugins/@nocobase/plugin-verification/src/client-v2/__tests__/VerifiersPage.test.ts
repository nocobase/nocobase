/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  recursiveTrim,
  submitVerifierForm,
  type VerifierFormValues,
  type VerifierResource,
} from '../pages/VerifiersPage';

function makeResource(overrides: Partial<VerifierResource> = {}): VerifierResource {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function readUpdateArgs(resource: VerifierResource): { filterByTk: string; values: VerifierFormValues } {
  const updateMock = resource.update as ReturnType<typeof vi.fn>;
  return updateMock.mock.calls[0]?.[0] as { filterByTk: string; values: VerifierFormValues };
}

describe('plugin-verification VerifiersPage submit pipeline', () => {
  it('should fire resource.create with trimmed options in create mode', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await submitVerifierForm({
      raw: {
        name: 'v_new',
        title: 'New verifier',
        verificationType: 'sms-otp',
        options: { provider: 'sms-aliyun', settings: { sign: '  foo  ', endpoint: 'x' } },
      },
      mode: 'create',
      resource,
      onSubmitted,
    });

    expect(resource.create).toHaveBeenCalledTimes(1);
    expect(resource.create).toHaveBeenCalledWith({
      values: {
        name: 'v_new',
        title: 'New verifier',
        verificationType: 'sms-otp',
        // Whitespace around literal credentials is stripped to match v1; env-var
        // references (e.g. `{{ $env.X }}`) survive untouched because they are
        // matched verbatim by `recursiveTrim`.
        options: { provider: 'sms-aliyun', settings: { sign: 'foo', endpoint: 'x' } },
      },
    });
    expect(resource.update).not.toHaveBeenCalled();
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should fire resource.update with record.name as filterByTk in edit mode', async () => {
    // Pin the filterByTk value so a regression to `record.id` (which is
    // undefined for `verifiers` because the collection is `autoGenId: false`
    // with `name` as PK) would fail loud here instead of silently no-op'ing.
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await submitVerifierForm({
      raw: {
        name: 'v_abc',
        title: 'Edited',
        verificationType: 'sms-otp',
        options: {
          provider: 'sms-aliyun',
          settings: { sign: 'NewSign', endpoint: 'dysmsapi.aliyuncs.com' },
        },
      },
      mode: 'edit',
      record: {
        name: 'v_abc',
        title: 'Old',
        verificationType: 'sms-otp',
        // `extraInternalKey` lives at the top of `options` and is not part of
        // any admin-settings form's declared paths — must survive the round
        // trip via the shallow merge on `options`.
        options: {
          provider: 'sms-aliyun',
          settings: { sign: 'OldSign', endpoint: 'old' },
          extraInternalKey: 'keep-me',
        },
      },
      resource,
      onSubmitted,
    });

    expect(resource.update).toHaveBeenCalledTimes(1);
    const updateArgs = readUpdateArgs(resource);
    expect(updateArgs.filterByTk).toBe('v_abc');
    const updatedOptions = updateArgs.values.options as Record<string, unknown>;
    const updatedSettings = updatedOptions.settings as Record<string, unknown>;
    // Top-level options keys not owned by the form are preserved.
    expect(updatedOptions.extraInternalKey).toBe('keep-me');
    // Fields the form owns are overwritten.
    expect(updatedSettings.sign).toBe('NewSign');
    expect(updatedSettings.endpoint).toBe('dysmsapi.aliyuncs.com');
    expect(resource.create).not.toHaveBeenCalled();
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should throw rather than silently skip when edit mode has no record.name', async () => {
    // Guards against the silent-fallthrough class of bug. Previously the
    // submit handler had `else if (record?.id != null)` and would just
    // `return` past the API call when record had no `id`, calling
    // `onSubmitted()` anyway — the page LOOKED successful while no update
    // request had fired.
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await expect(
      submitVerifierForm({
        raw: { title: 'Edited' },
        mode: 'edit',
        record: { title: 'Old' }, // no `name` field at all
        resource,
        onSubmitted,
      }),
    ).rejects.toThrow(/Edit mode requires record\.name/);

    expect(resource.create).not.toHaveBeenCalled();
    expect(resource.update).not.toHaveBeenCalled();
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('should not invoke onSubmitted when resource.create rejects', async () => {
    // Failure path: a failed API call must bubble up so the drawer stays open
    // and the user can retry, instead of closing on a falsely-successful state.
    const resource = makeResource({ create: vi.fn().mockRejectedValue(new Error('boom')) });
    const onSubmitted = vi.fn();

    await expect(
      submitVerifierForm({
        raw: { name: 'v', verificationType: 'sms-otp', options: {} },
        mode: 'create',
        resource,
        onSubmitted,
      }),
    ).rejects.toThrow(/boom/);
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('should not invoke onSubmitted when resource.update rejects', async () => {
    const resource = makeResource({ update: vi.fn().mockRejectedValue(new Error('nope')) });
    const onSubmitted = vi.fn();

    await expect(
      submitVerifierForm({
        raw: { title: 'Edited' },
        mode: 'edit',
        record: { name: 'v_abc' },
        resource,
        onSubmitted,
      }),
    ).rejects.toThrow(/nope/);
    expect(onSubmitted).not.toHaveBeenCalled();
  });
});

describe('plugin-verification recursiveTrim', () => {
  it('trims string leaves', () => {
    expect(recursiveTrim('  hello  ')).toBe('hello');
  });

  it('walks objects and arrays', () => {
    expect(recursiveTrim({ a: '  x ', b: ['  y ', { c: '  z  ' }] })).toEqual({
      a: 'x',
      b: ['y', { c: 'z' }],
    });
  });

  it('leaves non-string primitives intact', () => {
    expect(recursiveTrim(42)).toBe(42);
    expect(recursiveTrim(true)).toBe(true);
    expect(recursiveTrim(null)).toBe(null);
  });
});
