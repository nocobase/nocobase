import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { LifecycleDescription } from '@nocobase/lifecycle';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ProcessDiagram } from '../client/components/process-diagram.js';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';
import { NAMESPACE } from '../client/lib/format.js';

const description: LifecycleDescription = {
  name: 'tickets',
  initial: 'new',
  initialStates: ['new'],
  states: ['new', 'open', 'closed'],
  stateInfo: [
    { name: 'new', title: 'New', final: false, meta: {} },
    { name: 'open', title: 'Open', final: false, meta: {} },
    { name: 'closed', title: 'Closed', final: true, meta: {} },
  ],
  transitions: [
    {
      name: 'resolve',
      title: 'Close',
      from: ['open'],
      to: ['closed'],
      manual: true,
      effects: [],
      accept: [],
      meta: {},
    },
  ],
  triggers: [],
  continuations: [{ effect: 'notify', onFailure: 'resolve' }],
  onEnter: {},
};

beforeAll(() => {
  // jsdom does not measure SVG text; React Flow measures edge labels in the browser.
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 80, height: 20 }),
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
});

describe('example process diagram', () => {
  it.each([
    { locale: 'en-US', resources: enUS, autoHeight: undefined },
    { locale: 'en-US', resources: enUS, autoHeight: false },
    { locale: 'zh-CN', resources: zhCN, autoHeight: undefined },
    { locale: 'zh-CN', resources: zhCN, autoHeight: false },
  ])(
    'renders translated state details in $locale with autoHeight=$autoHeight and keeps history highlights',
    async ({ locale, resources, autoHeight }) => {
      const runtime = await createTestI18nRuntime({
        locale,
        namespaces: {
          [NAMESPACE]: {
            'en-US': async () => ({ default: enUS }),
            'zh-CN': async () => ({ default: zhCN }),
          },
        },
      });
      const view = render(
        <TestI18nProvider runtime={runtime} namespace={NAMESPACE}>
          <ProcessDiagram
            description={description}
            autoHeight={autoHeight}
            current='open'
            visited={['new', 'open']}
            availableTransitions={['resolve']}
          />
        </TestI18nProvider>,
      );
      const current = await screen.findByTestId('rf__node-open');
      expect(current).toHaveTextContent(resources.states.open);
      const ending = screen.getByText(`◎ ${resources.diagramStatus.end}`);
      fireEvent.click(ending);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      const previous = screen.getByTestId('rf__node-new');
      expect(previous).toHaveTextContent(resources.flowDiagram.visited);
      expect(
        previous.querySelector('[data-execution-state="visited"]'),
      ).not.toBeNull();
      expect(current).toHaveTextContent(resources.flowDiagram.current);
      expect(
        current.querySelector('[data-execution-state="current"]'),
      ).not.toBeNull();
      expect(screen.getByTestId('rf__node-closed')).not.toHaveTextContent(
        resources.diagramStatus.visited,
      );
      fireEvent.keyDown(current, { key: 'Enter' });
      expect(screen.getByRole('status')).toHaveTextContent(
        resources.states.open,
      );
      // A selected state must not show unrelated effect continuations with an absent success target.
      expect(screen.getByRole('status')).not.toHaveTextContent('notify');
      const onParameterBinding = vi.fn(() => false);
      const configurableDescription: LifecycleDescription = {
        ...description,
        parameterConfiguration: {
          readMode: 'live',
          groups: [
            {
              key: 'timing',
              title: 'Timing',
              schemaVersion: 1,
              fields: {
                timeout: {
                  type: 'number',
                  title: 'Timeout',
                  bindings: [{ state: 'open' }],
                },
              },
            },
          ],
        },
      };
      view.rerender(
        <TestI18nProvider runtime={runtime} namespace={NAMESPACE}>
          <ProcessDiagram
            description={configurableDescription}
            showDetails={false}
            onParameterBinding={onParameterBinding}
          />
        </TestI18nProvider>,
      );
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      const gear = within(screen.getByTestId('rf__node-open')).getByRole(
        'button',
        {
          name: resources.parameters.editCurrent,
        },
      );
      expect(
        within(screen.getByTestId('rf__node-new')).queryByRole('button', {
          name: resources.parameters.editCurrent,
        }),
      ).toBeNull();
      fireEvent.click(gear);
      expect(onParameterBinding).toHaveBeenCalledWith('state', 'open');
      fireEvent.keyDown(screen.getByTestId('rf__node-open'), { key: 'Enter' });
      expect(onParameterBinding).toHaveBeenCalledWith('state', 'open');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      view.rerender(
        <TestI18nProvider runtime={runtime} namespace={NAMESPACE}>
          <ProcessDiagram
            description={configurableDescription}
            current='closed'
          />
        </TestI18nProvider>,
      );
      expect(
        within(screen.getByTestId('rf__node-open')).queryByRole('button', {
          name: resources.parameters.editCurrent,
        }),
      ).toBeNull();
      expect(screen.getByTestId('rf__node-new')).not.toHaveTextContent(
        resources.diagramStatus.visited,
      );
      expect(screen.getByTestId('rf__node-open')).not.toHaveTextContent(
        resources.flowDiagram.current,
      );
      expect(screen.getByTestId('rf__node-closed')).toHaveTextContent(
        resources.flowDiagram.current,
      );
      expect(
        screen
          .getByTestId('rf__node-closed')
          .querySelector('[data-execution-state="current"]'),
      ).not.toBeNull();
    },
  );
});
