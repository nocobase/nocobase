/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { AddChildActionModel, PopupActionModel } from '@nocobase/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TreeBlockModel } from '../TreeBlockModel';

describe('TreeBlockModel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates title field sub model with the matched display field model', async () => {
    const titleField = {
      getComponentProps: () => ({ fieldProp: true }),
    };
    const setSubModel = vi.fn(() => ({
      dispatchEvent: vi.fn(),
      save: vi.fn(),
    }));

    vi.spyOn(DisplayItemModel, 'getDefaultBindingByField').mockReturnValue({
      modelName: 'DisplayTextFieldModel',
      defaultProps: { bindingProp: true },
    } as any);

    await TreeBlockModel.prototype.syncTitleFieldSubModel.call(
      {
        collection: {
          dataSourceKey: 'main',
          name: 'posts',
          getField: () => titleField,
        },
        context: {
          app: {},
        },
        flowEngine: {},
        subModels: {},
        getTitleFieldSettingsInitParams: TreeBlockModel.prototype.getTitleFieldSettingsInitParams,
        setSubModel,
      },
      'title',
    );

    expect(setSubModel).toHaveBeenCalledWith(
      'field',
      expect.objectContaining({
        use: 'DisplayTextFieldModel',
        props: expect.objectContaining({
          bindingProp: true,
          fieldProp: true,
          clickToOpen: false,
        }),
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'posts',
              fieldPath: 'title',
            },
          },
        },
      }),
    );
  });

  it('preserves display field settings when the title field binding does not change', async () => {
    const dispatchEvent = vi.fn();
    const setProps = vi.fn();
    const setStepParams = vi.fn();
    const currentFieldModel = {
      use: 'DisplayTextFieldModel',
      getStepParams: vi.fn((flowKey?: string, stepKey?: string) => {
        const stepParams = {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'posts',
              fieldPath: 'title',
            },
          },
          displayFieldSettings: {
            overflowMode: {
              overflowMode: true,
            },
          },
        };

        if (flowKey && stepKey) {
          return stepParams[flowKey]?.[stepKey];
        }

        if (flowKey) {
          return stepParams[flowKey];
        }

        return stepParams;
      }),
      setProps,
      setStepParams,
      dispatchEvent,
    };

    vi.spyOn(DisplayItemModel, 'getDefaultBindingByField').mockReturnValue({
      modelName: 'DisplayTextFieldModel',
      defaultProps: {},
    } as any);

    await TreeBlockModel.prototype.syncTitleFieldSubModel.call(
      {
        collection: {
          dataSourceKey: 'main',
          name: 'posts',
          getField: () => ({
            getComponentProps: () => ({}),
          }),
        },
        context: {
          app: {},
        },
        subModels: {
          field: currentFieldModel,
        },
        getTitleFieldSettingsInitParams: TreeBlockModel.prototype.getTitleFieldSettingsInitParams,
      },
      'title',
    );

    expect(setStepParams).toHaveBeenCalledWith({
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'posts',
          fieldPath: 'title',
        },
      },
      displayFieldSettings: {
        overflowMode: {
          overflowMode: true,
        },
      },
    });
    expect(dispatchEvent).toHaveBeenCalledWith('beforeRender', undefined, { useCache: false });
  });

  it('migrates the legacy FieldModel wrapper to the matched display field model and keeps compatible settings', async () => {
    const dispatchEvent = vi.fn();
    const save = vi.fn();
    const setSubModel = vi.fn(() => ({
      dispatchEvent,
      save,
    }));
    const removeModelWithSubModels = vi.fn();
    const currentFieldModel = {
      uid: 'field-model-uid',
      use: 'FieldModel',
      getStepParams: vi.fn((flowKey?: string, stepKey?: string) => {
        const stepParams = {
          fieldBinding: {
            use: 'DisplayTextFieldModel',
          },
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'posts',
              fieldPath: 'title',
            },
          },
          displayFieldSettings: {
            overflowMode: {
              overflowMode: true,
            },
          },
        };

        if (flowKey && stepKey) {
          return stepParams[flowKey]?.[stepKey];
        }

        if (flowKey) {
          return stepParams[flowKey];
        }

        return stepParams;
      }),
      invalidateFlowCache: vi.fn(),
    };

    vi.spyOn(DisplayItemModel, 'getDefaultBindingByField').mockReturnValue({
      modelName: 'DisplayTextFieldModel',
      defaultProps: {},
    } as any);

    await TreeBlockModel.prototype.syncTitleFieldSubModel.call(
      {
        collection: {
          dataSourceKey: 'main',
          name: 'posts',
          getField: () => ({
            getComponentProps: () => ({}),
          }),
        },
        context: {
          app: {},
        },
        flowEngine: {
          removeModelWithSubModels,
        },
        subModels: {
          field: currentFieldModel,
        },
        getTitleFieldSettingsInitParams: TreeBlockModel.prototype.getTitleFieldSettingsInitParams,
        setSubModel,
        save: vi.fn(),
      },
      'title',
      { persist: true },
    );

    expect(removeModelWithSubModels).toHaveBeenCalledWith('field-model-uid');
    expect(setSubModel).toHaveBeenCalledWith(
      'field',
      expect.objectContaining({
        uid: 'field-model-uid',
        use: 'DisplayTextFieldModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'posts',
              fieldPath: 'title',
            },
          },
          displayFieldSettings: {
            overflowMode: {
              overflowMode: true,
            },
          },
        },
      }),
    );
    expect(setSubModel.mock.calls[0][1].stepParams.fieldBinding).toBeUndefined();
    expect(dispatchEvent).toHaveBeenCalledWith('beforeRender', undefined, { useCache: false });
    expect(save).toHaveBeenCalled();
  });

  it('does not carry stale display settings when the title field binding changes', async () => {
    const setSubModel = vi.fn(() => ({
      dispatchEvent: vi.fn(),
    }));
    const currentFieldModel = {
      uid: 'field-model-uid',
      use: 'DisplayNumberFieldModel',
      getStepParams: vi.fn((flowKey?: string, stepKey?: string) => {
        const stepParams = {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'posts',
              fieldPath: 'id',
            },
          },
          numberSettings: {
            format: {
              separator: '0,0.00',
            },
          },
        };

        if (flowKey && stepKey) {
          return stepParams[flowKey]?.[stepKey];
        }

        if (flowKey) {
          return stepParams[flowKey];
        }

        return stepParams;
      }),
      invalidateFlowCache: vi.fn(),
    };

    vi.spyOn(DisplayItemModel, 'getDefaultBindingByField').mockReturnValue({
      modelName: 'DisplayTextFieldModel',
      defaultProps: {},
    } as any);

    await TreeBlockModel.prototype.syncTitleFieldSubModel.call(
      {
        collection: {
          dataSourceKey: 'main',
          name: 'posts',
          getField: () => ({
            getComponentProps: () => ({}),
          }),
        },
        context: {
          app: {},
        },
        flowEngine: {
          removeModelWithSubModels: vi.fn(),
        },
        subModels: {
          field: currentFieldModel,
        },
        getTitleFieldSettingsInitParams: TreeBlockModel.prototype.getTitleFieldSettingsInitParams,
        setSubModel,
      },
      'title',
    );

    expect(setSubModel).toHaveBeenCalledWith(
      'field',
      expect.objectContaining({
        use: 'DisplayTextFieldModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'posts',
              fieldPath: 'title',
            },
          },
        },
      }),
    );
    expect(setSubModel.mock.calls[0][1].stepParams.numberSettings).toBeUndefined();
  });

  it('destroys the persisted field sub model before rebuilding when the title field binding changes', async () => {
    const setSubModel = vi.fn(() => ({
      dispatchEvent: vi.fn(),
      save: vi.fn(),
    }));
    const destroyModel = vi.fn();
    const removeModelWithSubModels = vi.fn();
    const currentFieldModel = {
      uid: 'field-model-uid',
      use: 'DisplayNumberFieldModel',
      getStepParams: vi.fn((flowKey?: string, stepKey?: string) => {
        const stepParams = {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'posts',
              fieldPath: 'id',
            },
          },
        };

        if (flowKey && stepKey) {
          return stepParams[flowKey]?.[stepKey];
        }

        if (flowKey) {
          return stepParams[flowKey];
        }

        return stepParams;
      }),
      invalidateFlowCache: vi.fn(),
    };

    vi.spyOn(DisplayItemModel, 'getDefaultBindingByField').mockReturnValue({
      modelName: 'DisplayTextFieldModel',
      defaultProps: {},
    } as any);

    await TreeBlockModel.prototype.syncTitleFieldSubModel.call(
      {
        collection: {
          dataSourceKey: 'main',
          name: 'posts',
          getField: () => ({
            getComponentProps: () => ({}),
          }),
        },
        context: {
          app: {},
        },
        flowEngine: {
          destroyModel,
          removeModelWithSubModels,
        },
        subModels: {
          field: currentFieldModel,
        },
        getTitleFieldSettingsInitParams: TreeBlockModel.prototype.getTitleFieldSettingsInitParams,
        setSubModel,
        save: vi.fn(),
      },
      'title',
      { persist: true },
    );

    expect(destroyModel).toHaveBeenCalledWith('field-model-uid');
    expect(removeModelWithSubModels).not.toHaveBeenCalled();
  });

  it('injects cached add-child formData before the popup opens during route replay', async () => {
    const engine = new FlowEngine();
    const openView = vi.fn((ctx) => {
      expect(ctx.inputArgs.formData).toEqual({
        parent: { id: 'parent-1', title: 'Parent' },
        parentId: 'parent-1',
      });
    });
    engine.registerModels({ AddChildActionModel, PopupActionModel });
    engine.registerActions({
      openView: {
        name: 'openView',
        handler: openView,
      },
    });

    const cachedFormData = {
      parent: { id: 'parent-1', title: 'Parent' },
      parentId: 'parent-1',
    };
    const blockModel = engine.createModel({
      uid: 'tree-block',
      use: 'FlowModel',
    });
    const collection = {
      name: 'tree',
      dataSourceKey: 'main',
    };
    blockModel.context.defineProperty('blockModel', {
      value: {
        collection,
        dataSource: {
          getAssociation: vi.fn(() => ({ resourceName: 'tree.children' })),
        },
        getTreeAddChildFormDataInputKey: TreeBlockModel.prototype.getTreeAddChildFormDataInputKey,
        getTreeAddChildFormData: vi.fn((actionUid, sourceId) => {
          return actionUid === 'add-child' && sourceId === 'parent-1' ? cachedFormData : undefined;
        }),
      },
    });
    blockModel.context.defineProperty('collection', { value: collection });

    const action = engine.createModel<AddChildActionModel>({
      uid: 'add-child',
      use: 'AddChildActionModel',
      parentId: 'tree-block',
      stepParams: {
        popupSettings: {
          openView: {},
        },
      },
    });

    await action.dispatchEvent('click', {
      sourceId: 'parent-1',
      triggerByRouter: true,
    });

    expect(openView).toHaveBeenCalledTimes(1);
  });
});
