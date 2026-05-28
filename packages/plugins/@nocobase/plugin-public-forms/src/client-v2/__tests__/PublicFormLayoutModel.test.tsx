/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUBLIC_FORM_TOKEN_KEY } from '../constants';
import type { PublicFormLayoutModel } from '../models/PublicFormLayoutModel';

const mocks = vi.hoisted(() => {
  const requestInterceptor = {
    use: vi.fn(() => 1),
    eject: vi.fn(),
  };
  const app = {
    apiClient: {
      request: vi.fn(),
      axios: {
        interceptors: {
          request: requestInterceptor,
        },
      },
    },
  };
  const flowEngine = {
    resolveModelTree: vi.fn(),
    getModel: vi.fn(),
    createModelAsync: vi.fn(),
  };

  return {
    app,
    flowEngine,
    requestInterceptor,
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    PoweredBy: () => <div data-testid="powered-by" />,
    useApp: () => mocks.app,
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowEngine: () => mocks.flowEngine,
  };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useOutlet: () => null,
  };
});

describe('PublicFormLayoutModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.app.apiClient.request.mockResolvedValue({
      data: {
        data: {
          flowModel: {
            uid: 'public-form-page',
            use: 'RouteModel',
          },
        },
      },
    });
    mocks.flowEngine.resolveModelTree.mockResolvedValue(undefined);
    mocks.flowEngine.getModel.mockReturnValue(null);
    mocks.flowEngine.createModelAsync.mockResolvedValue(null);
  });

  it('passes cached form token on the initial public form meta request', async () => {
    localStorage.setItem(PUBLIC_FORM_TOKEN_KEY, 'cached-form-token');
    const { PublicFormLayoutModel } = await import('../models/PublicFormLayoutModel');
    const model = {
      currentLayoutRoute: {},
      getPageUidFromLayoutRoute: vi.fn(() => 'pf1'),
      applyPublicDataSource: vi.fn(),
      setLayoutContentElement: vi.fn(),
      setPublicFormKey: vi.fn(),
      setPublicFormSubmitted: vi.fn(),
    } as unknown as PublicFormLayoutModel;

    render(PublicFormLayoutModel.prototype.render.call(model));

    await waitFor(() => {
      expect(mocks.app.apiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'X-Form-Token': 'cached-form-token',
          },
          skipAuth: true,
          url: 'publicForms:getMeta/pf1',
        }),
      );
    });
  });
});
