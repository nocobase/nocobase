/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FilterFormItemModel } from '../../../filter-form/FilterFormItemModel';
import { customizeFilterRender } from '../customizeFilterRender';

type TestFieldModel = {
  props: Record<string, unknown>;
  render: () => React.ReactNode;
  setupReactiveRender: ReturnType<typeof vi.fn>;
  _reactiveWrapperCache?: unknown;
  __originalRender?: () => React.ReactNode;
};

const MultipleKeywordsInput = (props: Record<string, unknown>) => {
  return <div data-testid="multiple-keywords-input" {...props} />;
};

function createFieldModel() {
  return {
    props: {
      value: ['1', '2'],
      placeholder: 'runtime placeholder',
      onCompositionStart: vi.fn(),
      onCompositionEnd: vi.fn(),
    },
    render: () => <span data-testid="original-field" />,
    setupReactiveRender: vi.fn(),
  };
}

function createFilterItemModel({
  fieldModel,
  operator = '$in',
  collectionField,
}: {
  fieldModel: TestFieldModel;
  operator?: string;
  collectionField: Record<string, unknown>;
}) {
  return {
    uid: 'filter-item',
    operator,
    collectionField,
    context: {
      app: {
        getComponent: (name: string) => (name === 'MultipleKeywordsInput' ? MultipleKeywordsInput : undefined),
      },
      collectionField,
    },
    subModels: {
      field: fieldModel,
    },
    setProps: vi.fn(),
  } as unknown as FilterFormItemModel;
}

describe('customizeFilterRender action', () => {
  it('uses operator schema components for number filter fields', () => {
    const fieldModel = createFieldModel();
    const model = createFilterItemModel({
      fieldModel,
      collectionField: {
        interface: 'number',
        type: 'integer',
        filterable: {
          operators: [
            { label: 'equals', value: '$eq' },
            {
              label: 'is any of',
              value: '$in',
              schema: {
                'x-component': 'MultipleKeywordsInput',
                'x-component-props': {
                  fieldInterface: 'number',
                  placeholder: 'schema placeholder',
                },
              },
            },
          ],
        },
      },
    });

    customizeFilterRender.handler?.({ model } as any);

    const element = fieldModel.render();
    expect(React.isValidElement(element)).toBe(true);
    expect((element as React.ReactElement).type).toBe(MultipleKeywordsInput);
    expect((element as React.ReactElement).props.fieldInterface).toBe('number');
    expect((element as React.ReactElement).props.placeholder).toBe('runtime placeholder');
    expect((element as React.ReactElement).props.onCompositionStart).toBeNull();
    expect((element as React.ReactElement).props.onCompositionEnd).toBeNull();
    expect(fieldModel.setupReactiveRender).toHaveBeenCalled();
    expect(model.setProps).toHaveBeenCalledWith({ key: 'filter-item-$in' });

    fieldModel.props = {
      ...fieldModel.props,
      value: ['3'],
      placeholder: 'updated runtime placeholder',
    };
    const rerenderedElement = fieldModel.render();
    expect((rerenderedElement as React.ReactElement).props.value).toEqual(['3']);
    expect((rerenderedElement as React.ReactElement).props.placeholder).toBe('updated runtime placeholder');
  });

  it('restores original render when switching to an operator without a schema component', () => {
    const fieldModel = createFieldModel();
    const originalRender = fieldModel.render;
    const model = createFilterItemModel({
      fieldModel,
      collectionField: {
        interface: 'number',
        type: 'integer',
        filterable: {
          operators: [
            { label: 'equals', value: '$eq' },
            {
              label: 'is any of',
              value: '$in',
              schema: {
                'x-component': 'MultipleKeywordsInput',
                'x-component-props': {
                  fieldInterface: 'number',
                },
              },
            },
          ],
        },
      },
    });

    customizeFilterRender.handler?.({ model } as any);
    model.operator = '$eq';
    customizeFilterRender.handler?.({ model } as any);

    expect(fieldModel.render).toBe(originalRender);
    expect(fieldModel.render()).toEqual(<span data-testid="original-field" />);
  });
});
