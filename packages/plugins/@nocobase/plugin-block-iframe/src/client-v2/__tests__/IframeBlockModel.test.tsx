/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { FlowContext, FlowContextProvider, FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IframeBlockModel } from '../models/IframeBlockModel';

const iframeMocks = vi.hoisted(() => ({
  props: [] as Array<Record<string, unknown>>,
}));

vi.mock('react-iframe', () => ({
  default: (props: Record<string, unknown>) => {
    iframeMocks.props.push(props);
    return <iframe data-testid="iframe" src={String(props.url ?? '')} title="iframe" />;
  },
}));

type IframeSettingsFlow = {
  steps: {
    editIframe: {
      uiSchema: (ctx: { t: (key: string) => string }) => Record<string, unknown>;
      beforeParamsSave: (
        ctx: { api: { resource: (name: string) => Record<string, unknown> }; model: IframeSettingsModel },
        params: Record<string, unknown>,
      ) => Promise<void>;
      handler: (ctx: { model: IframeSettingsModel }, params: Record<string, unknown>) => Promise<void>;
    };
  };
};

type IframeSettingsModel = {
  setProps: (props: Record<string, unknown>) => void;
  setStepParams: (flowKey: string, stepKey: string, params: Record<string, unknown>) => void;
};

function getIframeSettingsFlow() {
  const modelClass = IframeBlockModel as typeof IframeBlockModel & {
    globalFlowRegistry: { getFlow: (key: string) => IframeSettingsFlow | undefined };
  };
  const flow = modelClass.globalFlowRegistry.getFlow('iframeBlockSettings');
  expect(flow).toBeDefined();
  return flow as IframeSettingsFlow;
}

function createFlowContext(options?: {
  html?: string;
  locale?: string;
  renderTemplate?: (value: string) => string;
  compile?: (value: string) => string;
}) {
  const ctx = new FlowContext();
  const request = vi.fn().mockResolvedValue({ data: options?.html ?? '<h1>{{ title }}</h1>' });
  const renderWithFullContext = vi.fn(async (value: string) => options?.renderTemplate?.(value) ?? value);

  Object.assign(ctx, {
    api: {
      request,
    },
    compile: options?.compile,
    liquid: {
      renderWithFullContext,
    },
    locale: options?.locale ?? 'en-US',
    t: (key: string) => key,
  });

  return { ctx, request, renderWithFullContext };
}

function renderWithContext(node: React.ReactNode, context = createFlowContext().ctx) {
  return render(<FlowContextProvider context={context}>{node}</FlowContextProvider>);
}

function renderWithEngineAndContext(node: React.ReactNode, context = createFlowContext().ctx) {
  const flowEngine = new FlowEngine();
  return render(
    <FlowEngineProvider engine={flowEngine}>
      <FlowContextProvider context={context}>{node}</FlowContextProvider>
    </FlowEngineProvider>,
  );
}

function createIframeModel(props: Record<string, unknown>, decoratorProps: Record<string, unknown> = {}) {
  const flowEngine = new FlowEngine();
  flowEngine.registerModels({ IframeBlockModel });
  const model = flowEngine.createModel<IframeBlockModel>({
    use: 'IframeBlockModel',
    props,
  });
  Object.assign(model.decoratorProps, decoratorProps);
  return model;
}

