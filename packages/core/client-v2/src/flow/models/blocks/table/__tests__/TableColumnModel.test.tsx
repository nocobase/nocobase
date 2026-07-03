/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { TableColumnModel } from '../TableColumnModel';

describe('TableColumnModel sorter settings', () => {
  it('clamps custom column width to the minimum value', () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({ uid: 'table-column-min-width', flowEngine: engine } as any);
    const widthStep = model.getFlow('tableColumnSettings')?.steps?.width as any;
    const setProps = vi.fn();

    widthStep.handler(
      {
        model: {
          setProps,
        },
      },
      { width: 0 },
    );

    expect(setProps).toHaveBeenCalledWith('width', 10);
  });

  it('hides quick edit setting for relation path columns added from association groups', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({ uid: 'table-column-relation-path-quick-edit', flowEngine: engine } as any);
    const quickEditStep = model.getFlow('tableColumnSettings')?.steps?.quickEdit as any;

    const hidden = await quickEditStep.hideInSettings({
      model: {
        associationPathName: 'department',
      },
    });

    expect(hidden).toBe(true);
  });

  it('keeps quick edit disabled for relation path columns even when params enable it', () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({
      uid: 'table-column-relation-path-disable-quick-edit',
      flowEngine: engine,
    } as any);
    const quickEditStep = model.getFlow('tableColumnSettings')?.steps?.quickEdit as any;
    const setProps = vi.fn();

    quickEditStep.handler(
      {
        model: {
          associationPathName: 'department',
          setProps,
        },
      },
      { editable: true },
    );

    expect(setProps).toHaveBeenCalledWith('editable', false);
  });

  it('hides sortable setting for association fields', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({ uid: 'table-column-association-sorter', flowEngine: engine } as any);
    const sorterStep = model.getFlow('tableColumnSettings')?.steps?.sorter as any;

    const hidden = await sorterStep.hideInSettings({
      model: {
        collectionField: {
          getInterfaceOptions: () => ({ sortable: true }),
        },
      },
      collectionField: {
        isAssociationField: () => true,
      },
    });

    expect(hidden).toBe(true);
  });

  it('keeps sortable setting visible for sortable non-association fields', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({ uid: 'table-column-basic-sorter', flowEngine: engine } as any);
    const sorterStep = model.getFlow('tableColumnSettings')?.steps?.sorter as any;

    const hidden = await sorterStep.hideInSettings({
      model: {
        collectionField: {
          getInterfaceOptions: () => ({ sortable: true }),
        },
      },
      collectionField: {
        isAssociationField: () => false,
      },
    });

    expect(hidden).toBeFalsy();
  });

  it('hides sortable setting for relation path columns added from association groups', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({ uid: 'table-column-relation-path-sorter', flowEngine: engine } as any);
    const sorterStep = model.getFlow('tableColumnSettings')?.steps?.sorter as any;

    const hidden = await sorterStep.hideInSettings({
      model: {
        associationPathName: 'department',
        collectionField: {
          getInterfaceOptions: () => ({ sortable: true }),
        },
      },
      collectionField: {
        isAssociationField: () => false,
      },
    });

    expect(hidden).toBe(true);
  });

  it('updates field component setting when association title field changes', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({ uid: 'table-column-title-field-component', flowEngine: engine } as any);
    const titleFieldStep = model.getFlow('tableColumnSettings')?.steps?.fieldNames as any;
    const setStepParams = vi.fn();
    const setProps = vi.fn();
    const setFieldProps = vi.fn();
    const dispatchEvent = vi.fn();
    const saveFieldModel = vi.fn();
    const targetCollectionField = {
      getComponentProps: () => ({
        format: 'hh:mm:ss a',
        timeFormat: 'hh:mm:ss a',
      }),
    };

    await titleFieldStep.beforeParamsSave(
      {
        collectionField: {
          isAssociationField: () => true,
          targetCollection: {
            name: 'departments',
            getField: () => targetCollectionField,
          },
        },
        model: {
          collectionField: {
            dataSourceKey: 'main',
          },
          constructor: {
            getDefaultBindingByField: () => ({
              modelName: 'DisplayTextFieldModel',
            }),
          },
          subModels: {
            field: {
              use: 'DisplayTextFieldModel',
              setProps: setFieldProps,
              setStepParams,
              dispatchEvent,
              save: saveFieldModel,
            },
          },
          setStepParams,
          setProps,
        },
      },
      { label: 'code' },
      { label: 'name' },
    );

    expect(setStepParams).toHaveBeenCalledWith('tableColumnSettings', 'model', { use: 'DisplayTextFieldModel' });
    expect(setFieldProps).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'hh:mm:ss a',
        timeFormat: 'hh:mm:ss a',
        titleField: 'code',
      }),
    );
    expect(setProps).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'hh:mm:ss a',
        timeFormat: 'hh:mm:ss a',
        titleField: 'code',
      }),
    );
    expect(saveFieldModel).toHaveBeenCalled();
  });

  it('clears stale datetime display props when association title field changes to date only', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({ uid: 'table-column-title-field-date-only', flowEngine: engine } as any);
    const titleFieldStep = model.getFlow('tableColumnSettings')?.steps?.fieldNames as any;
    const setStepParams = vi.fn();
    const setProps = vi.fn();
    const setFieldProps = vi.fn();
    const targetCollectionField = {
      getComponentProps: () => ({
        dateOnly: true,
        showTime: false,
      }),
    };

    await titleFieldStep.beforeParamsSave(
      {
        collectionField: {
          isAssociationField: () => true,
          targetCollection: {
            name: 'departments',
            getField: () => targetCollectionField,
          },
        },
        model: {
          collectionField: {
            dataSourceKey: 'main',
          },
          constructor: {
            getDefaultBindingByField: () => ({
              modelName: 'DisplayDateTimeFieldModel',
            }),
          },
          subModels: {
            field: {
              use: 'DisplayDateTimeFieldModel',
              setProps: setFieldProps,
              setStepParams,
              dispatchEvent: vi.fn(),
              save: vi.fn(),
            },
          },
          setStepParams,
          setProps,
        },
      },
      { label: 'dateOnly' },
      { label: 'time' },
    );

    expect(setFieldProps).toHaveBeenCalledWith(
      expect.objectContaining({
        dateOnly: true,
        format: undefined,
        showTime: false,
        timeFormat: undefined,
        titleField: 'dateOnly',
      }),
    );
    expect(setProps).toHaveBeenCalledWith(
      expect.objectContaining({
        dateOnly: true,
        format: undefined,
        showTime: false,
        timeFormat: undefined,
        titleField: 'dateOnly',
      }),
    );
  });

  it('keeps saved association title datetime format when table column initializes again', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({
      uid: 'table-column-title-field-saved-datetime-format',
      flowEngine: engine,
    } as any);
    const initStep = model.getFlow('tableColumnSettings')?.steps?.init as any;
    const setProps = vi.fn();
    const targetCollectionField = {
      getComponentProps: () => ({
        dateFormat: 'YYYY-MM-DD',
        format: 'YYYY-MM-DD HH:mm:ss',
        showTime: true,
        timeFormat: 'HH:mm:ss',
      }),
    };

    await initStep.handler({
      model: {
        context: {
          collectionField: {
            title: 'Shipments',
            name: 'shipments',
            isAssociationField: () => true,
            getComponentProps: () => ({
              fieldNames: {
                label: 'shipmentsDatetime',
              },
            }),
            targetCollection: {
              getField: () => targetCollectionField,
            },
          },
        },
        props: {
          titleField: 'shipmentsDatetime',
        },
        subModels: {
          field: {
            getStepParams: (flowKey, stepKey) =>
              flowKey === 'datetimeSettings' && stepKey === 'dateFormat'
                ? {
                    picker: 'date',
                    dateFormat: 'YYYY-MM-DD',
                    showTime: true,
                    timeFormat: 'h:mm a',
                  }
                : undefined,
          },
        },
        applySubModelsBeforeRenderFlows: vi.fn(),
        setProps,
      },
    });

    expect(setProps).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFormat: 'YYYY-MM-DD',
        format: 'YYYY-MM-DD h:mm a',
        showTime: true,
        timeFormat: 'h:mm a',
      }),
    );
  });

  it('keeps saved ordinary datetime format when table column initializes again', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({
      uid: 'table-column-saved-datetime-format',
      flowEngine: engine,
    } as any);
    const initStep = model.getFlow('tableColumnSettings')?.steps?.init as any;
    const setProps = vi.fn();

    await initStep.handler({
      model: {
        context: {
          collectionField: {
            title: 'Datetime',
            name: 'datetime',
            isAssociationField: () => false,
            getComponentProps: () => ({
              dateFormat: 'YYYY-MM-DD',
              showTime: false,
            }),
          },
        },
        props: {},
        subModels: {
          field: {
            getStepParams: (flowKey, stepKey) =>
              flowKey === 'datetimeSettings' && stepKey === 'dateFormat'
                ? {
                    picker: 'date',
                    dateFormat: 'YYYY-MM-DD',
                    showTime: true,
                    timeFormat: 'HH:mm:ss',
                  }
                : undefined,
          },
        },
        applySubModelsBeforeRenderFlows: vi.fn(),
        setProps,
      },
    });

    expect(setProps).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFormat: 'YYYY-MM-DD',
        format: 'YYYY-MM-DD HH:mm:ss',
        showTime: true,
        timeFormat: 'HH:mm:ss',
      }),
    );
  });

  it('does not update field component setting when title field refresh fails', async () => {
    const engine = new FlowEngine();
    const model = new TableColumnModel({ uid: 'table-column-title-field-component-failed', flowEngine: engine } as any);
    const titleFieldStep = model.getFlow('tableColumnSettings')?.steps?.fieldNames as any;
    const setStepParams = vi.fn();
    const setProps = vi.fn();
    const targetCollectionField = {
      getComponentProps: () => ({}),
    };

    await expect(
      titleFieldStep.beforeParamsSave(
        {
          collectionField: {
            isAssociationField: () => true,
            targetCollection: {
              name: 'departments',
              getField: () => targetCollectionField,
            },
          },
          model: {
            collectionField: {
              dataSourceKey: 'main',
            },
            constructor: {
              getDefaultBindingByField: () => ({
                modelName: 'DisplayTextFieldModel',
              }),
            },
            subModels: {
              field: {
                use: 'DisplayTextFieldModel',
                setProps: vi.fn(),
                setStepParams: vi.fn(),
                dispatchEvent: vi.fn().mockRejectedValue(new Error('beforeRender failed')),
                save: vi.fn(),
              },
            },
            setStepParams,
            setProps,
          },
        },
        { label: 'code' },
        { label: 'name' },
      ),
    ).rejects.toThrow('beforeRender failed');

    expect(setStepParams).not.toHaveBeenCalledWith('tableColumnSettings', 'model', expect.anything());
  });
});
