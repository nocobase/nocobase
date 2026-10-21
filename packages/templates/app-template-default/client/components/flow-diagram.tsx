import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  BaseEdge,
  Controls,
  ControlButton,
  MiniMap,
  Panel,
  Background,
  useReactFlow,
  useViewport,
  type MiniMapNodeProps,
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
import {
  Expand,
  Shrink,
  X,
  UserCheck,
  Wrench,
  CircleCheck,
  CircleX,
  TriangleAlert,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CircleDotIcon,
  FlagIcon,
  GitBranchIcon,
  MaximizeIcon,
  MinusIcon,
  PlayIcon,
  PlusIcon,
  Settings2Icon,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';

import '@xyflow/react/dist/style.css';

import {
  layoutFlowDiagram,
  flowLabelLines,
  revealRoute,
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
  actions?: ReactNode;
  description?: ReactNode;
}>;
type DiagramEdge = Edge<{
  points: readonly FlowDiagramPoint[];
  labelPosition?: FlowDiagramPoint;
  labelAnchor?: 'end' | 'middle';
  title?: string;
}>;

function DiagramMiniMapNode(props: MiniMapNodeProps): ReactElement {
  return (
    <rect
      x={props.x}
      y={props.y}
      width={props.width}
      height={props.height}
      rx={props.className.includes('minimap-pill') ? props.height / 2 : 8}
      fill={props.color}
      stroke={props.strokeColor}
      strokeWidth={props.strokeWidth}
      onClick={
        props.onClick ? (event) => props.onClick?.(event, props.id) : undefined
      }
    />
  );
}

function DiagramState({ data, id }: NodeProps<DiagramNode>): ReactElement {
  const { t } = useTranslation();
  const flow = useReactFlow();
  const Icon =
    data.item.kind === 'initial'
      ? PlayIcon
      : data.item.kind === 'final'
        ? FlagIcon
        : GitBranchIcon;
  const StatusIcon = data.item.highlighted ? CircleDotIcon : CheckIcon;
  const state = data.item.highlighted
    ? t('flowDiagram.current', { defaultValue: 'Current' })
    : data.item.visited
      ? t('flowDiagram.visited', { defaultValue: 'Visited' })
      : data.item.kind === 'initial'
        ? t('flowDiagram.initial', { defaultValue: 'Initial' })
        : data.item.kind === 'final'
          ? t('flowDiagram.final', { defaultValue: 'Final' })
          : t('flowDiagram.state', { defaultValue: 'State' });
  const inPosition = data.direction === 'RIGHT' ? Position.Left : Position.Top;
  const outPosition =
    data.direction === 'RIGHT' ? Position.Right : Position.Bottom;
  if (data.item.bare)
    return (
      <div className={cn('h-full w-full', data.item.className)}>
        <Handle
          id='in'
          type='target'
          position={inPosition}
          className='invisible'
        />
        {data.content}
        <Handle
          id='out'
          type='source'
          position={outPosition}
          className='invisible'
        />
      </div>
    );
  return (
    <div
      onFocusCapture={(event) => {
        // Readable initial zoom can put controls outside the viewport. Keyboard
        // focus brings their owning node into view without changing the zoom.
        const bounds = event.currentTarget.getBoundingClientRect();
        const canvas = event.currentTarget
          .closest('.react-flow')
          ?.getBoundingClientRect();
        const node = flow.getNode(id);
        if (
          canvas &&
          node &&
          (bounds.left < canvas.left ||
            bounds.right > canvas.right ||
            bounds.top < canvas.top ||
            bounds.bottom > canvas.bottom)
        ) {
          void flow.setCenter(
            node.position.x + (node.width ?? 232) / 2,
            node.position.y + (node.height ?? 104) / 2,
            { zoom: flow.getZoom() },
          );
        }
      }}
      data-execution-state={
        data.item.highlighted
          ? 'current'
          : data.item.visited
            ? 'visited'
            : 'pending'
      }
      className={cn(
        'group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-linear-to-b from-card to-muted/20 text-sm text-card-foreground shadow-md transition-[box-shadow,border-color] hover:border-primary/50 hover:shadow-lg motion-reduce:transition-none [.selected_&]:ring-2 [.selected_&]:ring-ring [.selected_&]:ring-offset-2 [.selected_&]:ring-offset-background',
        data.item.highlighted && 'border-primary ring-4 ring-primary/10',
        !data.item.highlighted &&
          (data.item.kind === 'initial' || data.item.configurable) &&
          'border-primary/25',
        data.item.visited && !data.item.highlighted && 'border-primary/40',
        data.item.className,
      )}
    >
      {!data.item.decorative && (
        <div
          aria-hidden
          className={cn(
            'absolute inset-x-0 top-0 h-1 bg-linear-to-r from-border to-border/40',
            data.item.kind === 'initial' && 'from-primary/70 to-primary/20',
            data.item.kind === 'final' && 'from-foreground/50 to-foreground/15',
            data.item.configurable && 'from-primary/60 to-primary/15',
            (data.item.highlighted || data.item.visited) &&
              'from-primary to-primary/50',
          )}
        />
      )}
      <Handle
        id='in'
        type='target'
        position={data.direction === 'RIGHT' ? Position.Left : Position.Top}
        className='invisible'
      />
      {data.item.decorative ? (
        <div className='flex h-full items-center justify-center text-center'>
          {data.content}
        </div>
      ) : (
        <>
          <div className='flex min-h-0 flex-1 items-center gap-3 px-4 pt-1'>
            <div
              aria-hidden
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-linear-to-br from-muted to-card text-muted-foreground shadow-xs',
                (data.item.kind === 'initial' ||
                  data.item.configurable ||
                  data.item.visited ||
                  data.item.highlighted) &&
                  'border-primary/15 from-primary/15 to-primary/5 text-primary',
              )}
            >
              <Icon className='size-4' />
            </div>
            <div className='flex min-w-0 flex-col gap-2 leading-snug'>
              <div className='line-clamp-2 font-semibold'>{data.content}</div>
              {data.description && (
                <div className='text-xs text-muted-foreground'>
                  {data.description}
                </div>
              )}
            </div>
          </div>
          <div className='flex min-h-8 shrink-0 items-center justify-between gap-2 border-t border-border/60 bg-muted/35 px-4 text-xs text-muted-foreground'>
            <span
              className={cn(
                'inline-flex items-center gap-1.5',
                (data.item.highlighted || data.item.visited) &&
                  'font-medium text-primary',
              )}
            >
              {(data.item.highlighted || data.item.visited) && (
                <StatusIcon className='size-3' aria-hidden />
              )}
              {state}
            </span>
            {data.actions ??
              (data.item.configurable && (
                <span className='inline-flex items-center gap-1 rounded-md border border-primary/15 bg-primary/5 px-1.5 py-0.5 text-primary'>
                  <Settings2Icon className='size-3' aria-hidden />
                  {t('flowDiagram.configurable', {
                    defaultValue: 'Parameters',
                  })}
                </span>
              ))}
          </div>
        </>
      )}
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

/** Measure the actual SVG bounds so multiline labels have equal chip padding. */
function TransitionLabel({
  x,
  y,
  label,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  label: ReactNode;
  anchor?: 'end' | 'middle';
}) {
  const ref = useRef<SVGTextElement>(null);
  const backgroundRef = useRef<SVGRectElement>(null);
  useLayoutEffect(() => {
    const box = ref.current?.getBBox();
    if (!box || !backgroundRef.current) return;
    for (const [key, value] of Object.entries({
      x: box.x - 6,
      y: box.y - 3,
      width: box.width + 12,
      height: box.height + 6,
    })) {
      backgroundRef.current.setAttribute(key, String(value));
    }
  }, [label, anchor]);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect ref={backgroundRef} rx={6} fill='var(--muted)' />
      <text
        ref={ref}
        textAnchor={anchor}
        dominantBaseline='central'
        fill='var(--muted-foreground)'
        fontSize='var(--text-xs)'
      >
        {typeof label === 'string'
          ? flowLabelLines(label).map((line, index, lines) => (
              <tspan
                // Label lines have no state; duplicate text needs a position key.
                // eslint-disable-next-line @eslint-react/no-array-index-key
                key={`${index}:${line}`}
                x={0}
                y={(index - (lines.length - 1) / 2) * 16}
              >
                {line}
              </tspan>
            ))
          : label}
      </text>
    </g>
  );
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
      {props.data?.title ? (
        // A wide transparent stroke so the hover text is easy to reach.
        <path d={path} fill='none' stroke='transparent' strokeWidth={12}>
          <title>{props.data.title}</title>
        </path>
      ) : null}
      {label && props.label ? (
        <g
          style={{ opacity: props.style?.opacity, transition: 'opacity 150ms' }}
        >
          <TransitionLabel
            x={label.x}
            y={label.y}
            label={props.label}
            anchor={props.data?.labelAnchor}
          />
        </g>
      ) : null}
    </>
  );
}