describe('IframeBlockModel', () => {
  afterEach(() => {
    cleanup();
    iframeMocks.props.length = 0;
    vi.clearAllMocks();
  });

  it('adds the iframe card body class to the block decorator', () => {
    const model = createIframeModel({ url: 'https://example.com' });

    expect(model.decoratorProps.className).toEqual(expect.stringContaining('css-'));
  });

  it('renders a prompt when required iframe configuration is missing', () => {
    const model = createIframeModel({ mode: 'url' });

    render(model.renderComponent());

    expect(screen.getByText('Please fill in the iframe URL')).toBeInTheDocument();
  });

  it('renders a prompt when HTML mode has no stored HTML record', () => {
    const model = createIframeModel({ mode: 'html' });

    render(model.renderComponent());

    expect(screen.getByText('Please fill in the iframe URL')).toBeInTheDocument();
  });

  it('renders URL mode iframe with rendered search parameters', async () => {
    const { ctx, renderWithFullContext } = createFlowContext({
      renderTemplate: (value) =>
        ({
          'https://example.com/{{$context.id}}': 'https://example.com/42',
          ticket: 'ticket',
          '{{$context.token}}': 'abc',
        })[value] ?? value,
    });
    const model = createIframeModel({
      mode: 'url',
      url: 'https://example.com/{{$context.id}}',
      params: [
        { name: 'ticket', value: '{{$context.token}}' },
        { name: 'count', value: 3 },
      ],
      allow: 'fullscreen',
    });

    renderWithContext(model.renderComponent(), ctx);

    await waitFor(() =>
      expect(screen.getByTestId('iframe')).toHaveAttribute('src', 'https://example.com/42?ticket=abc&count=3'),
    );
    expect(iframeMocks.props.at(-1)).toMatchObject({
      allow: 'fullscreen',
      display: 'block',
      position: 'relative',
      width: '100%',
    });
    expect(renderWithFullContext).toHaveBeenCalledWith('https://example.com/{{$context.id}}', ctx);
    expect(renderWithFullContext).toHaveBeenCalledWith('{{$context.token}}', ctx);
  });

  it('falls back when URL template rendering fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { ctx } = createFlowContext({
      renderTemplate: () => {
        throw new Error('template failed');
      },
    });
    const model = createIframeModel({ mode: 'url', url: 'https://example.com' });

    renderWithContext(model.renderComponent(), ctx);

    await waitFor(() => expect(screen.getByTestId('iframe')).toHaveAttribute('src', 'fallback-url'));
    expect(consoleError).toHaveBeenCalledWith('Error fetching target URL:', expect.any(Error));
  });

  it('shows a loading state while HTML content is being fetched', () => {
    const ctx = new FlowContext();
    Object.assign(ctx, {
      api: {
        request: vi.fn(() => new Promise(() => undefined)),
      },
      liquid: {
        renderWithFullContext: vi.fn(async (value: string) => value),
      },
      locale: 'en-US',
      t: (key: string) => key,
    });
    const model = createIframeModel({ mode: 'html', htmlId: 7 });

    const { container } = renderWithContext(model.renderComponent(), ctx);

    expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    expect(screen.queryByTestId('iframe')).not.toBeInTheDocument();
  });

  it('loads stored HTML, renders templates, and uses a data URL in HTML mode', async () => {
    const { ctx, request } = createFlowContext({
      html: '<h1>{{ title }}</h1>',
      renderTemplate: (value) => value.replace('{{ title }}', 'Dashboard'),
      compile: (value) => value.replace('Dashboard', 'Compiled dashboard'),
    });
    const model = createIframeModel({ mode: 'html', htmlId: 7 }, { heightMode: 'fullHeight' });

    renderWithContext(model.renderComponent(), ctx);

    await waitFor(() => {
      expect(screen.getByTestId('iframe').getAttribute('src')).toContain(
        encodeURIComponent('<h1>Compiled dashboard</h1>'),
      );
    });
    expect(request).toHaveBeenCalledWith({ url: 'iframeHtml:getHtml/7' });
    expect(iframeMocks.props.at(-1)?.styles).toMatchObject({
      height: '100%',
      flex: 1,
      minHeight: 0,
      border: 0,
    });
  });

  it('builds the iframe settings schema with mode-specific fields', () => {
    const schema = getIframeSettingsFlow().steps.editIframe.uiSchema({ t: (key) => key });

    expect(schema.mode).toMatchObject({
      required: true,
      default: 'url',
      'x-component': 'Radio.Group',
    });
    expect(schema.url).toMatchObject({
      required: true,
      'x-component-props': {
        placeholder: 'https://www.example.com',
      },
    });
    expect(schema.params).toMatchObject({
      type: 'array',
      'x-component': 'ArrayItems',
    });
    expect(schema.html).toMatchObject({
      required: true,
      'x-component-props': {
        minHeight: '320px',
        theme: 'light',
      },
    });
    expect(schema.allow).toMatchObject({
      title: 'Allow',
      type: 'string',
    });
  });

  it('renders allow help content from the settings schema', async () => {
    const schema = getIframeSettingsFlow().steps.editIframe.uiSchema({ t: (key) => key });
    const allowSchema = schema.allow as {
      description: React.ReactNode;
      'x-component': React.ComponentType<{ open?: boolean; value?: string }>;
    };
    const AllowSelect = allowSchema['x-component'];
    const { ctx } = createFlowContext({ locale: 'zh-CN' });

    renderWithEngineAndContext(
      <>
        {allowSchema.description}
        <AllowSelect open value="fullscreen" />
      </>,
      ctx,
    );

    expect(screen.getByRole('link').getAttribute('href')).toContain(
      '/zh-CN/docs/Web/HTML/Reference/Elements/iframe#allow',
    );
    expect((await screen.findAllByText('fullscreen')).length).toBeGreaterThan(0);
    expect(await screen.findByText('microphone')).toBeInTheDocument();
  });

  it('creates iframe HTML records before saving HTML mode settings', async () => {
    const create = vi.fn().mockResolvedValue({ data: { id: 12 } });
    const setStepParams = vi.fn();
    const flow = getIframeSettingsFlow();

    await flow.steps.editIframe.beforeParamsSave(
      {
        api: { resource: () => ({ create }) },
        model: { setProps: vi.fn(), setStepParams },
      },
      { mode: 'html', html: '<p>new</p>' },
    );

    expect(create).toHaveBeenCalledWith({ values: { html: '<p>new</p>' } });
    expect(setStepParams).toHaveBeenCalledWith('iframeBlockSettings', 'editIframe', { htmlId: 12 });
  });

  it('updates existing iframe HTML records before saving HTML mode settings', async () => {
    const update = vi.fn().mockResolvedValue({ data: { data: [{ id: 8 }] } });
    const setStepParams = vi.fn();
    const flow = getIframeSettingsFlow();

    await flow.steps.editIframe.beforeParamsSave(
      {
        api: { resource: () => ({ update }) },
        model: { setProps: vi.fn(), setStepParams },
      },
      { mode: 'html', html: '<p>updated</p>', htmlId: 8 },
    );

    expect(update).toHaveBeenCalledWith({ values: { html: '<p>updated</p>' }, filterByTk: 8 });
    expect(setStepParams).toHaveBeenCalledWith('iframeBlockSettings', 'editIframe', { htmlId: 8 });
  });

  it('does not persist iframe HTML when saving URL mode settings', async () => {
    const create = vi.fn();
    const setStepParams = vi.fn();
    const flow = getIframeSettingsFlow();

    await flow.steps.editIframe.beforeParamsSave(
      {
        api: { resource: () => ({ create }) },
        model: { setProps: vi.fn(), setStepParams },
      },
      { mode: 'url', html: '<p>ignored</p>' },
    );

    expect(create).not.toHaveBeenCalled();
    expect(setStepParams).not.toHaveBeenCalled();
  });

  it('applies saved iframe settings to the block props', async () => {
    const setProps = vi.fn();
    const params = {
      mode: 'url',
      url: 'https://example.com',
      html: '<p>ignored</p>',
      params: [{ name: 'a', value: 'b' }],
      allow: 'fullscreen',
      htmlId: 3,
    };

    await getIframeSettingsFlow().steps.editIframe.handler({ model: { setProps, setStepParams: vi.fn() } }, params);

    expect(setProps).toHaveBeenCalledWith({
      mode: 'url',
      url: 'https://example.com',
      html: '<p>ignored</p>',
      params: [{ name: 'a', value: 'b' }],
      allow: 'fullscreen',
      htmlId: 3,
    });
  });
});
