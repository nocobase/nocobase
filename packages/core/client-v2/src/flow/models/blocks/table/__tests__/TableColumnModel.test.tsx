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
    const dispatchEvent = vi.fn();
    const targetCollectionField = {
      getComponentProps: () => ({}),
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
              setStepParams,
              dispatchEvent,
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
                setStepParams: vi.fn(),
                dispatchEvent: vi.fn().mockRejectedValue(new Error('beforeRender failed')),
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
