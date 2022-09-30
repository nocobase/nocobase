import React, { useLayoutEffect, useRef, useEffect, useContext } from 'react';
import { Graph, Cell } from '@antv/x6';
import dagre from 'dagre';
import '@antv/x6-react-shape';
import { formatData } from './utils';
import {GraphDrawerContext} from './GraphCollectionEditorProvder';
import CollectionNode from './components/CollectionNode';

const LINE_HEIGHT = 24;
const NODE_WIDTH = 170;



let dir = 'LR'; // LR RL TB BT 竖排
//计算布局
function layout(graph) {
  const nodes = graph.getNodes();
  const edges = graph.getEdges();
  const g: any = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: dir, nodesep: 100, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));
  let width = 0;
  let height = 0;
  nodes.forEach((node, i) => {
    if (node.id !== 'parent') {
      width = 150;
      height = 200;
      g.setNode(node.id, { width, height });
    }
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
    if (item.shape !== 'edge') {
      graph.addNode(item);
    }
  });
}

function getEdges(edges, graph) {
  edges.forEach((item) => {
    if (item.shape == 'edge') {
      if (item.source && item.target) {
        graph.addEdge({
          ...item,
          connector: {
            name: 'rounded',
            zIndex: 10000,
          },
        });
      }
    }
  });
}

export const Editor = () => {
  const graph = useRef(null);
  graph.current = null;
  const { data: rawData } = useContext(GraphDrawerContext);
  const getCollectionData = () => {
    const { nodes, edges } = formatData(rawData);
    const cells: Cell[] = [];
    graph.current.resetCells(cells);
    getNodes(nodes, graph.current);
    getEdges(edges, graph.current);
    layout(graph.current);
  };

  useLayoutEffect(() => {
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
            offset: 25,
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
        component: <CollectionNode graph={myGraph} />,
        ports: {
          groups: {
            list: {
              markup: [
                {
                  tagName: 'rect',
                  selector: 'portBody',
                },
                {
                  tagName: 'text',
                  selector: 'portNameLabel',
                },
                {
                  tagName: 'text',
                  selector: 'portTypeLabel',
                },
              ],
              attrs: {
                portBody: {
                  width: NODE_WIDTH,
                  height: LINE_HEIGHT,
                  strokeWidth: 1,
                  stroke: '#5F95FF',
                  fill: '#EFF4FF',
                  magnet: true,
                },
                portNameLabel: {
                  ref: 'portBody',
                  refX: 6,
                  refY: 6,
                  fontSize: 10,
                },
                portTypeLabel: {
                  ref: 'portBody',
                  refX: 95,
                  refY: 6,
                  fontSize: 10,
                },
              },
              position: 'erPortPosition',
            },
          },
        },
      },
      true,
    );
  }, []);

  //监听数据，实时更新并渲染
  useEffect(() => {
    graph.current && getCollectionData();
  }, [graph.current]);

  return <div id="container" style={{ width: '100%' }}></div>;
};