const nodeTypes = { diagram: DiagramState };
const edgeTypes = { diagram: DiagramConnection };

export interface FlowDiagramProps extends FlowDiagramGraph {
  readonly direction?: FlowDiagramDirection;
  /** reduce layer spacing while retaining room for multiline conditions. */
  readonly compact?: boolean;
  readonly controls?: boolean;
  /** Expand vertically to show the entire graph at the available width. */
  readonly autoHeight?: boolean;
  /** Limit automatic fitting to this scale; manual zoom remains available. */
  readonly initialZoomLimit?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly ariaLabel: string;
  /** transitions left out of the layout. Hovering or focusing a node draws
   * the ones touching it in lanes beside the graph and dims unrelated states. */
  readonly revealEdges?: readonly FlowDiagramEdge[];
  /** Routes left off the canvas, such as returns a node lists in its own
   * details. Hovering or focusing a node keeps the states they connect it to at
   * full strength, dims the rest and passes `linked` to `renderNode`; nothing
   * is drawn. */
  readonly auxiliaryEdges?: readonly FlowDiagramEdge[];
  readonly nodeActions?: (node: FlowDiagramNode) => ReactNode;
  readonly nodeDescription?: (node: FlowDiagramNode) => ReactNode;
  readonly initialMinZoom?: number;
  readonly showMiniMap?: boolean;
  readonly renderNode?: (
    node: FlowDiagramNode,
    state: { active: boolean; linked: boolean },
  ) => ReactNode;
  readonly onNodeClick?: (node: FlowDiagramNode) => void;
  readonly onEdgeClick?: (edge: FlowDiagramEdge) => void;
  readonly onLayoutError?: (error: unknown) => void;
}

