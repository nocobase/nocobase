import { useEffect } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';

/** Runs inside React Flow's provider after the initial layout has fitted. */
export function SelectionFocus({
  node,
  request,
  ready,
  selected,
}: {
  node: Node | undefined;
  request: number | undefined;
  ready: boolean;
  selected: string | null | undefined;
}): null {
  const { setCenter, getZoom } = useReactFlow();
  useEffect(() => {
    if (!ready || request === undefined || !selected) return;
    const duration = window.matchMedia?.('(prefers-reduced-motion: reduce)')
      .matches
      ? 0
      : 250;
    // Without a counterpart, preserve this version's viewport.
    if (node) {
      void setCenter(
        node.position.x + (node.width ?? 0) / 2,
        node.position.y + (node.height ?? 0) / 2,
        { zoom: getZoom(), duration },
      );
    }
  }, [node, request, ready, selected, setCenter, getZoom]);
  return null;
}
