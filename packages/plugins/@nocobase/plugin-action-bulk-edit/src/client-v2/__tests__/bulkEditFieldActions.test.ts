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

  it('prefers the inner field binding as default params', () => {
    const ctx = createFieldComponentContext({
      bindings: [{ modelName: 'DefaultFieldModel' }],
      fieldBindingUse: 'StoredFieldModel',
    });

    expect(bulkEditFieldComponent.defaultParams?.(ctx)).toEqual({
      use: 'StoredFieldModel',
    });
  });
});

describe('bulkEditTitleField', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