/** A read-only graph canvas. The parent controls its data, selection details and dimensions. */
export function FlowDiagram({
  nodes,
  edges,
  direction = 'RIGHT',
  compact = false,
  controls = false,
  autoHeight = false,
  initialZoomLimit = 1,
  className,
  style,
  ariaLabel,
  revealEdges,
  auxiliaryEdges,
  renderNode,
  nodeActions,
  nodeDescription,
  initialMinZoom = 0.1,
  showMiniMap = false,
  onNodeClick,
  onEdgeClick,
  onLayoutError,
}: FlowDiagramProps): ReactElement {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expanded]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!autoHeight || expanded || !containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [autoHeight, expanded]);
  // Layout only structural changes; polling a record or highlighting a node preserves the viewport.
  const structure = JSON.stringify({
    nodes: nodes.map(({ id, width, height }) => ({
      id,
      label: '',
      width,
      height,
    })),
    edges: edges.map(({ id, source, target, label, configurable }) => ({
      id,
      source,
      target,
      label: configurable
        ? [label, t('flowDiagram.configurable', { defaultValue: 'Parameters' })]
            .filter(Boolean)
            .join(' · ')
        : label,
    })),
    direction,
    compact,
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
      compact: boolean;
    };
    void layoutFlowDiagram(input, input.direction, input.compact).then(
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
  const [hovered, setHovered] = useState<string>();
  const [focused, setFocused] = useState<string>();
  const active = hovered ?? focused;
  const revealed = useMemo(
    () =>
      active
        ? (revealEdges ?? []).filter(
            (edge) => edge.source === active || edge.target === active,
          )
        : [],
    [active, revealEdges],
  );
  // States joined to the active one only by routes left off the canvas.
  const linked = useMemo(
    () =>
      new Set(
        (active ? (auxiliaryEdges ?? []) : [])
          .flatMap((edge) =>
            edge.source === active
              ? [edge.target]
              : edge.target === active
                ? [edge.source]
                : [],
          )
          .filter((id) => id !== active),
      ),
    [active, auxiliaryEdges],
  );
  // The active state and every state one transition away stay at full strength.
  const related = useMemo(
    () =>
      active && (revealEdges || auxiliaryEdges)
        ? new Set(
            [...edges, ...revealed]
              .filter(
                (edge) => edge.source === active || edge.target === active,
              )
              .flatMap((edge) => [edge.source, edge.target])
              .concat(active, ...linked),
          )
        : undefined,
    [active, edges, revealed, revealEdges, auxiliaryEdges, linked],
  );
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
          // Raised so content the active node draws outside its box stays on top.
          zIndex: item.id === active ? 1 : 0,
          style: {
            width: placed.width,
            height: placed.height,
            opacity: related && !related.has(item.id) ? 0.35 : undefined,
            transition: 'opacity 150ms',
          },
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
            content: renderNode
              ? renderNode(item, {
                  active: item.id === active,
                  linked: linked.has(item.id),
                })
              : item.label,
            actions: nodeActions?.(item),
            description: nodeDescription?.(item),
          },
        };
      }),
    [
      layout,
      nodes,
      direction,
      renderNode,
      active,
      related,
      linked,
      nodeActions,
      nodeDescription,
    ],
  );
  const placedEdges = useMemo<DiagramEdge[]>(
    () =>
      (layout?.edges ?? []).map((placed) => {
        const item = edges.find((edge) => edge.id === placed.id)!;
        const color = item.visited
          ? 'color-mix(in srgb, var(--primary) 80%, var(--foreground))'
          : item.highlighted
            ? 'var(--primary)'
            : item.faint
              ? 'color-mix(in srgb, var(--muted-foreground) 25%, transparent)'
              : 'color-mix(in srgb, var(--muted-foreground) 45%, transparent)';
        return {
          ...item,
          label: placed.label,
          animated: Boolean(item.highlighted && !item.visited),
          type: 'diagram',
          focusable: !item.decorative,
          selectable: !item.decorative,
          sourceHandle: 'out',
          targetHandle: 'in',
          ariaLabel:
            item.title ?? item.label ?? `${item.source} → ${item.target}`,
          markerEnd: { type: MarkerType.ArrowClosed, color },
          style: {
            stroke: color,
            strokeWidth:
              item.visited || item.highlighted ? 2.5 : item.faint ? 1 : 1.5,
            strokeDasharray: item.dashed ? '5 4' : undefined,
            opacity:
              (revealEdges || auxiliaryEdges) &&
              active &&
              item.source !== active &&
              item.target !== active
                ? 0.25
                : undefined,
            transition: 'opacity 150ms',
          },
          data: {
            points: placed.points,
            labelPosition: placed.labelPosition,
            title: item.title,
          },
        };
      }),
    [layout, edges, active, revealEdges, auxiliaryEdges],
  );
  const revealedEdges = useMemo<DiagramEdge[]>(() => {
    if (!layout) return [];
    const placed = new Map(layout.nodes.map((node) => [node.id, node]));
    const routes = revealed.flatMap((item) => {
      const source = placed.get(item.source),
        target = placed.get(item.target);
      return source && target ? [{ item, source, target }] : [];
    });
    // Shorter spans take the inner lanes, so nested routes never cross.
    const span = ({ source, target }: (typeof routes)[number]) =>
      Math.abs(
        direction === 'DOWN' ? source.y - target.y : source.x - target.x,
      );
    routes.sort((a, b) => span(a) - span(b));
    const color = 'var(--primary)';
    return routes.map(({ item, source, target }, lane) => {
      const route = revealRoute(layout.nodes, source, target, direction, lane);
      return {
        ...item,
        id: `reveal:${item.id}`,
        type: 'diagram',
        focusable: false,
        selectable: false,
        sourceHandle: 'out',
        targetHandle: 'in',
        ariaLabel:
          item.title ?? item.label ?? `${item.source} → ${item.target}`,
        markerEnd: { type: MarkerType.ArrowClosed, color },
        style: { stroke: color, strokeWidth: 1.5, strokeDasharray: '5 4' },
        data: { ...route, title: item.title },
      };
    });
  }, [layout, revealed, direction]);
  const zoom =
    layout && width
      ? Math.max(
          initialMinZoom,
          Math.min(initialZoomLimit, (width - 48) / Math.max(1, layout.width)),
        )
      : 1;
  const height = layout
    ? Math.max(compact ? 240 : 320, layout.height * zoom + (compact ? 48 : 144))
    : 320;
  const canvas = (
    <div
      ref={containerRef}
      onFocus={(event) => {
        const target = event.target as HTMLElement;
        setFocused(
          target.closest<HTMLElement>('.react-flow__node')?.dataset.id,
        );
      }}
      onBlur={() => setFocused(undefined)}
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
        'relative h-96 w-full rounded-lg border border-border bg-muted/20 text-foreground [&_.react-flow__edge.animated_path]:motion-reduce:animate-none',
        className,
        expanded &&
          'fixed inset-0 z-[100] h-dvh! w-screen rounded-none bg-background',
      )}
      style={{ ...(autoHeight && !expanded ? { height } : {}), ...style }}
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
          key={autoHeight ? `${structure}:${width}:${zoom}` : structure}
          proOptions={controls ? { hideAttribution: true } : undefined}
          nodes={placedNodes}
          edges={
            revealedEdges.length
              ? [...placedEdges, ...revealedEdges]
              : placedEdges
          }
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView={expanded || !autoHeight}
          fitViewOptions={{
            padding: 0.08,
            minZoom: initialMinZoom,
            maxZoom: initialZoomLimit,
          }}
          defaultViewport={
            autoHeight && !expanded
              ? {
                  x: (width - layout.width * zoom) / 2,
                  y: (height - layout.height * zoom) / 2,
                  zoom,
                }
              : undefined
          }
          minZoom={0.1}
          maxZoom={2}
          zoomOnScroll={false}
          preventScrolling={false}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          deleteKeyCode={null}
          onNodeClick={(_, node) => onNodeClick?.(node.data.item)}
          onNodeMouseEnter={(_, node) => setHovered(node.id)}
          onNodeMouseLeave={() => setHovered(undefined)}
          onEdgeClick={(_, edge) => {
            const item = edges.find((candidate) => candidate.id === edge.id);
            if (item) onEdgeClick?.(item);
          }}
          ariaLabelConfig={{
            'controls.zoomIn.ariaLabel': t('flowDiagram.zoomIn'),
            'controls.zoomOut.ariaLabel': t('flowDiagram.zoomOut'),
            'controls.fitView.ariaLabel': t('flowDiagram.fitView', {
              defaultValue: 'Fit to view',
            }),
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
        >
          {!compact && <Background color='var(--border)' gap={24} size={1.5} />}
          {!compact && (
            <Panel position='top-left' className='pointer-events-none!'>
              <div className='inline-flex items-center gap-3 rounded-lg border bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow-xs'>
                <span className='inline-flex items-center gap-1.5'>
                  <GitBranchIcon className='size-3.5' aria-hidden />
                  {t('flowDiagram.states', { defaultValue: 'States' })}
                  <span className='font-semibold text-foreground tabular-nums'>
                    {nodes.filter((node) => !node.decorative).length}
                  </span>
                </span>
                <span className='h-3 w-px bg-border' aria-hidden />
                <span>
                  {t('flowDiagram.transitions', {
                    defaultValue: 'Transitions',
                  })}{' '}
                  <span className='font-semibold text-foreground tabular-nums'>
                    {edges.filter((edge) => !edge.decorative).length}
                  </span>
                </span>
              </div>
            </Panel>
          )}
          {!controls && <DiagramToolbar top={autoHeight} />}
          {controls && (
            <>
              <Controls
                fitViewOptions={{
                  padding: 0.08,
                  minZoom: initialMinZoom,
                  maxZoom: initialZoomLimit,
                }}
                showInteractive={false}
                aria-label={t('flowDiagram.controls', {
                  defaultValue: 'Diagram controls',
                })}
              >
                <ControlButton
                  type='button'
                  onClick={() => setExpanded((value) => !value)}
                  aria-label={t(
                    expanded
                      ? 'flowDiagram.exitFullscreen'
                      : 'flowDiagram.fullscreen',
                    {
                      defaultValue: expanded ? 'Exit fullscreen' : 'Fullscreen',
                    },
                  )}
                  title={t(
                    expanded
                      ? 'flowDiagram.exitFullscreen'
                      : 'flowDiagram.fullscreen',
                    {
                      defaultValue: expanded ? 'Exit fullscreen' : 'Fullscreen',
                    },
                  )}
                >
                  {expanded ? <Shrink /> : <Expand />}
                </ControlButton>
              </Controls>
              {expanded && (
                <Panel position='top-right'>
                  <div className='flex items-center gap-3 rounded-lg border bg-card p-2 text-card-foreground shadow-sm'>
                    <span className='text-xs text-muted-foreground'>
                      {t('flowDiagram.escapeHint', {
                        defaultValue: 'Press Escape to exit',
                      })}
                    </span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setExpanded(false)}
                    >
                      <X />
                      {t('flowDiagram.exitFullscreen', {
                        defaultValue: 'Exit fullscreen',
                      })}
                    </Button>
                  </div>
                </Panel>
              )}
            </>
          )}
          {(expanded || showMiniMap) && (
            <MiniMap<DiagramNode>
              pannable
              zoomable
              ariaLabel={t('flowDiagram.minimap', {
                defaultValue: 'Diagram overview',
              })}
              style={{ background: 'var(--card)' }}
              nodeComponent={DiagramMiniMapNode}
              nodeClassName={(node) =>
                node.data.item.minimapShape === 'pill' ? 'minimap-pill' : ''
              }
              nodeColor={(node) =>
                `color-mix(in srgb, ${node.data.item.minimapColor ?? 'var(--muted-foreground)'} 18%, var(--card))`
              }
              nodeStrokeColor={(node) =>
                `color-mix(in srgb, ${node.data.item.minimapColor ?? 'var(--muted-foreground)'} 35%, var(--card))`
              }
              nodeStrokeWidth={2}
              maskColor='color-mix(in srgb, var(--muted) 70%, transparent)'
              className='max-w-[35%]'
            />
          )}
        </ReactFlow>
      )}
    </div>
  );
  return expanded ? createPortal(canvas, document.body) : canvas;
}

