/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SelectionFocus } from '../../client/workflow-management/selection-focus.js';
const viewport = vi.hoisted(() => ({
  setCenter: vi.fn(),
  getZoom: vi.fn(() => 0.6),
}));
vi.mock('@xyflow/react', () => ({ useReactFlow: () => viewport }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it('waits for layout, centers the node and repeats focus for another click on the same node', () => {
  const node = {
    id: 'task',
    position: { x: 100, y: 200 },
    width: 200,
    height: 80,
    data: {},
  };
  const { rerender } = render(
    <SelectionFocus node={node} selected='task' request={1} ready={false} />,
  );
  expect(viewport.setCenter).not.toHaveBeenCalled();
  rerender(<SelectionFocus node={node} selected='task' request={1} ready />);
  expect(viewport.setCenter).toHaveBeenCalledWith(
    200,
    240,
    expect.objectContaining({ zoom: 0.6 }),
  );
  viewport.getZoom.mockReturnValueOnce(0.4);
  rerender(<SelectionFocus node={node} selected='task' request={2} ready />);
  expect(viewport.setCenter).toHaveBeenLastCalledWith(
    200,
    240,
    expect.objectContaining({ zoom: 0.4 }),
  );
  expect(viewport.setCenter).toHaveBeenCalledTimes(2);
});
it('preserves the viewport when the selected node does not exist there', () => {
  render(
    <SelectionFocus node={undefined} selected='added' request={1} ready />,
  );
  expect(viewport.setCenter).not.toHaveBeenCalled();
});
it('does not move ordinary workflow canvases without a focus request', () => {
  render(
    <SelectionFocus
      node={undefined}
      selected='task'
      request={undefined}
      ready
    />,
  );
  expect(viewport.setCenter).not.toHaveBeenCalled();
});
