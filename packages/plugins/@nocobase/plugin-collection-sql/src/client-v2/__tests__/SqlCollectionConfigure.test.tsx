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
import { App, Button, Form } from 'antd';
import type { FormInstance } from 'antd';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    DrawerFormLayout: ({
      cancelText,
      children,
      onSubmit,
      submitText,
      submitting,
      title,
    }: {
      cancelText: string;
      children: React.ReactNode;
      onSubmit: () => Promise<void> | void;
      submitText: string;
      submitting?: boolean;
      title: string;
    }) => (
      <section aria-label={title}>
        {children}
        <Button loading={submitting} onClick={() => onSubmit()}>
          {submitText}
        </Button>
        <Button>{cancelText}</Button>
      </section>
    ),
  };
});

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
    runAsync: (...args: unknown[]) => Promise<unknown>;
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
          runAsync,
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
  getSqlPreviewInternalName,
  SqlFieldsConfigureItem,
  SqlPreviewConfigureItem,
  SqlSourceCollectionsConfigureItem,
  SqlStatementConfigureItem,
  SqlSyncFieldsDrawer,
} from '../SqlCollectionConfigure';

type ConfigureItemProps = React.ComponentProps<typeof SqlStatementConfigureItem>;

const previewName = getSqlPreviewInternalName();

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
    name: 'integer',
    group: 'basic',
    title: 'Integer',
    availableTypes: ['integer'],
    default: {
      type: 'integer',
      uiSchema: {
        'x-component': 'InputNumber',
      },
    },
  },
  {
    name: 'checkbox',
    group: 'basic',
    title: 'Checkbox',
    availableTypes: ['boolean'],
    default: {
      type: 'boolean',
      uiSchema: {
        'x-component': 'Checkbox',
      },
    },
  },
  {
    name: 'textarea',
    group: 'advanced',
    title: 'Textarea',
    availableTypes: ['string'],
    default: {
      type: 'string',
      uiSchema: {
        'x-component': 'Input.TextArea',
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
];

const collections = [
  {
    name: 'orders',
    title: 'Orders',
    fields: [
      {
        name: 'title',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: 'Order title',
        },
      },
      {
        name: 'customer',
        type: 'belongsTo',
        interface: 'belongsTo',
        uiSchema: {
          title: 'Customer',
        },
      },
    ],
  },
  {
    name: 'customers',
    title: '{{t("Customers")}}',
    fields: [
      {
        name: 'name',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: 'Customer name',
        },
      },
    ],
  },
];

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

function createFieldInterfaceManager() {
  return {
    getFieldInterface: vi.fn((name?: string) => fieldInterfaces.find((item) => item.name === name)),
    getFieldInterfaceGroups: vi.fn(() => ({
      basic: { label: 'Basic', order: 1 },
      advanced: { label: 'Advanced', order: 5 },
      relation: { label: 'Relation', order: 9 },
    })),
    getFieldInterfaces: vi.fn(() => fieldInterfaces),
  };
}

function createApi(options?: {
  collectionList?: unknown;
  execute?: (...args: unknown[]) => Promise<unknown>;
  setFields?: (...args: unknown[]) => Promise<unknown>;
}) {
  const execute = vi.fn(
    options?.execute ||
      (() =>
        Promise.resolve({
          data: {
            data: {
              data: [
                {
                  id: 1,
                  title: 'First order',
                },
              ],
              fields: {
                id: {
                  interface: 'integer',
                  type: 'integer',
                },
                title: {
                  interface: 'input',
                  source: ['orders', 'title'],
                  type: 'string',
                  uiSchema: {
                    title: 'Title',
                  },
                },
              },
              sources: ['orders'],
            },
          },
        })),
  );
  const setFields = vi.fn(options?.setFields || (() => Promise.resolve({})));
  const request = vi.fn(() =>
    Promise.resolve(
      options?.collectionList || {
        data: {
          data: collections,
        },
      },
    ),
  );

  return {
    execute,
    request,
    setFields,
    api: {
      request,
      resource: vi.fn((name: string) => {
        if (name === 'sqlCollection') {
          return {
            execute,
            setFields,
          };
        }
        return {};
      }),
    },
  };
}

function createDeferred<T>() {
  let deferredResolve!: (value: T | PromiseLike<T>) => void;
  let deferredReject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    deferredResolve = resolve;
    deferredReject = reject;
  });

  return {
    promise,
    reject: deferredReject,
    resolve: deferredResolve,
  };
}

