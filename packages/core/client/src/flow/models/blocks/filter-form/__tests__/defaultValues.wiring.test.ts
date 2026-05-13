/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { filterFormDefaultValues } from '../../../../actions/filterFormDefaultValues';
import { FilterFormBlockModel } from '../FilterFormBlockModel';

describe('filter-form defaultValues wiring', () => {
  it('loads action and model modules', () => {
    expect(filterFormDefaultValues).toBeTruthy();
    expect(FilterFormBlockModel).toBeTruthy();
  });

  it('only excludes targets already handled by their own initial refresh', async () => {
    const refreshTargets = vi.fn().mockResolvedValue(undefined);
    const model = {
      initialRefreshHandledTargetIds: new Set<string>(),
      form: {},
      context: {
        refreshTargets,
      },
      prepareInitialFilterValues: vi.fn().mockResolvedValue(true),
    };

    FilterFormBlockModel.prototype.markInitialTargetRefreshHandled.call(model as any, 'target-1');
    await (FilterFormBlockModel.prototype as any).applyDefaultsAndInitialFilter.call(model);

    expect(refreshTargets).toHaveBeenCalledWith({ excludeTargetIds: new Set(['target-1']) });
  });

  it('does not cache initial defaults when form is not ready', async () => {
    const model = {
      form: undefined,
      initialDefaultsPromise: undefined,
      ensureFilterItemsBeforeRender: vi.fn().mockResolvedValue(undefined),
      applyFormDefaultValues: vi.fn().mockResolvedValue(undefined),
    };

    const prepared = await FilterFormBlockModel.prototype.prepareInitialFilterValues.call(model as any);

    expect(prepared).toBe(false);
    expect(model.initialDefaultsPromise).toBeUndefined();
    expect(model.applyFormDefaultValues).not.toHaveBeenCalled();
  });

  it('exposes current form values in the filter form variable meta tree', async () => {
    const engine = new FlowEngine();

    const dataSource = engine.context.dataSourceManager.getDataSource('main');
    dataSource.addCollection({
      name: 'users',
      filterTargetKey: ['id', 'tenantId'],
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'tenantId', type: 'string', interface: 'text' },
        { name: 'name', type: 'string', interface: 'text' },
      ],
    });
    dataSource.addCollection({
      name: 'departments',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'name', type: 'string', interface: 'text' },
        { name: 'owner', type: 'belongsTo', target: 'users', interface: 'm2o' },
      ],
    });
    dataSource.addCollection({
      name: 'tasks',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'title', type: 'string', interface: 'text' },
        { name: 'department', type: 'belongsTo', target: 'departments', interface: 'm2o' },
      ],
    });

    engine.registerModels({ FilterFormBlockModel });
    const model = engine.createModel<FilterFormBlockModel>({
      use: 'FilterFormBlockModel',
      uid: 'filter-form-current-form',
      subModels: {
        grid: {
          subModels: {
            items: [],
          },
        },
      },
    } as any);

    function HookCaller() {
      model.useHooksBeforeRender();
      return null;
    }

    render(React.createElement(HookCaller));

    const store = {
      title: 'bug',
      'department_department-filter': 1,
      'department.owner_owner-filter': { id: 7, tenantId: 'tenant-a' },
    };
    const fakeForm = {
      getFieldsValue: () => ({ ...store }),
    };
    model.context.defineProperty('form', { value: fakeForm });
    model.subModels.grid.subModels.items = [
      {
        uid: 'department-filter',
        fieldPath: 'department',
        props: { name: 'department_department-filter' },
        subModels: {
          field: {
            context: {
              collectionField: dataSource.getCollection('tasks').getField('department'),
            },
          },
        },
      },
      {
        uid: 'owner-filter',
        fieldPath: 'department.owner',
        props: { name: 'department.owner_owner-filter' },
        subModels: {
          field: {
            context: {
              collectionField: dataSource.getCollection('departments').getField('owner'),
            },
          },
        },
      },
    ];

    expect((model.context as any).formValues).toMatchObject({
      ...store,
      department: {
        'owner_owner-filter': { id: 7, tenantId: 'tenant-a' },
      },
    });

    const options = (model.context as any).getPropertyOptions('formValues');
    const meta = await options.meta();
    const properties = await meta.properties();
    const metaTree = await (model.context as any).getPropertyMetaTree();

    expect(options.resolveOnServer('department_department-filter')).toBe(false);
    expect(options.resolveOnServer('department_department-filter.name')).toBe(true);
    expect(options.resolveOnServer('department.owner_owner-filter.name')).toBe(true);
    expect(meta.title).toBe('Current form');
    expect(properties.department.properties['owner_owner-filter'].title).toBe('owner');
    expect(metaTree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'formValues',
          title: 'Current form',
        }),
      ]),
    );
    expect(await meta.buildVariablesParams(model.context)).toMatchObject({
      'department_department-filter': { collection: 'departments', dataSourceKey: 'main', filterByTk: 1 },
      department: {
        'owner_owner-filter': {
          collection: 'users',
          dataSourceKey: 'main',
          filterByTk: { id: 7, tenantId: 'tenant-a' },
        },
      },
    });
  });
});
