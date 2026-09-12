/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DetailsItemModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bulkEditFieldComponent } from '../flow/bulkEditFieldComponent';
import { bulkEditTitleField } from '../flow/bulkEditTitleField';

type BindingModel = {
  modelName: string;
  defaultProps?: Record<string, unknown> | ((ctx: unknown, collectionField: unknown) => Record<string, unknown>);
};

function createFieldComponentContext(options: {
  pattern?: string;
  titleField?: string;
  bindings?: BindingModel[];
  fieldBindingUse?: string;
}) {
  const modelClass = {
    getBindingsByField: vi.fn(() => options.bindings ?? []),
    getDefaultBindingByField: vi.fn(() => options.bindings?.[0]),
  };
  const titleCollectionField = {
    name: options.titleField,
  };
  const collectionField = {
    targetCollection: {
      getField: vi.fn(() => titleCollectionField),
    },
  };
  const model = {
    props: {
      titleField: options.titleField,
    },
    constructor: modelClass,
    getProps: vi.fn(() => ({
      pattern: options.pattern,
    })),
    subModels: {
      field: {
        use: 'FallbackFieldModel',
        props: {
          fieldNames: {
            label: options.titleField,
          },
        },
        stepParams: options.fieldBindingUse
          ? {
              fieldBinding: {
                use: options.fieldBindingUse,
              },
            }
          : undefined,
      },
    },
  };

  return {
    model,
    collectionField,
    engine: {
      getModelClass: vi.fn((modelName: string) => ({
        meta: {
          label: `${modelName} label`,
        },
      })),
    },
    t: (key: string) => `t:${key}`,
  };
}

