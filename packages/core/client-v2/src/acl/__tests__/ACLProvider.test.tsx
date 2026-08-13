/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FLOW_SETTINGS_PREFERENCE_STORAGE_KEY,
  writeFlowSettingsPreference,
} from '../../flow/admin-shell/admin-layout/flowSettingsPreference';
import { ACLRolesCheckProvider } from '../ACLProvider';

const mocks = vi.hoisted(() => ({
  app: undefined as unknown,
}));

vi.mock('../../hooks/useApp', () => ({
  useApp: () => mocks.app,
}));

describe('ACLRolesCheckProvider', () => {
  beforeEach(() => {
    window.localStorage.removeItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY);
  });

  it('exits UI editing mode when the current role cannot configure pages', async () => {
    const disable = vi.fn(async () => undefined);
    const setRole = vi.fn();
    const aclContext: Record<string, unknown> = {};
    const appContext = {
      acl: undefined,
      defineProperty(name: string, descriptor: PropertyDescriptor) {
        Object.defineProperty(this, name, descriptor);
      },
      ...aclContext,
    };

    mocks.app = {
      apiClient: {
        auth: {
          role: 'member',
          setRole,
        },
        request: vi.fn(async () => ({
          data: {
            data: {
              role: 'viewer',
              snippets: [],
            },
            meta: {},
          },
        })),
      },
      context: appContext,
      flowEngine: {
        flowSettings: {
          disable,
        },
      },
      pluginSettingsManager: {
        setAclSnippets: vi.fn(),
      },
      renderComponent: () => <div>Loading</div>,
      router: {
        isSkippedAuthCheckRoute: () => false,
      },
    };
    writeFlowSettingsPreference(true);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ACLRolesCheckProvider>
          <div>Page content</div>
        </ACLRolesCheckProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Page content')).toBeInTheDocument();
    await waitFor(() => {
      expect(disable).toHaveBeenCalledTimes(1);
    });
    expect(window.localStorage.getItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY)).toBe('0');
    expect(setRole).toHaveBeenCalledWith('viewer');
  });
});
