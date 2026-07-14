/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApplicationContext } from '@nocobase/client-v2';
import dayjs from 'dayjs';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  normalizeSettingsForSchema,
  serializeDatePickerValue,
  SettingsAutoForm,
  SettingsSingleField,
} from '../components/SettingsAutoForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@nocobase/client-v2', async () => {
  const ReactModule = await import('react');
  return {
    ApplicationContext: ReactModule.createContext(null),
  };
});

describe('SettingsAutoForm', () => {
  it('uses the complete candidate root for object draft visibility without rendering the object title twice', async () => {
    const onChange = vi.fn();
    const schema = {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          default: 'simple',
        },
        displayOptions: {
          type: 'object',
          title: 'Display settings',
          properties: {
            enableColor: {
              type: 'boolean',
              default: false,
              title: 'Enable color',
            },
            advancedColor: {
              type: 'string',
              default: '#1677ff',
              title: 'Advanced color',
              'x-visible-when': {
                logic: '$and',
                items: [
                  { path: 'mode', operator: '$eq', value: 'advanced' },
                  { path: 'displayOptions.enableColor', operator: '$eq', value: true },
                ],
              },
            },
          },
        },
      },
    };

    const Harness = () => {
      const [value, setValue] = React.useState({ enableColor: false, advancedColor: '#ff0000' });
      return (
        <SettingsSingleField
          fieldName="displayOptions"
          fieldPath={['displayOptions']}
          fieldSchema={schema.properties.displayOptions}
          rootSchema={schema}
          descriptorDefaults={{
            mode: 'simple',
            displayOptions: { enableColor: false, advancedColor: '#1677ff' },
          }}
          savedRootValue={{
            mode: 'advanced',
            displayOptions: { enableColor: false, advancedColor: '#ff0000' },
          }}
          value={value}
          onChange={(next, validation) => {
            setValue(next as typeof value);
            onChange(next, validation);
          }}
        />
      );
    };
    const { queryByText, getByText, getByRole, getByDisplayValue } = render(<Harness />);

    expect(queryByText('Display settings')).not.toBeInTheDocument();
    expect(queryByText('Advanced color')).not.toBeInTheDocument();
    fireEvent.click(getByRole('switch'));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        { enableColor: true, advancedColor: '#ff0000' },
        expect.objectContaining({ errors: [] }),
      );
    });
    await waitFor(() => expect(getByText('Advanced color')).toBeInTheDocument());
    fireEvent.change(getByDisplayValue('#ff0000'), { target: { value: '#00ff00' } });
    fireEvent.click(getByRole('switch'));
    await waitFor(() => expect(queryByText('Advanced color')).not.toBeInTheDocument());
    fireEvent.click(getByRole('switch'));
    await waitFor(() => expect(getByDisplayValue('#00ff00')).toBeInTheDocument());
  });

  it('atomically replaces the current object draft so cleared saved children do not reappear', async () => {
    const onChange = vi.fn();
    const fieldSchema = {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        removedControl: { type: 'string' },
        title: {
          type: 'string',
          'x-visible-when': { path: 'displayOptions.removedControl', operator: '$empty' },
        },
      },
    };
    render(
      <SettingsSingleField
        fieldName="displayOptions"
        fieldSchema={fieldSchema}
        rootSchema={{ type: 'object', properties: { displayOptions: fieldSchema } }}
        descriptorDefaults={{ displayOptions: { enabled: false } }}
        savedRootValue={{ displayOptions: { enabled: true, removedControl: 'legacy-value' } }}
        value={{ enabled: false }}
        onChange={onChange}
      />,
    );

    expect(await waitFor(() => screen.getByText('title'))).toBeInTheDocument();
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ enabled: false }, expect.objectContaining({ errors: [] })),
    );
  });

  it('keeps an explicitly cleared value absent instead of restoring saved or default values', async () => {
    const onChange = vi.fn();
    const Harness = () => {
      const [value, setValue] = React.useState<Record<string, unknown>>({ pageSize: 30 });
      return (
        <SettingsSingleField
          fieldName="displayOptions"
          fieldSchema={{
            type: 'object',
            properties: {
              pageSize: {
                type: 'integer',
                default: 20,
              },
            },
          }}
          rootSchema={{ type: 'object' }}
          savedRootValue={{ displayOptions: { pageSize: 40 } }}
          value={value}
          onChange={(next, validation) => {
            setValue(next as Record<string, unknown>);
            onChange(next, validation);
          }}
        />
      );
    };
    render(<Harness />);

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({}, expect.objectContaining({ errors: [] }));
    });
  });

  it('keeps other top-level saved settings read-only while evaluating the current object draft', () => {
    const displayOptionsSchema = {
      type: 'object',
      properties: {
        enableColor: { type: 'boolean' },
        advancedColor: {
          type: 'string',
          title: 'Advanced color',
          'x-visible-when': {
            logic: '$and',
            items: [
              { path: 'mode', operator: '$eq', value: 'advanced' },
              { path: 'displayOptions.enableColor', operator: '$eq', value: true },
            ],
          },
        },
      },
    };
    const rootSchema = {
      type: 'object',
      properties: {
        mode: { type: 'string' },
        displayOptions: displayOptionsSchema,
      },
    };
    const { queryByText } = render(
      <SettingsSingleField
        fieldName="displayOptions"
        fieldSchema={displayOptionsSchema}
        rootSchema={rootSchema}
        descriptorDefaults={{ mode: 'advanced', displayOptions: { enableColor: false } }}
        savedRootValue={{ mode: 'simple', displayOptions: { enableColor: false } }}
        value={{ enableColor: true, advancedColor: '#00ff00' }}
      />,
    );

    expect(queryByText('Advanced color')).not.toBeInTheDocument();
  });

  it('preserves hidden values and validates them while rejecting unknown object properties', () => {
    const schema = {
      type: 'object',
      properties: {
        displayOptions: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            pageSize: {
              type: 'integer',
              minimum: 1,
              'x-visible-when': { path: 'displayOptions.enabled', operator: '$eq', value: true },
            },
          },
        },
      },
    };

    expect(
      normalizeSettingsForSchema(schema, {
        displayOptions: { enabled: false, pageSize: 0, unknown: true },
      }),
    ).toMatchObject({
      value: {
        displayOptions: { enabled: false, pageSize: 0, unknown: true },
      },
      errors: expect.arrayContaining([
        { label: 'displayOptions.pageSize', path: 'displayOptions.pageSize', message: 'Too small' },
        {
          code: 'settings_unknown_property',
          label: 'displayOptions.unknown',
          path: 'displayOptions.unknown',
          message: 'Unknown property',
        },
      ]),
    });
  });

  it('renders and validates a single schema field for runtime flow steps', async () => {
    const onChange = vi.fn();
    render(
      <SettingsSingleField
        fieldName="pageSize"
        required
        fieldSchema={{
          type: 'integer',
          title: 'Page size',
          minimum: 1,
        }}
        value={0}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        0,
        expect.objectContaining({
          value: {
            pageSize: 0,
          },
          errors: [
            expect.objectContaining({
              label: 'Page size',
              message: 'Too small',
            }),
          ],
        }),
      );
    });
  });

  it('reports validation changes when the selected entry schema changes without changing settings', async () => {
    const onChange = vi.fn();
    const value = {
      plan: 'pro',
    };
    const { rerender } = render(
      <SettingsAutoForm
        schema={{
          type: 'object',
          properties: {
            plan: {
              type: 'string',
            },
          },
        }}
        value={value}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    onChange.mockClear();

    rerender(
      <SettingsAutoForm
        schema={{
          type: 'object',
          properties: {
            plan: {
              type: 'string',
              enum: ['basic'],
            },
          },
        }}
        value={value}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        {
          plan: 'pro',
        },
        expect.objectContaining({
          errors: [
            expect.objectContaining({
              label: 'plan',
              message: 'Must be one of the allowed values',
            }),
          ],
        }),
      );
    });
  });

  it('serializes date values as YYYY-MM-DD and date-time values as ISO timestamps', () => {
    const value = dayjs('2026-07-05T01:30:00.000Z');

    expect(serializeDatePickerValue({ format: 'date' }, value)).toBe('2026-07-05');
    expect(serializeDatePickerValue({ format: 'date-time' }, value)).toBe('2026-07-05T01:30:00.000Z');
  });

  it('disables radio group fields when the form is disabled', () => {
    const { container } = render(
      <SettingsAutoForm
        disabled
        schema={{
          type: 'object',
          properties: {
            plan: {
              type: 'string',
              enum: ['basic', 'pro'],
              'x-component': 'Radio.Group',
            },
          },
        }}
        value={{ plan: 'basic' }}
      />,
    );

    const radio = container.querySelector('input[type="radio"][value="basic"]');
    expect(radio).toHaveProperty('disabled', true);
  });

  it('renders advanced safe selector components from the light extension whitelist', async () => {
    const products = {
      name: 'products',
      title: 'Products',
      getFields: () => [
        {
          name: 'name',
          title: 'Name',
        },
      ],
    };
    const mainDataSource = {
      key: 'main',
      displayName: 'Main',
      getCollections: () => [products],
      getCollection: (name: string) => (name === products.name ? products : undefined),
    };
    const app = {
      dataSourceManager: {
        getDataSources: () => [mainDataSource],
        getDataSource: (key: string) => (key === mainDataSource.key ? mainDataSource : undefined),
      },
      flowEngine: {
        context: {
          user: {
            roles: [{ name: 'admin', title: 'Admin' }],
          },
          t: (key: string) => key,
        },
      },
    };

    const { container } = render(
      <ApplicationContext.Provider value={app as never}>
        <SettingsAutoForm
          schema={{
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                'x-component': 'CollectionSelect',
              },
              displayField: {
                type: 'string',
                'x-component': 'CollectionFieldSelect',
              },
              visibleForRole: {
                type: 'string',
                'x-component': 'RoleSelect',
              },
              dataSource: {
                type: 'string',
                'x-component': 'DataSourceSelect',
              },
              color: {
                type: 'string',
                'x-component': 'ColorPicker',
              },
            },
          }}
          value={{
            collection: 'products',
            displayField: 'name',
            visibleForRole: 'admin',
            dataSource: 'main',
            color: '#1677ff',
          }}
        />
      </ApplicationContext.Provider>,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('.ant-select')).toHaveLength(4);
      expect(container.querySelector('.ant-color-picker-trigger')).toBeInTheDocument();
    });
  });

  it('waits for a collection before enabling CollectionFieldSelect and normalizes legacy collection.field values', async () => {
    const products = {
      name: 'products',
      title: 'Products',
      getFields: () => [
        {
          name: 'name',
          title: 'Name',
        },
      ],
    };
    const schema = {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          'x-component': 'CollectionSelect',
        },
        displayField: {
          type: 'string',
          'x-component': 'CollectionFieldSelect',
        },
      },
    };
    const app = {
      dataSourceManager: {
        getDataSources: () => [
          {
            key: 'main',
            getCollections: () => [products],
            getCollection: (name: string) => (name === products.name ? products : undefined),
          },
        ],
      },
    };

    const { container } = render(
      <ApplicationContext.Provider value={app as never}>
        <SettingsAutoForm schema={schema} value={{ displayField: 'products.name' }} />
      </ApplicationContext.Provider>,
    );

    await waitFor(() => {
      const selects = container.querySelectorAll('.ant-select');
      expect(selects).toHaveLength(2);
      expect(selects[1]).toHaveClass('ant-select-disabled');
    });
    expect(
      normalizeSettingsForSchema(schema, {
        collection: 'products',
        displayField: 'products.name',
      }).value,
    ).toMatchObject({
      collection: 'products',
      displayField: 'name',
    });
  });

  it('resolves CollectionFieldSelect dependencies from the same nested object scope', async () => {
    const products = {
      name: 'products',
      title: 'Products',
      getFields: () => [
        {
          name: 'name',
          title: 'Name',
        },
      ],
    };
    const schema = {
      type: 'object',
      properties: {
        advanced: {
          type: 'object',
          properties: {
            collection: {
              type: 'string',
              'x-component': 'CollectionSelect',
            },
            displayField: {
              type: 'string',
              'x-component': 'CollectionFieldSelect',
            },
          },
        },
      },
    };
    const app = {
      dataSourceManager: {
        getDataSources: () => [
          {
            key: 'main',
            getCollections: () => [products],
            getCollection: (name: string) => (name === products.name ? products : undefined),
          },
        ],
      },
    };

    const { container } = render(
      <ApplicationContext.Provider value={app as never}>
        <SettingsAutoForm schema={schema} value={{ advanced: { collection: 'products', displayField: 'name' } }} />
      </ApplicationContext.Provider>,
    );

    await waitFor(() => {
      const selects = container.querySelectorAll('.ant-select');
      expect(selects).toHaveLength(2);
      expect(selects[1]).not.toHaveClass('ant-select-disabled');
    });
    expect(
      normalizeSettingsForSchema(schema, {
        advanced: {
          collection: 'products',
          displayField: 'products.name',
        },
      }).value,
    ).toMatchObject({
      advanced: {
        collection: 'products',
        displayField: 'name',
      },
    });
  });

  it('falls back to the top-level collection when a nested CollectionFieldSelect has no local collection', async () => {
    const products = {
      name: 'products',
      title: 'Products',
      getFields: () => [
        {
          name: 'name',
          title: 'Name',
        },
      ],
    };
    const schema = {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          'x-component': 'CollectionSelect',
        },
        advanced: {
          type: 'object',
          properties: {
            displayField: {
              type: 'string',
              'x-component': 'CollectionFieldSelect',
            },
          },
        },
      },
    };
    const app = {
      dataSourceManager: {
        getDataSources: () => [
          {
            key: 'main',
            getCollections: () => [products],
            getCollection: (name: string) => (name === products.name ? products : undefined),
          },
        ],
      },
    };

    const { container } = render(
      <ApplicationContext.Provider value={app as never}>
        <SettingsAutoForm schema={schema} value={{ collection: 'products', advanced: { displayField: 'name' } }} />
      </ApplicationContext.Provider>,
    );

    await waitFor(() => {
      const selects = container.querySelectorAll('.ant-select');
      expect(selects).toHaveLength(2);
      expect(selects[1]).not.toHaveClass('ant-select-disabled');
    });
    expect(
      normalizeSettingsForSchema(schema, {
        collection: 'products',
        advanced: {
          displayField: 'products.name',
        },
      }).value,
    ).toMatchObject({
      collection: 'products',
      advanced: {
        displayField: 'name',
      },
    });
  });

  it('resolves CollectionFieldSelect dependencies from ancestor object scopes', async () => {
    const products = {
      name: 'products',
      title: 'Products',
      getFields: () => [
        {
          name: 'name',
          title: 'Name',
        },
      ],
    };
    const schema = {
      type: 'object',
      properties: {
        advanced: {
          type: 'object',
          properties: {
            collection: {
              type: 'string',
              'x-component': 'CollectionSelect',
            },
            filters: {
              type: 'object',
              properties: {
                displayField: {
                  type: 'string',
                  'x-component': 'CollectionFieldSelect',
                },
              },
            },
          },
        },
      },
    };
    const app = {
      dataSourceManager: {
        getDataSources: () => [
          {
            key: 'main',
            getCollections: () => [products],
            getCollection: (name: string) => (name === products.name ? products : undefined),
          },
        ],
      },
    };

    const { container } = render(
      <ApplicationContext.Provider value={app as never}>
        <SettingsAutoForm
          schema={schema}
          value={{ advanced: { collection: 'products', filters: { displayField: 'name' } } }}
        />
      </ApplicationContext.Provider>,
    );

    await waitFor(() => {
      const selects = container.querySelectorAll('.ant-select');
      expect(selects).toHaveLength(2);
      expect(selects[1]).not.toHaveClass('ant-select-disabled');
    });
    expect(
      normalizeSettingsForSchema(schema, {
        advanced: {
          collection: 'products',
          filters: {
            displayField: 'products.name',
          },
        },
      }).value,
    ).toMatchObject({
      advanced: {
        collection: 'products',
        filters: {
          displayField: 'name',
        },
      },
    });
  });

  it('resolves selector dataSource dependencies from ancestor object scopes', async () => {
    const products = {
      name: 'products',
      title: 'Products',
      getFields: () => [{ name: 'name', title: 'Name' }],
    };
    const schema = {
      type: 'object',
      properties: {
        advanced: {
          type: 'object',
          properties: {
            dataSource: {
              type: 'string',
              'x-component': 'DataSourceSelect',
            },
            filters: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  'x-component': 'CollectionSelect',
                },
              },
            },
          },
        },
      },
    };
    const app = {
      dataSourceManager: {
        getDataSources: () => [
          {
            key: 'archive',
            displayName: 'Archive',
            getCollections: () => [],
            getCollection: () => undefined,
          },
          {
            key: 'main',
            displayName: 'Main',
            getCollections: () => [products],
            getCollection: (name: string) => (name === products.name ? products : undefined),
          },
        ],
        getDataSource: (key: string) =>
          key === 'main'
            ? {
                key: 'main',
                displayName: 'Main',
                getCollections: () => [products],
                getCollection: (name: string) => (name === products.name ? products : undefined),
              }
            : undefined,
      },
    };

    const { container } = render(
      <ApplicationContext.Provider value={app as never}>
        <SettingsAutoForm schema={schema} value={{ advanced: { dataSource: 'main', filters: {} } }} />
      </ApplicationContext.Provider>,
    );

    await waitFor(() => {
      const selectors = container.querySelectorAll('.ant-select-selector');
      expect(selectors).toHaveLength(2);
      fireEvent.mouseDown(selectors[1]);
    });
    expect(document.body).toHaveTextContent('Products');
  });

  it('loads RoleSelect options from the system roles resource before falling back to current user roles', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [
          { name: 'admin', title: 'Admin' },
          { name: 'member', title: 'Member' },
        ],
      },
    });
    const app = {
      apiClient: {
        resource: (name: string) => (name === 'roles' ? { list } : undefined),
      },
      flowEngine: {
        context: {
          user: {
            roles: [{ name: 'admin', title: 'Admin' }],
          },
          t: (key: string) => key,
        },
      },
    };
    const { container } = render(
      <ApplicationContext.Provider value={app as never}>
        <SettingsAutoForm
          schema={{
            type: 'object',
            properties: {
              visibleForRole: {
                type: 'string',
                'x-component': 'RoleSelect',
              },
            },
          }}
          value={{}}
        />
      </ApplicationContext.Provider>,
    );

    await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ paginate: false })));
    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as HTMLElement);
    expect(document.body).toHaveTextContent('Member');
  });

  it('validates supported string formats', async () => {
    const onChange = vi.fn();
    render(
      <SettingsAutoForm
        schema={{
          type: 'object',
          properties: {
            contact: {
              type: 'string',
              format: 'email',
            },
          },
        }}
        value={{ contact: 'not-an-email' }}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        {
          contact: 'not-an-email',
        },
        expect.objectContaining({
          errors: [
            expect.objectContaining({
              label: 'contact',
              message: 'Must match the required format',
            }),
          ],
        }),
      );
    });
  });

  it('validates empty strings when the runtime schema format requires a non-empty value', async () => {
    const onChange = vi.fn();
    render(
      <SettingsAutoForm
        schema={{
          type: 'object',
          properties: {
            contact: {
              type: 'string',
              format: 'email',
            },
          },
        }}
        value={{ contact: '' }}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        {
          contact: '',
        },
        expect.objectContaining({
          errors: [
            expect.objectContaining({
              label: 'contact',
              message: 'Must match the required format',
            }),
          ],
        }),
      );
    });
  });

  it('validates uri and url formats with hostname semantics aligned to runtime', async () => {
    const onChange = vi.fn();
    render(
      <SettingsAutoForm
        schema={{
          type: 'object',
          properties: {
            webhook: {
              type: 'string',
              format: 'uri',
            },
          },
        }}
        value={{ webhook: 'mailto:test@example.com' }}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        {
          webhook: 'mailto:test@example.com',
        },
        expect.objectContaining({
          errors: [
            expect.objectContaining({
              label: 'webhook',
              message: 'Must match the required format',
            }),
          ],
        }),
      );
    });
  });

  it('treats required empty strings as present values like runtime validation', async () => {
    const onChange = vi.fn();
    render(
      <SettingsAutoForm
        schema={{
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
            },
          },
        }}
        value={{ title: '' }}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        {
          title: '',
        },
        expect.objectContaining({
          errors: [],
        }),
      );
    });
  });

  it('treats required undefined values as missing like JSON runtime payloads', () => {
    expect(
      normalizeSettingsForSchema(
        {
          type: 'object',
          required: ['count'],
          properties: {
            count: {
              type: 'number',
            },
          },
        },
        {
          count: undefined,
        },
      ).errors,
    ).toEqual([
      expect.objectContaining({
        label: 'count',
        message: 'Required',
      }),
    ]);
  });

  it('validates required null values against their schema type like runtime validation', async () => {
    const onChange = vi.fn();
    render(
      <SettingsAutoForm
        schema={{
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
            },
          },
        }}
        value={{ title: null }}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        {
          title: null,
        },
        expect.objectContaining({
          errors: [
            expect.objectContaining({
              label: 'title',
              message: 'Must be a string',
            }),
          ],
        }),
      );
    });
  });

  it('validates null object values against their schema type like runtime validation', async () => {
    const onChange = vi.fn();
    render(
      <SettingsAutoForm
        schema={{
          type: 'object',
          properties: {
            profile: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                },
              },
            },
          },
        }}
        value={{ profile: null }}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        {
          profile: null,
        },
        expect.objectContaining({
          errors: [
            expect.objectContaining({
              label: 'profile',
              message: 'Must be an object',
            }),
          ],
        }),
      );
    });
  });

  it('validates array items against the item schema', async () => {
    const onChange = vi.fn();
    render(
      <SettingsAutoForm
        schema={{
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: {
                type: 'string',
                minLength: 2,
              },
            },
          },
        }}
        value={{ tags: ['a'] }}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        {
          tags: ['a'],
        },
        expect.objectContaining({
          errors: [
            expect.objectContaining({
              label: 'tags[0]',
              message: 'Too short',
            }),
          ],
        }),
      );
    });
  });

  it('infers array schemas from items like runtime validation', () => {
    expect(
      normalizeSettingsForSchema(
        {
          type: 'object',
          properties: {
            tags: {
              items: {
                type: 'string',
                minLength: 2,
              },
            },
          },
        },
        {
          tags: ['a'],
        },
      ).errors,
    ).toEqual([
      expect.objectContaining({
        label: 'tags[0]',
        message: 'Too short',
      }),
    ]);
  });

  it('validates null array items against the item schema type', async () => {
    const onChange = vi.fn();
    render(
      <SettingsAutoForm
        schema={{
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        }}
        value={{ tags: [null] }}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        {
          tags: [null],
        },
        expect.objectContaining({
          errors: [
            expect.objectContaining({
              label: 'tags[0]',
              message: 'Must be a string',
            }),
          ],
        }),
      );
    });
  });

  it('validates null array object items against the item schema type', async () => {
    const onChange = vi.fn();
    render(
      <SettingsAutoForm
        schema={{
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                  },
                },
              },
            },
          },
        }}
        value={{ rows: [null] }}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        {
          rows: [null],
        },
        expect.objectContaining({
          errors: [
            expect.objectContaining({
              label: 'rows[0]',
              message: 'Must be an object',
            }),
          ],
        }),
      );
    });
  });

  it('compares structured enum values by stable JSON semantics like runtime validation', () => {
    const schema = {
      type: 'object',
      properties: {
        layout: {
          enum: [{ size: 'small', columns: [1, 2] }],
        },
      },
    };

    expect(
      normalizeSettingsForSchema(schema, {
        layout: {
          columns: [1, 2],
          size: 'small',
        },
      }).errors,
    ).toEqual([]);
    expect(
      normalizeSettingsForSchema(schema, {
        layout: {
          columns: [2, 1],
          size: 'small',
        },
      }).errors,
    ).toEqual([
      expect.objectContaining({
        label: 'layout',
        message: 'Must be one of the allowed values',
      }),
    ]);
  });
});
