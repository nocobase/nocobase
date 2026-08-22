/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App, Form, message, Modal } from 'antd';
import type { FormInstance } from 'antd';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ahooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ahooks')>();
  const ReactModule = await import('react');

  type UseRequestOptions = {
    manual?: boolean;
    onError?: (error: unknown) => void;
  };

  type RequestResult = {
    data: unknown;
    loading: boolean;
    refresh: () => void;
    refreshAsync: () => Promise<unknown>;
    run: (...args: unknown[]) => void;
  };

  return {
    ...actual,
    useRequest(service: (...args: unknown[]) => Promise<unknown>, options?: UseRequestOptions) {
      const [, forceUpdate] = ReactModule.useState(0);
      const serviceRef = ReactModule.useRef(service);
      const optionsRef = ReactModule.useRef(options);
      const argsRef = ReactModule.useRef<unknown[]>([]);
      const resultRef = ReactModule.useRef<RequestResult>();

      serviceRef.current = service;
      optionsRef.current = options;

      const getResult = () => {
        if (!resultRef.current) {
          throw new Error('useRequest result has not been initialized.');
        }
        return resultRef.current;
      };

      if (!resultRef.current) {
        const runAsync = async (...args: unknown[]) => {
          argsRef.current = args;
          getResult().loading = true;
          forceUpdate((value) => value + 1);

          try {
            const result = await serviceRef.current(...args);
            getResult().data = result;
            return result;
          } catch (error) {
            optionsRef.current?.onError?.(error);
            throw error;
          } finally {
            getResult().loading = false;
            forceUpdate((value) => value + 1);
          }
        };

        resultRef.current = {
          data: undefined,
          loading: false,
          refresh: () => {
            runAsync(...argsRef.current).catch(() => undefined);
          },
          refreshAsync: () => runAsync(...argsRef.current),
          run: (...args: unknown[]) => {
            runAsync(...args).catch(() => undefined);
          },
        };
      }

      ReactModule.useEffect(() => {
        if (!optionsRef.current?.manual) {
          getResult().run();
        }
      }, []);

      return getResult();
    },
  };
});

import {
  FdwFieldsConfigureItem,
  FdwPreviewConfigureItem,
  FdwRemoteServerConfigureItem,
  FdwRemoteTableConfigureItem,
} from '../FdwCollectionConfigure';

type ConfigureItemProps = React.ComponentProps<typeof FdwFieldsConfigureItem>;

const fieldInterfaces = [
  {
    name: 'input',
    group: 'basic',
    title: 'Input',
    availableTypes: ['string'],
    default: {
      type: 'string',
      uiSchema: {
        'x-component': 'Input',
      },
    },
  },
  {
    name: 'number',
    group: 'basic',
    title: 'Number',
    availableTypes: ['integer'],
    default: {
      type: 'integer',
      uiSchema: {
        'x-component': 'InputNumber',
      },
    },
  },
  {
    name: 'map',
    group: 'advanced',
    title: 'Map',
    availableTypes: ['point'],
    default: {
      type: 'point',
      uiSchema: {
        'x-component': 'Map',
      },
    },
  },
  {
    name: 'belongsTo',
    group: 'relation',
    title: 'Belongs to',
    availableTypes: ['bigInt'],
    default: {
      type: 'bigInt',
    },
  },
  {
    name: 'checkbox',
    availableTypes: ['boolean'],
    default: {
      type: 'boolean',
      uiSchema: {
        'x-component': 'Checkbox',
      },
    },
  },
];

function createFieldInterfaceManager() {
  return {
    getFieldInterface: vi.fn((name?: string) => fieldInterfaces.find((item) => item.name === name)),
    getFieldInterfaceGroups: vi.fn(() => ({
      basic: { label: 'Basic', order: 1 },
      advanced: { label: 'Advanced', order: 2 },
      relation: { label: 'Relation', order: 3 },
    })),
    getFieldInterfaces: vi.fn(() => fieldInterfaces),
  };
}

function createEngine(options?: { api?: Record<string, unknown> }) {
  const engine = new FlowEngine();
  engine.context.defineMethod('t', (key: string) => `t:${key}`);
  engine.context.defineProperty('api', {
    value: options?.api || {
      resource: vi.fn(),
    },
  });
  engine.context.defineProperty('dataSourceManager', {
    value: {
      collectionFieldInterfaceManager: createFieldInterfaceManager(),
    },
  });
  return engine;
}