function createEngine(options?: {
  api?: Record<string, unknown>;
  reload?: () => Promise<void> | void;
  useRuntimeFields?: boolean;
}) {
  const engine = new FlowEngine();
  const collectionFieldInterfaceManager = createFieldInterfaceManager();
  engine.context.defineMethod('t', (key: string) => `t:${key}`);
  engine.context.defineProperty('api', {
    value:
      options?.api ||
      createApi({
        collectionList: {
          data: {
            data: collections,
          },
        },
      }).api,
  });
  engine.context.defineProperty('dataSourceManager', {
    value: {
      collectionFieldInterfaceManager,
      getDataSource: vi.fn(() => ({
        reload: options?.reload || vi.fn(),
        getCollection: vi.fn((name: string) => {
          const collection = collections.find((item) => item.name === name);
          return collection
            ? {
                title: collection.title,
                ...(options?.useRuntimeFields === false
                  ? {}
                  : {
                      getFields: () => collection.fields,
                    }),
              }
            : undefined;
        }),
      })),
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
    useRuntimeFields?: boolean;
  },
) {
  const engine = createEngine({ api: options?.api, useRuntimeFields: options?.useRuntimeFields });
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
            <Component form={form} mode={options?.mode || 'create'} template={{ name: 'sql', title: '' }} item={{}} />
          </Form>
        </App>
      </FlowEngineProvider>
    );
  }

  const result = render(<Harness />);
  return { ...result, form: formRef as FormInstance, engine };
}

function renderSyncDrawer(options?: {
  api?: Record<string, unknown>;
  collection?: Record<string, unknown>;
  onSubmitted?: () => void;
  reload?: () => Promise<void> | void;
}) {
  const engine = createEngine({ api: options?.api, reload: options?.reload });

  return render(
    <FlowEngineProvider engine={engine}>
      <App>
        <SqlSyncFieldsDrawer
          dataSourceKey="main"
          collection={{
            name: 'orders_view',
            sql: 'select * from orders',
            fields: [],
            sources: [],
            ...options?.collection,
          }}
          onSubmitted={options?.onSubmitted || vi.fn()}
        />
      </App>
    </FlowEngineProvider>,
  );
}

describe('SqlStatementConfigureItem', () => {
  beforeEach(setMatchMedia);

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('executes and confirms SQL before allowing form validation', async () => {
    const { api, execute } = createApi();
    const { form } = renderConfigureItem(SqlStatementConfigureItem, {
      api,
      initialValues: {
        sql: '',
        sources: ['legacy'],
        fields: [],
      },
    });

    fireEvent.change(screen.getByRole('textbox'), {
      target: {
        value: 'select id, title from orders',
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
          errors: ['t:Please confirm the SQL statement first'],
        }),
      ]),
    });

    fireEvent.click(screen.getByText('t:Execute'));

    await waitFor(() =>
      expect(execute.mock.calls[0]?.[0]).toEqual({
        values: {
          sql: 'select id, title from orders',
        },
      }),
    );
    expect(form.getFieldValue('sources')).toEqual(['legacy', 'orders']);
    expect(form.getFieldValue(previewName)).toMatchObject({
      data: [{ id: 1, title: 'First order' }],
    });
    expect(form.getFieldValue('fields')).toEqual([
      expect.objectContaining({
        name: 'id',
        interface: 'integer',
      }),
      expect.objectContaining({
        name: 'title',
        source: ['orders', 'title'],
        uiSchema: {
          title: 'Title',
        },
      }),
    ]);

    expect(form.getFieldValue('sql')).toBe('select id, title from orders');
  });

  it('stores SQL execution errors in the internal preview field', async () => {
    const { api, execute } = createApi({
      execute: () =>
        Promise.reject({
          response: {
            data: {
              errors: [{ message: 'Syntax error' }],
            },
          },
        }),
    });
    const { form } = renderConfigureItem(SqlStatementConfigureItem, {
      api,
      initialValues: {
        sql: 'select * from',
      },
    });

    fireEvent.click(screen.getByText('t:Execute'));

    await waitFor(() => expect(execute).toHaveBeenCalled());
    expect(form.getFieldValue(previewName)).toEqual({
      error: 'Syntax error',
    });
    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });

  it('confirms edited SQL statements before validation passes', async () => {
    const { api, execute } = createApi({
      execute: () =>
        Promise.resolve({
          data: {
            data: {
              data: [],
              fields: {},
              sources: [],
            },
          },
        }),
    });
    const { form } = renderConfigureItem(SqlStatementConfigureItem, {
      api,
      initialValues: {
        sql: '',
      },
    });

    fireEvent.change(screen.getByRole('textbox'), {
      target: {
        value: 'select id from orders',
      },
    });
    fireEvent.click(screen.getByText('t:Confirm'));

    await waitFor(() =>
      expect(execute.mock.calls[0]?.[0]).toEqual({
        values: {
          sql: 'select id from orders',
        },
      }),
    );
    await waitFor(() => expect(screen.getByText('t:Edit')).toBeInTheDocument());
    expect(form.getFieldValue('sql')).toBe('select id from orders');
  });

  it('does not execute empty SQL statements', async () => {
    const { api, execute } = createApi();
    renderConfigureItem(SqlStatementConfigureItem, {
      api,
      initialValues: {
        sql: '',
      },
      mode: 'edit',
    });

    fireEvent.click(screen.getByText('t:Confirm'));

    await waitFor(() => expect(execute).not.toHaveBeenCalled());
  });

  it('does not execute empty SQL from the execute button', async () => {
    const { api, execute } = createApi();
    renderConfigureItem(SqlStatementConfigureItem, {
      api,
      initialValues: {
        sql: '',
      },
    });

    fireEvent.click(screen.getByText('t:Execute'));

    await waitFor(() => expect(execute).not.toHaveBeenCalled());
  });

  it('auto-confirms existing SQL statements in edit mode', async () => {
    const { api, execute } = createApi();
    const { form } = renderConfigureItem(SqlStatementConfigureItem, {
      api,
      initialValues: {
        sql: 'select id from orders',
      },
      mode: 'edit',
    });

    await waitFor(() =>
      expect(execute.mock.calls[0]?.[0]).toEqual({
        values: {
          sql: 'select id from orders',
        },
      }),
    );

    let values: Record<string, unknown> | undefined;
    await act(async () => {
      values = await form.validateFields();
    });

    expect(values).toMatchObject({
      sql: 'select id from orders',
    });
    expect(screen.getByText('t:Edit')).toBeInTheDocument();
  });

  it('allows existing SQL statements to be edited again', async () => {
    const { api, execute } = createApi();
    renderConfigureItem(SqlStatementConfigureItem, {
      api,
      initialValues: {
        sql: 'select id from orders',
      },
    });

    fireEvent.click(screen.getByText('t:Edit'));

    expect(screen.getByRole('textbox')).not.toBeDisabled();
    expect(execute).not.toHaveBeenCalled();
  });
});

