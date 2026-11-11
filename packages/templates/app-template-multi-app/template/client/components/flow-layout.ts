import type {
  ELK,
  ELKConstructorArguments,
  ElkNode,
} from 'elkjs/lib/elk-api.js';

export interface FlowDiagramNode {
  readonly id: string;
  readonly label: string;
  readonly kind?: 'initial' | 'final' | 'state';
  /** True only when the lifecycle definition binds configurable parameters to this state. */
  readonly configurable?: boolean;
  /** Fixed canvas dimensions; customize these when supplying richer node content. */
  readonly width?: number;
  readonly height?: number;
  /** A visual annotation, not an inspectable business state or transition. */
  readonly decorative?: boolean;
  readonly visited?: boolean;
  readonly highlighted?: boolean;
  readonly className?: string;
  /** the caller's rendered content draws the whole node, without the default box or state tint. */
  readonly bare?: boolean;
  readonly minimapShape?: 'pill' | 'card';
  readonly minimapColor?: string;
}

export interface FlowDiagramEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label?: string;
  /** True when the transition binds editable business parameters. */
  readonly configurable?: boolean;
  /** A visual annotation, not an inspectable business state or transition. */
  readonly decorative?: boolean;
  readonly visited?: boolean;
  readonly highlighted?: boolean;
  readonly dashed?: boolean;
  /** a secondary route drawn thin and light, so the main path reads first. */
  readonly faint?: boolean;
  /** hover and accessible text for an edge that shows no label on the canvas. */
  readonly title?: string;
}

export type FlowDiagramDirection = 'RIGHT' | 'DOWN';

export interface FlowDiagramGraph {
  readonly nodes: readonly FlowDiagramNode[];
  readonly edges: readonly FlowDiagramEdge[];
}

export interface FlowDiagramPoint {
  readonly x: number;
  readonly y: number;
}

export interface FlowDiagramLayout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly (FlowDiagramNode &
    FlowDiagramPoint & { width: number; height: number })[];
  readonly edges: readonly (FlowDiagramEdge & {
    points: readonly FlowDiagramPoint[];
    labelPosition?: FlowDiagramPoint;
  })[];
}