function renderConfigureItem(
  Component: React.ComponentType<ConfigureItemProps>,
  options?: {
    api?: Record<string, unknown>;
    initialValues?: Record<string, unknown>;
    mode?: ConfigureItemProps['mode'];
    registerNames?: string[];
  },
) {
  const engine = createEngine({ api: options?.api });
  let formRef: FormInstance | undefined;

  function Harness() {
    const [form] = Form.useForm();
    formRef = form;

    React.useEffect(() => {
      if (options?.initialValues) {
        form.setFieldsValue(options.initialValues);
      }
    }, [form]);

    return (
      <FlowEngineProvider engine={engine}>
        <App>
          <Form form={form} initialValues={options?.initialValues}>
            {options?.registerNames?.map((name) => (
              <Form.Item key={name} name={name} hidden getValueProps={() => ({ value: '' })}>
                <input />
              </Form.Item>
            ))}
            <Component form={form} mode={options?.mode || 'create'} />
          </Form>
        </App>
      </FlowEngineProvider>
    );
  }

  const result = render(<Harness />);
  return { ...result, form: formRef as FormInstance, engine };
}

function setMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

function openSelect(index = 0) {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[index]);
}

function getDatabaseServerFormValues(dialog: HTMLElement) {
  return {
    database: within(dialog).getByLabelText('t:Database'),
    description: within(dialog).getByLabelText('t:Display name'),
    host: within(dialog).getByLabelText('t:Host'),
    name: within(dialog).getByLabelText('t:Server name'),
    password: within(dialog).getByLabelText('t:Password'),
    port: within(dialog).getByLabelText('t:Port'),
    username: within(dialog).getByLabelText('t:Username'),
  };
}

function fillDatabaseServerForm(
  dialog: HTMLElement,
  values: Record<keyof ReturnType<typeof getDatabaseServerFormValues>, string>,
) {
  const fields = getDatabaseServerFormValues(dialog);

  Object.entries(values).forEach(([name, value]) => {
    fireEvent.change(fields[name as keyof typeof fields], {
      target: { value },
    });
  });
}

describe('FdwFieldsConfigureItem', () => {
  beforeEach(() => {
    setMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a required fields hint when no remote fields are loaded', async () => {
    const { form } = renderConfigureItem(FdwFieldsConfigureItem, {
      initialValues: {
        fields: [],
      },
    });

    expect(screen.getByText('t:Remote table')).toBeInTheDocument();
    let validationError: unknown;
    await act(async () => {
      try {
        await form.validateFields();
      } catch (error) {
        validationError = error;
      }
    });
    expect(validationError).toMatchObject({
      errorFields: expect.arrayContaining([
        expect.objectContaining({
          name: ['fields'],
        }),
      ]),
    });
  });

  it('renders loaded fields, unsupported fields, and updates display titles', () => {
    const { form } = renderConfigureItem(FdwFieldsConfigureItem, {
      initialValues: {
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
            allowNull: false,
            uiSchema: {
              rawTitle: 'Raw title',
              title: 'Title',
            },
          },
          {
            name: 'amount',
            type: 'integer',
            interface: 'number',
            possibleTypes: ['integer', 'string'],
            allowNull: true,
            uiSchema: {
              title: 'Amount',
            },
          },
        ],
        __fdwUnsupportedFields: [{ name: 'legacy_shape', rawType: 'geometry' }],
      },
    });

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('amount')).toBeInTheDocument();
    expect(screen.getByText('legacy_shape')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Title'), {
      target: { value: 'Order title' },
    });

    expect(form.getFieldValue(['fields', 0, 'uiSchema'])).toEqual({
      title: 'Order title',
    });
  });

  it('updates field type and interface selections', async () => {
    const { form } = renderConfigureItem(FdwFieldsConfigureItem, {
      initialValues: {
        fields: [
          {
            name: 'amount',
            type: 'integer',
            interface: 'number',
            possibleTypes: ['integer', 'string'],
            allowNull: true,
            uiSchema: {
              title: 'Amount',
            },
          },
        ],
      },
    });

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByTitle('string'));
    expect(form.getFieldValue(['fields', 0, 'type'])).toBe('string');

    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByTitle('Input'));
    expect(form.getFieldValue('fields')).toEqual([
      expect.objectContaining({
        interface: 'input',
        type: 'string',
        uiSchema: {
          'x-component': 'Input',
          required: false,
          title: 'Amount',
        },
      }),
    ]);

    let values: Record<string, unknown> | undefined;
    await act(async () => {
      values = await form.validateFields();
    });
    expect(values).toMatchObject({
      fields: expect.any(Array),
    });
  });

  it('rejects fields without usable interface metadata', async () => {
    const { form } = renderConfigureItem(FdwFieldsConfigureItem, {
      initialValues: {
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: null,
            uiSchema: {},
          },
        ],
      },
    });

    let validationError: unknown;
    await act(async () => {
      try {
        await form.validateFields();
      } catch (error) {
        validationError = error;
      }
    });
    expect(validationError).toMatchObject({
      errorFields: expect.arrayContaining([
        expect.objectContaining({
          errors: ['t:Fields can only be used correctly if they are defined with an interface.'],
        }),
      ]),
    });
  });
});

