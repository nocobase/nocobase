/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowSurfaceError } from '../../errors';
import { FLOW_SURFACE_REACTION_UNSUPPORTED_ACTION_FOR_SCENE } from '../errors';
import {
  buildReactionFingerprint,
  compileActionLinkageCanonicalRules,
  compileBlockLinkageCanonicalRules,
  compileFieldLinkageCanonicalRules,
  normalizeFieldLinkageRules,
} from '../linkage';

describe('flow-surfaces reaction linkage helpers', () => {
  it('should compile block linkage rules to current canonical shape', () => {
    const canonical = compileBlockLinkageCanonicalRules([
      {
        key: 'block-rule-1',
        title: 'Rule 1',
        enabled: true,
        when: {
          logic: '$and',
          items: [{ path: 'record.status', operator: '$eq', value: 'draft' }],
        },
        then: [
          { key: 'a1', type: 'setBlockState', state: 'hidden' },
          { key: 'a2', type: 'runjs', code: 'ctx.message.info("hello")', version: 'v2' },
        ],
      },
    ]);

    expect(canonical).toEqual([
      {
        key: 'block-rule-1',
        title: 'Rule 1',
        enable: true,
        condition: {
          logic: '$and',
          items: [{ path: '{{ ctx.record.status }}', operator: '$eq', value: 'draft' }],
        },
        actions: [
          {
            key: 'a1',
            name: 'linkageSetBlockProps',
            params: { value: 'hidden' },
          },
          {
            key: 'a2',
            name: 'linkageRunjs',
            params: {
              value: {
                script: 'ctx.message.info("hello")',
                version: 'v2',
              },
            },
          },
        ],
      },
    ]);
  });

  it('should compile action linkage rules to current canonical shape', () => {
    const canonical = compileActionLinkageCanonicalRules([
      {
        key: 'action-rule-1',
        title: 'Rule 1',
        enabled: true,
        when: {
          logic: '$and',
          items: [{ path: 'record.enabled', operator: '$eq', value: true }],
        },
        then: [{ key: 'a1', type: 'setActionState', state: 'disabled' }],
      },
    ]);

    expect(canonical).toEqual([
      {
        key: 'action-rule-1',
        title: 'Rule 1',
        enable: true,
        condition: {
          logic: '$and',
          items: [{ path: '{{ ctx.record.enabled }}', operator: '$eq', value: true }],
        },
        actions: [
          {
            key: 'a1',
            name: 'linkageSetActionProps',
            params: { value: 'disabled' },
          },
        ],
      },
    ]);
  });

  it('should normalize canonical field linkage rules and resolve field paths', () => {
    const normalized = normalizeFieldLinkageRules(
      [
        {
          key: 'field-rule-1',
          title: 'Rule 1',
          enable: true,
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.record.level }}', operator: '$eq', value: 2 }],
          },
          actions: [
            {
              key: 'a1',
              name: 'linkageSetFieldProps',
              params: {
                value: {
                  fields: ['field-status'],
                  state: 'disabled',
                },
              },
            },
          ],
        },
      ],
      {
        scene: 'form',
        resolveFieldPath: (fieldUid) => (fieldUid === 'field-status' ? 'status' : undefined),
      },
    );

    expect(normalized).toEqual([
      {
        key: 'field-rule-1',
        title: 'Rule 1',
        enabled: true,
        when: {
          logic: '$and',
          items: [{ path: 'record.level', operator: '$eq', value: 2 }],
        },
        then: [{ key: 'a1', type: 'setFieldState', fieldPaths: ['status'], state: 'disabled' }],
      },
    ]);
  });

  it('should compile form field linkage rules and resolve target field uids', () => {
    const canonical = compileFieldLinkageCanonicalRules(
      [
        {
          key: 'field-rule-1',
          title: 'Rule 1',
          enabled: true,
          when: {
            logic: '$and',
            items: [{ path: 'record.status', operator: '$eq', value: 'draft' }],
          },
          then: [
            {
              key: 'a1',
              type: 'setFieldState',
              fieldPaths: ['status'],
              state: 'disabled',
            },
            {
              key: 'a2',
              type: 'assignField',
              items: [
                {
                  key: 'i1',
                  enabled: true,
                  targetPath: 'status',
                  when: {
                    logic: '$and',
                    items: [{ path: 'record.type', operator: '$eq', value: 'auto' }],
                  },
                  value: { source: 'path', path: 'record.defaultStatus' },
                },
              ],
            },
            {
              key: 'a3',
              type: 'setFieldDefaultValue',
              items: [
                {
                  key: 'i2',
                  enabled: true,
                  targetPath: 'name',
                  value: { source: 'literal', value: 'Untitled' },
                },
              ],
            },
          ],
        },
      ],
      {
        scene: 'form',
        resolveFieldUid: (fieldPath) => `uid:${fieldPath}`,
      },
    );

    expect(canonical).toEqual([
      {
        key: 'field-rule-1',
        title: 'Rule 1',
        enable: true,
        condition: {
          logic: '$and',
          items: [{ path: '{{ ctx.record.status }}', operator: '$eq', value: 'draft' }],
        },
        actions: [
          {
            key: 'a1',
            name: 'linkageSetFieldProps',
            params: {
              value: {
                fields: ['uid:status'],
                state: 'disabled',
              },
            },
          },
          {
            key: 'a2',
            name: 'linkageAssignField',
            params: {
              value: [
                {
                  key: 'i1',
                  enable: true,
                  targetPath: 'status',
                  mode: 'assign',
                  condition: {
                    logic: '$and',
                    items: [{ path: '{{ ctx.record.type }}', operator: '$eq', value: 'auto' }],
                  },
                  value: '{{ ctx.record.defaultStatus }}',
                },
              ],
            },
          },
          {
            key: 'a3',
            name: 'setFieldsDefaultValue',
            params: {
              value: [
                {
                  key: 'i2',
                  enable: true,
                  targetPath: 'name',
                  mode: 'default',
                  condition: { logic: '$and', items: [] },
                  value: 'Untitled',
                },
              ],
            },
          },
        ],
      },
    ]);
  });

  it('should reject field actions unsupported by details scene', () => {
    expect(() =>
      normalizeFieldLinkageRules(
        [
          {
            then: [{ type: 'assignField', items: [] }],
          },
        ],
        { scene: 'details' },
      ),
    ).toThrowError(
      expect.objectContaining<Partial<FlowSurfaceError>>({
        code: FLOW_SURFACE_REACTION_UNSUPPORTED_ACTION_FOR_SCENE,
      }),
    );
  });

  it('should build stable fingerprints', () => {
    const a = buildReactionFingerprint({ b: 2, a: 1 });
    const b = buildReactionFingerprint({ a: 1, b: 2 });

    expect(a).toBe(b);
  });
});
