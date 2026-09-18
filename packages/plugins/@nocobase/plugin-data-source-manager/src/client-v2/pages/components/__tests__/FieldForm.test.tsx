/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.fn(() => Promise.resolve({ data: { data: {} } }));
const reload = vi.fn(() => Promise.resolve());
const validate = vi.fn(() => Promise.resolve());
const relationValidate = vi.fn(() => Promise.resolve());
const normalizeValues = vi.fn((values: Record<string, unknown>) => ({
  ...values,
  normalized: true,
}));
const notifications = {
  error: vi.fn(),
};

const fieldInterfaceConfigure = {
  name: 'input',
  title: '{{t("Input")}}',
  default: {
    interface: 'input',
    type: 'string',
    uiSchema: {
      type: 'string',
    },
  },
  items: [
    {
      name: 'type',
      title: 'Storage type',
      component: 'Select',
      options: [{ label: 'String', value: 'string' }],
      defaultValue: 'string',
      required: true,
    },
    {
      name: 'primaryKey',
      title: 'Primary key',
      component: 'Checkbox',
      defaultValue: false,
    },
    {
      name: 'defaultValue',
      title: 'Default value',
      component: 'Input',
      defaultValue: 'N/A',
    },
    {
      name: 'validation',
      title: 'Validation',
      component: 'FieldValidation',
    },
  ],
  normalizeValues,
  validate,
};

const selectFieldInterfaceConfigure = {
  name: 'select',
  title: '{{t("Select")}}',
  default: {
    interface: 'select',
    type: 'string',
    uiSchema: {
      enum: [{ label: 'Open', value: 'open' }],
      type: 'string',
    },
  },
  items: [
    {
      name: 'type',
      title: 'Storage type',
      component: 'Select',
      options: [{ label: 'String', value: 'string' }],
      defaultValue: 'string',
      required: true,
    },
  ],
  normalizeValues,
  validate,
};

const relationFieldInterfaceConfigure = {
  name: 'belongsTo',
  title: '{{t("Belongs to")}}',
  isAssociation: true,
  default: {
    interface: 'belongsTo',
    type: 'belongsTo',
    source: 'orders',
    autoCreateReverseField: true,
    uiSchema: {
      type: 'object',
    },
    reverseField: {
      interface: 'hasMany',
      name: 'orders',
      type: 'hasMany',
      uiSchema: {
        type: 'array',
      },
    },
  },
  items: [
    {
      name: 'target',
      title: 'Target collection',
      component: 'CollectionSelect',
      required: true,
    },
    {
      name: 'sourceKey',
      title: 'Source key',
      component: 'SourceKey',
      required: true,
    },
    {
      name: 'targetKey',
      title: 'Target key',
      component: 'TargetKey',
      required: true,
    },
    {
      name: 'foreignKey',
      title: 'Foreign key',
      component: 'ForeignKey',
      required: true,
      defaultValue: '{{ useNewId("f_") }}',
    },
    {
      name: 'autoCreateReverseField',
      title: 'Auto create reverse field',
      component: 'Checkbox',
      defaultValue: true,
    },
    {
      name: 'reverseField.type',
      title: 'Inverse relationship type',
      component: 'Select',
      disabled: true,
      options: [{ label: 'HasMany', value: 'hasMany' }],
      required: true,
    },
    {
      name: 'reverseField.name',
      title: 'Reverse field name',
      component: 'Input',
      required: true,
    },
    {
      name: 'reverseField.uiSchema.title',
      title: 'Reverse field display name',
      component: 'Input',
    },
  ],
  validate: relationValidate,
};

const plugin = {
  getCollectionTemplate: vi.fn(() => ({
    name: 'general',
    title: 'General collection',
  })),
};

