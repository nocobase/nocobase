/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, waitFor } from '@testing-library/react';
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

describe('SettingsAutoForm', () => {
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

  it('reports validation changes when the selected publication schema changes without changing settings', async () => {
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
