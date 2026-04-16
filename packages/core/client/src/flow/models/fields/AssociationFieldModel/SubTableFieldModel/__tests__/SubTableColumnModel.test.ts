/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  canShowSubTableColumnTitleField,
  getSubTableColumnRenderConfigKey,
  isSubTableColumnReadPretty,
  resolveSubTableColumnCurrentObject,
  resolveSubTableColumnReadPrettyDisplayValue,
  resolveSubTableColumnRenderedFieldPath,
  SubTableColumnModel,
  syncSubTableColumnDisplayOnlySettings,
  syncSubTableColumnTitleFieldSelection,
} from '../SubTableColumnModel';

describe('SubTableColumnModel helper methods', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefers the configured fieldSettings init when available', () => {
    const fieldSettingsInit = {
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'users.user_m2o',
    };

    const result = SubTableColumnModel.prototype.getFieldSettingsInitParams.call({
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return fieldSettingsInit;
        }
      },
    });

    expect(result).toEqual(fieldSettingsInit);
  });

  it('falls back to the column field context for rebuilds', () => {
    const result = SubTableColumnModel.prototype.getFieldSettingsInitParams.call({
      getStepParams: () => undefined,
      collectionField: {
        dataSourceKey: 'main',
      },
      context: {
        blockModel: {
          collection: {
            name: 'users',
          },
        },
      },
      fieldPath: 'users.user_m2o',
    });

    expect(result).toEqual({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'users.user_m2o',
    });
  });

  it('merges the saved title field props into rebuilt association field props', () => {
    const result = SubTableColumnModel.prototype.getFieldComponentPropsForSubModel.call({
      props: {},
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'subTableColumnSettings' && stepKey === 'fieldNames') {
          return { label: 'nickname' };
        }
      },
      collectionField: {
        isAssociationField: () => true,
        getComponentProps: () => ({
          allowClear: true,
          fieldNames: {
            label: 'id',
            value: 'id',
          },
        }),
        targetCollection: {
          getField: (fieldName: string) => {
            if (fieldName !== 'nickname') {
              return null;
            }

            return {
              getComponentProps: () => ({
                placeholder: 'Nickname',
              }),
            };
          },
        },
      },
    });

    expect(result).toEqual({
      allowClear: true,
      placeholder: 'Nickname',
      fieldNames: {
        label: 'nickname',
        value: 'id',
      },
    });
  });

  it('prefers the saved fieldNames step params over props when resolving title field', () => {
    const relationValue = { id: 37, nickname: '小云', staffname: '卢云熙' };

    expect(
      resolveSubTableColumnReadPrettyDisplayValue({
        value: relationValue,
        parent: {
          props: { titleField: 'staffname' },
          getStepParams: (flowKey: string, stepKey: string) => {
            if (flowKey === 'subTableColumnSettings' && stepKey === 'fieldNames') {
              return { label: 'nickname' };
            }
          },
          collectionField: { targetCollectionTitleFieldName: 'staffname' },
        } as any,
        columnFieldPath: 'org_o2m.user_m2o',
        renderedFieldPath: 'id',
      }),
    ).toBe(relationValue);
  });

  it('treats pattern=readPretty as display-only for sub-table cells', () => {
    expect(isSubTableColumnReadPretty({ pattern: 'readPretty' })).toBe(true);
    expect(isSubTableColumnReadPretty({ readPretty: true })).toBe(true);
    expect(isSubTableColumnReadPretty({ pattern: 'editable' })).toBe(false);
  });

  it('hides parent title-field settings for display models that disable title fields', () => {
    expect(
      canShowSubTableColumnTitleField({
        collectionField: {
          isAssociationField: () => true,
        },
        model: {
          getProps: () => ({ pattern: 'readPretty' }),
          subModels: {
            field: {
              disableTitleField: true,
            },
          },
        },
      }),
    ).toBe(false);

    expect(
      canShowSubTableColumnTitleField({
        collectionField: {
          isAssociationField: () => true,
        },
        model: {
          getProps: () => ({ pattern: 'readPretty' }),
          subModels: {
            field: {
              disableTitleField: false,
            },
          },
        },
      }),
    ).toBe(true);
  });

  it('syncs display-only model and title-field params into the current subtable flow', () => {
    const setStepParams = vi.fn();

    syncSubTableColumnDisplayOnlySettings({
      flowKey: 'subTableColumnSettings',
      collectionField: {
        isAssociationField: () => true,
        targetCollectionTitleFieldName: 'nickname',
      },
      model: {
        props: {
          titleField: 'staffname',
        },
        subModels: {
          field: {
            use: 'DisplaySubItemFieldModel',
          },
        },
        setStepParams,
      },
    });

    expect(setStepParams).toHaveBeenCalledWith('subTableColumnSettings', 'model', {
      use: 'DisplaySubItemFieldModel',
    });
    expect(setStepParams).toHaveBeenCalledWith('subTableColumnSettings', 'fieldNames', {
      label: 'staffname',
    });
  });

  it('syncs title-field selection into parent props and display model step params', () => {
    const setProps = vi.fn();
    const setStepParams = vi.fn();
    const setParentProps = vi.fn();
    vi.spyOn(DisplayItemModel, 'getDefaultBindingByField').mockReturnValue({
      modelName: 'DisplayTextFieldModel',
    } as any);

    const result = syncSubTableColumnTitleFieldSelection(
      {
        flowKey: 'subTableColumnSettings',
        collectionField: {
          targetCollection: {
            getField: (fieldName: string) => {
              if (fieldName !== 'staffname') {
                return null;
              }

              return {
                getComponentProps: () => ({
                  placeholder: 'Staff name',
                }),
                interface: 'input',
              };
            },
          },
        },
        model: {
          parent: {
            setProps: setParentProps,
          },
          setProps,
          setStepParams,
          subModels: {
            field: {
              use: 'DisplayNumberFieldModel',
            },
          },
        },
      },
      'staffname',
    );

    expect(result?.targetUse).toBe('DisplayTextFieldModel');
    expect(setProps).toHaveBeenCalledWith({
      titleField: 'staffname',
      placeholder: 'Staff name',
    });
    expect(setParentProps).toHaveBeenCalledWith({
      __columnRenderKey: expect.any(String),
    });
    expect(setStepParams).toHaveBeenCalledWith('subTableColumnSettings', 'model', {
      use: 'DisplayTextFieldModel',
    });
  });

  it('changes the render config key when title field changes', () => {
    const baseModel = {
      collectionField: {
        targetCollectionTitleFieldName: 'nickname',
      },
      getProps: () => ({
        pattern: 'readPretty',
        width: 180,
      }),
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'subTableColumnSettings' && stepKey === 'fieldNames') {
          return { label: 'nickname' };
        }
      },
      subModels: {
        field: {
          use: 'DisplayTextFieldModel',
          getStepParams: () => ({ fieldPath: 'nickname' }),
        },
      },
      context: {
        fieldPath: 'org_o2m.user_m2o',
      },
    } as any;

    const changedModel = {
      ...baseModel,
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'subTableColumnSettings' && stepKey === 'fieldNames') {
          return { label: 'staffname' };
        }
      },
    } as any;

    expect(getSubTableColumnRenderConfigKey(baseModel)).not.toBe(getSubTableColumnRenderConfigKey(changedModel));
  });

  it('uses the relation object as currentObject when rendering display-only association values', () => {
    const relationValue = { id: 37, staffname: '卢云熙' };
    const rowRecord = { id: 3, user_m2o: relationValue };

    expect(
      resolveSubTableColumnCurrentObject({
        value: relationValue,
        record: rowRecord,
        isReadPretty: true,
      }),
    ).toBe(relationValue);

    expect(
      resolveSubTableColumnCurrentObject({
        value: relationValue,
        record: rowRecord,
        isReadPretty: false,
      }),
    ).toBe(rowRecord);
  });

  it('prefers the nested display field path when resolving readPretty values', () => {
    expect(
      resolveSubTableColumnRenderedFieldPath({
        getStepParams: () => ({ fieldPath: 'org_o2m.user_m2o' }),
        context: { fieldPath: 'org_o2m.user_m2o' },
        subModels: {
          field: {
            getStepParams: () => ({ fieldPath: 'staffname' }),
          },
        },
      }),
    ).toBe('staffname');
  });

  it('passes the relation object through when title-field based display models need it', () => {
    const relationValue = { id: 37, staffname: '卢云熙' };

    expect(
      resolveSubTableColumnReadPrettyDisplayValue({
        value: relationValue,
        parent: {
          props: { titleField: 'staffname' },
          collectionField: { targetCollectionTitleFieldName: 'staffname' },
        },
        columnFieldPath: 'org_o2m.user_m2o',
        renderedFieldPath: 'id',
      }),
    ).toBe(relationValue);
  });

  it('falls back to the nested display model path when no title field is configured', () => {
    expect(
      resolveSubTableColumnReadPrettyDisplayValue({
        value: { id: 37, staffname: '卢云熙' },
        parent: {
          props: {},
          collectionField: { targetCollectionTitleFieldName: undefined },
        },
        columnFieldPath: 'org_o2m.user_m2o',
        renderedFieldPath: 'id',
      }),
    ).toBe(37);
  });

  it('normalizes to-many display-only values from rows payloads for nested subtable fields', () => {
    expect(
      resolveSubTableColumnReadPrettyDisplayValue({
        value: {
          rows: [
            { id: 1, nickname: 'Alice' },
            { id: 2, nickname: 'Bob' },
          ],
        },
        parent: {
          props: {},
          collectionField: {
            isAssociationField: () => true,
            interface: 'o2m',
            targetCollectionTitleFieldName: 'nickname',
          },
        } as any,
        columnFieldPath: 'org_o2m.members',
        renderedFieldPath: 'org_o2m.members',
      }),
    ).toEqual([
      { id: 1, nickname: 'Alice' },
      { id: 2, nickname: 'Bob' },
    ]);
  });

  it('normalizes single relation objects into arrays for nested to-many display models', () => {
    expect(
      resolveSubTableColumnReadPrettyDisplayValue({
        value: { id: 1, nickname: 'Alice' },
        parent: {
          props: {},
          collectionField: {
            isAssociationField: () => true,
            interface: 'm2m',
          },
        } as any,
        columnFieldPath: 'org_o2m.roles',
        renderedFieldPath: 'org_o2m.roles',
      }),
    ).toEqual([{ id: 1, nickname: 'Alice' }]);
  });
});
