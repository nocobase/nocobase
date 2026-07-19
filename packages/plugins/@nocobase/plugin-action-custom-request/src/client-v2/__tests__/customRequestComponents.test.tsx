/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequestKeyField } from '../components/RequestKeyField';
import { RolesSelect } from '../components/RolesSelect';
import { customRequestUiSchema } from '../customRequestUiSchema';

type FlowContext = {
  request?: ReturnType<typeof vi.fn>;
  api?: {
    resource: ReturnType<typeof vi.fn>;
  };
};

const mocks = vi.hoisted(() => ({
  form: {
    values: {},
    setValues: vi.fn(),
  },
  flowContext: {} as FlowContext,
}));

vi.mock('@formily/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@formily/react')>()),
  useForm: () => mocks.form,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => mocks.flowContext,
  };
});

describe('custom request components', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.form.values = {};
    mocks.flowContext = {};
  });

  it('generates a request key when the field has no value', async () => {
    const onChange = vi.fn();

    render(<RequestKeyField onChange={onChange} />);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^req-/));
    });
  });

  it('loads existing request configuration into the form', async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        data: {
          options: {
            method: 'PUT',
            url: 'https://example.com',
            headers: [{ name: 'Authorization', value: 'Bearer token' }],
            params: [{ name: 'page', value: '1' }],
            data: {
              ok: true,
            },
            responseType: 'stream',
          },
          roles: [{ name: 'admin' }],
        },
      },
    });
    mocks.flowContext = {
      request,
    };

    render(<RequestKeyField value="req-1" />);

    await waitFor(() => {
      expect(mocks.form.setValues).toHaveBeenCalledWith({
        method: 'PUT',
        url: 'https://example.com',
        headers: [{ name: 'Authorization', value: 'Bearer token' }],
        params: [{ name: 'page', value: '1' }],
        data: JSON.stringify({ ok: true }, null, 2),
        timeout: 5000,
        responseType: 'stream',
        roles: ['admin'],
      });
    });
  });

  it('loads role options for the roles select', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ title: 'Admin', name: 'admin' }, { title: 'Empty' }],
      },
    });
    const resource = vi.fn(() => ({
      list,
    }));
    mocks.flowContext = {
      api: {
        resource,
      },
    };

    render(<RolesSelect value={['admin']} onChange={vi.fn()} />);

    await waitFor(() => {
      expect(resource).toHaveBeenCalledWith('roles');
      expect(list).toHaveBeenCalledWith({
        pageSize: 200,
        sort: ['createdAt'],
      });
    });
  });

  it('exposes the expected fields in the configuration schema', () => {
    expect(customRequestUiSchema).toMatchObject({
      key: {
        'x-component': RequestKeyField,
      },
      method: {
        default: 'POST',
      },
      url: {
        required: true,
      },
      responseType: {
        default: 'json',
      },
      roles: {
        'x-component': RolesSelect,
      },
    });
  });
});
