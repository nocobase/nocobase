/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { App, ConfigProvider } from 'antd';
import { render } from '@nocobase/test/client';
import { describe, expect, it } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { JSBlockModel } from '../JSBlock';

function createJSBlock(uid: string, showBlockCard?: boolean, decoratorProps?: Record<string, unknown>) {
  const engine = new FlowEngine();
  engine.registerModels({ JSBlockModel });
  const model = engine.createModel<JSBlockModel>({
    use: 'JSBlockModel',
    uid,
    stepParams:
      typeof showBlockCard === 'boolean'
        ? {
            jsSettings: {
              showBlockCard: {
                showBlockCard,
              },
            },
          }
        : undefined,
  });
  model.setDecoratorProps({
    className: 'custom-js-block-shell',
    style: {
      minHeight: 120,
    },
    ...(decoratorProps || {}),
  });
  return { engine, model };
}

function renderBlock(engine: FlowEngine, model: JSBlockModel) {
  return render(
    <FlowEngineProvider engine={engine}>
      <ConfigProvider>
        <App>{model.render()}</App>
      </ConfigProvider>
    </FlowEngineProvider>,
  );
}

describe('JSBlockModel', () => {
  it('renders with the outer block card by default', () => {
    const { engine, model } = createJSBlock('js-block-with-card');
    const { container } = renderBlock(engine, model);
    const host = container.querySelector('#model-js-block-with-card');

    expect(host).toBeTruthy();
    expect(host?.classList.contains('ant-card')).toBe(true);
    expect(host?.classList.contains('code-block')).toBe(true);
    expect(host?.classList.contains('custom-js-block-shell')).toBe(true);
  });

  it('renders a plain host without the outer card when showBlockCard is false', () => {
    const { engine, model } = createJSBlock('js-block-without-card', false, {
      showCard: true,
    });
    const { container } = renderBlock(engine, model);
    const host = container.querySelector('#model-js-block-without-card') as HTMLElement | null;

    expect(container.querySelector('.ant-card')).toBeNull();
    expect(host).toBeInstanceOf(HTMLDivElement);
    expect(host?.classList.contains('code-block')).toBe(true);
    expect(host?.classList.contains('custom-js-block-shell')).toBe(true);
    expect(host?.style.minHeight).toBe('120px');
    expect(model.context.ref.current).toBe(host?.firstElementChild);
  });

  it('keeps cardless specified-height content scrollable inside the plain host', () => {
    const { engine, model } = createJSBlock('js-block-without-card-height', false, {
      heightMode: 'specifyValue',
      height: 80,
      style: undefined,
    });
    const { container } = renderBlock(engine, model);
    const host = container.querySelector('#model-js-block-without-card-height') as HTMLElement | null;
    const overflowContent = document.createElement('div');
    overflowContent.style.height = '200px';
    model.context.ref.current?.appendChild(overflowContent);

    expect(host?.style.height).toBe('80px');
    expect(host?.style.minHeight).toBe('0');
    expect(host?.style.overflow).toBe('auto');
    expect(model.context.ref.current?.firstElementChild).toBe(overflowContent);
  });
});
