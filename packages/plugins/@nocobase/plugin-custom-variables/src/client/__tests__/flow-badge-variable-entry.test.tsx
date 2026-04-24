/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@nocobase/test/client';

const mocks = vi.hoisted(() => {
  const renderMock = vi.fn(() => <div data-testid="initializer-render" />);
  const useSchemaInitializerRenderMock = vi.fn(() => ({ render: renderMock }));
  const useTokenMock = vi.fn(() => ({ token: { borderRadius: 8 } }));
  const useVariableScopeInfoMock = vi.fn(() => ({ getVariableScopeInfo: () => ({ scopeId: 'page-1' }) }));
  const requestMock = vi.fn();
  const dataSourceApplicationProviderMock = vi.fn(({ children }) => (
    <div data-testid="data-source-application-provider">{children}</div>
  ));
  const schemaComponentOptionsMock = vi.fn(({ children }) => (
    <div data-testid="schema-component-options">{children}</div>
  ));
  const schemaComponentMock = vi.fn(() => <div data-testid="schema-component" />);
  const components = { Action: { Drawer: 'ActionDrawerComponent' } };
  const scopes = { t: (value: string) => value };
  const useAppMock = vi.fn(() => ({
    components,
    dataSourceManager: { getDataSources: vi.fn(() => []) },
    scopes,
  }));

  return {
    components,
    dataSourceApplicationProviderMock,
    renderMock,
    schemaComponentMock,
    schemaComponentOptionsMock,
    scopes,
    requestMock,
    useSchemaInitializerRenderMock,
    useTokenMock,
    useVariableScopeInfoMock,
    useAppMock,
  };
});

vi.mock('@nocobase/client', async () => {
  const actual = await vi.importActual<object>('@nocobase/client');

  return {
    ...actual,
    ActionContextProvider: ({ children }) => <div data-testid="action-context-provider">{children}</div>,
    DataSourceApplicationProvider: (props) => mocks.dataSourceApplicationProviderMock(props),
    SchemaComponent: (props) => mocks.schemaComponentMock(props),
    SchemaComponentOptions: (props) => mocks.schemaComponentOptionsMock(props),
    SchemaInitializerItem: ({ title, onClick }) => (
      <button data-testid="schema-initializer-item" onClick={onClick}>
        {title}
      </button>
    ),
    useSchemaInitializerRender: mocks.useSchemaInitializerRenderMock,
    useToken: mocks.useTokenMock,
    useVariableScopeInfo: mocks.useVariableScopeInfoMock,
    useApp: mocks.useAppMock,
  };
});

import { AddVariableButton } from '../AddVariableButton';
import {
  clearCustomVariableRequestCache,
  getCustomVariableConfig,
  parseCustomVariable,
} from '../customVariableRequestCache';
import { variableInitializer } from '../variableInitializer';

describe('flow badge variable entry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCustomVariableRequestCache();
  });

  it('should render add variable initializer with designable enabled', () => {
    render(<AddVariableButton />);

    expect(mocks.useSchemaInitializerRenderMock).toHaveBeenCalledWith('customVariables:addVariable', {
      designable: true,
    });
    expect(mocks.renderMock).toHaveBeenCalledWith({ style: { borderRadius: 8 } });
    expect(screen.getByTestId('initializer-render')).toBeInTheDocument();
  });

  it('should not render add variable initializer without scope', () => {
    mocks.useVariableScopeInfoMock.mockReturnValueOnce({ getVariableScopeInfo: () => ({ scopeId: undefined }) });

    render(<AddVariableButton />);

    expect(mocks.useSchemaInitializerRenderMock).toHaveBeenCalledWith('customVariables:addVariable', undefined);
    expect(mocks.renderMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('initializer-render')).not.toBeInTheDocument();
  });

  it('should bridge app components and scopes for aggregate variable renderer', () => {
    const AggregateVariableItem = (
      variableInitializer.options.items?.find((item) => item.name === 'aggregateVariable') as any
    )?.Component;

    render(<AggregateVariableItem />);

    expect(mocks.useAppMock).toHaveBeenCalled();
    expect(mocks.dataSourceApplicationProviderMock).toHaveBeenCalled();
    expect(mocks.schemaComponentOptionsMock).toHaveBeenCalled();
    expect(mocks.schemaComponentMock).toHaveBeenCalled();
    expect(mocks.dataSourceApplicationProviderMock.mock.calls[0][0]).toMatchObject({
      dataSourceManager: expect.any(Object),
    });
    expect(mocks.schemaComponentOptionsMock.mock.calls[0][0]).toMatchObject({
      components: mocks.components,
      scope: mocks.scopes,
    });
    expect(screen.getByTestId('data-source-application-provider')).toBeInTheDocument();
    expect(screen.getByTestId('schema-component-options')).toBeInTheDocument();
    expect(screen.getByTestId('schema-component')).toBeInTheDocument();
  });

  it('should reuse custom variable config and parse requests with the same key', async () => {
    mocks.requestMock.mockImplementation(async ({ url }) => {
      if (url.startsWith('customVariables:get')) {
        return {
          data: {
            data: {
              name: 'foo',
              options: { params: { filter: {} }, collection: 'users' },
            },
          },
        };
      }

      return { data: { data: 3 } };
    });

    await Promise.all([
      getCustomVariableConfig({ request: mocks.requestMock }, 'foo'),
      getCustomVariableConfig({ request: mocks.requestMock }, 'foo'),
    ]);
    await Promise.all([
      parseCustomVariable({ request: mocks.requestMock }, 'foo', { status: 'active' }),
      parseCustomVariable({ request: mocks.requestMock }, 'foo', { status: 'active' }),
    ]);

    expect(mocks.requestMock).toHaveBeenCalledTimes(2);
    expect(mocks.requestMock).toHaveBeenNthCalledWith(1, {
      url: 'customVariables:get?filter[name]=foo',
      method: 'GET',
    });
    expect(mocks.requestMock).toHaveBeenNthCalledWith(2, {
      url: 'customVariables:parse?name=foo',
      method: 'POST',
      data: { filterCtx: { status: 'active' } },
    });
  });
});