describe('SqlSourceCollectionsConfigureItem', () => {
  beforeEach(setMatchMedia);

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads collection options and keeps missing selected sources visible', async () => {
    const { api, request } = createApi();
    renderConfigureItem(SqlSourceCollectionsConfigureItem, {
      api,
      initialValues: {
        sources: ['missing_source'],
      },
      registerNames: ['sources'],
    });

    await waitFor(() => expect(request).toHaveBeenCalled());
    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(await screen.findByTitle('Orders')).toBeInTheDocument();
    expect(screen.getAllByTitle('missing_source').length).toBeGreaterThan(0);
  });

  it('supports nested collection list responses', async () => {
    const { api, request } = createApi({
      collectionList: {
        data: {
          data: {
            data: collections,
          },
        },
      },
    });
    renderConfigureItem(SqlSourceCollectionsConfigureItem, {
      api,
      initialValues: {
        sources: [],
      },
      registerNames: ['sources'],
    });

    await waitFor(() => expect(request).toHaveBeenCalled());
    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(await screen.findByTitle('Orders')).toBeInTheDocument();
    expect(screen.getByTitle('t:Customers')).toBeInTheDocument();
  });
});

describe('SqlFieldsConfigureItem', () => {
  beforeEach(setMatchMedia);

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders SQL errors from preview results', async () => {
    renderConfigureItem(SqlFieldsConfigureItem, {
      initialValues: {
        [previewName]: {
          error: 'Syntax error',
        },
        fields: [],
      },
      registerNames: [previewName, 'fields'],
    });

    expect(await screen.findByText('t:SQL error: Syntax error')).toBeInTheDocument();
  });

  it('renders a validation hint before SQL fields are available', async () => {
    renderConfigureItem(SqlFieldsConfigureItem, {
      initialValues: {
        fields: [],
      },
      registerNames: ['fields'],
    });

    expect(await screen.findByText('t:Please use a valid SELECT or WITH AS statement')).toBeInTheDocument();
  });

  it('renders a validation hint when preview contains no usable fields', async () => {
    renderConfigureItem(SqlFieldsConfigureItem, {
      initialValues: {
        [previewName]: {
          data: [],
          fields: {},
        },
        fields: [],
      },
      registerNames: [previewName, 'fields'],
    });

    expect(await screen.findByText('t:Please use a valid SELECT or WITH AS statement')).toBeInTheDocument();
  });

  it('updates display titles and field interfaces', async () => {
    const { form } = renderConfigureItem(SqlFieldsConfigureItem, {
      initialValues: {
        sources: ['orders'],
        fields: [
          {
            name: 'title',
            type: 'boolean',
            interface: 'input',
            source: null,
            uiSchema: {
              title: 'Title',
            },
          },
        ],
      },
      registerNames: ['sources', 'fields'],
    });

    expect(await screen.findByText('title')).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue('Title'), {
      target: {
        value: 'Order title',
      },
    });
    expect(form.getFieldValue(['fields', 0, 'uiSchema'])).toEqual({
      title: 'Order title',
    });

    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByTitle('Checkbox'));
    expect(form.getFieldValue(['fields', 0, 'interface'])).toBe('checkbox');
  });

  it('inherits field configuration from the selected source field', async () => {
    const { form } = renderConfigureItem(SqlFieldsConfigureItem, {
      initialValues: {
        sources: ['orders'],
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
            source: null,
            uiSchema: {
              title: 'Title',
            },
          },
        ],
      },
      registerNames: ['sources', 'fields'],
    });

    expect(await screen.findByText('title')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByTitle('Orders'));
    fireEvent.click(await screen.findByTitle('Order title'));

    await waitFor(() =>
      expect(form.getFieldValue(['fields', 0])).toEqual({
        name: 'title',
        source: 'orders.title',
        interface: 'input',
        type: 'string',
        uiSchema: {
          title: 'Order title',
        },
      }),
    );
  });

  it('uses collection response fields when runtime fields are unavailable', async () => {
    const { form } = renderConfigureItem(SqlFieldsConfigureItem, {
      initialValues: {
        sources: ['orders'],
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
            source: null,
            uiSchema: {
              title: 'Title',
            },
          },
        ],
      },
      registerNames: ['sources', 'fields'],
      useRuntimeFields: false,
    });

    expect(await screen.findByText('title')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByTitle('Orders'));
    fireEvent.click(await screen.findByTitle('Order title'));

    await waitFor(() =>
      expect(form.getFieldValue(['fields', 0])).toEqual(
        expect.objectContaining({
          source: 'orders.title',
          interface: 'input',
          type: 'string',
          uiSchema: {
            title: 'Order title',
          },
        }),
      ),
    );
  });

  it('clears a selected source field without changing the field interface', async () => {
    const { form } = renderConfigureItem(SqlFieldsConfigureItem, {
      initialValues: {
        sources: ['orders'],
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
            source: 'orders.title',
            uiSchema: {
              title: 'Order title',
            },
          },
        ],
      },
      registerNames: ['sources', 'fields'],
    });

    expect(await screen.findByText('title')).toBeInTheDocument();

    const clearButton = document.querySelector<HTMLElement>('.ant-select-clear');
    expect(clearButton).toBeInTheDocument();
    fireEvent.mouseDown(clearButton as HTMLElement);
    fireEvent.click(clearButton as HTMLElement);

    await waitFor(() =>
      expect(form.getFieldValue(['fields', 0])).toEqual(
        expect.objectContaining({
          source: null,
          interface: 'input',
          type: 'string',
        }),
      ),
    );
  });

  it('shows all field interfaces when the SQL field type is unknown', async () => {
    renderConfigureItem(SqlFieldsConfigureItem, {
      initialValues: {
        sources: ['orders'],
        fields: [
          {
            name: 'computed_value',
            interface: 'input',
            source: null,
            uiSchema: {
              title: 'Computed value',
            },
          },
        ],
      },
      registerNames: ['sources', 'fields'],
    });

    expect(await screen.findByText('computed_value')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);

    expect(await screen.findByTitle('Integer')).toBeInTheDocument();
    expect(screen.getByTitle('Checkbox')).toBeInTheDocument();
  });

  it('renders source-bound field interfaces as read-only tags', async () => {
    renderConfigureItem(SqlFieldsConfigureItem, {
      initialValues: {
        sources: ['orders'],
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
            source: 'orders.title',
            uiSchema: {
              title: 'Title',
            },
          },
        ],
      },
      registerNames: ['sources', 'fields'],
    });

    expect(await screen.findByText('title')).toBeInTheDocument();
    expect(screen.getByText('Input')).toBeInTheDocument();
  });

  it('builds field rows from a new preview payload', async () => {
    const { form } = renderConfigureItem(SqlFieldsConfigureItem, {
      initialValues: {
        [previewName]: {
          data: [
            {
              total: 10,
            },
          ],
          sources: ['orders'],
        },
        sources: ['orders'],
        fields: [],
      },
      registerNames: [previewName, 'sources', 'fields'],
    });

    await waitFor(() =>
      expect(form.getFieldValue('fields')).toEqual([
        expect.objectContaining({
          name: 'total',
          interface: 'integer',
        }),
      ]),
    );
    expect(await screen.findByText('total')).toBeInTheDocument();
  });
});

