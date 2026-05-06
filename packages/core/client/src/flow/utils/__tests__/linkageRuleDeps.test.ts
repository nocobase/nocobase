/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  collectLinkageRuleDeps,
  linkageRuleDepsShouldRefresh,
  type FormValuesChangeLikePayload,
} from '../linkageRuleDeps';

describe('linkageRuleDeps', () => {
  it('extracts ctx.formValues and ctx.item dependencies from linkage rules', () => {
    const deps = collectLinkageRuleDeps({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [
              { path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'open' },
              { path: '{{ ctx.item.value.nickname }}', operator: '$eq', value: '{{ ctx.formValues.owner.name }}' },
            ],
          },
          actions: [
            {
              name: 'linkageRunjs',
              params: {
                value: {
                  script:
                    "return ctx.formValues.amount + await ctx.getVar('ctx.item.parentItem.value.department.name')",
                },
              },
            },
          ],
        },
      ],
    });

    expect(deps.formValuesPaths).toEqual(expect.arrayContaining(['status', 'owner.name', 'amount']));
    expect(deps.itemPaths).toEqual(expect.arrayContaining(['value.nickname', 'parentItem.value.department.name']));
    expect(deps.hasDeps).toBe(true);
  });

  it('extracts RunJSValue dependencies', () => {
    const deps = collectLinkageRuleDeps({
      value: [
        {
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageAssignField',
              params: {
                value: [
                  {
                    targetPath: 'title',
                    value: {
                      code: "return ctx.formValues.status + await ctx.getVar('ctx.item.value.nickname')",
                      version: 'v1',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(deps.formValuesPaths).toEqual(expect.arrayContaining(['status']));
    expect(deps.itemPaths).toEqual(expect.arrayContaining(['value.nickname']));
  });

  it('matches formValues deps against changed paths by ancestor or descendant path', () => {
    const deps = collectLinkageRuleDeps({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.customer.level.name }}', operator: '$eq', value: 'VIP' }],
          },
          actions: [],
        },
      ],
    });

    expect(
      linkageRuleDepsShouldRefresh(deps, {
        changedPaths: [['customer']],
      } as FormValuesChangeLikePayload),
    ).toBe(true);
    expect(
      linkageRuleDepsShouldRefresh(deps, {
        changedPaths: [['customer', 'level', 'name']],
      } as FormValuesChangeLikePayload),
    ).toBe(true);
    expect(
      linkageRuleDepsShouldRefresh(deps, {
        changedPaths: [['status']],
      } as FormValuesChangeLikePayload),
    ).toBe(false);
  });

  it('maps ctx.item.value dependencies through fieldIndex', () => {
    const deps = collectLinkageRuleDeps({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.item.value.nickname }}', operator: '$eq', value: 'A' }],
          },
          actions: [],
        },
      ],
    });

    expect(
      linkageRuleDepsShouldRefresh(
        deps,
        {
          changedPaths: [['roles', 1, 'nickname']],
        } as FormValuesChangeLikePayload,
        { fieldIndex: ['roles:1'] },
      ),
    ).toBe(true);
    expect(
      linkageRuleDepsShouldRefresh(
        deps,
        {
          changedPaths: [['roles', 0, 'nickname']],
        } as FormValuesChangeLikePayload,
        { fieldIndex: ['roles:1'] },
      ),
    ).toBe(false);
  });

  it('maps ctx.item index and length dependencies to the current list root', () => {
    const deps = collectLinkageRuleDeps({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [
              { path: '{{ ctx.item.index }}', operator: '$eq', value: 1 },
              { path: '{{ ctx.item.length }}', operator: '$gt', value: 1 },
            ],
          },
          actions: [],
        },
      ],
    });

    expect(
      linkageRuleDepsShouldRefresh(
        deps,
        {
          changedPaths: [['roles']],
        } as FormValuesChangeLikePayload,
        { fieldIndex: ['roles:1'] },
      ),
    ).toBe(true);
    expect(
      linkageRuleDepsShouldRefresh(
        deps,
        {
          changedPaths: [['departments']],
        } as FormValuesChangeLikePayload,
        { fieldIndex: ['roles:1'] },
      ),
    ).toBe(false);
  });

  it('maps parent item dependencies through nested fieldIndex', () => {
    const deps = collectLinkageRuleDeps({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.item.parentItem.value.title }}', operator: '$eq', value: 'A' }],
          },
          actions: [],
        },
      ],
    });

    expect(
      linkageRuleDepsShouldRefresh(
        deps,
        {
          changedPaths: [['projects', 0, 'title']],
        } as FormValuesChangeLikePayload,
        { fieldIndex: ['projects:0', 'tasks:2'] },
      ),
    ).toBe(true);
    expect(
      linkageRuleDepsShouldRefresh(
        deps,
        {
          changedPaths: [['projects', 0, 'tasks', 2, 'title']],
        } as FormValuesChangeLikePayload,
        { fieldIndex: ['projects:0', 'tasks:2'] },
      ),
    ).toBe(false);
  });

  it('maps parent item dependencies to root form values when depth reaches the fieldIndex chain root', () => {
    const deps = collectLinkageRuleDeps({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.item.parentItem.parentItem.value.title }}', operator: '$eq', value: 'A' }],
          },
          actions: [],
        },
      ],
    });

    expect(
      linkageRuleDepsShouldRefresh(
        deps,
        {
          changedPaths: [['title']],
        } as FormValuesChangeLikePayload,
        { fieldIndex: ['projects:0', 'tasks:2'] },
      ),
    ).toBe(true);
    expect(
      linkageRuleDepsShouldRefresh(
        deps,
        {
          changedPaths: [['projects', 0, 'title']],
        } as FormValuesChangeLikePayload,
        { fieldIndex: ['projects:0', 'tasks:2'] },
      ),
    ).toBe(false);
  });

  it('falls back when parent item depth exceeds the fieldIndex chain', () => {
    const deps = collectLinkageRuleDeps({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [
              {
                path: '{{ ctx.item.parentItem.parentItem.parentItem.value.title }}',
                operator: '$eq',
                value: 'A',
              },
            ],
          },
          actions: [],
        },
      ],
    });

    expect(
      linkageRuleDepsShouldRefresh(
        deps,
        {
          changedPaths: [['anything']],
        } as FormValuesChangeLikePayload,
        { fieldIndex: ['projects:0', 'tasks:2'] },
      ),
    ).toBe(true);
  });

  it('falls back to refreshing item deps when item cannot be mapped', () => {
    const deps = collectLinkageRuleDeps({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.item.value.nickname }}', operator: '$eq', value: 'A' }],
          },
          actions: [],
        },
      ],
    });

    expect(
      linkageRuleDepsShouldRefresh(deps, {
        changedPaths: [['anything']],
      } as FormValuesChangeLikePayload),
    ).toBe(true);
  });
});
