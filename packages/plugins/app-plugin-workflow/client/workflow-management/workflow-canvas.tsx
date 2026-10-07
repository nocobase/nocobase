import { SelectionFocus } from './selection-focus.js';
import { terminalEdgePoints } from './graph/terminal-edge.js';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import {
  CircleStop,
  Columns3,
  Flag,
  GitBranch,
  Hourglass,
  X,
  Rows3,
  Terminal,
  Zap,
} from 'lucide-react';
import '@xyflow/react/dist/style.css';
import {
  applyLayoutResult,
  createLayoutInput,
  projectWorkflowGraph,
} from '@nocobase/app-plugin-workflow/client';
import type {
  WorkflowLayoutDirection,
  WorkflowLayoutPoint,
} from '@nocobase/app-plugin-workflow/client';
import { layoutWithElk } from './graph/elk-layout.js';
import { WORKFLOW_NS } from '../namespace.js';
import type { WorkflowCanvasProps, WorkflowNodeRunRecord } from './types.js';
import './workflow-canvas.css';

interface CanvasNodeData extends Record<string, unknown> {
  difference?: string;
  connectionsChanged?: boolean;
  title: string;
  nodeType: string | null;
  kind: string;
  status: string;
  direction: WorkflowLayoutDirection;
  attempts: readonly WorkflowNodeRunRecord[];
  onViewNodeRun?: (nodeRun: WorkflowNodeRunRecord) => void;
  onViewStartInput?: () => void;
}
interface CanvasEdgeData extends Record<string, unknown> {
  readonly points: readonly WorkflowLayoutPoint[];
  readonly labelColor: string;
  readonly terminal?: boolean;
}

const EMPTY_NODE_RUNS: readonly WorkflowNodeRunRecord[] = [];

function CanvasNode({ data }: NodeProps<Node<CanvasNodeData>>): ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const vertical = data.direction === 'DOWN';
  const targetPosition = vertical ? Position.Top : Position.Left;
  const sourcePosition = vertical ? Position.Bottom : Position.Right;
  if (data.kind === 'branch-anchor') {
    return (
      <div
        className={`workflow-flow-branch-anchor ${data.status}`}
        aria-label={t('canvas.emptyBranch')}
      >
        <Handle
          type='target'
          position={targetPosition}
          className='workflow-flow-handle'
        />
        <Handle
          type='source'
          position={sourcePosition}
          className='workflow-flow-handle'
        />
      </div>
    );
  }
  const boundary = data.kind === 'start' || data.kind === 'end';
  const condition = data.nodeType === 'condition';
  const waitInstruction = data.nodeType === 'wait';
  const terminateInstruction = data.nodeType === 'terminate';
  const instructionClass = data.nodeType ? `instruction-${data.nodeType}` : '';
  const Icon =
    data.kind === 'start'
      ? Zap
      : data.kind === 'end'
        ? Flag
        : terminateInstruction
          ? CircleStop
          : condition
            ? GitBranch
            : waitInstruction
              ? Hourglass
              : Terminal;
  return (
    <div
      className={`workflow-flow-node ${boundary ? 'boundary' : ''} ${data.kind} ${instructionClass} ${data.status} ${data.difference ? `workflow-diff-${data.difference}` : ''}`}
    >
      {data.kind !== 'start' ? (
        <Handle
          type='target'
          position={targetPosition}
          className='workflow-flow-handle'
        />
      ) : null}
      <span className='workflow-flow-icon' aria-hidden='true'>
        <Icon />
      </span>
      <span className='workflow-flow-copy'>
        <strong>{data.title}</strong>
        {data.difference && data.difference !== 'unchanged' ? (
          <span className={`workflow-diff-label ${data.difference}`}>
            {data.connectionsChanged
              ? t('comparison.connectionsChanged')
              : t(`comparison.${data.difference}`)}
          </span>
        ) : null}
      </span>
      {data.kind === 'end' ? null : condition ? (
        <>
          <Handle
            type='source'
            id='no'
            position={sourcePosition}
            style={vertical ? { left: '33.333%' } : { top: '33.333%' }}
            className='workflow-flow-handle workflow-flow-branch-handle no'
          />
          <Handle
            type='source'
            id='yes'
            position={sourcePosition}
            style={vertical ? { left: '66.667%' } : { top: '66.667%' }}
            className='workflow-flow-handle workflow-flow-branch-handle yes'
          />
        </>
      ) : (
        <Handle
          type='source'
          position={sourcePosition}
          className='workflow-flow-handle'
        />
      )}
    </div>
  );
}
const nodeTypes = { workflow: CanvasNode };