/** Wrap condition labels without splitting words. */
export function flowLabelLines(text: string): string[] {
  const lines: string[] = [];
  let line = '',
    width = 0;
  for (const token of text.match(/[a-zA-Z0-9_]+|[^a-zA-Z0-9_]/g) ?? []) {
    const tokenWidth = [...token].reduce(
      (n, char) => n + (char.charCodeAt(0) > 255 ? 14 : 7),
      0,
    );
    if (line && width + tokenWidth > 252) {
      lines.push(line.trim());
      line = '';
      width = 0;
    }
    line += token;
    width += tokenWidth;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

type ElkConstructor = new (args?: ELKConstructorArguments) => ELK;
let elkPromise: Promise<ELK> | undefined;

function getElk(): Promise<ELK> {
  return (elkPromise ??= import('elkjs/lib/elk.bundled.js').then((module) => {
    // elkjs is CommonJS: NodeNext and Vite expose its constructor differently.
    const imported = module.default as
      ElkConstructor | { default: ElkConstructor };
    return new (typeof imported === 'function' ? imported : imported.default)();
  }));
}

/** Layout and route the same graph, including cycles, parallel edges and self-transitions. */
export async function layoutFlowDiagram(
  graph: FlowDiagramGraph,
  direction: FlowDiagramDirection = 'RIGHT',
  compact = false,
): Promise<FlowDiagramLayout> {
  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (ids.has(node.id)) throw new Error(`Duplicate node: ${node.id}`);
    ids.add(node.id);
    if (
      !Number.isFinite(node.width ?? 232) ||
      (node.width ?? 232) <= 0 ||
      !Number.isFinite(node.height ?? 104) ||
      (node.height ?? 104) <= 0
    )
      throw new Error(`Invalid dimensions: ${node.id}`);
  }
  const edgeIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) throw new Error(`Duplicate edge: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!ids.has(edge.source) || !ids.has(edge.target))
      throw new Error(`Unknown endpoint: ${edge.id}`);
  }
  // Internal ids occupy their own namespace, regardless of caller-provided ids.
  const nodeIds = new Map(
    graph.nodes.map((node, index) => [node.id, `n${index}`]),
  );
  const elk = await getElk();
  const result = await elk.layout<ElkNode>({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': compact ? '20' : '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': compact ? '28' : '72',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      // Declared state order keeps retry edges from moving later states before the start.
      'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.thoroughness': '32',
      'elk.spacing.edgeEdge': compact ? '8' : '20',
      'elk.layered.spacing.edgeEdgeBetweenLayers': compact ? '8' : '20',
      'elk.layered.spacing.edgeNodeBetweenLayers': compact ? '8' : '24',
    },
    children: graph.nodes.map((node) => {
      const id = nodeIds.get(node.id)!;
      const width = node.width ?? 232;
      const height = node.height ?? 104;
      const connections = graph.edges.map((edge, index) => ({ edge, index }));
      const incoming = connections.filter(
        ({ edge }) => edge.target === node.id,
      );
      const outgoing = connections.filter(
        ({ edge }) => edge.source === node.id,
      );
      return {
        id,
        width,
        height,
        // Let crossing minimization order ports instead of freezing declaration order.
        layoutOptions: { 'elk.portConstraints': 'FIXED_SIDE' },
        ports: [
          ...incoming.map(({ index }) => ({
            id: `e${index}:in`,
            width: 0,
            height: 0,
            layoutOptions: {
              'elk.port.side': direction === 'RIGHT' ? 'WEST' : 'NORTH',
            },
          })),
          ...outgoing.map(({ index }) => ({
            id: `e${index}:out`,
            width: 0,
            height: 0,
            layoutOptions: {
              'elk.port.side': direction === 'RIGHT' ? 'EAST' : 'SOUTH',
            },
          })),
        ],
      };
    }),
    edges: graph.edges.map((edge, index) => ({
      id: `e${index}`,
      sources: [`e${index}:out`],
      targets: [`e${index}:in`],
      labels: edge.label
        ? [
            {
              text: edge.label,
              // Reserve space on the routed edge so labels remain attached to it.
              layoutOptions: {
                'elk.edgeLabels.placement': 'CENTER',
                'elk.edgeLabels.inline': 'true',
              },
              width: Math.min(
                268,
                [...edge.label].reduce(
                  (total, char) => total + (char.charCodeAt(0) > 255 ? 14 : 7),
                  16,
                ),
              ),
              height: flowLabelLines(edge.label).length * 18 + 8,
            },
          ]
        : [],
    })),
  });
  return {
    width: result.width ?? 0,
    height: result.height ?? 0,
    nodes: graph.nodes.map((node, index) => {
      const placed = result.children![index];
      return {
        ...node,
        x: placed.x ?? 0,
        y: placed.y ?? 0,
        width: placed.width ?? node.width ?? 232,
        height: placed.height ?? node.height ?? 104,
      };
    }),
    edges: graph.edges.map((edge, index) => {
      const routed = result.edges![index];
      const label = routed.labels?.[0];
      const points = (routed.sections ?? []).flatMap((section) => [
        section.startPoint,
        ...(section.bendPoints ?? []),
        section.endPoint,
      ]);
      // ELK may round a self-loop's port but leave its neighboring bend fractional.
      // Align those bends with the port so even short endpoint segments stay orthogonal.
      if (points.length >= 4) {
        const axis = direction === 'RIGHT' ? 'y' : 'x';
        for (const [endpoint, bend] of [
          [0, 1],
          [points.length - 1, points.length - 2],
        ]) {
          if (Math.abs(points[endpoint][axis] - points[bend][axis]) < 1) {
            points[bend] = { ...points[bend], [axis]: points[endpoint][axis] };
          }
        }
      }
      let labelPosition: FlowDiagramPoint | undefined;
      if (label) {
        const center = {
          x: (label.x ?? 0) + (label.width ?? 0) / 2,
          y: (label.y ?? 0) + (label.height ?? 0) / 2,
        };
        // ELK reserves inline label space, but can offset its center slightly
        // in horizontal layouts. Anchor it precisely to that reserved segment.
        let distance = Infinity;
        for (let index = 1; index < points.length; index++) {
          const start = points[index - 1];
          const end = points[index];
          const candidate = {
            x: Math.max(
              Math.min(start.x, end.x),
              Math.min(center.x, Math.max(start.x, end.x)),
            ),
            y: Math.max(
              Math.min(start.y, end.y),
              Math.min(center.y, Math.max(start.y, end.y)),
            ),
          };
          const nextDistance = Math.hypot(
            candidate.x - center.x,
            candidate.y - center.y,
          );
          if (nextDistance < distance) {
            labelPosition = candidate;
            distance = nextDistance;
          }
        }
      }
      return { ...edge, points, labelPosition };
    }),
  };
}

type PlacedFlowNode = FlowDiagramLayout['nodes'][number];

/** a transient route for an edge left out of the layout. It runs in a lane
 * outside every node it passes, so revealing it never moves the laid-out graph.
 * Deeper lanes keep nested routes from crossing one another; a self-transition loops
 * beside its own node. The label sits outside the lane instead of over the nodes. */
export function revealRoute(
  nodes: readonly PlacedFlowNode[],
  source: PlacedFlowNode,
  target: PlacedFlowNode,
  direction: FlowDiagramDirection,
  lane = 0,
): {
  points: FlowDiagramPoint[];
  labelPosition: FlowDiagramPoint;
  labelAnchor: 'end' | 'middle';
} {
  // Measure along the flow (main) and across it; the lane runs before the nodes on the cross axis.
  const down = direction === 'DOWN';
  const main = (node: PlacedFlowNode) => (down ? node.y : node.x);
  const cross = (node: PlacedFlowNode) => (down ? node.x : node.y);
  const size = (node: PlacedFlowNode) => (down ? node.height : node.width);
  const point = (along: number, across: number): FlowDiagramPoint =>
    down ? { x: across, y: along } : { x: along, y: across };
  const loop = source === target;
  const start = Math.min(main(source), main(target));
  const end = Math.max(
    main(source) + size(source),
    main(target) + size(target),
  );
  const lanePosition =
    Math.min(
      ...(loop
        ? [cross(source)]
        : nodes
            .filter(
              (node) => main(node) < end && main(node) + size(node) > start,
            )
            .map(cross)),
    ) -
    16 -
    lane * 10;
  const from = main(source) + size(source) * (loop ? 0.3 : 0.5);
  const to = main(target) + size(target) * (loop ? 0.7 : 0.5);
  return {
    points: [
      point(from, cross(source)),
      point(from, lanePosition),
      point(to, lanePosition),
      point(to, cross(target)),
    ],
    // DOWN lanes run left of the nodes, so labels end at the lane; RIGHT lanes run above them.
    labelPosition: point((from + to) / 2, lanePosition - (down ? 6 : 14)),
    labelAnchor: down ? 'end' : 'middle',
  };
}

/** Keep return and self-transitions out of the process layout. Declaration order
 * describes forward progress; even adjacent returns can become long routes in ELK. */
export function partitionFlowDiagramReturns(graph: FlowDiagramGraph): {
  edges: FlowDiagramEdge[];
  extraEdges: FlowDiagramEdge[];
} {
  const order = new Map(graph.nodes.map((node, index) => [node.id, index]));
  const edges: FlowDiagramEdge[] = [],
    extraEdges: FlowDiagramEdge[] = [];
  for (const edge of graph.edges) {
    const source = order.get(edge.source),
      target = order.get(edge.target);
    const returnRoute =
      !edge.decorative &&
      source !== undefined &&
      target !== undefined &&
      source >= target;
    (returnRoute ? extraEdges : edges).push(edge);
  }
  return { edges, extraEdges };
}
