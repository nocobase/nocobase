/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { BaseLayoutModel } from '../../flow/admin-shell/BaseLayoutModel';
import { LayoutRoute } from '../LayoutRoute';
import type { LayoutDefinition } from '../types';

class TestLayoutModel extends BaseLayoutModel {
  render() {
    return <div data-testid="layout-route">{this.layout.name}</div>;
  }
}

const layout: LayoutDefinition = {
  name: 'test',
  pathPrefix: '/test',
  normalizedPathPrefix: 'test',
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
      normalizedPathPrefix: 'test',
      rootPageModelClass: 'TestRootPageModel',
      childPageModelClass: 'TestChildPageModel',
    });
  });
});