/** View controls belong inside React Flow so they always use this canvas's viewport. */
function DiagramToolbar({
  top = false,
}: {
  readonly top?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const flow = useReactFlow();
  const { zoom } = useViewport();
  const controls = [
    {
      label: t('flowDiagram.zoomOut', { defaultValue: 'Zoom out' }),
      icon: MinusIcon,
      disabled: zoom <= 0.1,
      run: () => void flow.zoomOut(),
    },
    {
      label: t('flowDiagram.zoomIn', { defaultValue: 'Zoom in' }),
      icon: PlusIcon,
      disabled: zoom >= 2,
      run: () => void flow.zoomIn(),
    },
    {
      label: t('flowDiagram.fit', { defaultValue: 'Fit to view' }),
      icon: MaximizeIcon,
      disabled: false,
      run: () => void flow.fitView({ padding: 0.2, maxZoom: 1 }),
    },
  ];
  return (
    <Panel
      position={top ? 'top-right' : 'bottom-left'}
      className='max-sm:top-12! max-sm:bottom-auto!'
    >
      <div className='flex items-center gap-1 rounded-xl border bg-card/95 p-1.5 shadow-md'>
        {controls.map(({ label, icon: Icon, disabled, run }) => (
          <Tooltip key={label}>
            <TooltipTrigger render={<span />}>
              <Button
                type='button'
                size='sm'
                className='size-7 p-0'
                variant='ghost'
                aria-label={label}
                disabled={disabled || !flow.viewportInitialized}
                onClick={run}
              >
                <Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='min-w-12 px-2 text-xs text-muted-foreground tabular-nums'
                aria-label={t('flowDiagram.actualSize', {
                  defaultValue: 'Actual size',
                })}
                disabled={!flow.viewportInitialized}
                onClick={() => void flow.zoomTo(1)}
              />
            }
          >
            {Math.round(zoom * 100)}%
          </TooltipTrigger>
          <TooltipContent>
            {t('flowDiagram.actualSize', { defaultValue: 'Actual size' })}
          </TooltipContent>
        </Tooltip>
      </div>
    </Panel>
  );
}

export type FlowDiagramStepKind =
  'start' | 'approval' | 'work' | 'success' | 'negative' | 'exception';

const stepIcons = {
  start: PlayIcon,
  approval: UserCheck,
  work: Wrench,
  success: CircleCheck,
  negative: CircleX,
  exception: TriangleAlert,
};

// Only intermediate steps use filled icon tiles; boundary icons inherit their pill tone.
const stepIconTones = {
  approval: 'bg-primary text-primary-foreground',
  work: 'bg-[var(--area-administration,var(--chart-2))] text-background',
};

// The tone of the state at the other end of a route listed beside a node.
const stepDotTones: Record<FlowDiagramStepKind, string> = {
  start: 'bg-muted-foreground',
  approval: 'bg-primary',
  work: 'bg-[var(--area-administration,var(--chart-2))]',
  success: 'bg-(--status-success)',
  negative: 'bg-destructive',
  exception: 'bg-(--status-warning)',
};

export interface FlowDiagramStepProps {
  readonly kind: FlowDiagramStepKind;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly progress?: 'plan' | 'current' | 'visited' | 'unreached';
  /** Joined to the active state by a route left off the canvas. */
  readonly linked?: boolean;
  readonly actions?: ReactNode;
  /** Supporting exits or details revealed by the canvas's active state. */
  readonly children?: ReactNode;
}

/** Shared process vocabulary: boundary pills, work cards and actual execution status. */
export function FlowDiagramStep({
  kind,
  label,
  description,
  icon,
  progress = 'plan',
  linked = false,
  actions,
  children,
}: FlowDiagramStepProps): ReactElement {
  const { t } = useTranslation();
  const card = kind === 'approval' || kind === 'work';
  const Icon = stepIcons[kind];
  return (
    <div
      data-execution-state={progress}
      className={cn(
        'relative flex h-full border bg-card text-card-foreground transition-[border-color,box-shadow,opacity]',
        card
          ? 'items-center gap-3 rounded-lg px-3 shadow-xs'
          : 'flex-col items-center justify-center rounded-full px-4',
        kind === 'success' &&
          'border-(--status-success)/30 bg-(--status-success-background) text-(--status-success)',
        kind === 'negative' &&
          'border-dashed border-destructive/40 bg-destructive/5 text-destructive',
        kind === 'exception' &&
          'border-dashed border-(--status-warning)/35 bg-(--status-warning-background) text-(--status-warning)',
        progress === 'current' && 'border-primary ring-2 ring-primary/40',
        progress === 'unreached' && 'border-dashed opacity-55',
        linked &&
          'opacity-100 outline-2 outline-offset-2 outline-primary/60 outline-dashed',
      )}
    >
      <span
        className={cn(
          'flex max-w-full items-center gap-1.5',
          card && 'w-full gap-3',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'flex shrink-0 items-center justify-center',
            card && 'size-8 rounded-md shadow-xs',
            card && stepIconTones[kind],
          )}
        >
          {icon ?? <Icon className='size-4' />}
        </span>
        <span
          className={cn(
            'flex min-w-0 flex-1 flex-col text-sm font-medium',
            card && 'text-left',
          )}
        >
          <span className='truncate'>{label}</span>
          {description && (
            <span className='truncate text-xs font-normal text-muted-foreground'>
              {description}
            </span>
          )}
        </span>
        {card && actions}
      </span>
      {!card && actions}
      {progress === 'current' && (
        <span className='absolute -top-2.5 right-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground'>
          {t('flowDiagram.current', { defaultValue: 'Current' })}
        </span>
      )}
      {progress === 'visited' && card && (
        <span
          className='absolute -top-2 right-2 flex size-4 items-center justify-center rounded-full bg-(--status-success) text-primary-foreground'
          title={t('flowDiagram.visited', { defaultValue: 'Visited' })}
        >
          <CheckIcon aria-hidden className='size-3' />
          <span className='sr-only'>
            {t('flowDiagram.visited', { defaultValue: 'Visited' })}
          </span>
        </span>
      )}
      {children}
    </div>
  );
}

export interface FlowDiagramTransitionNote {
  readonly id: string;
  /** Short translated action. */
  readonly label: ReactNode;
  /** Complete translated route, read by assistive technology. */
  readonly detail?: string;
  /** Tone of the state at the other end of the route. */
  readonly kind?: FlowDiagramStepKind;
  /** Lists the route under "Leaves to" (the default) or "Arrives from". */
  readonly direction?: 'out' | 'in';
  /** Translated labels of the states at the other end of the route. */
  readonly peers?: readonly string[];
}

/** Routes left off the canvas, listed in one card beside the active node. */
export function FlowDiagramTransitionNotes({
  notes,
}: {
  readonly notes: readonly FlowDiagramTransitionNote[];
}): ReactElement | null {
  const { t } = useTranslation();
  if (!notes.length) return null;
  const sections = [
    {
      direction: 'out',
      title: t('flowDiagram.leavesTo', { defaultValue: 'Leaves to' }),
      icon: ArrowRightIcon,
    },
    {
      direction: 'in',
      title: t('flowDiagram.arrivesFrom', { defaultValue: 'Arrives from' }),
      icon: ArrowLeftIcon,
    },
  ] as const;
  return (
    <div
      role='group'
      aria-label={t('flowDiagram.otherRoutes', {
        defaultValue: 'Other routes',
      })}
      className='nodrag nopan absolute top-1/2 left-full z-10 -translate-y-1/2 pl-2 text-left'
    >
      <div className='flex w-max max-w-72 flex-col gap-2 rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-md'>
        {sections.map(({ direction, title, icon: Icon }) => {
          const items = notes.filter(
            (note) => (note.direction ?? 'out') === direction,
          );
          if (!items.length) return null;
          return (
            <div key={direction} className='flex flex-col gap-1'>
              <p className='font-medium text-muted-foreground'>{title}</p>
              <ul className='flex flex-col gap-1'>
                {items.map((note) => (
                  <li key={note.id}>
                    <span
                      role='note'
                      aria-label={note.detail}
                      className='flex min-w-0 items-center gap-1.5'
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          stepDotTones[note.kind ?? 'start'],
                        )}
                      />
                      <span className='shrink-0 font-medium'>{note.label}</span>
                      {note.peers?.length ? (
                        <>
                          <Icon
                            aria-hidden
                            className='size-3 shrink-0 text-muted-foreground'
                          />
                          <span className='truncate text-muted-foreground'>
                            {note.peers.join(', ')}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