describe('SqlPreviewConfigureItem', () => {
  beforeEach(setMatchMedia);

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('uses configured field titles and compiles string preview values', async () => {
    renderConfigureItem(SqlPreviewConfigureItem, {
      initialValues: {
        [previewName]: {
          data: [
            {
              title: '{{t("Draft")}}',
              total: 12,
            },
          ],
        },
        fields: [
          {
            name: 'title',
            uiSchema: {
              title: 'Order title',
            },
          },
          {
            name: 'total',
          },
        ],
      },
      registerNames: [previewName, 'fields'],
    });

    expect(screen.getByText('Order title')).toBeInTheDocument();
    expect(screen.getByText('total')).toBeInTheDocument();
    expect(screen.getByText('t:Draft')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('falls back to preview data keys when fields are not configured', async () => {
    renderConfigureItem(SqlPreviewConfigureItem, {
      initialValues: {
        [previewName]: {
          data: [
            {
              status: '{{t("Draft")}}',
            },
          ],
        },
        fields: [],
      },
      registerNames: [previewName, 'fields'],
    });

    expect(screen.getByText('status')).toBeInTheDocument();
    expect(screen.getByText('t:Draft')).toBeInTheDocument();
  });
});

describe('SqlSyncFieldsDrawer', () => {
  beforeEach(setMatchMedia);

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads SQL preview data and submits synchronized fields', async () => {
    const onSubmitted = vi.fn();
    const reload = vi.fn();
    const { api, execute, setFields } = createApi();

    renderSyncDrawer({ api, onSubmitted, reload });

    expect(screen.getByLabelText('t:Sync from database')).toBeInTheDocument();
    await waitFor(() => expect(execute).toHaveBeenCalled());
    fireEvent.click(screen.getByText('t:Submit'));

    await waitFor(() =>
      expect(setFields.mock.calls[0]?.[0]).toEqual({
        filterByTk: 'orders_view',
        values: {
          fields: expect.arrayContaining([
            expect.objectContaining({
              name: 'title',
            }),
          ]),
          sources: ['orders'],
        },
      }),
    );
    expect(reload).toHaveBeenCalled();
    expect(onSubmitted).toHaveBeenCalled();
  });

  it('renders SQL sync errors in the fields panel', async () => {
    const { api, execute } = createApi({
      execute: () =>
        Promise.reject({
          response: {
            data: {
              errors: [{ message: 'Sync failed' }],
            },
          },
        }),
    });

    renderSyncDrawer({ api });

    await waitFor(() => expect(execute).toHaveBeenCalled());
    expect(await screen.findByText('t:SQL error: Sync failed')).toBeInTheDocument();
  });

  it('does not load preview data when the collection has no SQL statement', async () => {
    const { api, execute } = createApi();

    renderSyncDrawer({
      api,
      collection: {
        sql: undefined,
        fields: [],
      },
    });

    expect(screen.getByLabelText('t:Sync from database')).toBeInTheDocument();
    await waitFor(() => expect(execute).not.toHaveBeenCalled());
  });

  it('ignores preview responses that finish after the drawer is unmounted', async () => {
    const deferred = createDeferred({
      data: {
        data: {
          data: [
            {
              id: 1,
            },
          ],
          fields: {
            id: {
              interface: 'integer',
              type: 'integer',
            },
          },
          sources: ['orders'],
        },
      },
    });
    const { api, execute } = createApi({
      execute: () => deferred.promise,
    });
    const { unmount } = renderSyncDrawer({ api });

    await waitFor(() => expect(execute).toHaveBeenCalled());
    unmount();

    await act(async () => {
      deferred.resolve({
        data: {
          data: {
            data: [
              {
                id: 1,
              },
            ],
            fields: {
              id: {
                interface: 'integer',
                type: 'integer',
              },
            },
            sources: ['orders'],
          },
        },
      });
      await deferred.promise;
    });

    expect(screen.queryByLabelText('t:Sync from database')).not.toBeInTheDocument();
  });
});