describe('FdwRemoteServerConfigureItem', () => {
  beforeEach(() => {
    setMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads database servers and resets dependent collection fields when a server is selected', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [
          { description: 'Server A', name: 'server_a' },
          { description: 'Server B', name: 'server_b' },
        ],
      },
    });
    const api = {
      resource: vi.fn(() => ({ list })),
    };
    const { form } = renderConfigureItem(FdwRemoteServerConfigureItem, {
      api,
      initialValues: {
        remoteServerName: 'server_a',
        remoteTableInfo: { tableName: 'orders' },
        remoteTableName: 'public.orders',
        fields: [{ name: 'title' }],
        __fdwUnsupportedFields: [{ name: 'shape' }],
      },
    });

    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    openSelect();
    fireEvent.click(await screen.findByTitle('Server B'));

    expect(form.getFieldValue('remoteServerName')).toBe('server_b');
    expect(form.getFieldValue('remoteTableName')).toBeUndefined();
    expect(form.getFieldValue('remoteTableInfo')).toBeUndefined();
    expect(form.getFieldValue('fields')).toEqual([]);
    expect(form.getFieldValue('__fdwUnsupportedFields')).toEqual([]);
  });

  it('disables the database server selector in edit mode', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    const api = {
      resource: vi.fn(() => ({ list })),
    };

    renderConfigureItem(FdwRemoteServerConfigureItem, {
      api,
      mode: 'edit',
    });

    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('creates a database server from the dropdown dialog and selects it after refresh', async () => {
    const success = vi.spyOn(message, 'success').mockImplementation(() => undefined);
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    const testConnection = vi.fn().mockResolvedValue({});
    const create = vi.fn().mockResolvedValue({
      data: {
        data: {
          description: 'Server New',
          name: 'server_new',
        },
      },
    });
    const api = {
      resource: vi.fn(() => ({ create, list, testConnection })),
    };
    const { form } = renderConfigureItem(FdwRemoteServerConfigureItem, { api });

    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    openSelect();
    fireEvent.click(await screen.findByText('t:Create database server'));

    const dialog = await screen.findByRole('dialog');
    fillDatabaseServerForm(dialog, {
      database: 'main',
      description: 'Server New',
      host: '127.0.0.1',
      name: 'server_new',
      password: 'secret',
      port: '5432',
      username: 'nocobase',
    });

    fireEvent.click(within(dialog).getByText('t:Test Connection'));
    await waitFor(() =>
      expect(testConnection).toHaveBeenCalledWith({
        values: expect.objectContaining({
          name: 'server_new',
          database: 'main',
        }),
      }),
    );

    fireEvent.click(within(dialog).getByText('t:Submit'));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        values: expect.objectContaining({
          name: 'server_new',
          description: 'Server New',
        }),
      }),
    );

    expect(success).toHaveBeenCalledWith('t:Connection successful');
    expect(success).toHaveBeenCalledWith('t:Saved successfully');
    expect(form.getFieldValue('remoteServerName')).toBe('server_new');
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('closes the database server dialog when creation is cancelled', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    const api = {
      resource: vi.fn(() => ({ list })),
    };
    renderConfigureItem(FdwRemoteServerConfigureItem, { api });

    await waitFor(() => expect(list).toHaveBeenCalled());
    openSelect();
    fireEvent.click(await screen.findByText('t:Create database server'));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByText('t:Cancel'));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the database server dialog open when validation or API actions fail', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    const testConnection = vi.fn().mockRejectedValue({
      response: {
        data: 'Connection failed',
      },
    });
    const create = vi.fn().mockRejectedValue({
      response: {
        data: {
          errors: [{ message: 'Create failed' }],
        },
      },
    });
    const api = {
      resource: vi.fn(() => ({ create, list, testConnection })),
    };
    renderConfigureItem(FdwRemoteServerConfigureItem, { api });

    await waitFor(() => expect(list).toHaveBeenCalled());
    openSelect();
    fireEvent.click(await screen.findByText('t:Create database server'));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByText('t:Submit'));
    expect(create).not.toHaveBeenCalled();

    fillDatabaseServerForm(dialog, {
      database: 'main',
      description: 'Server New',
      host: '127.0.0.1',
      name: 'server_new',
      password: 'secret',
      port: '5432',
      username: 'nocobase',
    });

    fireEvent.click(within(dialog).getByText('t:Test Connection'));
    await waitFor(() => expect(testConnection).toHaveBeenCalled());

    fireEvent.click(within(dialog).getByText('t:Submit'));
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('edits and deletes database servers from option actions', async () => {
    const success = vi.spyOn(message, 'success').mockImplementation(() => undefined);
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            database: 'main',
            description: 'Server A',
            host: '127.0.0.1',
            name: 'server_a',
            password: 'secret',
            port: '5432',
            username: 'nocobase',
          },
        ],
      },
    });
    const update = vi.fn().mockResolvedValue({
      data: {
        data: {
          description: 'Server A Updated',
          name: 'server_a',
        },
      },
    });
    const destroy = vi.fn().mockResolvedValue({});
    const api = {
      resource: vi.fn(() => ({ destroy, list, update })),
    };
    const confirm = vi.spyOn(Modal, 'confirm').mockReturnValue({ destroy: vi.fn(), update: vi.fn() });
    const { form } = renderConfigureItem(FdwRemoteServerConfigureItem, {
      api,
      initialValues: {
        remoteServerName: 'server_a',
        fields: [{ name: 'title' }],
      },
    });

    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    openSelect();
    fireEvent.click(await screen.findByText('t:Edit'));

    const dialog = await screen.findByRole('dialog');
    const fields = getDatabaseServerFormValues(dialog);
    expect(fields.name).toBeDisabled();
    fireEvent.change(fields.description, {
      target: { value: 'Server A Updated' },
    });
    fireEvent.click(within(dialog).getByText('t:Submit'));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        filterByTk: 'server_a',
        values: expect.objectContaining({
          description: 'Server A Updated',
          name: 'server_a',
        }),
      }),
    );

    openSelect();
    fireEvent.click(await screen.findByText('t:Delete'));

    const config = confirm.mock.calls[0][0];
    expect(config).toMatchObject({ title: 't:Are you sure you want to delete it?' });
    await act(async () => {
      await config.onOk?.(() => undefined);
    });

    expect(destroy).toHaveBeenCalledWith({ filterByTk: 'server_a' });
    expect(success).toHaveBeenCalledWith('t:Saved successfully');
    expect(form.getFieldValue('remoteServerName')).toBeUndefined();
    expect(form.getFieldValue('fields')).toEqual([]);
  });

  it('does not clear the selected server when deleting a different server', async () => {
    const success = vi.spyOn(message, 'success').mockImplementation(() => undefined);
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ description: 'Server A', name: 'server_a' }],
      },
    });
    const destroy = vi.fn().mockResolvedValue({});
    const api = {
      resource: vi.fn(() => ({ destroy, list })),
    };
    const confirm = vi.spyOn(Modal, 'confirm').mockReturnValue({ destroy: vi.fn(), update: vi.fn() });
    const { form } = renderConfigureItem(FdwRemoteServerConfigureItem, {
      api,
      initialValues: {
        remoteServerName: 'server_b',
      },
    });

    await waitFor(() => expect(list).toHaveBeenCalled());
    openSelect();
    fireEvent.click(await screen.findByText('t:Delete'));

    const config = confirm.mock.calls[0][0];
    await act(async () => {
      await config.onOk?.(() => undefined);
    });

    expect(destroy).toHaveBeenCalledWith({ filterByTk: 'server_a' });
    expect(success).toHaveBeenCalledWith('t:Saved successfully');
    expect(form.getFieldValue('remoteServerName')).toBe('server_b');
  });
});

