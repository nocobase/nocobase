import { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { afterEach, expect, it, vi } from 'vitest';
import { FlowDiagram } from '../client/components/flow-diagram.js';
import enUS from '../client/locales/en-US.js';
import { NAMESPACE } from '../client/lib/format.js';

const { bounds } = vi.hoisted(() => ({
  bounds: { width: 10000, height: 12000 },
}));
vi.mock('../client/components/flow-layout.js', () => ({
  layoutFlowDiagram: async () => ({
    ...bounds,
    nodes: [{ id: 'start', x: 24, y: 24, width: 100, height: 40 }],
    edges: [],
  }),
}));
vi.mock('@xyflow/react', async (original) => ({
  ...(await original<typeof import('@xyflow/react')>()),
  // Like React Flow, an uncontrolled viewport reads its default only on mount.
  ReactFlow: ({
    defaultViewport,
  }: {
    defaultViewport: { x: number; y: number; zoom: number };
  }) => {
    const [viewport] = useState(defaultViewport);
    return <output data-testid='viewport'>{JSON.stringify(viewport)}</output>;
  },
}));
afterEach(() => vi.unstubAllGlobals());

it('fits all layout bounds and refits after the stretched canvas is resized', async () => {
  let resize: ((width: number, height: number) => void) | undefined;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        resize = (width, height) =>
          callback(
            [{ contentRect: { width, height } } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  const runtime = await createTestI18nRuntime({
    locale: 'en-US',
    namespaces: { [NAMESPACE]: { 'en-US': async () => ({ default: enUS }) } },
  });
  render(
    <TestI18nProvider runtime={runtime} namespace={NAMESPACE}>
      <FlowDiagram
        ariaLabel='Diagram'
        nodes={[{ id: 'start', label: 'Start' }]}
        edges={[]}
      />
    </TestI18nProvider>,
  );
  await screen.findByTestId('viewport');
  for (const [width, height] of [
    [600, 800],
    [360, 1200],
  ]) {
    act(() => resize?.(width!, height!));
    await waitFor(() => {
      const viewport = JSON.parse(
        screen.getByTestId('viewport').textContent!,
      ) as { x: number; y: number; zoom: number };
      expect(viewport.zoom).toBeLessThan(0.1);
      expect(viewport.x).toBeGreaterThanOrEqual(24);
      expect(viewport.y).toBeGreaterThanOrEqual(24);
      expect(viewport.x + bounds.width * viewport.zoom).toBeLessThanOrEqual(
        width! - 24,
      );
      expect(viewport.y + bounds.height * viewport.zoom).toBeLessThanOrEqual(
        height! - 24,
      );
    });
  }
});
