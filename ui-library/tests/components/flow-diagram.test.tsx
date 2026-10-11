import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FlowDiagram } from '../../registry/components/flow-diagram.js';
import * as layoutModule from '../../registry/components/flow-layout.js';
import type { FlowDiagramLayout } from '../../registry/components/flow-layout.js';
import { readmeTranslations } from '../readme-translations.js';

const resources = readmeTranslations('components');
const graph = {
  nodes: [
    { id: 'a', label: 'Draft' },
    { id: 'b', label: 'Review' },
  ],
  edges: [{ id: 'submit', source: 'a', target: 'b', label: 'Submit' }],
};
const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/test-diagram',
    resources: resources['en-US'],
  },
});

beforeAll(() => {
  // jsdom does not measure SVG text; React Flow measures edge labels in the browser.
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 80, height: 20 }),
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(element: Element): void {
        if (element.getAttribute('aria-label') === 'Tall process') {
          this.callback(
            [
              {
                contentRect: { width: 300 },
                target: element,
              } as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver,
          );
        }
      }
      unobserve(): void {}
      disconnect(): void {}
    },
  );
});

describe('FlowDiagram', () => {
  it('opens details with mouse and keyboard and preserves layout on highlight refresh', async () => {
    const layout = vi.spyOn(layoutModule, 'layoutFlowDiagram');
    const onNodeClick = vi.fn();
    const onEdgeClick = vi.fn();
    const wrap = (highlighted: boolean) => (
      <TestI18nProvider runtime={runtime}>
        <FlowDiagram
          {...graph}
          nodes={graph.nodes.map((node) => ({ ...node, highlighted }))}
          ariaLabel='Review process'
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
        />
      </TestI18nProvider>
    );
    const { rerender } = render(wrap(false));
    const node = await screen.findByTestId('rf__node-a');
    fireEvent.click(node);
    fireEvent.keyDown(node, { key: 'Enter' });
    expect(onNodeClick).toHaveBeenCalledTimes(2);
    expect(onNodeClick).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'a' }),
    );
    rerender(wrap(true));
    await waitFor(() => expect(node).toHaveTextContent('Draft'));
    expect(layout).toHaveBeenCalledTimes(1);
    const edge = screen.getByTestId('rf__edge-submit');
    fireEvent.click(edge);
    fireEvent.keyDown(edge, { key: ' ' });
    expect(onEdgeClick).toHaveBeenCalledTimes(2);
    expect(onEdgeClick).toHaveBeenCalledWith(graph.edges[0]);
    layout.mockRestore();
  });

  it('keeps real edges mounted when a parent refresh recreates node data and render callbacks', async () => {
    const wrap = (highlighted: boolean) => (
      <TestI18nProvider runtime={runtime}>
        <FlowDiagram
          nodes={graph.nodes.map((node) => ({ ...node, highlighted }))}
          edges={graph.edges.map((edge) => ({ ...edge, highlighted }))}
          ariaLabel='Refreshing process'
          renderNode={(node) => <span>{node.label}</span>}
        />
      </TestI18nProvider>
    );
    const { rerender } = render(wrap(false));
    const edge = await screen.findByTestId('rf__edge-submit');
    const removed: Node[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) removed.push(...record.removedNodes);
    });
    observer.observe(screen.getByLabelText('Refreshing process'), {
      childList: true,
      subtree: true,
    });
    for (const highlighted of [false, true, true, false]) {
      rerender(wrap(highlighted));
      expect(screen.getByTestId('rf__edge-submit')).toBe(edge);
    }
    await act(async () => {
      await Promise.resolve();
    });
    expect(removed.some((node) => node === edge || node.contains(edge))).toBe(
      false,
    );
    observer.disconnect();
  });

  it('sizes the full graph including outer routes to the container width', async () => {
    const layout = vi
      .spyOn(layoutModule, 'layoutFlowDiagram')
      .mockResolvedValue({
        width: 400,
        height: 1200,
        nodes: [{ id: 'a', label: '', x: 20, y: 20, width: 200, height: 64 }],
        edges: [],
      });
    render(
      <TestI18nProvider runtime={runtime}>
        <FlowDiagram
          nodes={[graph.nodes[0]!]}
          edges={[]}
          autoHeight
          ariaLabel='Tall process'
        />
      </TestI18nProvider>,
    );
    await screen.findByTestId('rf__node-a');
    // 24 canvas pixels of padding on each side; height includes all layout routes, not just nodes.
    expect(screen.getByLabelText('Tall process')).toHaveStyle({
      height: '804px',
    });
    layout.mockRestore();
  });

  it('shows a translated layout failure and reports its cause', async () => {
    const onLayoutError = vi.fn();
    render(
      <TestI18nProvider runtime={runtime}>
        <FlowDiagram
          nodes={graph.nodes}
          edges={[{ id: 'bad', source: 'a', target: 'missing' }]}
          ariaLabel='Broken process'
          onLayoutError={onLayoutError}
        />
      </TestI18nProvider>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to lay out this diagram.',
    );
    await waitFor(() =>
      expect(onLayoutError).toHaveBeenCalledWith(expect.any(Error)),
    );
  });

  it('ignores an older layout that finishes after the graph changes', async () => {
    const resolvers: ((value: FlowDiagramLayout) => void)[] = [];
    const layout = vi
      .spyOn(layoutModule, 'layoutFlowDiagram')
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvers.push(resolve);
          }),
      );
    const { rerender } = render(
      <TestI18nProvider runtime={runtime}>
        <FlowDiagram {...graph} ariaLabel='Process' />
      </TestI18nProvider>,
    );
    rerender(
      <TestI18nProvider runtime={runtime}>
        <FlowDiagram
          nodes={[{ id: 'new', label: 'New state' }]}
          edges={[]}
          ariaLabel='Process'
        />
      </TestI18nProvider>,
    );
    await act(async () =>
      resolvers[1]!({
        width: 200,
        height: 64,
        nodes: [
          { id: 'new', label: 'New state', width: 200, height: 64, x: 0, y: 0 },
        ],
        edges: [],
      }),
    );
    expect(await screen.findByTestId('rf__node-new')).toHaveTextContent(
      'New state',
    );
    await act(async () =>
      resolvers[0]!({ width: 0, height: 0, nodes: [], edges: [] }),
    );
    expect(screen.getByTestId('rf__node-new')).toHaveTextContent('New state');
    layout.mockRestore();
  });
});