describe('bulkEditFieldComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds selectable component options and filters unsupported bulk edit bindings', () => {
    const ctx = createFieldComponentContext({
      bindings: [
        { modelName: 'InputFieldModel' },
        { modelName: 'SubTableFieldModel' },
        { modelName: 'SelectFieldModel' },
      ],
    });

    expect(bulkEditFieldComponent.uiMode?.(ctx)).toEqual({
      type: 'select',
      key: 'use',
      props: {
        options: [
          { label: 't:InputFieldModel label', value: 'InputFieldModel' },
          { label: 't:SelectFieldModel label', value: 'SelectFieldModel' },
        ],
      },
    });
    expect(bulkEditFieldComponent.hideInSettings?.(ctx)).toBeUndefined();
  });

  it('hides settings when there is only one editable binding', () => {
    const ctx = createFieldComponentContext({
      bindings: [{ modelName: 'InputFieldModel' }],
    });

    expect(bulkEditFieldComponent.uiMode?.(ctx)).toBeNull();
    expect(bulkEditFieldComponent.hideInSettings?.(ctx)).toBe(true);
  });

  it('builds read pretty association and title field component option groups', () => {
    vi.spyOn(DetailsItemModel, 'getBindingsByField')
      .mockReturnValueOnce([{ modelName: 'AssociationReadPrettyModel' }] as never)
      .mockReturnValueOnce([{ modelName: 'InputFieldModel' }, { modelName: 'SubTableFieldModel' }] as never);

    const ctx = createFieldComponentContext({
      pattern: 'readPretty',
      titleField: 'name',
    });

    expect(bulkEditFieldComponent.uiMode?.(ctx)).toEqual({
      type: 'select',
      key: 'use',
      props: {
        options: [
          {
            label: 't:AssociationField component',
            options: [{ label: 't:AssociationReadPrettyModel label', value: 'AssociationReadPrettyModel' }],
          },
          {
            label: 't:Title field component',
            options: [{ label: 't:InputFieldModel label', value: 'InputFieldModel' }],
          },
        ],
      },
    });
  });

  it('hides read pretty settings when only one association binding is available and no title field is configured', () => {
    const ctx = createFieldComponentContext({
      bindings: [{ modelName: 'AssociationReadPrettyModel' }],
      pattern: 'readPretty',
    });

    expect(bulkEditFieldComponent.uiMode?.(ctx)).toBeNull();
    expect(bulkEditFieldComponent.hideInSettings?.(ctx)).toBe(true);
  });

  it('uses the inner field label as read pretty title field fallback', () => {
    vi.spyOn(DetailsItemModel, 'getBindingsByField')
      .mockReturnValueOnce([{ modelName: 'AssociationReadPrettyModel' }, { modelName: 'SubTableFieldModel' }] as never)
      .mockReturnValueOnce([{ modelName: 'InputFieldModel' }] as never);

    const ctx = createFieldComponentContext({
      pattern: 'readPretty',
      titleField: undefined,
    });
    ctx.model.subModels.field.props.fieldNames.label = 'nickname';

    expect(bulkEditFieldComponent.uiMode?.(ctx)).toEqual({
      type: 'select',
      key: 'use',
      props: {
        options: [
          {
            label: 't:AssociationField component',
            options: [{ label: 't:AssociationReadPrettyModel label', value: 'AssociationReadPrettyModel' }],
          },
          {
            label: 't:Title field component',
            options: [{ label: 't:InputFieldModel label', value: 'InputFieldModel' }],
          },
        ],
      },
    });
    expect(ctx.collectionField.targetCollection.getField).toHaveBeenCalledWith('nickname');
  });

  it('prefers the inner field binding as default params', () => {
    const ctx = createFieldComponentContext({
      bindings: [{ modelName: 'DefaultFieldModel' }],
      fieldBindingUse: 'StoredFieldModel',
    });

    expect(bulkEditFieldComponent.defaultParams?.(ctx)).toEqual({
      use: 'StoredFieldModel',
    });
  });

  it('falls back to the current inner field use when no stored binding exists', () => {
    const ctx = createFieldComponentContext({
      bindings: [{ modelName: 'DefaultFieldModel' }],
    });

    expect(bulkEditFieldComponent.defaultParams?.(ctx)).toEqual({
      use: 'FallbackFieldModel',
    });
  });

  it('uses a supported binding when the default binding is excluded from bulk edit', () => {
    const ctx = createFieldComponentContext({
      bindings: [{ modelName: 'SubTableFieldModel' }, { modelName: 'InputFieldModel' }],
    });
    ctx.model.subModels.field.use = undefined;

    expect(bulkEditFieldComponent.defaultParams?.(ctx)).toEqual({
      use: 'InputFieldModel',
    });
  });

  it('keeps the existing field component when params are saved without changing the model use', async () => {
    const ctx = createFieldComponentContext({
      bindings: [
        {
          defaultProps: () => ({
            placeholder: 'Title',
          }),
          modelName: 'InputFieldModel',
        },
      ],
    });

    await expect(
      bulkEditFieldComponent.beforeParamsSave?.(
        ctx as never,
        {
          use: 'InputFieldModel',
        },
        {
          use: 'InputFieldModel',
        },
      ),
    ).resolves.toBeUndefined();
  });

  it('rebuilds the field sub model when the selected component changes', async () => {
    const dispatchEvent = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const save = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const removeModelWithSubModels = vi.fn();
    const invalidateFlowCache = vi.fn();
    const ctx = createFieldComponentContext({
      bindings: [
        {
          defaultProps: () => ({
            placeholder: 'Title',
          }),
          modelName: 'InputFieldModel',
        },
      ],
    });
    Object.assign(ctx.model, {
      flowEngine: {
        removeModelWithSubModels,
      },
      getFieldSettingsInitParams: vi.fn(() => ({
        collectionName: 'posts',
        fieldPath: 'title',
      })),
      save,
      setSubModel: vi.fn(() => ({
        dispatchEvent,
      })),
    });
    ctx.model.subModels.field = {
      invalidateFlowCache,
      serialize: vi.fn(() => ({
        subModels: {
          keep: {
            delegateToParent: true,
          },
          remove: {
            delegateToParent: false,
          },
        },
      })),
      stepParams: {
        fieldBinding: {
          use: 'OldFieldModel',
        },
      },
      uid: 'field-uid',
    };

    await bulkEditFieldComponent.beforeParamsSave?.(
      ctx as never,
      {
        use: 'InputFieldModel',
      },
      {
        use: 'OldFieldModel',
      },
    );

    expect(invalidateFlowCache).toHaveBeenCalledWith('beforeRender', true);
    expect(removeModelWithSubModels).toHaveBeenCalledWith('field-uid');
    expect(ctx.model.setSubModel).toHaveBeenCalledWith(
      'field',
      expect.objectContaining({
        props: {
          placeholder: 'Title',
        },
        stepParams: expect.objectContaining({
          fieldBinding: {
            use: 'InputFieldModel',
          },
          fieldSettings: {
            init: {
              collectionName: 'posts',
              fieldPath: 'title',
            },
          },
        }),
        subModels: {
          keep: {
            delegateToParent: true,
          },
        },
        uid: 'field-uid',
      }),
    );
    expect(dispatchEvent).toHaveBeenCalledWith('beforeRender', undefined, { useCache: false });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('rebuilds read pretty title field components from title-field bindings', async () => {
    const dispatchEvent = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const save = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    vi.spyOn(DetailsItemModel, 'getBindingsByField')
      .mockReturnValueOnce([{ modelName: 'AssociationReadPrettyModel' }] as never)
      .mockReturnValueOnce([
        {
          defaultProps: {
            ellipsis: true,
          },
          modelName: 'DisplayTextFieldModel',
        },
      ] as never);
    const ctx = createFieldComponentContext({
      pattern: 'readPretty',
      titleField: 'name',
    });
    Object.assign(ctx.model, {
      flowEngine: {
        removeModelWithSubModels: vi.fn(),
      },
      save,
      setSubModel: vi.fn(() => ({
        dispatchEvent,
      })),
    });
    ctx.model.subModels.field = {
      serialize: vi.fn(() => ({
        subModels: {},
      })),
      uid: undefined,
    };

    await bulkEditFieldComponent.beforeParamsSave?.(
      ctx as never,
      {
        use: 'DisplayTextFieldModel',
      },
      {
        use: 'AssociationReadPrettyModel',
      },
    );

    expect(ctx.collectionField.targetCollection.getField).toHaveBeenCalledWith('name');
    expect(ctx.model.setSubModel).toHaveBeenCalledWith(
      'field',
      expect.objectContaining({
        props: {
          ellipsis: true,
          pattern: 'readPretty',
        },
      }),
    );
    expect(dispatchEvent).toHaveBeenCalledWith('beforeRender', undefined, { useCache: false });
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe('bulkEditTitleField', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rebuilds and saves the display title field before params are persisted', async () => {
    const saveInnerField = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const saveWrapperField = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const dispatchEvent = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const newDisplayField = {
      dispatchEvent,
      save: saveInnerField,
    };
    const innerDisplayField = {
      save: saveWrapperField,
      setSubModel: vi.fn(() => newDisplayField),
      subModels: {
        field: {
          uid: 'old-title-field',
        },
      },
    };
    const ctx = {
      engine: {
        destroyModel: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      },
      model: {
        collectionField: {
          dataSourceKey: 'main',
          target: 'users',
          targetCollection: {
            getField: vi.fn(() => ({ name: 'nickname' })),
          },
        },
        subModels: {
          field: {
            subModels: {
              field: innerDisplayField,
            },
          },
        },
      },
    };

    vi.spyOn(DisplayItemModel, 'getDefaultBindingByField').mockReturnValue({
      modelName: 'DisplayTextFieldModel',
    } as never);

    await bulkEditTitleField.beforeParamsSave?.(
      ctx as never,
      {
        label: 'nickname',
      },
      {
        label: 'name',
      },
    );

    expect(ctx.engine.destroyModel).toHaveBeenCalledWith('old-title-field');
    expect(innerDisplayField.setSubModel).toHaveBeenCalledWith('field', {
      use: 'DisplayTextFieldModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'nickname',
          },
        },
      },
    });
    expect(saveInnerField).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).toHaveBeenCalledWith('beforeRender');
    expect(saveWrapperField).toHaveBeenCalledTimes(1);
  });

  it('updates association fieldNames and rebuilds the display title field', async () => {
    const dispatchEvent = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const innerDisplayField = {
      setSubModel: vi.fn(() => ({
        dispatchEvent,
      })),
      setProps: vi.fn(),
    };
    const wrapperField = {
      setProps: vi.fn(),
      subModels: {
        field: innerDisplayField,
      },
    };
    const targetCollectionField = {
      name: 'name',
    };
    const ctx = {
      model: {
        collectionField: {
          target: 'users',
          dataSourceKey: 'main',
          targetCollection: {
            filterTargetKey: 'id',
            getField: vi.fn(() => targetCollectionField),
          },
        },
        subModels: {
          field: wrapperField,
        },
      },
    };

    vi.spyOn(DisplayItemModel, 'getDefaultBindingByField').mockReturnValue({
      modelName: 'DisplayTextFieldModel',
    } as never);

    await bulkEditTitleField.handler?.(ctx, {
      label: 'name',
    });

    const fieldNames = {
      value: 'id',
      label: 'name',
    };
    expect(innerDisplayField.setProps).toHaveBeenCalledWith({ fieldNames });
    expect(wrapperField.setProps).toHaveBeenCalledWith({ fieldNames });
    expect(innerDisplayField.setSubModel).toHaveBeenCalledWith('field', {
      use: 'DisplayTextFieldModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'name',
          },
        },
      },
    });
    expect(dispatchEvent).toHaveBeenCalledWith('beforeRender');
  });

  it('skips title field handler when target collection is unavailable', async () => {
    const ctx = {
      model: {
        collectionField: {
          targetCollection: null,
        },
      },
    };

    await expect(bulkEditTitleField.handler?.(ctx, { label: 'name' })).resolves.toBeUndefined();
  });
});