const flowMocks = {
  ctx: {
    api: {
      request: vi.fn((options: { url: string }) => {
        if (options.url === 'dataSources/main/collections:list') {
          return Promise.resolve({
            data: {
              data: [
                {
                  name: 'orders',
                  title: 'Orders',
                  fields: [{ name: 'id', primaryKey: true, uiSchema: { title: 'ID' } }],
                },
                {
                  name: 'customers',
                  title: 'Customers',
                  fields: [{ name: 'id', primaryKey: true, uiSchema: { title: 'ID' } }],
                },
              ],
            },
          });
        }
        return apiRequest(options);
      }),
    },
    app: {
      pm: {
        get: vi.fn(() => plugin),
      },
    },
    dataSourceManager: {
      collectionFieldInterfaceManager: {
        getFieldInterfaceConfigure: vi.fn((name: string) =>
          name === 'belongsTo'
            ? relationFieldInterfaceConfigure
            : name === 'select'
              ? selectFieldInterfaceConfigure
              : fieldInterfaceConfigure,
        ),
        getFieldInterfaces: vi.fn(() => [
          {
            name: 'input',
            title: '{{t("Input")}}',
            default: fieldInterfaceConfigure.default,
          },
          {
            name: 'select',
            title: '{{t("Select")}}',
            default: selectFieldInterfaceConfigure.default,
          },
          {
            name: 'belongsTo',
            title: '{{t("Belongs to")}}',
            default: relationFieldInterfaceConfigure.default,
            isAssociation: true,
          },
        ]),
      },
      getDataSource: vi.fn(() => ({
        options: {
          type: 'main',
        },
        reload,
      })),
    },
  },
  engine: {
    context: {
      t: vi.fn((key: string) => `t:${key}`),
    },
  },
};

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    randomId: (prefix = '') => `${prefix}fixed`,
    useFlowContext: () => flowMocks.ctx,
    useFlowEngine: () => flowMocks.engine,
  };
});

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const MockApp = Object.assign(({ children }: { children: React.ReactNode }) => <div>{children}</div>, {
    useApp: () => ({
      notification: notifications,
    }),
  });

  function flattenOptions(options?: Array<Record<string, unknown>>): Array<{ label: React.ReactNode; value: string }> {
    return (options || []).flatMap((option) =>
      Array.isArray(option.options)
        ? flattenOptions(option.options as Array<Record<string, unknown>>)
        : [{ label: option.label as React.ReactNode, value: String(option.value) }],
    );
  }

  return {
    ...actual,
    App: MockApp,
    Select: ({
      disabled,
      onChange,
      options,
      value,
    }: {
      disabled?: boolean;
      onChange?: (value?: string) => void;
      options?: Array<Record<string, unknown>>;
      value?: string;
    }) => {
      const items = flattenOptions(options);
      return (
        <select
          data-testid="mock-select"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange?.(event.currentTarget.value || undefined)}
        >
          <option value="" />
          {items.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    },
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    DrawerFormLayout: ({
      children,
      onSubmit,
      submitText,
      title,
    }: {
      children: React.ReactNode;
      onSubmit?: () => void | Promise<void>;
      submitText?: string;
      title: string;
    }) => (
      <section aria-label={title}>
        {children}
        <button
          type="button"
          onClick={() => {
            Promise.resolve(onSubmit?.()).catch(() => undefined);
          }}
        >
          {submitText || 'Submit'}
        </button>
      </section>
    ),
    evaluateFieldConfigureExpression: (value: unknown) => Boolean(value),
    fieldValidationConfigureRegistry: {
      getGroup: () => [
        {
          key: 'required',
          label: 'Required',
        },
      ],
    },
    getCoreFieldConfigureState: () => ({}),
    runCoreFieldConfigureEffects: vi.fn(),
    useCurrentAppInfo: () => ({
      database: {
        dialect: 'postgres',
      },
    }),
  };
});

vi.mock('../collectionFieldApi', () => ({
  getCollectionFieldActionUrl: (_dataSourceKey: string, _collectionName: string, action: string, fieldName?: string) =>
    fieldName ? `collectionFields:${action}:${fieldName}` : `collectionFields:${action}`,
}));

import { FieldForm } from '../FieldForm';

const collection = {
  name: 'orders',
  title: '{{t("Orders")}}',
  template: 'general',
  fields: [{ name: 'id', primaryKey: true }],
};

