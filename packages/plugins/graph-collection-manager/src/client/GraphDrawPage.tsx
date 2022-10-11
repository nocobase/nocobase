import React, { useLayoutEffect, useRef, useEffect, useContext } from 'react';
import { Graph, Cell } from '@antv/x6';
import dagre from 'dagre';
import '@antv/x6-react-shape';
import { SchemaOptionsContext } from '@formily/react';

import {
  useAPIClient,
  APIClientProvider,
  CollectionManagerProvider,
  useCollectionManager,
  SchemaComponentOptions,
} from '@nocobase/client';
import { formatData } from './utils';
import Entity from './components/Entity';

const LINE_HEIGHT = 25;
const NODE_WIDTH = 210;

let dir = 'TB'; // LR RL TB BT 横排
//计算布局
function layout(graph) {
  const nodes = graph.getNodes();
  const edges = graph.getEdges();
  const g: any = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: dir, nodesep: 100, edgesep: 20, rankSep: 50, align: 'DL', controlPoints: true });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node, i) => {
   const width = 210;
   const  height = node.getPorts().length * 25 + 30;
    g.setNode(node.id, { width, height });
  });
  edges.forEach((edge) => {
    const source = edge.getSource();
    const target = edge.getTarget();
    g.setEdge(source.cell, target.cell);
  });
  dagre.layout(g);
  graph.freeze();
  g.nodes().forEach((id) => {
    const node = graph.getCell(id);
    if (node) {
      const pos: any = g.node(id);
      node.position(pos.x, pos.y);
    }
  });
  graph.unfreeze();
  graph.centerContent();
}

function getNodes(nodes, graph) {
  nodes.forEach((item) => {
    graph.addNode(item);
  });
}

function getEdges(edges, graph) {
  const nodes = graph.getNodes();
  edges.forEach((item) => {
    if (item.source && item.target) {
      graph.addEdge({
        ...item,
        connector: {
          name: 'rounded',
          zIndex: 10000,
        },
      });
    }
  });
}

function getCollectionData(rawData, graph) {
  const { nodes, edges } = formatData(rawData);
  const cells: Cell[] = [];
  graph.resetCells(cells);
  getNodes(nodes, graph);
  getEdges(edges, graph);
  layout(graph);
}
export const Editor = () => {
  const api = useAPIClient();
  const graph = useRef(null);
  graph.current = null;
  const { collections: data, refreshCM } = useCollectionManager();
  let options = useContext(SchemaOptionsContext);
  const scope = { ...options?.scope };
  const components = { ...options?.components };
  const initGraphCollections = () => {
    const myGraph = new Graph({
      container: document.getElementById('container')!,
      panning: true,
      height: 800,
      scroller: {
        enabled: !0,
        pageVisible: !1,
        pageBreak: !1,
      },
      autoResize: true,
      connecting: {
        router: {
          name: 'er',
          args: {
            direction: 'H',
          },
        },
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
      },
      snapline: {
        enabled: !0,
      },
      keyboard: {
        enabled: false,
      },
      clipboard: {
        enabled: false,
      },
      interacting: {
        magnetConnectable: false,
      },
    });
    graph.current = myGraph;
    Graph.registerPortLayout(
      'erPortPosition',
      (portsPositionArgs) => {
        return portsPositionArgs.map((_, index) => {
          return {
            position: {
              x: 0,
              y: (index + 1) * LINE_HEIGHT,
            },
            angle: 0,
          };
        });
      },
      true,
    );
    Graph.registerNode(
      'er-rect',
      {
        inherit: 'react-shape',
        component: (node) => (
          <APIClientProvider apiClient={api}>
            <SchemaComponentOptions inherit scope={scope} components={components}>
              <CollectionManagerProvider collections={data} refreshCM={refreshCM}>
                <div style={{ height: 'auto' }}>
                  <Entity graph={myGraph} node={node} />
                </div>
              </CollectionManagerProvider>
            </SchemaComponentOptions>
          </APIClientProvider>
        ),
        ports: {
          groups: {
            list: {
              markup: [
                {
                  tagName: 'rect',
                  selector: 'portBody',
                },
              ],
              attrs: {
                portBody: {
                  width: NODE_WIDTH,
                  height: LINE_HEIGHT,
                  strokeWidth: 1,
                  magnet: true,
                  visibility: 'hidden',
                },
              },
              position: 'erPortPosition',
            },
          },
        },
      },
      true,
    );
  };

  useLayoutEffect(() => {
    initGraphCollections();
    return () => {
      graph.current = null;
    };
  }, []);

  useEffect(() => {
    graph.current && getCollectionData(data, graph.current);
  }, []);

  return <div id="container" style={{ width: '100%', height: 'auto' }}></div>;
};
