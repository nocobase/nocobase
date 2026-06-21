/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { filterFormDefaultValues } from '../../../../actions/filterFormDefaultValues';
import { FilterFormBlockModel } from '../FilterFormBlockModel';

function resolveTemplateValue(raw: any, values: Record<string, any>): any {
  if (typeof raw === 'string') {
    const matched = raw.match(/^\{\{\s*ctx\.formValues\.([^}]+?)\s*\}\}$/);
    return matched ? values[matched[1]] : raw;
  }
  if (Array.isArray(raw)) {
    return raw.map((item) => resolveTemplateValue(item, values));
  }
  if (raw && typeof raw === 'object') {
    return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, resolveTemplateValue(value, values)]));
  }
  return raw;
}

function createFilterFormDefaultValuesModel(rules: any[], initialValues: Record<string, any> = {}) {
  const values = { ...initialValues };
  const createItem = (fieldPath: string, uid: string) => ({
    uid,
    fieldPath,
    props: { name: `${fieldPath}_${uid}` },
    getProps() {
      return this.props;
    },
    getStepParams(flowKey: string, stepKey: string) {
      if (flowKey === 'fieldSettings' && stepKey === 'init') {
        return { fieldPath };
      }
      return undefined;
    },
    subModels: {
      field: {},
    },
  });
  const model = {
    defaultValuesRefreshSeq: 0,
    lastDefaultValueByFieldName: new Map<string, any>(),
    userEditedFieldNames: new Set<string>(),
    form: {
      getFieldsValue: () => ({ ...values }),
      getFieldValue: (name: string) => values[name],
      setFieldValue: (name: string, value: any) => {
        values[name] = value;
      },
      setFieldsValue: (next: Record<string, any>) => {
        Object.assign(values, next);
      },
    },
    context: {
      resolveJsonTemplate: vi.fn((raw) => resolveTemplateValue(raw, values)),
      app: {
        jsonLogic: {
          apply: vi.fn((logic: Record<string, any[]>) => {
            const [[operator, args]] = Object.entries(logic);
            if (operator === '$eq') return args[0] === args[1];
            return true;
          }),
        },
      },
    },
    subModels: {
      grid: {
        subModels: {
          items: [createItem('nickname', 'nick'), createItem('username', 'user')],
        },
      },
    },
    getStepParams: vi.fn((flowKey: string, stepKey: string) => {
      if (flowKey === 'formFilterBlockModelSettings' && stepKey === 'defaultValues') {
        return { value: rules };
      }
      return undefined;
    }),
    canApplyFormDefaultValue: (FilterFormBlockModel.prototype as any).canApplyFormDefaultValue,
    canApplyFormOverrideValue: (FilterFormBlockModel.prototype as any).canApplyFormOverrideValue,
    normalizeFieldValueMode: (FilterFormBlockModel.prototype as any).normalizeFieldValueMode,
    markFilterFormUserEditedFields: (FilterFormBlockModel.prototype as any).markFilterFormUserEditedFields,
    resetFilterFormUserEditedFields: (FilterFormBlockModel.prototype as any).resetFilterFormUserEditedFields,
    matchDefaultValueCondition: (FilterFormBlockModel.prototype as any).matchDefaultValueCondition,
    applyFormDefaultValues: FilterFormBlockModel.prototype.applyFormDefaultValues,
    handleFilterFormValuesChange: (FilterFormBlockModel.prototype as any).handleFilterFormValuesChange,
    dispatchEvent: vi.fn(),
    emitter: {
      emit: vi.fn(),
    },
  };

  return { model, values };
}

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
    expect(options.resolveOnServer('department_department-filter[0].name')).toBe(true);
    expect(options.resolveOnServer('department.owner_owner-filter.name')).toBe(true);
    expect(options.serverOnlyWhenContextParams).toBe(true);
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

  it('refreshes default values that depend on current filter form values', async () => {
    const { model, values } = createFilterFormDefaultValuesModel(
      [
        {
          key: 'username-default',
          enable: true,
          targetPath: 'username',
          mode: 'default',
          value: '{{ ctx.formValues.nickname_nick }}',
        },
      ],
      { nickname_nick: 'Alice' },
    );

    await FilterFormBlockModel.prototype.applyFormDefaultValues.call(model as any);
    expect(values.username_user).toBe('Alice');

    values.nickname_nick = 'Bob';
    model.defaultValuesRefreshSeq += 1;
    await FilterFormBlockModel.prototype.applyFormDefaultValues.call(model as any, {
      refreshSeq: model.defaultValuesRefreshSeq,
    });
    expect(values.username_user).toBe('Bob');

    values.username_user = 'Manual';
    values.nickname_nick = 'Carol';
    model.defaultValuesRefreshSeq += 1;
    await FilterFormBlockModel.prototype.applyFormDefaultValues.call(model as any, {
      refreshSeq: model.defaultValuesRefreshSeq,
    });
    expect(values.username_user).toBe('Manual');
  });

  it('applies fixed values even when the target filter field already has a value', async () => {
    const { model, values } = createFilterFormDefaultValuesModel(
      [
        {
          key: 'username-fixed',
          enable: true,
          targetPath: 'username',
          mode: 'assign',
          value: '{{ ctx.formValues.nickname_nick }}',
        },
      ],
      { nickname_nick: 'Bob', username_user: 'Manual' },
    );

    await FilterFormBlockModel.prototype.applyFormDefaultValues.call(model as any);

    expect(values.username_user).toBe('Bob');
  });

  it('applies override values until the target filter field is changed by user', async () => {
    const { model, values } = createFilterFormDefaultValuesModel(
      [
        {
          key: 'username-override',
          enable: true,
          targetPath: 'username',
          mode: 'override',
          value: '{{ ctx.formValues.nickname_nick }}',
        },
      ],
      { nickname_nick: 'Bob', username_user: 'Manual' },
    );

    await FilterFormBlockModel.prototype.applyFormDefaultValues.call(model as any);
    expect(values.username_user).toBe('Bob');

    values.nickname_nick = 'Carol';
    model.defaultValuesRefreshSeq += 1;
    await FilterFormBlockModel.prototype.applyFormDefaultValues.call(model as any, {
      refreshSeq: model.defaultValuesRefreshSeq,
    });
    expect(values.username_user).toBe('Carol');

    values.username_user = 'User value';
    (model as any).handleFilterFormValuesChange(
      { username_user: 'User value' },
      { nickname_nick: 'Carol', username_user: 'User value' },
    );

    await waitFor(() => {
      expect(values.username_user).toBe('User value');
    });

    values.nickname_nick = 'Dora';
    model.defaultValuesRefreshSeq += 1;
    await FilterFormBlockModel.prototype.applyFormDefaultValues.call(model as any, {
      refreshSeq: model.defaultValuesRefreshSeq,
    });
    expect(values.username_user).toBe('User value');
  });

  it('clears filter form user-edited override state on forced apply', async () => {
    const { model, values } = createFilterFormDefaultValuesModel(
      [
        {
          key: 'username-override',
          enable: true,
          targetPath: 'username',
          mode: 'override',
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.nickname_nick }}', operator: '$eq', value: 'allow' }],
          },
          value: '{{ ctx.formValues.nickname_nick }}',
        },
      ],
      { nickname_nick: 'deny', username_user: 'User value' },
    );

    model.userEditedFieldNames.add('username_user');

    await FilterFormBlockModel.prototype.applyFormDefaultValues.call(model as any, { force: true });
    expect(values.username_user).toBe('User value');
    expect(model.userEditedFieldNames.has('username_user')).toBe(false);

    values.nickname_nick = 'allow';
    await FilterFormBlockModel.prototype.applyFormDefaultValues.call(model as any);

    expect(values.username_user).toBe('allow');
  });

  it('skips filter form field values when the rule condition does not match', async () => {
    const { model, values } = createFilterFormDefaultValuesModel(
      [
        {
          key: 'username-condition',
          enable: true,
          targetPath: 'username',
          mode: 'assign',
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.nickname_nick }}', operator: '$eq', value: 'allow' }],
          },
          value: 'Matched',
        },
      ],
      { nickname_nick: 'deny' },
    );

    await FilterFormBlockModel.prototype.applyFormDefaultValues.call(model as any);
    expect(values.username_user).toBeUndefined();

    values.nickname_nick = 'allow';
    await FilterFormBlockModel.prototype.applyFormDefaultValues.call(model as any);
    expect(values.username_user).toBe('Matched');
  });

  it('emits formValuesChange with final values after applying dependent field values', async () => {
    const { model, values } = createFilterFormDefaultValuesModel(
      [
        {
          key: 'username-fixed',
          enable: true,
          targetPath: 'username',
          mode: 'assign',
          value: '{{ ctx.formValues.nickname_nick }}',
        },
      ],
      { nickname_nick: 'Bob' },
    );

    (model as any).handleFilterFormValuesChange({ nickname_nick: 'Bob' }, { nickname_nick: 'Bob' });

    await waitFor(() => {
      expect(values.username_user).toBe('Bob');
      expect(model.dispatchEvent).toHaveBeenCalledWith(
        'formValuesChange',
        {
          changedValues: {
            nickname_nick: 'Bob',
            username_user: 'Bob',
          },
          allValues: {
            nickname_nick: 'Bob',
            username_user: 'Bob',
          },
        },
        { debounce: true },
      );
    });
    expect(model.emitter.emit).toHaveBeenCalledWith('formValuesChange', {
      changedValues: {
        nickname_nick: 'Bob',
        username_user: 'Bob',
      },
      allValues: {
        nickname_nick: 'Bob',
        username_user: 'Bob',
      },
    });
  });
});
