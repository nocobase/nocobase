import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  BaseEdge,
  EdgeText,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import '@xyflow/react/dist/style.css';

import {
  layoutFlowDiagram,
  type FlowDiagramDirection,
  type FlowDiagramEdge,
  type FlowDiagramGraph,
  type FlowDiagramLayout,
  type FlowDiagramNode,
  type FlowDiagramPoint,
} from './flow-layout.js';

type DiagramNode = Node<{
  item: FlowDiagramNode;
  direction: FlowDiagramDirection;
  content: ReactNode;
}>;
type DiagramEdge = Edge<{
  points: readonly FlowDiagramPoint[];
  labelPosition?: FlowDiagramPoint;
}>;

function DiagramState({ data }: NodeProps<DiagramNode>): ReactElement {
  return (
    <div
      data-execution-state={
        data.item.highlighted
          ? 'current'
          : data.item.visited
            ? 'visited'
            : 'pending'
      }
      style={
        data.item.highlighted || data.item.visited
          ? {
              borderColor: `color-mix(in srgb, var(--primary) ${data.item.highlighted ? 100 : 50}%, var(--border))`,
              background: `color-mix(in srgb, var(--primary) ${data.item.highlighted ? 22 : 8}%, var(--card))`,
            }
          : undefined
      }
      className={cn(
        'flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-card px-3 text-sm text-card-foreground shadow-sm',
        data.item.highlighted && 'font-semibold ring-2 ring-primary/30',
        data.item.className,
      )}
    >
      <Handle
        id='in'
        type='target'
        position={data.direction === 'RIGHT' ? Position.Left : Position.Top}
        className='invisible'
      />
      <div className='w-full text-center leading-snug'>{data.content}</div>
      <Handle
        id='out'
        type='source'
        position={data.direction === 'RIGHT' ? Position.Right : Position.Bottom}
        className='invisible'
      />
    </div>
  );
}

/** Keep ELK's routes while rounding their right-angle bends. */
function routePath(points: readonly FlowDiagramPoint[]): string {
  if (!points.length) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index++) {
    const before = points[index - 1];
    const point = points[index];
    const after = points[index + 1];
    const incoming = Math.hypot(point.x - before.x, point.y - before.y);
    const outgoing = Math.hypot(after.x - point.x, after.y - point.y);
    if (!incoming || !outgoing) continue;
    const radius = Math.min(8, incoming / 2, outgoing / 2);
    const start = {
      x: point.x + ((before.x - point.x) / incoming) * radius,
      y: point.y + ((before.y - point.y) / incoming) * radius,
    };
    const end = {
      x: point.x + ((after.x - point.x) / outgoing) * radius,
      y: point.y + ((after.y - point.y) / outgoing) * radius,
    };
    path += ` L ${start.x} ${start.y} Q ${point.x} ${point.y} ${end.x} ${end.y}`;
  }
  const last = points.at(-1)!;
  return `${path} L ${last.x} ${last.y}`;
}

function DiagramConnection(props: EdgeProps<DiagramEdge>): ReactElement {
  const points = props.data?.points ?? [];
  const path = routePath(points);
  const label = props.data?.labelPosition;
  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={props.markerEnd}
        style={props.style}
      />
      {label && props.label ? (
        <EdgeText
          x={label.x}
          y={label.y}
          label={props.label}
          labelStyle={{ fill: 'var(--foreground)', fontSize: 'var(--text-sm)' }}
          labelBgStyle={{ fill: 'var(--card)' }}
          labelBgPadding={[6, 4]}
          labelBgBorderRadius={4}
        />
      ) : null}
    </>
  );
}

const nodeTypes = { diagram: DiagramState };
const edgeTypes = { diagram: DiagramConnection };

export interface FlowDiagramProps extends FlowDiagramGraph {
  readonly direction?: FlowDiagramDirection;
  /** Expand vertically to show the entire graph at the available width. */
  readonly autoHeight?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly ariaLabel: string;
  readonly renderNode?: (node: FlowDiagramNode) => ReactNode;
  readonly onNodeClick?: (node: FlowDiagramNode) => void;
  readonly onEdgeClick?: (edge: FlowDiagramEdge) => void;
  readonly onLayoutError?: (error: unknown) => void;
}