function pointAlongPath(points: CanvasEdgeData['points']): {
  x: number;
  y: number;
} {
  return pointAlongPathAt(points, 0.5);
}

function pointAlongPathAt(
  points: CanvasEdgeData['points'],
  fraction: number,
): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  const lengths = points
    .slice(1)
    .map((point, index) =>
      Math.hypot(point.x - points[index].x, point.y - points[index].y),
    );
  const distance = lengths.reduce((sum, length) => sum + length, 0) * fraction;
  let traversed = 0;
  for (let index = 0; index < lengths.length; index += 1) {
    const next = traversed + lengths[index];
    if (next >= distance) {
      const ratio =
        lengths[index] === 0 ? 0 : (distance - traversed) / lengths[index];
      return {
        x: points[index].x + (points[index + 1].x - points[index].x) * ratio,
        y: points[index].y + (points[index + 1].y - points[index].y) * ratio,
      };
    }
    traversed = next;
  }
  return points.at(-1) ?? { x: 0, y: 0 };
}

function RoutedWorkflowEdge({
  data,
  label,
  markerEnd,
  sourceX,
  sourceY,
  style,
  targetX,
  targetY,
}: EdgeProps<Edge<CanvasEdgeData>>): ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const points =
    data?.points && data.points.length >= 2
      ? data.points
      : [
          { x: sourceX, y: sourceY },
          { x: targetX, y: targetY },
        ];
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const labelPoint = pointAlongPath(points);
  const terminalPoint = data?.terminal ? points.at(-1) : null;
  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={data?.terminal ? undefined : markerEnd}
        style={style}
      />
      {terminalPoint ? (
        <EdgeLabelRenderer>
          <div
            className='workflow-flow-terminal-marker nodrag nopan'
            aria-label={t('canvas.terminates')}
            style={{
              transform: `translate(-50%, -50%) translate(${terminalPoint.x}px, ${terminalPoint.y}px)`,
            }}
          >
            <X aria-hidden='true' />
          </div>
        </EdgeLabelRenderer>
      ) : null}
      {label == null ? null : (
        <EdgeLabelRenderer>
          <div
            className='workflow-flow-edge-label nodrag nopan'
            style={{
              color: data?.labelColor,
              transform: `translate(-50%, -50%) translate(${labelPoint.x}px, ${labelPoint.y}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = { workflow: RoutedWorkflowEdge };

export function WorkflowCanvas({
  definition,
  focusRequest,
  differences,
  changedConnections,
  overlay,
  nodeRuns = EMPTY_NODE_RUNS,
  selectedNodeKey,
  onSelectNode,
  onViewNodeRun,
  onViewStartInput,
}: WorkflowCanvasProps): ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const graph = useMemo(() => {
    const contracts = new Map([
      [
        'condition',
        {
          type: 'condition',
          title: t('canvas.condition'),
          getBranchKeys: () => ['yes', 'no'],
          getBranchLabel: (branchKey: string) =>
            branchKey === 'yes'
              ? t('canvas.yes')
              : branchKey === 'no'
                ? t('canvas.no')
                : branchKey,
        },
      ],
      [
        'terminate',
        {
          type: 'terminate',
          title: t('canvas.terminate'),
          getBranchKeys: () => [],
          terminal: true,
        },
      ],
      ['run', { type: 'run', title: t('canvas.run'), getBranchKeys: () => [] }],
    ]);
    const projected = projectWorkflowGraph(definition, contracts);
    return {
      ...projected,
      nodes: projected.nodes.map((node) => ({
        ...node,
        title:
          node.kind === 'start'
            ? t('canvas.start')
            : node.kind === 'end'
              ? t('canvas.end')
              : node.kind === 'branch-anchor'
                ? t('canvas.emptyBranch')
                : node.title,
      })),
    };
  }, [definition, t]);
  const [direction, setDirection] = useState<WorkflowLayoutDirection>('DOWN');
  const [layout, setLayout] = useState<{
    graph: typeof graph;
    direction: WorkflowLayoutDirection;
    positions: ReadonlyMap<string, { id: string; x: number; y: number }>;
    routes: readonly {
      readonly id: string;
      readonly points: readonly { readonly x: number; readonly y: number }[];
    }[];
  }>(() => ({ graph, direction, positions: new Map(), routes: [] }));
  const [fittedLayout, setFittedLayout] = useState<{
    graph: typeof graph;
    direction: WorkflowLayoutDirection;
  } | null>(null);
  useEffect(() => {
    let active = true;
    void layoutWithElk(createLayoutInput(graph, direction)).then((result) => {
      if (active)
        setLayout({
          graph,
          direction,
          positions: applyLayoutResult(graph, result).positions,
          routes: result.routes,
        });
    });
    return () => {
      active = false;
    };
  }, [direction, graph]);
  const positions = useMemo<
    ReadonlyMap<string, { id: string; x: number; y: number }>
  >(
    () =>
      layout.graph === graph && layout.direction === direction
        ? layout.positions
        : new Map(),
    [direction, graph, layout],
  );
  const routes = useMemo<ReadonlyMap<string, readonly WorkflowLayoutPoint[]>>(
    () =>
      layout.graph === graph && layout.direction === direction
        ? new Map(
            layout.routes.map((route) => [route.id, route.points] as const),
          )
        : new Map(),
    [direction, graph, layout],
  );
  const viewportReady =
    fittedLayout?.graph === graph && fittedLayout.direction === direction;
  const attemptsByNode = useMemo(() => {
    const result = new Map<string, WorkflowNodeRunRecord[]>();
    for (const run of nodeRuns)
      result.set(run.nodeKey, [...(result.get(run.nodeKey) ?? []), run]);
    return result;
  }, [nodeRuns]);
  const ready =
    positions.size === graph.nodes.length && routes.size === graph.edges.length;
  const nodes = useMemo<Node<CanvasNodeData>[]>(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        type: 'workflow',
        position: positions.get(node.id) ?? { x: 0, y: 0 },
        data: {
          connectionsChanged: Boolean(
            node.workflowNodeKey &&
            changedConnections?.has(node.workflowNodeKey),
          ),
          difference: node.workflowNodeKey
            ? differences?.get(node.workflowNodeKey)
            : undefined,
          title: node.title,
          nodeType: node.nodeType,
          kind: node.kind,
          status: overlay?.nodeStatus.get(node.id) ?? 'unvisited',
          direction,
          attempts: node.workflowNodeKey
            ? (attemptsByNode.get(node.workflowNodeKey) ?? [])
            : [],
          onViewNodeRun,
          onViewStartInput,
        },
        draggable: false,
        selectable: node.kind !== 'end' && node.kind !== 'branch-anchor',
        width: node.width,
        height: node.height,
        className:
          node.workflowNodeKey === selectedNodeKey
            ? 'workflow-selected'
            : undefined,
      })),
    [
      attemptsByNode,
      differences,
      changedConnections,
      direction,
      graph,
      onViewNodeRun,
      onViewStartInput,
      overlay,
      positions,
      selectedNodeKey,
    ],
  );
  const edges = useMemo<Edge[]>(
    () =>
      graph.edges.map((edge) => {
        const traversed = overlay?.traversedEdgeIds.has(edge.id) ?? false;
        const points = routes.get(edge.id) ?? [];
        const renderedPoints = edge.terminal
          ? terminalEdgePoints(
              points,
              [...routes]
                .filter(([id]) => id !== edge.id)
                .map(([, route]) => route),
            )
          : points;
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle:
            edge.kind === 'branch' ? (edge.branchKey ?? undefined) : undefined,
          type: 'workflow',
          data: {
            points: renderedPoints,
            terminal: edge.terminal,
            labelColor: traversed
              ? 'var(--foreground)'
              : 'var(--muted-foreground)',
          },
          label: edge.label ?? undefined,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: traversed
              ? 'var(--foreground)'
              : 'var(--workflow-edge-muted)',
          },
          style: {
            stroke: traversed
              ? 'var(--foreground)'
              : 'var(--workflow-edge-muted)',
            strokeWidth: traversed ? 2.4 : 1.3,
            strokeDasharray: traversed ? undefined : '6 5',
          },
        };
      }),
    [graph, overlay, routes],
  );
  const minimapColor = (node: Node<CanvasNodeData>): string =>
    node.data.status === 'resolved'
      ? 'var(--workflow-success-soft)'
      : node.data.status === 'pending'
        ? 'var(--workflow-pending-soft)'
        : node.data.status === 'failed' || node.data.status === 'error'
          ? 'var(--workflow-error-soft)'
          : node.data.status === 'aborted'
            ? 'var(--workflow-aborted-soft)'
            : 'var(--secondary)';
  const minimapStroke = (node: Node<CanvasNodeData>): string =>
    node.data.status === 'resolved'
      ? 'var(--workflow-success)'
      : node.data.status === 'pending'
        ? 'var(--workflow-pending)'
        : node.data.status === 'failed' || node.data.status === 'error'
          ? 'var(--workflow-error)'
          : node.data.status === 'aborted'
            ? 'var(--workflow-aborted)'
            : node.data.kind === 'start' || node.data.kind === 'end'
              ? 'var(--workflow-emphasis-soft)'
              : 'var(--border)';
  const runInteractive = Boolean(onViewNodeRun || onViewStartInput);
  const interactive = Boolean(onSelectNode || runInteractive);
  return (
    <div
      className='workflow-canvas'
      aria-label={
        runInteractive
          ? t('canvas.runLabel')
          : onSelectNode
            ? t('canvas.editableLabel')
            : t('canvas.readOnlyLabel')
      }
    >
      {ready ? (
        <>
          <ReactFlow
            ariaLabelConfig={{
              'controls.ariaLabel': t('canvas.controls'),
              'controls.zoomIn.ariaLabel': t('canvas.zoomIn'),
              'controls.zoomOut.ariaLabel': t('canvas.zoomOut'),
              'controls.fitView.ariaLabel': t('canvas.fitView'),
            }}
            className={`workflow-canvas-viewport${viewportReady ? ' ready' : ''}`}
            nodes={nodes}
            edges={edges}
            edgeTypes={edgeTypes}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={interactive}
            onNodeClick={
              interactive
                ? (_, node) => {
                    if (node.id === 'end' || node.data.kind === 'branch-anchor')
                      return;
                    const graphNode = graph.nodes.find(
                      (item) => item.id === node.id,
                    );
                    if (!graphNode) return;
                    onSelectNode?.(graphNode.workflowNodeKey ?? null);
                    if (graphNode.kind === 'start') onViewStartInput?.();
                    else {
                      const latest = graphNode.workflowNodeKey
                        ? attemptsByNode.get(graphNode.workflowNodeKey)?.at(-1)
                        : undefined;
                      if (latest) onViewNodeRun?.(latest);
                    }
                  }
                : undefined
            }
            onPaneClick={interactive ? () => onSelectNode?.(null) : undefined}
            onInit={(instance) => {
              window.requestAnimationFrame(() => {
                void instance
                  .fitView({ padding: 0.22, minZoom: 0.35, maxZoom: 1.15 })
                  .then(() => setFittedLayout({ graph, direction }));
              });
            }}
            minZoom={0.2}
            maxZoom={1.5}
          >
            <SelectionFocus
              node={nodes.find(
                (node) =>
                  node.id ===
                  graph.nodes.find(
                    (item) => item.workflowNodeKey === selectedNodeKey,
                  )?.id,
              )}
              request={focusRequest}
              ready={viewportReady}
              selected={selectedNodeKey}
            />
            <Background color='var(--border)' gap={24} size={1} />
            <Panel position='top-right' className='workflow-layout-toggle'>
              <button
                type='button'
                className={direction === 'RIGHT' ? 'active' : undefined}
                aria-label={t('canvas.horizontalLayout')}
                aria-pressed={direction === 'RIGHT'}
                title={t('canvas.horizontalLayout')}
                onClick={() => setDirection('RIGHT')}
              >
                <Columns3 aria-hidden='true' />
              </button>
              <button
                type='button'
                className={direction === 'DOWN' ? 'active' : undefined}
                aria-label={t('canvas.verticalLayout')}
                aria-pressed={direction === 'DOWN'}
                title={t('canvas.verticalLayout')}
                onClick={() => setDirection('DOWN')}
              >
                <Rows3 aria-hidden='true' />
              </button>
            </Panel>
            <MiniMap
              style={differences ? { width: 120, height: 90 } : undefined}
              nodeColor={minimapColor}
              nodeStrokeColor={minimapStroke}
              nodeBorderRadius={8}
              maskColor='color-mix(in oklab, var(--muted) 72%, transparent)'
              pannable
              zoomable
            />
            <Controls showInteractive={false} />
          </ReactFlow>
          {viewportReady ? null : (
            <div className='workflow-canvas-loading'>{t('canvas.fitting')}</div>
          )}
        </>
      ) : (
        <div className='workflow-canvas-loading'>{t('canvas.layingOut')}</div>
      )}
    </div>
  );
}