function renderFieldForm(props: Partial<React.ComponentProps<typeof FieldForm>> = {}) {
  const onSubmitted = props.onSubmitted || vi.fn();
  render(
    <App>
      <FieldForm
        mode="create"
        dataSourceKey="main"
        collection={collection}
        interfaceName="input"
        onSubmitted={onSubmitted}
        {...props}
      />
    </App>,
  );
  return { onSubmitted };
}

describe('FieldForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a field with configured defaults and normalized values', async () => {
    const { onSubmitted } = renderFieldForm();

    fireEvent.change(await screen.findByLabelText('t:Field display name'), {
      target: { value: 'Customer name' },
    });
    fireEvent.change(screen.getByLabelText('t:Field name'), {
      target: { value: 'customerName' },
    });
    fireEvent.click(screen.getByText('t:Submit'));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith({
        url: 'collectionFields:create',
        method: 'post',
        data: expect.objectContaining({
          name: 'customerName',
          interface: 'input',
          type: 'string',
          defaultValue: 'N/A',
          normalized: true,
          uiSchema: expect.objectContaining({
            title: 'Customer name',
          }),
        }),
      }),
    );
    expect(validate).toHaveBeenCalled();
    expect(normalizeValues).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
    expect(onSubmitted).toHaveBeenCalled();
  });

  it('updates an existing field without allowing the field name to change', async () => {
    const onSubmitted = vi.fn();
    renderFieldForm({
      mode: 'edit',
      field: {
        name: 'title',
        interface: 'input',
        type: 'string',
        uiSchema: {
          title: 'Title',
        },
      },
      onSubmitted,
    });

    const nameInput = await screen.findByLabelText('t:Field name');
    expect(nameInput).toBeDisabled();

    fireEvent.change(screen.getByLabelText('t:Field display name'), {
      target: { value: 'Order title' },
    });
    fireEvent.click(screen.getByText('t:Submit'));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith({
        url: 'collectionFields:update:title',
        method: 'post',
        data: expect.objectContaining({
          name: 'title',
          normalized: true,
          uiSchema: expect.objectContaining({
            title: 'Order title',
          }),
        }),
      }),
    );
    expect(onSubmitted).toHaveBeenCalled();
  });

  it('rejects duplicate names even for fields without a UI interface', async () => {
    const { onSubmitted } = renderFieldForm({
      collection: { ...collection, fields: [{ name: 'hidden_fk', type: 'bigInt' }] },
    });
    fireEvent.change(await screen.findByLabelText('t:Field display name'), { target: { value: 'Hidden FK' } });
    fireEvent.change(screen.getByLabelText('t:Field name'), { target: { value: 'hidden_fk' } });
    fireEvent.click(screen.getByText('t:Submit'));

    expect(await screen.findByText('t:Field name already exists')).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('allows recreating a deleted field when the current field list is empty', async () => {
    const { onSubmitted } = renderFieldForm({ collection: { ...collection, fields: [] } });
    fireEvent.change(await screen.findByLabelText('t:Field display name'), { target: { value: 'Status' } });
    fireEvent.change(screen.getByLabelText('t:Field name'), { target: { value: 'status' } });
    fireEvent.click(screen.getByText('t:Submit'));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'collectionFields:create', data: expect.objectContaining({ name: 'status' }) }),
    );
  });

  it('preserves inverse field metadata and edited titles when editing an existing relation', async () => {
    renderFieldForm({
      mode: 'edit',
      interfaceName: 'belongsTo',
      field: {
        name: 'customer',
        interface: 'belongsTo',
        type: 'belongsTo',
        source: 'orders',
        target: 'customers',
        sourceKey: 'id',
        targetKey: 'id',
        foreignKey: 'customerId',
        uiSchema: {
          title: 'Customer',
          type: 'object',
        },
        reverseField: {
          key: 'customers.orders',
          name: 'orders',
          interface: 'hasMany',
          type: 'hasMany',
          uiSchema: {
            title: 'Orders',
            type: 'array',
          },
        },
      },
    });

    expect(await screen.findByRole('checkbox', { name: 'Auto create reverse field' })).toBeChecked();
    fireEvent.change(screen.getByLabelText('t:Field display name'), { target: { value: 'Updated customer' } });
    fireEvent.change(screen.getByLabelText('Reverse field display name'), { target: { value: 'Updated orders' } });
    fireEvent.click(screen.getByText('t:Submit'));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'collectionFields:update:customer',
          data: expect.objectContaining({
            uiSchema: expect.objectContaining({ title: 'Updated customer', type: 'object' }),
            reverseField: expect.objectContaining({
              key: 'customers.orders',
              name: 'orders',
              interface: 'hasMany',
              type: 'hasMany',
              uiSchema: expect.objectContaining({ title: 'Updated orders', type: 'array' }),
            }),
          }),
        }),
      ),
    );
  });

  it.each([undefined, null])(
    'initializes an inverse field when the existing relation has reverseField=%s',
    async (reverseField) => {
      renderFieldForm({
        mode: 'edit',
        interfaceName: 'belongsTo',
        field: {
          name: 'customer',
          interface: 'belongsTo',
          type: 'belongsTo',
          source: 'orders',
          target: 'customers',
          sourceKey: 'id',
          targetKey: 'id',
          foreignKey: 'customerId',
          uiSchema: { title: 'Customer', type: 'object' },
          reverseField,
        },
      });

      const checkbox = await screen.findByRole('checkbox', { name: 'Auto create reverse field' });
      expect(checkbox).not.toBeChecked();
      fireEvent.click(checkbox);
      const inverseType = screen
        .getAllByTestId('mock-select')
        .find((select) =>
          Array.from((select as HTMLSelectElement).options).some((option) => option.value === 'hasMany'),
        );
      expect(inverseType).toBeDisabled();
      expect(inverseType).toHaveValue('hasMany');
      expect(screen.getByLabelText('Reverse field name')).toHaveValue('f_fixed');
      expect(screen.getByLabelText('Reverse field display name')).toHaveValue('t:Orders');
      fireEvent.click(screen.getByText('t:Submit'));

      await waitFor(() =>
        expect(apiRequest).toHaveBeenCalledWith({
          url: 'collectionFields:update:customer',
          method: 'post',
          data: expect.objectContaining({
            reverseField: expect.objectContaining({
              name: 'f_fixed',
              type: 'hasMany',
              uiSchema: expect.objectContaining({ title: 't:Orders' }),
            }),
          }),
        }),
      );
      expect(relationFieldInterfaceConfigure.default.reverseField.name).toBe('orders');
      expect(relationFieldInterfaceConfigure.default.reverseField.uiSchema).toEqual({ type: 'array' });

      apiRequest.mockClear();
      fireEvent.click(checkbox);
      fireEvent.click(screen.getByText('t:Submit'));
      await waitFor(() => expect(apiRequest).toHaveBeenCalled());
      expect(apiRequest.mock.calls[0][0].data).not.toHaveProperty('reverseField');
    },
  );

  it('rebuilds initial values when changing the field interface before creating a field', async () => {
    renderFieldForm({ interfaceName: undefined });

    fireEvent.change(screen.getAllByTestId('mock-select')[0], {
      target: { value: 'select' },
    });
    fireEvent.change(await screen.findByLabelText('t:Field display name'), {
      target: { value: 'Status' },
    });
    fireEvent.change(screen.getByLabelText('t:Field name'), {
      target: { value: 'status' },
    });
    fireEvent.click(screen.getByText('t:Submit'));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith({
        url: 'collectionFields:create',
        method: 'post',
        data: expect.objectContaining({
          name: 'status',
          interface: 'select',
          type: 'string',
          normalized: true,
          uiSchema: expect.objectContaining({
            title: 'Status',
          }),
        }),
      }),
    );
  });

  it('stops submission when the field interface validation fails', async () => {
    validate.mockRejectedValueOnce(new Error('Invalid field config'));
    renderFieldForm();

    fireEvent.change(await screen.findByLabelText('t:Field display name'), {
      target: { value: 'Customer name' },
    });
    fireEvent.change(screen.getByLabelText('t:Field name'), {
      target: { value: 'customerName' },
    });
    fireEvent.click(screen.getByText('t:Submit'));

    await waitFor(() =>
      expect(notifications.error).toHaveBeenCalledWith({
        message: 'Invalid field config',
      }),
    );
    expect(apiRequest).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('lists the columns that can hold the foreign key and submits the selected one', async () => {
    renderFieldForm({
      interfaceName: 'belongsTo',
      collection: {
        ...collection,
        fields: [
          { name: 'id', primaryKey: true, type: 'bigInt', uiSchema: { title: 'ID' } },
          { name: 'customerId', type: 'bigInt', uiSchema: { title: 'Customer ID' } },
          { name: 'status', type: 'string', uiSchema: { title: 'Status' } },
          { name: 'payload', type: 'json', uiSchema: { title: 'Payload' } },
          { name: 'customers', type: 'hasMany', uiSchema: { title: 'Customers' } },
        ],
      },
    });

    await waitFor(() =>
      expect(flowMocks.ctx.api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'dataSources/main/collections:list',
        }),
      ),
    );
    const foreignKeySelect = screen
      .getAllByTestId('mock-select')
      .find((select) =>
        Array.from((select as HTMLSelectElement).options).some((option) => option.value === 'customerId'),
      ) as HTMLSelectElement;
    expect(Array.from(foreignKeySelect.options).map((option) => option.value)).toEqual([
      '',
      'id',
      'customerId',
      'status',
    ]);

    const selects = screen.getAllByTestId('mock-select');
    fireEvent.change(screen.getByLabelText('t:Field display name'), {
      target: { value: 'Customer' },
    });
    fireEvent.change(screen.getByLabelText('t:Field name'), {
      target: { value: 'customer' },
    });
    fireEvent.change(selects[0], { target: { value: 'customers' } });
    fireEvent.change(selects[1], { target: { value: 'id' } });
    fireEvent.change(selects[2], { target: { value: 'id' } });
    fireEvent.change(foreignKeySelect, { target: { value: 'customerId' } });
    fireEvent.click(screen.getByText('t:Submit'));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'collectionFields:create',
          data: expect.objectContaining({ foreignKey: 'customerId' }),
        }),
      ),
    );
  });

  it('creates relation fields with selected keys and normalized reverse field values', async () => {
    renderFieldForm({ interfaceName: 'belongsTo' });

    await waitFor(() =>
      expect(flowMocks.ctx.api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'dataSources/main/collections:list',
        }),
      ),
    );
    fireEvent.change(screen.getByLabelText('t:Field display name'), {
      target: { value: 'Customer' },
    });
    fireEvent.change(screen.getByLabelText('t:Field name'), {
      target: { value: 'customer' },
    });

    const selects = screen.getAllByTestId('mock-select');
    fireEvent.change(selects[0], { target: { value: 'customers' } });
    fireEvent.change(selects[1], { target: { value: 'id' } });
    fireEvent.change(selects[2], { target: { value: 'id' } });
    fireEvent.click(screen.getByText('t:Submit'));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith({
        url: 'collectionFields:create',
        method: 'post',
        data: expect.objectContaining({
          name: 'customer',
          interface: 'belongsTo',
          type: 'belongsTo',
          foreignKey: 'f_fixed',
          sourceKey: 'id',
          target: 'customers',
          targetKey: 'id',
          reverseField: expect.objectContaining({
            name: 'f_fixed',
            uiSchema: expect.objectContaining({
              title: 'Customer',
            }),
          }),
        }),
      }),
    );
    const createCall = apiRequest.mock.calls.find(([options]) => options.url === 'collectionFields:create')?.[0];
    expect(createCall.data.autoCreateReverseField).toBeUndefined();
    expect(relationValidate).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });
});
