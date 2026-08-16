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
  SettingsSingleField,
} from '../components/SettingsAutoForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/client-v2')>()),
  ApplicationContext: (await import('react')).createContext(null),
}));

describe('SettingsSingleField', () => {
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

    expect(getByRole('switch', { name: 'Enable color' })).toBeInTheDocument();

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
    expect(getByRole('textbox', { name: 'Advanced color' })).toBeInTheDocument();
    fireEvent.change(getByDisplayValue('#ff0000'), { target: { value: '#00ff00' } });
    fireEvent.click(getByRole('switch'));
    await waitFor(() => expect(queryByText('Advanced color')).not.toBeInTheDocument());
    fireEvent.click(getByRole('switch'));
    await waitFor(() => expect(getByDisplayValue('#00ff00')).toBeInTheDocument());
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

  it('serializes date values as YYYY-MM-DD and date-time values as ISO timestamps', () => {
    const value = dayjs('2026-07-05T01:30:00.000Z');

    expect(serializeDatePickerValue({ format: 'date' }, value)).toBe('2026-07-05');
    expect(serializeDatePickerValue({ format: 'date-time' }, value)).toBe('2026-07-05T01:30:00.000Z');
  });

  it('renders advanced safe selector components from the JS Template whitelist', async () => {
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

    render(
      <ApplicationContext.Provider value={app as never}>
        <SettingsSingleField
          fieldName="settings"
          fieldSchema={{
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
            },
          }}
          value={{
            collection: 'products',
            displayField: 'name',
            visibleForRole: 'admin',
            dataSource: 'main',
          }}
        />
      </ApplicationContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')).toHaveLength(4);
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

    render(
      <ApplicationContext.Provider value={app as never}>
        <SettingsSingleField fieldName="settings" fieldSchema={schema} value={{ displayField: 'products.name' }} />
      </ApplicationContext.Provider>,
    );

    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
      expect(selects[1]).toBeDisabled();
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

    render(
      <ApplicationContext.Provider value={app as never}>
        <SettingsSingleField
          fieldName="settings"
          fieldSchema={schema}
          value={{ advanced: { dataSource: 'main', filters: {} } }}
        />
      </ApplicationContext.Provider>,
    );

    await waitFor(() => {
      const selectors = screen.getAllByRole('combobox');
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
    render(
      <ApplicationContext.Provider value={app as never}>
        <SettingsSingleField
          fieldName="settings"
          fieldSchema={{
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
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(document.body).toHaveTextContent('Member');
  });
});
