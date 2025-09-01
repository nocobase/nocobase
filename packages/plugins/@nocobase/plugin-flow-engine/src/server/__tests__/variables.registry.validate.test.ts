/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { variables } from '../variables/registry';

describe('variables registry validate and usage extraction', () => {
  it('extractUsage should capture dot and bracket forms for record', () => {
    const template = {
      a: '{{ ctx.record.roles[0].name }}',
      b: "{{ ctx['record']['company'].title }}",
    };
    const usage = variables.extractUsage(template);
    expect(usage.record).toBeTruthy();
    // Should include first example path
    expect(usage.record.some((p) => p.startsWith('roles'))).toBeTruthy();
    // Should include company path from bracket var
    expect(usage.record.some((p) => p.startsWith('company'))).toBeTruthy();
  });

  it('validate should require contextParams.record when ctx.record is used (dot form)', () => {
    const template = { a: '{{ ctx.record.id }}' };
    const { ok, missing } = variables.validate(template, {});
    expect(ok).toBe(false);
    expect(missing).toEqual(
      expect.arrayContaining(['contextParams.record.collection', 'contextParams.record.filterByTk']),
    );
  });

  it('validate should require contextParams.record when ctx["record"] is used (bracket form)', () => {
    const template = { a: "{{ ctx['record'].id }}" };
    const { ok, missing } = variables.validate(template, {});
    expect(ok).toBe(false);
    expect(missing).toEqual(
      expect.arrayContaining(['contextParams.record.collection', 'contextParams.record.filterByTk']),
    );
  });

  it('validate should pass when required record params provided', () => {
    const template = { a: '{{ ctx.record.id }}' };
    const { ok, missing } = variables.validate(template, {
      record: { collection: 'users', filterByTk: 1 },
    });
    expect(ok).toBe(true);
    expect(missing).toBeUndefined();
  });

  it('validate should require parentRecord params and pass when provided', () => {
    const template = { a: '{{ ctx.parentRecord.id }}' };
    const fail = variables.validate(template, {});
    expect(fail.ok).toBe(false);
    expect(fail.missing).toEqual(
      expect.arrayContaining(['contextParams.parentRecord.collection', 'contextParams.parentRecord.filterByTk']),
    );

    const ok = variables.validate(template, {
      parentRecord: { collection: 'users', filterByTk: 1 },
    });
    expect(ok.ok).toBe(true);
    expect(ok.missing).toBeUndefined();
  });

  it('validate should report missing for multiple variables (record + parentRecord)', () => {
    const template = {
      a: '{{ ctx.record.id }}',
      b: '{{ ctx.parentRecord.name }}',
    };
    const res = variables.validate(template, {});
    expect(res.ok).toBe(false);
    // Both sets should be present
    expect(res.missing).toEqual(
      expect.arrayContaining([
        'contextParams.record.collection',
        'contextParams.record.filterByTk',
        'contextParams.parentRecord.collection',
        'contextParams.parentRecord.filterByTk',
      ]),
    );
  });
});
