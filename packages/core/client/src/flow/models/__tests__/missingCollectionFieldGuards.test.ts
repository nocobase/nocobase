/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { pattern } from '../../actions/pattern';
import { titleField } from '../../actions/titleField';
import { FormItemModel } from '../blocks/form/FormItemModel';
import { TableColumnModel } from '../blocks/table/TableColumnModel';
import { RecordSelectFieldModel } from '../fields/AssociationFieldModel/RecordSelectFieldModel';
import { FilterFormCustomRecordSelectFieldModel } from '../blocks/filter-form/fields/FilterFormCustomRecordSelectFieldModel';

describe('missing collectionField guards', () => {
  it('pattern and titleField actions tolerate missing collectionField', () => {
    const ctx: any = {
      app: { dataSourceManager: {} },
      collectionField: undefined,
      model: {
        props: {},
        parent: undefined,
        context: {},
        subModels: {},
      },
      t: (value: string) => value,
    };

    expect(() => pattern.defaultParams?.(ctx)).not.toThrow();
    expect(pattern.defaultParams?.(ctx)).toEqual({ pattern: 'editable' });
    expect(() => titleField.uiMode?.(ctx)).not.toThrow();
    expect(() => titleField.defaultParams?.(ctx)).not.toThrow();
    expect(titleField.defaultParams?.(ctx)).toEqual({ label: undefined });
  });

  it('form and table flows tolerate missing collectionField', () => {
    const engine = new FlowEngine();
    engine.registerModels({ FormItemModel, TableColumnModel });

    const formItem = engine.createModel<FormItemModel>({
      uid: 'form-item-missing-field',
      use: 'FormItemModel',
    });
    const formFlow: any = formItem.getFlow('editItemSettings');

    expect(() => formFlow.steps.initialValue.defaultParams({ model: formItem })).not.toThrow();
    expect(formFlow.steps.initialValue.defaultParams({ model: formItem })).toEqual({ defaultValue: undefined });
    expect(() => formFlow.steps.titleField.defaultParams({ model: formItem })).not.toThrow();
    expect(formFlow.steps.titleField.defaultParams({ model: formItem })).toEqual({ titleField: undefined });

    const tableColumn = engine.createModel<TableColumnModel>({
      uid: 'table-column-missing-field',
      use: 'TableColumnModel',
    });
    const columnFlow: any = tableColumn.getFlow('tableColumnSettings');

    expect(() => columnFlow.steps.quickEdit.defaultParams({ model: tableColumn })).not.toThrow();
    expect(columnFlow.steps.quickEdit.defaultParams({ model: tableColumn })).toEqual({ editable: false });
    expect(() => columnFlow.steps.fieldNames.defaultParams({ model: tableColumn })).not.toThrow();
    expect(columnFlow.steps.fieldNames.defaultParams({ model: tableColumn })).toEqual({ label: undefined });
  });

  it('record select flows tolerate missing collectionField', () => {
    const engine = new FlowEngine();
    engine.registerModels({ RecordSelectFieldModel, FilterFormCustomRecordSelectFieldModel });

    const recordSelect = engine.createModel<RecordSelectFieldModel>({
      uid: 'record-select-missing-field',
      use: 'RecordSelectFieldModel',
    });
    const recordSelectFlow: any = recordSelect.getFlow('selectSettings');
    expect(() => recordSelectFlow.steps.allowMultiple.defaultParams({ model: recordSelect })).not.toThrow();
    expect(recordSelectFlow.steps.allowMultiple.defaultParams({ model: recordSelect })).toEqual({
      allowMultiple: false,
    });

    const filterRecordSelect = engine.createModel<FilterFormCustomRecordSelectFieldModel>({
      uid: 'filter-record-select-missing-field',
      use: 'FilterFormCustomRecordSelectFieldModel',
    });
    const filterRecordSelectFlow: any = filterRecordSelect.getFlow('selectSettings');
    expect(() => filterRecordSelectFlow.steps.allowMultiple.defaultParams({ model: filterRecordSelect })).not.toThrow();
    expect(filterRecordSelectFlow.steps.allowMultiple.defaultParams({ model: filterRecordSelect })).toEqual({
      allowMultiple: false,
    });
  });
});
