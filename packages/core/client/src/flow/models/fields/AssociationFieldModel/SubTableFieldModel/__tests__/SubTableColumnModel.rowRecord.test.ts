/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { DisplayTitleFieldModel } from '../../../DisplayTitleFieldModel';
import { titleField } from '../../../../../actions/titleField';
import {
  SubTableColumnModel,
  getLatestSubTableRowRecord,
  buildRowPathFromFieldIndex,
  isSubTableColumnConfiguredReadPretty,
  getSubTableColumnTitleField,
  getSubTableColumnReadPrettyFieldProps,
  isSubTableColumnReadPretty,
} from '../SubTableColumnModel';

describe('SubTableColumnModel row record helpers', () => {
  it('builds the row path from fieldIndex entries', () => {
    expect(buildRowPathFromFieldIndex(['roles:0'])).toEqual(['roles', 0]);
    expect(buildRowPathFromFieldIndex(['users:1', 'roles:2'])).toEqual(['users', 1, 'roles', 2]);
  });

  it('prefers the latest row value from form over the fallback record', () => {
    const form = {
      getFieldValue: vi.fn((path: any) => {
        if (JSON.stringify(path) === JSON.stringify(['roles', 0])) {
          return { uid: 'role-uid-1', __is_new__: true };
        }
      }),
    };
    const fallback = { uid: 'stale-role', __is_new__: false };

    expect(getLatestSubTableRowRecord(form, ['roles:0'], fallback)).toEqual({
      uid: 'role-uid-1',
      __is_new__: true,
    });
    expect(form.getFieldValue).toHaveBeenCalledWith(['roles', 0]);
  });

  it('falls back to the record when latest row value is unavailable', () => {
    const form = { getFieldValue: vi.fn(() => undefined) };
    const fallback = { uid: 'stale-role', __is_new__: false };

    expect(getLatestSubTableRowRecord(form, ['roles:0'], fallback)).toBe(fallback);
  });

  it('treats a display-only column pattern as read-pretty mode', () => {
    expect(isSubTableColumnReadPretty({ props: { pattern: 'readPretty' } })).toBe(true);
    expect(isSubTableColumnReadPretty({ props: { readPretty: true } })).toBe(true);
    expect(isSubTableColumnReadPretty({ props: { pattern: 'editable' } })).toBe(false);
  });

  it('treats a saved display-only column pattern as read-pretty during beforeRender restore', () => {
    expect(
      isSubTableColumnConfiguredReadPretty({
        props: {},
        getStepParams: vi.fn(() => ({ pattern: 'readPretty' })),
      }),
    ).toBe(true);
  });

  it('passes the association title field to read-pretty cell field models', () => {
    const relationValue = { id: 1, name: 'Alice' };
    expect(
      getSubTableColumnReadPrettyFieldProps(
        {
          props: {},
          collectionField: {
            targetCollectionTitleFieldName: 'name',
          },
        },
        relationValue,
      ),
    ).toEqual({
      value: relationValue,
      titleField: 'name',
    });
  });

  it('resolves the saved title field before the target collection default', () => {
    expect(
      getSubTableColumnTitleField({
        props: { titleField: 'nickname' },
        subModels: {
          field: {
            props: {
              titleField: 'name',
            },
          },
        },
        collectionField: {
          targetCollectionTitleFieldName: 'title',
        },
      }),
    ).toBe('nickname');
  });

  it('applies the configured title field to a display-only association column', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ SubTableColumnModel, DisplayTitleFieldModel });
    engine.registerActions({ titleField });

    const rolesField = {
      name: 'roles',
      title: 'Roles',
      collection: { name: 'users' },
      targetCollectionTitleFieldName: 'name',
      targetCollection: {
        name: 'roles',
        getField: vi.fn((name: string) => ({
          name,
          getComponentProps: () => ({ componentField: name }),
        })),
      },
      isAssociationField: () => true,
      getComponentProps: () => ({}),
    };

    const column = engine.createModel<SubTableColumnModel>({
      use: SubTableColumnModel,
      uid: 'roles-display-column-title-field',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'roles',
          },
        },
        subTableColumnSettings: {
          pattern: {
            pattern: 'readPretty',
          },
          fieldNames: {
            label: 'nickname',
          },
        },
      },
    });
    column.context.defineProperty('collectionField', { value: rolesField });
    column.context.defineProperty('blockModel', { value: { addAppends: vi.fn() } });
    column.setSubModel('field', {
      use: DisplayTitleFieldModel,
      uid: 'roles-display-field-title-field',
    });

    await column.dispatchEvent('beforeRender');

    expect(column.props.titleField).toBe('nickname');
    expect(column.props.componentField).toBe('nickname');
  });

  it('applies saved display field settings to the inner field during column beforeRender', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ SubTableColumnModel, DisplayTitleFieldModel });

    const rolesCollection = {
      name: 'roles',
      filterTargetKey: 'id',
    };
    const rolesField = {
      name: 'roles',
      title: 'Roles',
      collection: { name: 'users' },
      targetCollection: rolesCollection,
      isAssociationField: () => true,
      getComponentProps: () => ({ titleField: 'name' }),
    };

    const column = engine.createModel<SubTableColumnModel>({
      use: SubTableColumnModel,
      uid: 'roles-title-column',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'roles',
          },
        },
      },
    });
    column.context.defineProperty('collectionField', { value: rolesField });
    column.context.defineProperty('blockModel', { value: { addAppends: vi.fn() } });

    const field = column.setSubModel('field', {
      use: DisplayTitleFieldModel,
      uid: 'roles-title-display',
      stepParams: {
        displayFieldSettings: {
          clickToOpen: {
            clickToOpen: true,
          },
        },
      },
    }) as DisplayTitleFieldModel;

    expect(field.props.clickToOpen).toBeUndefined();

    await column.dispatchEvent('beforeRender');

    expect(field.props.clickToOpen).toBe(true);
  });
});
