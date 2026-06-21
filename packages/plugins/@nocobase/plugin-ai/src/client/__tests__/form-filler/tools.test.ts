/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { buildFormFillerPatches, formFillerTool, normalizeFormFillerData } from '../../ai-employees/form-filler/tools';

describe('formFillerTool', () => {
  const subTablePaths = new Set(['roles']);

  it('adds subtable row identity metadata for new rows', () => {
    const result = normalizeFormFillerData(
      {
        roles: [{ name: 'Admin' }, { id: 1, name: 'Owner' }],
      },
      [],
      subTablePaths,
    );

    expect(result.roles).toEqual([
      expect.objectContaining({
        name: 'Admin',
        __is_new__: true,
        __index__: expect.any(String),
      }),
      { id: 1, name: 'Owner' },
    ]);
  });

  it('does not add new-row metadata to ordinary association arrays', () => {
    const result = normalizeFormFillerData({
      users: [{ name: 'Alice' }],
    });

    expect(result.users).toEqual([{ name: 'Alice' }]);
  });

  it('builds patches for top-level fields and nested leaves', () => {
    const patches = buildFormFillerPatches({
      roles: [{ name: 'Admin', __is_new__: true, __index__: 'row-1' }],
    });

    expect(patches).toEqual([
      {
        path: ['roles'],
        value: [{ name: 'Admin', __is_new__: true, __index__: 'row-1' }],
      },
      { path: ['roles', 0, 'name'], value: 'Admin' },
      { path: ['roles', 0, '__is_new__'], value: true },
      { path: ['roles', 0, '__index__'], value: 'row-1' },
    ]);
  });

  it('writes nested patches through the form runtime and waits for completion', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const getModel = vi.fn(() => ({
      context: {
        setFormValues,
      },
      subModels: {
        field: {
          use: 'SubTableFieldModel',
          context: {
            collectionField: {
              name: 'roles',
            },
          },
        },
      },
    }));
    const app = {
      flowEngine: {
        getModel,
      },
    };

    await formFillerTool[1].invoke?.(app, {
      form: 'form-1',
      data: {
        roles: [{ name: 'Admin' }],
      },
    });

    expect(getModel).toHaveBeenCalledWith('form-1', true);
    expect(setFormValues).toHaveBeenCalledWith(
      expect.arrayContaining([
        {
          path: ['roles'],
          value: [
            expect.objectContaining({
              name: 'Admin',
              __is_new__: true,
              __index__: expect.any(String),
            }),
          ],
        },
        { path: ['roles', 0, 'name'], value: 'Admin' },
      ]),
      { source: 'system' },
    );
  });

  it('uses the rendered form model tree to recognize o2m fields displayed as subtables', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const getModel = vi.fn(() => ({
      context: {
        setFormValues,
      },
      subModels: {
        grid: {
          subModels: {
            items: [
              {
                use: 'FormItemModel',
                subModels: {
                  field: {
                    use: 'SubTableFieldModel',
                    context: {
                      collectionField: {
                        name: 'roles',
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    }));
    const app = {
      flowEngine: {
        getModel,
      },
    };

    await formFillerTool[1].invoke?.(app, {
      form: 'form-1',
      data: {
        roles: [{ name: 'Admin' }],
      },
    });

    expect(setFormValues).toHaveBeenCalledWith(
      expect.arrayContaining([
        {
          path: ['roles'],
          value: [
            expect.objectContaining({
              name: 'Admin',
              __is_new__: true,
              __index__: expect.any(String),
            }),
          ],
        },
        { path: ['roles', 0, 'name'], value: 'Admin' },
      ]),
      { source: 'system' },
    );
  });
});
