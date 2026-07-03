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
import { waitFor } from '@testing-library/react';
import { render } from '@nocobase/test/client';
import { describe, expect, it, vi } from 'vitest';
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

function makeRefReady(model: JSBlockModel) {
  const element = document.createElement('div');
  (model.context.ref as React.MutableRefObject<HTMLDivElement | null>).current = element;
  return element;
}

async function runConfiguredJSBlock(model: JSBlockModel, code: string) {
  model.setStepParams('jsSettings', 'runJs', { code, version: 'v2' });
  makeRefReady(model);
  await model.dispatchEvent('beforeRender', undefined, { useCache: false });
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

  it('calculates cardless full-height on the plain host', () => {
    const originalInnerHeight = window.innerHeight;
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 500,
    });
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if ((this as HTMLElement).id === 'model-js-block-without-card-full-height') {
        return {
          x: 0,
          y: 150,
          top: 150,
          left: 0,
          bottom: 150,
          right: 0,
          width: 0,
          height: 0,
          toJSON: () => ({}),
        } as DOMRect;
      }
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
        toJSON: () => ({}),
      } as DOMRect;
    });

    try {
      const { engine, model } = createJSBlock('js-block-without-card-full-height', false, {
        heightMode: 'fullHeight',
        style: undefined,
      });
      const { container } = renderBlock(engine, model);
      const host = container.querySelector('#model-js-block-without-card-full-height') as HTMLElement | null;

      expect(parseInt(host?.style.height || '0', 10)).toBeGreaterThan(0);
      expect(host?.style.overflow).toBe('auto');
    } finally {
      rectSpy.mockRestore();
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: originalInnerHeight,
      });
    }
  });

  it('preloads ACL data before running configured JavaScript', async () => {
    const { engine, model } = createJSBlock('js-block-acl-preload');
    const request = vi.fn().mockResolvedValue({
      data: {
        data: {
          allowAll: true,
          role: 'root',
        },
        meta: {},
      },
    });
    engine.context.defineProperty('api', {
      value: {
        auth: {
          token: 'token-1',
        },
        request,
      },
    });

    await runConfiguredJSBlock(
      model,
      `ctx.model.setProps({ aclLoadedBeforeRunJS: ctx.acl.data.allowAll === true && ctx.acl.data.role === 'root' });`,
    );

    await waitFor(() => {
      expect(model.props.aclLoadedBeforeRunJS).toBe(true);
    });
    expect(request).toHaveBeenCalledWith({
      url: 'roles:check',
      skipNotify: true,
      skipAuth: true,
    });
  });

  it('skips ACL preload on routes that skip auth checks', async () => {
    const { engine, model } = createJSBlock('js-block-acl-skip-route');
    const request = vi.fn();
    const isSkippedAuthCheckRoute = vi.fn(() => true);
    engine.context.defineProperty('api', {
      value: {
        auth: {
          token: 'token-1',
        },
        request,
      },
    });
    engine.context.defineProperty('app', {
      value: {
        router: {
          isSkippedAuthCheckRoute,
        },
      },
    });
    engine.context.defineProperty('location', {
      value: {
        pathname: '/signin',
      },
    });

    await runConfiguredJSBlock(model, `ctx.model.setProps({ skippedRouteRendered: true });`);

    await waitFor(() => {
      expect(model.props.skippedRouteRendered).toBe(true);
    });
    expect(isSkippedAuthCheckRoute).toHaveBeenCalledWith('/signin');
    expect(request).not.toHaveBeenCalled();
  });

  it('keeps running JavaScript when ACL preload returns unauthorized', async () => {
    const { engine, model } = createJSBlock('js-block-acl-unauthorized');
    const request = vi.fn().mockRejectedValue({
      response: {
        status: 401,
      },
    });
    engine.context.defineProperty('api', {
      value: {
        auth: {
          token: 'token-1',
        },
        request,
      },
    });

    await runConfiguredJSBlock(
      model,
      `ctx.model.setProps({ unauthorizedRendered: true, unauthorizedCanWrite: ctx.acl.can('posts:write') });`,
    );

    await waitFor(() => {
      expect(model.props.unauthorizedRendered).toBe(true);
    });
    expect(model.props.unauthorizedCanWrite).toBe(false);
    expect(request).toHaveBeenCalledWith({
      url: 'roles:check',
      skipNotify: true,
      skipAuth: true,
    });
  });
});
