import { centerEdgePoints } from './center-edge.js';
import * as ElkModule from 'elkjs/lib/elk.bundled.js';
import type {
  ELK,
  ELKConstructorArguments,
  ElkExtendedEdge,
} from 'elkjs/lib/elk-api.js';
import type {
  WorkflowLayoutInput,
  WorkflowLayoutResult,
} from '@nocobase/app-plugin-dag-flow/client';

type ElkConstructor = new (args?: ELKConstructorArguments) => ELK;

function normalizeElkConstructor(
  imported: ElkConstructor | { default: ElkConstructor },
): ElkConstructor {
  return typeof imported === 'function' ? imported : imported.default;
}

const elk = new (normalizeElkConstructor(ElkModule.default))();
export async function layoutWithElk(
  input: WorkflowLayoutInput,
): Promise<WorkflowLayoutResult> {
  const result = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': input.direction,
      'elk.spacing.nodeNode': '48',
      'elk.layered.spacing.nodeNodeBetweenLayers':
        input.direction === 'DOWN' ? '56' : '104',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.edgeRouting': 'ORTHOGONAL',
    },
    children: input.nodes.map((node) => ({
      id: node.id,
      width: node.width,
      height: node.height,
      layoutOptions:
        node.ports.length > 0
          ? { 'elk.portConstraints': 'FIXED_ORDER' }
          : undefined,
      ports: node.ports.map((port) => ({
        id: port.id,
        width: 0,
        height: 0,
        layoutOptions: {
          'elk.port.side': port.side,
          'elk.port.index': String(port.index),
        },
      })),
    })),
    edges: input.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.sourcePort ?? edge.source],
      targets: [edge.targetPort],
    })),
  });
  return {
    positions: (result.children ?? []).map((node) => ({
      id: node.id,
      x: node.x ?? 0,
      y: node.y ?? 0,
    })),
    routes: ((result.edges ?? []) as ElkExtendedEdge[]).map((edge) => {
      const inputEdge = input.edges.find((item) => item.id === edge.id);
      const points = (edge.sections ?? []).flatMap((section, index) => [
        ...(index === 0 ? [section.startPoint] : []),
        ...(section.bendPoints ?? []),
        section.endPoint,
      ]);
      const obstacles = (result.children ?? [])
        .filter(
          (node) =>
            node.id !== inputEdge?.source && node.id !== inputEdge?.target,
        )
        .map((node) => ({
          x: node.x ?? 0,
          y: node.y ?? 0,
          width: node.width ?? 0,
          height: node.height ?? 0,
        }));
      return {
        id: edge.id,
        points: centerEdgePoints(points, input.direction, obstacles),
      };
    }),
  };
}