/** A read-only graph canvas. The parent controls its data, selection details and dimensions. */
export function FlowDiagram({
  nodes,
  edges,
  direction = 'RIGHT',
  autoHeight = false,
  className,
  style,
  ariaLabel,
  renderNode,
  onNodeClick,
  onEdgeClick,
  onLayoutError,
}: FlowDiagramProps): ReactElement {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!autoHeight || !containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [autoHeight]);
  // Layout only structural changes; polling a record or highlighting a node preserves the viewport.
  const structure = JSON.stringify({
    nodes: nodes.map(({ id, width, height }) => ({
      id,
      label: '',
      width,
      height,
    })),
    edges: edges.map(({ id, source, target, label }) => ({
      id,
      source,
      target,
      label,
    })),
    direction,
  });
  const [result, setResult] = useState<{
    key: string;
    layout?: FlowDiagramLayout;
    error?: unknown;
  }>();
  useEffect(() => {
    let active = true;
    const input = JSON.parse(structure) as FlowDiagramGraph & {
      direction: FlowDiagramDirection;
    };
    void layoutFlowDiagram(input, input.direction).then(
      (layout) => {
        if (active) setResult({ key: structure, layout });
      },
      (error: unknown) => {
        if (active) setResult({ key: structure, error });
      },
    );
    return () => {
      active = false;
    };
  }, [structure]);
  useEffect(() => {
    if (result?.key === structure && result.error)
      onLayoutError?.(result.error);
  }, [result, structure, onLayoutError]);
  const layout = result?.key === structure ? result.layout : undefined;
  const placedNodes = useMemo<DiagramNode[]>(
    () =>
      (layout?.nodes ?? []).map((placed) => {
        const item = nodes.find((node) => node.id === placed.id)!;
        return {
          id: item.id,
          type: 'diagram',
          focusable: !item.decorative,
          selectable: !item.decorative,
          position: { x: placed.x, y: placed.y },
          style: { width: placed.width, height: placed.height },
          // ELK owns fixed geometry. Recreated controlled nodes must not clear
          // React Flow's measurements and briefly remove every connected edge.
          width: placed.width,
          height: placed.height,
          measured: { width: placed.width, height: placed.height },
          handles: [
            {
              id: 'in',
              type: 'target',
              position: direction === 'RIGHT' ? Position.Left : Position.Top,
              x: direction === 'RIGHT' ? 0 : placed.width / 2,
              y: direction === 'RIGHT' ? placed.height / 2 : 0,
              width: 0,
              height: 0,
            },
            {
              id: 'out',
              type: 'source',
              position:
                direction === 'RIGHT' ? Position.Right : Position.Bottom,
              x: direction === 'RIGHT' ? placed.width : placed.width / 2,
              y: direction === 'RIGHT' ? placed.height / 2 : placed.height,
              width: 0,
              height: 0,
            },
          ],
          ariaLabel: item.label,
          data: {
            item,
            direction,
            content: renderNode ? renderNode(item) : item.label,
          },
        };
      }),
    [layout, nodes, direction, renderNode],
  );
  const placedEdges = useMemo<DiagramEdge[]>(
    () =>
      (layout?.edges ?? []).map((placed) => {
        const item = edges.find((edge) => edge.id === placed.id)!;
        const color = item.visited
          ? 'color-mix(in srgb, var(--primary) 80%, var(--foreground))'
          : item.highlighted
            ? 'var(--primary)'
            : 'color-mix(in srgb, var(--muted-foreground) 65%, transparent)';
        return {
          ...item,
          type: 'diagram',
          focusable: !item.decorative,
          selectable: !item.decorative,
          sourceHandle: 'out',
          targetHandle: 'in',
          ariaLabel: item.label ?? `${item.source} → ${item.target}`,
          markerEnd: { type: MarkerType.ArrowClosed, color },
          style: {
            stroke: color,
            strokeWidth: item.visited || item.highlighted ? 2.5 : 1.5,
            strokeDasharray: item.dashed ? '5 4' : undefined,
          },
          data: { points: placed.points, labelPosition: placed.labelPosition },
        };
      }),
    [layout, edges],
  );
  const zoom =
    layout && width
      ? Math.max(0.1, Math.min(1, (width - 48) / Math.max(1, layout.width)))
      : 1;
  const height = layout ? Math.max(240, layout.height * zoom + 48) : 240;
  return (
    <div
      ref={containerRef}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const target = event.target as HTMLElement | SVGElement;
        const nodeElement = target.closest<HTMLElement>('.react-flow__node');
        const edgeElement = target.closest<HTMLElement>('.react-flow__edge');
        if (target !== nodeElement && target !== edgeElement) return;
        const id = target.dataset.id;
        const node = nodes.find((item) => item.id === id);
        const edge = edges.find((item) => item.id === id);
        if (nodeElement && node) {
          event.preventDefault();
          onNodeClick?.(node);
        }
        if (edgeElement && edge) {
          event.preventDefault();
          onEdgeClick?.(edge);
        }
      }}
      aria-label={ariaLabel}
      className={cn(
        'relative h-96 w-full rounded-lg border border-border bg-muted/20 text-foreground',
        className,
      )}
      style={{ ...(autoHeight ? { height } : {}), ...style }}
    >
      {!nodes.length ? (
        <p role='status' className='p-4 text-sm text-muted-foreground'>
          {t('flowDiagram.empty', { defaultValue: 'No states to display.' })}
        </p>
      ) : result?.key === structure && result.error ? (
        <p role='alert' className='p-4 text-sm text-destructive'>
          {t('flowDiagram.failed', {
            defaultValue: 'Unable to lay out this diagram.',
          })}
        </p>
      ) : !layout ? (
        <p role='status' className='p-4 text-sm text-muted-foreground'>
          {t('flowDiagram.loading', { defaultValue: 'Laying out diagram…' })}
        </p>
      ) : (
        <ReactFlow<DiagramNode, DiagramEdge>
          key={autoHeight ? `${structure}:${width}` : structure}
          nodes={placedNodes}
          edges={placedEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView={!autoHeight}
          fitViewOptions={{ padding: 0.08 }}
          defaultViewport={
            autoHeight
              ? {
                  x: (width - layout.width * zoom) / 2,
                  y: (height - layout.height * zoom) / 2,
                  zoom,
                }
              : undefined
          }
          minZoom={0.1}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          deleteKeyCode={null}
          onNodeClick={(_, node) => onNodeClick?.(node.data.item)}
          onEdgeClick={(_, edge) => {
            const item = edges.find((candidate) => candidate.id === edge.id);
            if (item) onEdgeClick?.(item);
          }}
          ariaLabelConfig={{
            'node.a11yDescription.keyboardDisabled': t('flowDiagram.nodeHelp', {
              defaultValue: 'Press Enter or Space to select a state.',
            }),
            'node.a11yDescription.default': t('flowDiagram.nodeHelp', {
              defaultValue: 'Press Enter or Space to select a state.',
            }),
            'edge.a11yDescription.default': t('flowDiagram.edgeHelp', {
              defaultValue: 'Press Enter or Space to select a transition.',
            }),
          }}
        />
      )}
    </div>
  );
}
