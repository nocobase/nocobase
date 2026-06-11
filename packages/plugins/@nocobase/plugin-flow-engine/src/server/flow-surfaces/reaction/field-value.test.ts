/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowSurfaceBadRequestError } from '../errors';
import { FLOW_SURFACE_REACTION_FORM_ONLY } from './errors';
import {
  assertFieldValueTargetSupported,
  buildFieldValueWriteResult,
  collectUpdateAssociationValuesFromFieldValueRules,
  compileFieldValueRulesToCanonical,
  normalizeFieldValueRules,
} from './field-value';

describe('flow surfaces reaction field value helpers', () => {
  it('normalizes defaults and compiles canonical rules close to assignRules.value', () => {
    const normalized = normalizeFieldValueRules([
      {
        targetPath: 'status',
        when: {
          logic: '$and',
          items: [{ path: 'record.enabled', operator: '$eq', value: { source: 'path', path: 'record.allowed' } }],
        },
        value: { source: 'path', path: 'record.status' },
      },
      {
        key: 'runjs-rule',
        enabled: false,
        targetPath: 'title',
        mode: 'default',
        value: { source: 'runjs', code: 'return 1;' },
      },
    ]);

    expect(normalized).toEqual([
      {
        key: 'idx:0',
        enabled: true,
        targetPath: 'status',
        mode: 'assign',
        when: {
          logic: '$and',
          items: [{ path: 'record.enabled', operator: '$eq', value: { source: 'path', path: 'record.allowed' } }],
        },
        value: { source: 'path', path: 'record.status' },
      },
      {
        key: 'runjs-rule',
        enabled: false,
        targetPath: 'title',
        mode: 'default',
        when: { logic: '$and', items: [] },
        value: { source: 'runjs', code: 'return 1;', version: 'v1' },
      },
    ]);

    expect(compileFieldValueRulesToCanonical(normalized)).toEqual([
      {
        key: 'idx:0',
        enable: true,
        targetPath: 'status',
        mode: 'assign',
        condition: {
          logic: '$and',
          items: [
            {
              path: '{{ ctx.record.enabled }}',
              operator: '$eq',
              value: '{{ ctx.record.allowed }}',
            },
          ],
        },
        value: '{{ ctx.record.status }}',
      },
      {
        key: 'runjs-rule',
        enable: false,
        targetPath: 'title',
        mode: 'default',
        condition: { logic: '$and', items: [] },
        value: { code: 'return 1;', version: 'v1' },
      },
    ]);
  });

  it('throws a stable error code for unsupported targets', () => {
    expect(() =>
      assertFieldValueTargetSupported({
        uid: 'table-1',
        use: 'TableBlockModel',
      }),
    ).toThrowError(FlowSurfaceBadRequestError);

    try {
      assertFieldValueTargetSupported({
        uid: 'table-1',
        use: 'TableBlockModel',
      });
    } catch (error) {
      expect((error as FlowSurfaceBadRequestError).code).toBe(FLOW_SURFACE_REACTION_FORM_ONLY);
    }
  });

  it('builds a stable write result and reuses slot fingerprinting', () => {
    const target = {
      uid: 'form-1',
      publicPath: 'overview.employeeForm',
      use: 'CreateFormModel',
    };
    const left = buildFieldValueWriteResult({
      target,
      rules: [
        {
          key: 'a',
          targetPath: 'status',
          value: { source: 'literal', value: 'draft' },
          when: { items: [], logic: '$and' },
        },
      ],
    });
    const right = buildFieldValueWriteResult({
      target,
      rules: [
        {
          key: 'a',
          targetPath: 'status',
          when: { logic: '$and', items: [] },
          value: { source: 'literal', value: 'draft' },
        },
      ],
    });

    expect(left.resolvedScene).toBe('form');
    expect(left.resolvedSlot).toEqual({
      flowKey: 'formModelSettings',
      stepKey: 'assignRules',
      valuePath: 'value',
    });
    expect(left.fingerprint).toBe(right.fingerprint);
  });

  it('collects updateAssociationValues for nested association target paths', () => {
    const profileCollection: any = {
      getField: (name: string) => ({ name, isAssociationField: () => false }),
    };
    const userCollection: any = {
      filterTargetKey: 'id',
      getField: (name: string) => {
        if (name === 'profile') {
          return { name, isAssociationField: () => true, targetCollection: profileCollection };
        }
        return { name, isAssociationField: () => false };
      },
    };
    const rootCollection: any = {
      getField: (name: string) => {
        if (name === 'user') {
          return { name, isAssociationField: () => true, targetCollection: userCollection };
        }
        return { name, isAssociationField: () => false };
      },
    };

    expect(
      collectUpdateAssociationValuesFromFieldValueRules(
        [
          { targetPath: 'title' },
          { targetPath: 'user.name' },
          { targetPath: 'user.profile.name' },
          { targetPath: 'user.id' },
        ],
        rootCollection,
      ),
    ).toEqual(expect.arrayContaining(['user', 'user.profile']));
  });
});