describe('FdwRemoteTableConfigureItem', () => {
  beforeEach(() => {
    setMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('handles remote table list request failures', async () => {
    const list = vi.fn().mockRejectedValue({
      response: {
        data: {
          messages: ['List failed'],
        },
      },
    });
    const api = {
      resource: vi.fn((name: string) => {
        if (name === 'databaseServers/server_a/tables') {
          return { list };
        }
        return {};
      }),
    };
    const { form } = renderConfigureItem(FdwRemoteTableConfigureItem, {
      api,
      initialValues: {
        remoteServerName: 'server_a',
      },
      registerNames: ['remoteServerName'],
    });

    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(form.getFieldValue('remoteTableName')).toBeUndefined();
  });

  it('disables remote table selection when the collection is edited or no server is selected', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    const api = {
      resource: vi.fn((name: string) => {
        if (name === 'databaseServers/server_a/tables') {
          return { list };
        }
        return {};
      }),
    };

    renderConfigureItem(FdwRemoteTableConfigureItem, { api });
    expect(screen.getByRole('combobox')).toBeDisabled();
    cleanup();
    setMatchMedia();

    renderConfigureItem(FdwRemoteTableConfigureItem, {
      api,
      initialValues: {
        remoteServerName: 'server_a',
      },
      mode: 'edit',
      registerNames: ['remoteServerName'],
    });

    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('loads remote tables, selects a schema-qualified table, and normalizes its fields', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ name: 'orders', schema: 'public' }, { name: 'audit_logs' }],
      },
    });
    const get = vi.fn().mockResolvedValue({
      data: {
        data: {
          data: {
            fields: [
              {
                allowNull: false,
                name: 'title',
                rawType: 'varchar',
                type: 'string',
                uiSchema: {
                  rawTitle: 'Raw title',
                },
              },
              {
                allowNull: true,
                name: 'location',
                type: 'point',
              },
              {
                allowNull: false,
                name: 'uuid_col',
                type: 'uuid',
              },
              {
                allowNull: true,
                name: 'no_type',
              },
            ],
            unsupportedFields: [{ name: 'shape', rawType: 'geometry' }],
          },
        },
      },
    });
    const api = {
      resource: vi.fn((name: string) => {
        if (name === 'databaseServers/server_a/tables') {
          return { get, list };
        }
        return {};
      }),
    };
    const { form } = renderConfigureItem(FdwRemoteTableConfigureItem, {
      api,
      initialValues: {
        name: 't_temp',
        remoteServerName: 'server_a',
      },
      registerNames: ['remoteServerName'],
    });

    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    openSelect();
    fireEvent.click(await screen.findByTitle('public.orders'));

    await waitFor(() =>
      expect(get).toHaveBeenCalledWith({
        filterByTk: 'public.orders',
      }),
    );
    expect(form.getFieldValue('name')).toBe('orders');
    expect(form.getFieldValue('remoteTableName')).toBe('public.orders');
    expect(form.getFieldValue('remoteTableInfo')).toEqual({
      schema: 'public',
      tableName: 'orders',
    });
    expect(form.getFieldValue('__fdwUnsupportedFields')).toEqual([{ name: 'shape', rawType: 'geometry' }]);
    expect(form.getFieldValue('fields')).toEqual([
      expect.objectContaining({
        interface: 'input',
        name: 'title',
        uiSchema: {
          'x-component': 'Input',
          required: true,
          title: 'title',
        },
      }),
      expect.objectContaining({
        interface: 'map',
        name: 'location',
        uiSchema: {
          'x-component': 'Map',
          required: false,
          title: 'location',
        },
      }),
      expect.objectContaining({
        interface: undefined,
        name: 'uuid_col',
        uiSchema: {
          required: true,
          title: 'uuid_col',
        },
      }),
      expect.objectContaining({
        interface: 'checkbox',
        name: 'no_type',
        uiSchema: {
          'x-component': 'Checkbox',
          required: false,
          title: 'no_type',
        },
      }),
    ]);
  });

  it('derives remote table info for tables without schema names', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ name: 'audit_logs' }],
      },
    });
    const get = vi.fn().mockResolvedValue({
      data: {
        data: {
          fields: [],
          unsupportedFields: [],
        },
      },
    });
    const api = {
      resource: vi.fn((name: string) => {
        if (name === 'databaseServers/server_a/tables') {
          return { get, list };
        }
        return {};
      }),
    };
    const { form } = renderConfigureItem(FdwRemoteTableConfigureItem, {
      api,
      initialValues: {
        remoteServerName: 'server_a',
      },
      registerNames: ['remoteServerName'],
    });

    await waitFor(() => expect(list).toHaveBeenCalled());
    openSelect();
    fireEvent.click(await screen.findByTitle('audit_logs'));

    await waitFor(() =>
      expect(get).toHaveBeenCalledWith({
        filterByTk: 'audit_logs',
      }),
    );
    expect(form.getFieldValue('name')).toBe('audit_logs');
    expect(form.getFieldValue('remoteTableInfo')).toEqual({
      tableName: 'audit_logs',
    });
  });

  it('clears field metadata when loading remote fields fails', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ name: 'orders', schema: 'public' }],
      },
    });
    const get = vi.fn().mockRejectedValue(new Error('Fields failed'));
    const api = {
      resource: vi.fn((name: string) => {
        if (name === 'databaseServers/server_a/tables') {
          return { get, list };
        }
        return {};
      }),
    };
    const { form } = renderConfigureItem(FdwRemoteTableConfigureItem, {
      api,
      initialValues: {
        fields: [{ name: 'stale' }],
        remoteServerName: 'server_a',
      },
      registerNames: ['remoteServerName'],
    });

    await waitFor(() => expect(list).toHaveBeenCalled());
    openSelect();
    fireEvent.click(await screen.findByTitle('public.orders'));

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(form.getFieldValue('fields')).toEqual([]);
    expect(form.getFieldValue('__fdwUnsupportedFields')).toEqual([]);
  });
});

