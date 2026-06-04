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
import { FlowEngine, FlowModel, FlowSettingsContextProvider } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import {
  fieldLinkageRules,
  linkageAssignField,
  linkageSetFieldProps,
  subFormFieldLinkageRules,
  subFormLinkageSetFieldProps,
} from '../linkageRules';

const createSubFormFieldModel = ({
  uid,
  fieldPath,
  hidden,
  blockUid = 'block-1',
  fieldIndex,
  fieldPathArray,
}: {
  uid: string;
  fieldPath: string;
  hidden: boolean;
  blockUid?: string;
  fieldIndex?: string[];
  fieldPathArray?: Array<string | number>;
}) => ({
  uid,
  hidden,
  props: {},
  context: {
    blockModel: { uid: blockUid },
    ...(fieldIndex ? { fieldIndex } : {}),
    ...(fieldPathArray ? { fieldPathArray } : {}),
  },
  forks: new Set(),
  getStepParams: (flowKey: string, stepKey: string) => {
    if (flowKey === 'fieldSettings' && stepKey === 'init') {
      return { fieldPath };
    }
  },
  setProps(key: any, value?: any) {
    if (typeof key === 'string') {
      this.props[key] = value;
    } else {
      this.props = { ...this.props, ...key };
    }
  },
});

const runSubFormFieldStateRule = async ({
  state,
  fieldUid,
  fieldKey,
  targetModel,
  models,
}: {
  state: 'visible' | 'hidden';
  fieldUid: string;
  fieldKey: string[];
  targetModel: any;
  models: any[];
}) => {
  const formItemModel: any = {
    uid: fieldUid,
    forks: new Set([targetModel]),
    getFork: vi.fn((key: string) => (key === `${fieldKey}:${fieldUid}` ? targetModel : undefined)),
  };
  const allModels = [formItemModel, ...models];
  const ctx: any = {
    app: {
      jsonLogic: {
        apply: vi.fn(() => true),
      },
    },
    model: {
      context: {
        blockModel: { uid: 'block-1' },
        fieldKey,
      },
      flowEngine: {
        forEachModel: (visitor: (model: any) => void) => {
          allModels.forEach(visitor);
        },
      },
    },
    engine: {
      getModel: vi.fn((uid: string) => (uid === fieldUid ? formItemModel : undefined)),
      forEachModel: (visitor: (model: any) => void) => {
        allModels.forEach(visitor);
      },
    },
    getAction: (name: string) => (name === 'subFormLinkageSetFieldProps' ? subFormLinkageSetFieldProps : null),
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
            name: 'subFormLinkageSetFieldProps',
            params: {
              value: {
                fields: [fieldUid],
                state,
              },
            },
          },
        ],
      },
    ],
  });
};

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

  it('should sync hidden state when a subform field changes from hidden to visible', async () => {
    const targetModel = createSubFormFieldModel({
      uid: 'field-a',
      fieldPath: 'a',
      hidden: true,
      fieldIndex: ['items:0'],
    });
    const collectedModel = createSubFormFieldModel({
      uid: 'field-a-collected',
      fieldPath: 'a',
      hidden: true,
      fieldPathArray: ['items', 0, 'a'],
    });

    await runSubFormFieldStateRule({
      state: 'visible',
      fieldUid: 'field-a',
      fieldKey: ['items:0'],
      targetModel,
      models: [collectedModel],
    });

    expect(targetModel.hidden).toBe(false);
    expect(collectedModel.hidden).toBe(false);
  });

  it('should sync hidden state when a subform field changes from visible to hidden', async () => {
    const targetModel = createSubFormFieldModel({
      uid: 'field-a',
      fieldPath: 'a',
      hidden: false,
      fieldIndex: ['items:0'],
    });
    const collectedModel = createSubFormFieldModel({
      uid: 'field-a-collected',
      fieldPath: 'a',
      hidden: false,
      fieldPathArray: ['items', 0, 'a'],
    });

    await runSubFormFieldStateRule({
      state: 'hidden',
      fieldUid: 'field-a',
      fieldKey: ['items:0'],
      targetModel,
      models: [collectedModel],
    });

    expect(targetModel.hidden).toBe(true);
    expect(collectedModel.hidden).toBe(true);
  });

  it('should only sync hidden state for the current subform row', async () => {
    const targetModel = createSubFormFieldModel({
      uid: 'field-a',
      fieldPath: 'a',
      hidden: true,
      fieldIndex: ['items:0'],
    });
    const row0CollectedModel = createSubFormFieldModel({
      uid: 'field-a-row-0',
      fieldPath: 'a',
      hidden: true,
      fieldPathArray: ['items', 0, 'a'],
    });
    const row1CollectedModel = createSubFormFieldModel({
      uid: 'field-a-row-1',
      fieldPath: 'a',
      hidden: true,
      fieldPathArray: ['items', 1, 'a'],
    });

    await runSubFormFieldStateRule({
      state: 'visible',
      fieldUid: 'field-a',
      fieldKey: ['items:0'],
      targetModel,
      models: [row0CollectedModel, row1CollectedModel],
    });

    expect(row0CollectedModel.hidden).toBe(false);
    expect(row1CollectedModel.hidden).toBe(true);
  });

  it('should clear the current row value when a subform list field is hidden without reserving value', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const form = {
      getFieldValue: vi.fn((path: Array<string | number>) => {
        if (JSON.stringify(path) === JSON.stringify(['items', 0, 'a'])) {
          return 'row value';
        }
        return undefined;
      }),
      setFieldValue: vi.fn(),
    };
    const engine = new FlowEngine();

    const rowGridFork = new FlowModel({ uid: 'row-grid-fork', flowEngine: engine }) as any;
    rowGridFork.hidden = false;
    rowGridFork.context.defineProperty('fieldKey', { value: ['items:0'] });
    rowGridFork.context.defineProperty('fieldIndex', { value: ['items:0'] });
    rowGridFork.context.defineProperty('form', { value: form });
    rowGridFork.context.defineProperty('setFormValues', { value: setFormValues });
    rowGridFork.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });
    rowGridFork.getAction = vi.fn((name: string) => {
      if (name === 'subFormLinkageSetFieldProps') {
        return subFormLinkageSetFieldProps;
      }
    });

    const targetFieldFork: any = {
      uid: 'field-a',
      isFork: true,
      hidden: false,
      props: {},
      context: {
        fieldIndex: ['items:0'],
      },
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'a' };
        }
      }),
      setProps(key: any, value?: any) {
        if (typeof key === 'string') {
          this.props[key] = value;
        } else {
          this.props = { ...this.props, ...key };
        }
      },
    };

    const formItemModel: any = {
      uid: 'field-a',
      getFork: vi.fn((key: string) => (key === 'items:0:field-a' ? targetFieldFork : undefined)),
    };

    engine.getModel = vi.fn((uid: string) => (uid === 'field-a' ? formItemModel : undefined)) as any;

    await subFormFieldLinkageRules.handler(
      {
        model: {
          hidden: false,
          subModels: {
            grid: {
              forks: [rowGridFork],
            },
          },
        },
        flowKey: 'eventSettings',
      } as any,
      {
        value: [
          {
            key: 'rule-1',
            enable: true,
            condition: { logic: '$and', items: [] },
            actions: [
              {
                name: 'subFormLinkageSetFieldProps',
                params: {
                  value: {
                    fields: ['field-a'],
                    state: 'hidden',
                  },
                },
              },
            ],
          },
        ],
      },
    );

    expect(form.getFieldValue).toHaveBeenCalledWith(['items', 0, 'a']);
    expect(targetFieldFork.hidden).toBe(true);
    expect(setFormValues).toHaveBeenCalledWith(
      [{ path: ['items', 0, 'a'], value: undefined }],
      expect.objectContaining({ source: 'linkage' }),
    );
    expect(form.setFieldValue).not.toHaveBeenCalled();
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

  it('should clear form value when a field is hidden without reserving value', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const form = {
      getFieldValue: vi.fn(() => '123'),
      setFieldValue: vi.fn(),
    };
    const fieldModel: any = {
      uid: 'name-field',
      hidden: false,
      context: { form },
      props: {
        label: 'Name',
      },
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'name' };
        }
      }),
      setProps(key: any, value?: any) {
        if (typeof key === 'string') {
          this.props[key] = value;
        } else {
          this.props = { ...this.props, ...key };
        }
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
      setFormValues,
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
                  fields: ['name-field'],
                  state: 'hidden',
                },
              },
            },
          ],
        },
      ],
    });

    expect(fieldModel.hidden).toBe(true);
    expect(setFormValues).toHaveBeenCalledWith(
      [{ path: ['name'], value: undefined }],
      expect.objectContaining({ source: 'linkage' }),
    );
    expect(form.setFieldValue).not.toHaveBeenCalled();
  });

  it('should keep hidden clear after same-round assignment for the same field', async () => {
    const formValues: { name?: string } = {};
    const setFormValues = vi.fn(async (patches: Array<{ path: Array<string | number>; value: string | undefined }>) => {
      for (const patch of patches) {
        if (patch.path.length === 1 && patch.path[0] === 'name') {
          formValues.name = patch.value;
        }
      }
    });
    const form = {
      getFieldValue: vi.fn((path: Array<string | number>) => {
        if (path.length === 1 && path[0] === 'name') {
          return formValues.name;
        }
        return undefined;
      }),
      setFieldValue: vi.fn(),
    };
    const fieldModel: any = {
      uid: 'name-field',
      hidden: false,
      context: { form },
      props: {
        label: 'Name',
      },
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'name' };
        }
      }),
      setProps(key: any, value?: any) {
        if (typeof key === 'string') {
          this.props[key] = value;
        } else {
          this.props = { ...this.props, ...key };
        }
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
      setFormValues,
      getAction: (name: string) => {
        if (name === 'linkageSetFieldProps') return linkageSetFieldProps;
        if (name === 'linkageAssignField') return linkageAssignField;
        return null;
      },
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
                  fields: ['name-field'],
                  state: 'hidden',
                },
              },
            },
            {
              key: 'action-2',
              name: 'linkageAssignField',
              params: {
                value: [
                  {
                    key: 'assign-1',
                    enable: true,
                    targetPath: 'name',
                    value: 'assigned',
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(fieldModel.hidden).toBe(true);
    expect(formValues.name).toBeUndefined();
    expect(setFormValues).not.toHaveBeenCalled();
    expect(form.setFieldValue).not.toHaveBeenCalled();
  });

  it('should not clear form value when a field is hidden with reserved value', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const form = {
      getFieldValue: vi.fn(() => '123'),
      setFieldValue: vi.fn(),
    };
    const fieldModel: any = {
      uid: 'name-field',
      hidden: false,
      context: { form },
      props: {
        label: 'Name',
      },
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'name' };
        }
      }),
      setProps(key: any, value?: any) {
        if (typeof key === 'string') {
          this.props[key] = value;
        } else {
          this.props = { ...this.props, ...key };
        }
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
      setFormValues,
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
                  fields: ['name-field'],
                  state: 'hiddenReservedValue',
                },
              },
            },
          ],
        },
      ],
    });

    expect(fieldModel.hidden).toBe(false);
    expect(fieldModel.props.hidden).toBe(true);
    expect(setFormValues).not.toHaveBeenCalled();
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
