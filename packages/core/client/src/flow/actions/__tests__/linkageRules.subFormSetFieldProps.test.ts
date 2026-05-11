/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FlowSettingsContextProvider } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { fieldLinkageRules, linkageSetFieldProps, subFormLinkageSetFieldProps } from '../linkageRules';

describe('subFormLinkageSetFieldProps action', () => {
  it('should not throw when engine.getModel returns undefined', () => {
    const setProps = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const ctx: any = {
      model: {
        uid: 'sub-form-uid',
        context: {
          fieldKey: ['roles:0'],
        },
      },
      engine: {
        getModel: vi.fn(() => undefined),
      },
    };

    expect(() => {
      subFormLinkageSetFieldProps.handler(ctx, {
        value: {
          fields: ['missing-field-uid'],
          state: 'disabled',
        },
        setProps,
      });
    }).not.toThrow();

    expect(setProps).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('[subFormLinkageSetFieldProps] Target field model not found', {
      fieldUid: 'missing-field-uid',
      modelUid: 'sub-form-uid',
    });

    warnSpy.mockRestore();
  });

  it('should fallback to master model when fieldKey is missing', () => {
    const setProps = vi.fn();
    const getFork = vi.fn();
    const formItemModel: any = {
      uid: 'field-1',
      getFork,
    };

    const ctx: any = {
      model: {
        context: {},
      },
      engine: {
        getModel: vi.fn(() => formItemModel),
      },
    };

    subFormLinkageSetFieldProps.handler(ctx, {
      value: {
        fields: ['field-1'],
        state: 'disabled',
      },
      setProps,
    });

    expect(getFork).not.toHaveBeenCalled();
    expect(setProps).toHaveBeenCalledWith(formItemModel, { disabled: true });
  });

  it('should fallback to master model when fork model not found', () => {
    const setProps = vi.fn();
    const getFork = vi.fn(() => undefined);
    const formItemModel: any = {
      uid: 'field-2',
      getFork,
    };

    const ctx: any = {
      model: {
        context: {
          fieldKey: ['roles:0'],
        },
      },
      engine: {
        getModel: vi.fn(() => formItemModel),
      },
    };

    subFormLinkageSetFieldProps.handler(ctx, {
      value: {
        fields: ['field-2'],
        state: 'enabled',
      },
      setProps,
    });

    expect(getFork).toHaveBeenCalledTimes(1);
    expect(getFork).toHaveBeenCalledWith('roles:0:field-2');
    expect(setProps).toHaveBeenCalledWith(formItemModel, { disabled: false });
  });

  it('should limit options on the fork model', () => {
    const setProps = vi.fn();
    const selectedOptions = [{ label: 'Open', value: 'open' }];
    const forkModel: any = {
      uid: 'field-3',
      isFork: true,
    };
    const formItemModel: any = {
      uid: 'field-3',
      getFork: vi.fn(() => forkModel),
    };

    const ctx: any = {
      model: {
        context: {
          fieldKey: ['roles:0'],
        },
      },
      engine: {
        getModel: vi.fn(() => formItemModel),
      },
    };

    subFormLinkageSetFieldProps.handler(ctx, {
      value: {
        fields: ['field-3'],
        state: 'limitOptions',
        selectedOptions,
      },
      setProps,
    });

    expect(setProps).toHaveBeenCalledWith(forkModel, { options: selectedOptions });
  });
});