describe('FdwPreviewConfigureItem', () => {
  beforeEach(() => {
    setMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads remote preview data and stringifies object cell values', async () => {
    const query = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            emptyValue: null,
            location: 'POINT(1 2)',
            meta: { id: 1 },
            title: 'First order',
          },
        ],
      },
    });
    const api = {
      resource: vi.fn((name: string, source?: string) => {
        if (name === 'databaseServers.tables' && source === 'server_a') {
          return { query };
        }
        return {};
      }),
    };

    renderConfigureItem(FdwPreviewConfigureItem, {
      api,
      initialValues: {
        remoteServerName: 'server_a',
        remoteTableName: 'public.orders',
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
            uiSchema: { title: 'Title' },
          },
          {
            name: 'emptyValue',
            type: 'string',
            interface: 'input',
            uiSchema: { title: 'Empty value' },
          },
          {
            name: 'meta',
            type: 'json',
            interface: 'input',
            uiSchema: { title: 'Meta' },
          },
          {
            name: 'location',
            type: 'point',
            interface: 'map',
            uiSchema: { title: 'Location' },
          },
        ],
      },
      registerNames: ['remoteServerName', 'remoteTableName', 'fields'],
    });

    await waitFor(() =>
      expect(query).toHaveBeenCalledWith({
        filterByTk: 'public.orders',
        fieldTypes: {
          location: 'point',
        },
      }),
    );
    expect(await screen.findByText('First order')).toBeInTheDocument();
    expect(screen.getByText('{"id":1}')).toBeInTheDocument();
    expect(screen.getByText('POINT(1 2)')).toBeInTheDocument();
  });

  it('does not load preview data until the remote table and fields are ready', () => {
    const query = vi.fn();
    const api = {
      resource: vi.fn(() => ({ query })),
    };

    renderConfigureItem(FdwPreviewConfigureItem, {
      api,
      initialValues: {
        remoteServerName: 'server_a',
        fields: [],
      },
      registerNames: ['remoteServerName', 'fields'],
    });

    expect(query).not.toHaveBeenCalled();
  });

  it('clears preview data when supported API error shapes are returned', async () => {
    const errors = [
      'Preview failed',
      { response: { data: 'Preview failed' } },
      { response: { data: { messages: [{ message: 'Preview failed' }] } } },
      { response: { data: { messages: ['Preview failed'] } } },
      { response: { data: { error: { message: 'Preview failed' } } } },
      { response: { data: { message: 'Preview failed' } } },
      new Error('Preview failed'),
    ];

    for (const error of errors) {
      cleanup();
      const query = vi.fn().mockRejectedValue(error);
      const api = {
        resource: vi.fn(() => ({ query })),
      };

      renderConfigureItem(FdwPreviewConfigureItem, {
        api,
        initialValues: {
          remoteServerName: 'server_a',
          remoteTableName: 'public.orders',
          fields: [
            {
              name: 'title',
              type: 'string',
              interface: 'input',
              uiSchema: { title: 'Title' },
            },
          ],
        },
        registerNames: ['remoteServerName', 'remoteTableName', 'fields'],
      });

      await waitFor(() => expect(query).toHaveBeenCalledTimes(1));
      expect(screen.queryByText('First order')).not.toBeInTheDocument();
    }
  });
});
