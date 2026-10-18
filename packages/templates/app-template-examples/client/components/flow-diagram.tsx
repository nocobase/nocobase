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
  Background,
  MiniMap,
  Panel,
  useReactFlow,
  useViewport,
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
import {
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
}>;

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
          labelStyle={{
            fill: 'var(--foreground)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
          }}
          labelBgStyle={{
            fill: 'var(--card)',
            stroke: 'var(--border)',
            strokeWidth: 1,
          }}
          labelBgPadding={[9, 5]}
          labelBgBorderRadius={7}
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
  /** Interactive controls shown in the node footer. */
  readonly nodeActions?: (node: FlowDiagramNode) => ReactNode;
  /** Supporting content below the node title; provide sufficient fixed node dimensions. */
  readonly nodeDescription?: (node: FlowDiagramNode) => ReactNode;
  /** Initial fit prioritizes legibility; the Fit control still shows the entire graph. */
  readonly initialMinZoom?: number;
  readonly showMiniMap?: boolean;
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
  nodeActions,
  nodeDescription,
  initialMinZoom = 0.1,
  showMiniMap = false,
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
            actions: nodeActions?.(item),
            description: nodeDescription?.(item),
          },
        };
      }),
    [layout, nodes, direction, renderNode, nodeActions, nodeDescription],
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
          label: placed.label,
          type: 'diagram',
          animated: Boolean(item.highlighted && !item.visited),
          focusable: !item.decorative,
          selectable: !item.decorative,
          sourceHandle: 'out',
          targetHandle: 'in',
          ariaLabel: placed.label ?? `${item.source} → ${item.target}`,
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
      ? Math.max(
          0.1,
          initialMinZoom,
          Math.min(1, (width - 48) / Math.max(1, layout.width)),
        )
      : 1;
  // Reserve room above and below the graph for the canvas chrome.
  const height = layout ? Math.max(320, layout.height * zoom + 144) : 320;
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
        'relative isolate h-96 w-full overflow-hidden rounded-xl border border-border bg-linear-to-br from-primary/5 via-background to-muted/40 text-foreground [&_.react-flow__attribution]:bg-card/80 [&_.react-flow__attribution]:text-muted-foreground [&_.react-flow__edge.selected_path.react-flow__edge-path]:stroke-primary [&_.react-flow__edge.animated_path]:motion-reduce:animate-none',
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
          fitViewOptions={{
            padding: 0.2,
            minZoom: initialMinZoom,
            maxZoom: 1,
          }}
          defaultViewport={
            autoHeight
              ? {
                  x: (width - layout.width * zoom) / 2,
                  y: (height - layout.height * zoom) / 2,
                  zoom,
                }
              : undefined
          }
          // A full-height process is read by scrolling the page, not wheel-zooming the canvas.
          zoomOnScroll={!autoHeight}
          preventScrolling={!autoHeight}
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
        >
          <Background color='var(--border)' gap={24} size={1.5} />
          {showMiniMap && (
            <MiniMap
              pannable
              zoomable
              ariaLabel={t('flowDiagram.overview', {
                defaultValue: 'Diagram overview',
              })}
              nodeColor='var(--muted-foreground)'
              maskColor='color-mix(in srgb, var(--background) 75%, transparent)'
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
              className='hidden sm:block'
            />
          )}
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
                {t('flowDiagram.transitions', { defaultValue: 'Transitions' })}{' '}
                <span className='font-semibold text-foreground tabular-nums'>
                  {edges.filter((edge) => !edge.decorative).length}
                </span>
              </span>
            </div>
          </Panel>
          <DiagramToolbar top={autoHeight} />
        </ReactFlow>
      )}
    </div>
  );
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