describe('linkageSetFieldProps action', () => {
  it('should limit field options', () => {
    const setProps = vi.fn();
    const selectedOptions = [{ label: 'Draft', value: 'draft' }];
    const fieldComponentModel: any = {
      uid: 'status-field-component',
    };
    const fieldModel: any = {
      uid: 'status-field',
      subModels: {
        field: fieldComponentModel,
      },
    };
    const ctx: any = {
      model: {
        subModels: {
          grid: {
            subModels: {
              items: [fieldModel],
            },
          },
        },
      },
    };

    linkageSetFieldProps.handler(ctx, {
      value: {
        fields: ['status-field'],
        state: 'limitOptions',
        selectedOptions,
      },
      setProps,
    });

    expect(setProps).toHaveBeenCalledWith(fieldComponentModel, { options: selectedOptions });
  });

  it('should sync limited options to existing field forks immediately', async () => {
    const selectedOptions = [{ label: 'Draft', value: 'draft' }];
    const forkModel: any = {
      uid: 'status-field-component',
      isFork: true,
      setProps: vi.fn(),
    };
    const fieldComponentModel: any = {
      uid: 'status-field-component',
      props: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
        ],
      },
      forks: new Set([forkModel]),
      setProps(key: any, value?: any) {
        if (typeof key === 'string') {
          this.props[key] = value;
        } else {
          this.props = { ...this.props, ...key };
        }
      },
    };
    const staleFieldComponentModel: any = {
      uid: 'status-field-component',
      props: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
        ],
      },
      forks: new Set(),
      setProps: vi.fn(),
    };
    const fieldModel: any = {
      uid: 'status-field',
      subModels: {
        field: fieldComponentModel,
      },
    };
    const ctx: any = {
      app: {
        jsonLogic: {
          apply: vi.fn(() => true),
        },
      },
      model: {
        __allModels: [staleFieldComponentModel],
        subModels: {
          grid: {
            subModels: {
              items: [fieldModel],
            },
          },
        },
      },
      getAction: (name: string) => (name === 'linkageSetFieldProps' ? linkageSetFieldProps : null),
      resolveJsonTemplate: vi.fn(async (value) => value),
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-1',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              key: 'action-1',
              name: 'linkageSetFieldProps',
              params: {
                value: {
                  fields: ['status-field'],
                  state: 'limitOptions',
                  selectedOptions,
                },
              },
            },
          ],
        },
      ],
    });

    expect(fieldComponentModel.props.options).toEqual(selectedOptions);
    expect(staleFieldComponentModel.setProps).not.toHaveBeenCalledWith({ options: selectedOptions });
    expect(forkModel.setProps).toHaveBeenCalledWith({ options: selectedOptions });
  });

  it('should not clear form value when limit options reruns after selection', async () => {
    const selectedOptions = [{ label: 'Draft', value: 'draft' }];
    const form = {
      getFieldValue: vi.fn(() => 'draft'),
      setFieldValue: vi.fn(),
    };
    const fieldComponentModel: any = {
      uid: 'status-field-component',
      context: { form },
      props: {
        name: 'status',
        value: undefined,
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
        ],
      },
      setProps(key: any, value?: any) {
        if (typeof key === 'string') {
          this.props[key] = value;
        } else {
          this.props = { ...this.props, ...key };
        }
      },
    };
    const fieldModel: any = {
      uid: 'status-field',
      subModels: {
        field: fieldComponentModel,
      },
    };
    const ctx: any = {
      app: {
        jsonLogic: {
          apply: vi.fn(() => true),
        },
      },
      model: {
        context: { form },
        subModels: {
          grid: {
            subModels: {
              items: [fieldModel],
            },
          },
        },
      },
      getAction: (name: string) => (name === 'linkageSetFieldProps' ? linkageSetFieldProps : null),
      resolveJsonTemplate: vi.fn(async (value) => value),
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-1',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              key: 'action-1',
              name: 'linkageSetFieldProps',
              params: {
                value: {
                  fields: ['status-field'],
                  state: 'limitOptions',
                  selectedOptions,
                },
              },
            },
          ],
        },
      ],
    });

    expect(fieldComponentModel.props.options).toEqual(selectedOptions);
    expect(form.setFieldValue).not.toHaveBeenCalled();
  });

  it('should keep all options selectable after options were limited once', async () => {
    const fieldComponentModel: any = {
      uid: 'status-field-component',
      props: {
        options: [{ label: 'Draft', value: 'draft' }],
      },
    };
    const fieldModel: any = {
      uid: 'status-field',
      props: {
        label: 'Status',
      },
      collectionField: {
        interface: 'select',
        uiSchema: {
          enum: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
        },
      },
      subModels: {
        field: fieldComponentModel,
      },
    };
    const ctx: any = {
      model: {
        translate: (text: string) => text,
        subModels: {
          grid: {
            subModels: {
              items: [fieldModel],
            },
          },
        },
      },
    };
    const Comp: any = linkageSetFieldProps.uiSchema.value['x-component'];
    const value = {
      fields: ['status-field'],
      state: 'limitOptions',
      selectedOptions: [{ label: 'Draft', value: 'draft' }],
    };
    const view = render(
      React.createElement(
        FlowSettingsContextProvider,
        { value: ctx },
        React.createElement(Comp, { value, onChange: () => {} }),
      ),
    );

    const selectors = view.container.querySelectorAll('.ant-select-selector');
    fireEvent.mouseDown(selectors[2] as Element);
    expect(await screen.findByText('Published')).toBeTruthy();
  });

  it('should only show options state for supported single field selection', () => {
    const supportedField: any = {
      uid: 'status-field',
      props: {
        label: 'Status',
      },
      collectionField: {
        interface: 'select',
        uiSchema: {
          enum: [{ label: 'Draft', value: 'draft' }],
        },
      },
      subModels: {
        field: {
          uid: 'status-field-component',
          props: {
            options: [{ label: 'Draft', value: 'draft' }],
          },
        },
      },
    };
    const unsupportedField: any = {
      uid: 'note-field',
      props: {
        label: 'Note',
      },
      collectionField: {
        interface: 'input',
      },
      subModels: {
        field: {
          uid: 'note-field-component',
          props: {},
        },
      },
    };
    const ctx: any = {
      model: {
        translate: (text: string) => text,
        subModels: {
          grid: {
            subModels: {
              items: [supportedField, unsupportedField],
            },
          },
        },
      },
    };
    const Comp: any = linkageSetFieldProps.uiSchema.value['x-component'];

    const { rerender } = render(
      React.createElement(
        FlowSettingsContextProvider,
        { value: ctx },
        React.createElement(Comp, {
          value: {
            fields: ['status-field'],
            state: 'limitOptions',
          },
          onChange: () => {},
        }),
      ),
    );

    expect(screen.getAllByText('Options')).toHaveLength(2);

    rerender(
      React.createElement(
        FlowSettingsContextProvider,
        { value: ctx },
        React.createElement(Comp, {
          value: {
            fields: ['status-field', 'note-field'],
            state: 'limitOptions',
          },
          onChange: () => {},
        }),
      ),
    );

    expect(screen.queryAllByText('Options')).toHaveLength(1);
  });

  it('should clear selected options when changing fields under limit options', () => {
    const statusField: any = {
      uid: 'status-field',
      props: {
        label: 'Status',
      },
      collectionField: {
        interface: 'select',
        uiSchema: {
          enum: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
        },
      },
      subModels: {
        field: {
          uid: 'status-field-component',
          props: {
            options: [
              { label: 'Draft', value: 'draft' },
              { label: 'Published', value: 'published' },
            ],
          },
        },
      },
    };
    const categoryField: any = {
      uid: 'category-field',
      props: {
        label: 'Category',
      },
      collectionField: {
        interface: 'select',
        uiSchema: {
          enum: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
        },
      },
      subModels: {
        field: {
          uid: 'category-field-component',
          props: {
            options: [
              { label: 'A', value: 'a' },
              { label: 'B', value: 'b' },
            ],
          },
        },
      },
    };
    const ctx: any = {
      model: {
        translate: (text: string) => text,
        subModels: {
          grid: {
            subModels: {
              items: [statusField, categoryField],
            },
          },
        },
      },
    };
    const onChange = vi.fn();
    const Comp: any = linkageSetFieldProps.uiSchema.value['x-component'];
    const view = render(
      React.createElement(
        FlowSettingsContextProvider,
        { value: ctx },
        React.createElement(Comp, {
          value: {
            fields: ['status-field'],
            state: 'limitOptions',
            selectedOptions: [{ label: 'Draft', value: 'draft' }],
          },
          onChange,
        }),
      ),
    );

    const selectors = view.container.querySelectorAll('.ant-select-selector');
    fireEvent.mouseDown(selectors[0] as Element);
    fireEvent.click(screen.getByText('Category'));

    expect(onChange).toHaveBeenLastCalledWith({
      fields: ['status-field', 'category-field'],
      state: undefined,
      selectedOptions: [],
    });
  });
});
