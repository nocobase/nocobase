/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BaseLayoutModel } from '../../flow/admin-shell/BaseLayoutModel';
import { LayoutContentRoute } from '../LayoutContentRoute';
import { LayoutRoute } from '../LayoutRoute';
import type { LayoutDefinition } from '../types';
import { getLayoutContentRouteName } from '../utils';

class TestLayoutModel extends BaseLayoutModel {
  render() {
    return <div data-testid="layout-route">{this.layout.name}</div>;
  }
}

const layout: LayoutDefinition = {
  name: 'test',
  basePath: '/test',
  normalizedBasePath: 'test',
  uid: 'test-layout-model',
  layoutModelClass: 'TestLayoutModel',
  rootPageModelClass: 'TestRootPageModel',
  childPageModelClass: 'TestChildPageModel',
  authCheck: true,
};

describe('LayoutRoute', () => {
  it('creates layout model from registered string class and injects layout definition', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ TestLayoutModel });
    engine.context.defineProperty('app', {
      value: {
        layoutManager: {
          getLayout: () => layout,
        },
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <LayoutRoute layoutName="test" />
      </FlowEngineProvider>,
    );

    expect(await screen.findByTestId('layout-route')).toHaveTextContent('test');
    const model = engine.getModel<TestLayoutModel>('test-layout-model');
    expect(model).toBeInstanceOf(TestLayoutModel);
    expect(model.layout).toMatchObject({
      name: 'test',
      normalizedBasePath: 'test',
      rootPageModelClass: 'TestRootPageModel',
      childPageModelClass: 'TestChildPageModel',
    });
  });
});

describe('LayoutContentRoute', () => {
  function setup(initialEntry: string) {
    const engine = new FlowEngine();
    engine.registerModels({ TestLayoutModel });
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: () => Promise.resolve(),
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded: () => Promise.resolve(),
        getRouteBySchemaUid: () => ({ type: 'flowPage', schemaUid: 'page-1' }),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/',
        layoutManager: {
          getLayout: () => layout,
        },
        router: {
          getBasename: () => '',
        },
      },
    });
    const model = engine.createModel<TestLayoutModel>({
      uid: layout.uid,
      use: TestLayoutModel,
      props: {
        layout,
      },
    });
    const router = createMemoryRouter(
      [
        {
          id: getLayoutContentRouteName(layout.name),
          path: '/test/*',
          element: <LayoutContentRoute layoutName="test" />,
        },
      ],
      {
        initialEntries: [initialEntry],
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <RouterProvider router={router} />
      </FlowEngineProvider>,
    );

    return { model };
  }

  it('syncs root layout route without rendering page content', async () => {
    const { model } = setup('/test');

    await waitFor(() => {
      expect(model.currentLayoutRoute).toMatchObject({
        type: 'root',
        pathname: '/test',
        relativePath: '',
      });
    });
  });

  it('parses page route from catch-all pathname', async () => {
    const { model } = setup('/test/page-1/tab/tab-1/view/popup');

    await waitFor(() => {
      expect(model.currentLayoutRoute).toMatchObject({
        type: 'page',
        pageUid: 'page-1',
        tabUid: 'tab-1',
        viewStack: [{ viewUid: 'page-1', tabUid: 'tab-1' }, { viewUid: 'popup' }],
      });
    });
  });

  it('renders not found for unsupported content path', async () => {
    const { model } = setup('/test/page-1/unknown/value');

    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(model.currentLayoutRoute).toMatchObject({
      type: 'notFound',
      relativePath: 'page-1/unknown/value',
    });
  });
});
