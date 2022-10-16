import React, { useLayoutEffect, useEffect, useContext, useState, useImperativeHandle } from 'react';
import { Graph } from '@antv/x6';
import dagre from 'dagre';
import { last, throttle } from 'lodash';
import '@antv/x6-react-shape';
import { SchemaOptionsContext } from '@formily/react';
import { Layout, Menu, Input } from 'antd';
import { cx } from '@emotion/css';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import {
  useAPIClient,
  APIClientProvider,
  CollectionManagerProvider,
  SchemaComponentOptions,
  useCompile,
} from '@nocobase/client';
import { formatData } from './utils';
import Entity from './components/Entity';
import { collectionListClass } from './style';
import { FullScreenContext } from './GraphCollectionShortcut';
import { useGraphPosions } from './GraphPositionProvider';

const { Sider, Content } = Layout;

const LINE_HEIGHT = 32;
const NODE_WIDTH = 210;
let targetGraph;
let targetNode;
let dir = 'TB'; // LR RL TB BT 横排
//计算布局
async function layout(graph, positions, createPositions, refreshPositions) {
  let graphPositions = [];
  const nodes: any[] = graph.getNodes();
  const edges = graph.getEdges();
  const g: any = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: dir, nodesep: 50, edgesep: 50, rankSep: 50, align: 'DL', controlPoints: true });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach((node, i) => {
    const width = 210;
    const height = node.getPorts().length * 32 + 30;
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
      const targetPosition =
        (positions &&
          positions.find((v) => {
            return v.collectionName === node.store.data.name;
          })) ||
        {};
      node.position(targetPosition.x || pos.x, targetPosition.y || pos.y);
      if (positions && !positions.find((v) => v.collectionName === node.store.data.name)) {
        // 位置表中没有的表都自动保存
        graphPositions.push({
          collectionName: node.store.data.name,
          x: pos.x,
          y: pos.y,
        });
      }
    }
  });
  graph.unfreeze();
  targetNode
    ? graph.positionCell(targetNode, 'top', { padding: 100 })
    : graph.positionCell(last(nodes), 'top', { padding: 100 });
  if (graphPositions.length > 0) {
    await createPositions(graphPositions);
    await refreshPositions();
  }
}

function getNodes(nodes, graph) {
  nodes.forEach((item) => {
    graph.addNode(item);
  });
}

function getEdges(edges, graph) {
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

export const Editor = React.memo(() => {
  const api = useAPIClient();
  const compile = useCompile();
  const { positions, createPositions, updatePosition, refreshPositions } = useGraphPosions();
  const [collapsed, setCollapsed] = useState(false);
  const { GraphRef } = useContext(FullScreenContext);
  const [collectionData, setCollectionData] = useState<any>([]);
  const [collectionList, setCollectionList] = useState<any>([]);
  let options = useContext(SchemaOptionsContext);
  const scope = { ...options?.scope };
  const components = { ...options?.components };
  useImperativeHandle(GraphRef, () => ({
    refreshCM,
  }));
  const setTargetNode = (node) => {
    targetNode = node;
  };
  const refreshCM = async () => {
    const { data } = await api.resource('collections').list({
      paginate: false,
      appends: ['fields', 'fields.uiSchema'],
      sort: 'sort',
    });
    setCollectionData(data.data);
    setCollectionList(data.data);
    getCollectionData(data.data, targetGraph);
    targetGraph.collections = data.data;
  };
  const initGraphCollections = () => {
    const myGraph = new Graph({
      container: document.getElementById('container')!,
      panning: true,
      moveThreshold: 3,
      height: 800,
      scroller: {
        enabled: true,
      },
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
      autoResize: document.getElementById('graph_container'),
    });
    targetGraph = myGraph;
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
              <CollectionManagerProvider collections={targetGraph?.collections} refreshCM={refreshCM}>
                <div style={{ height: 'auto' }}>
                  <Entity node={node} setTargetNode={setTargetNode} />
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
    console.log(targetGraph.positions)
    targetGraph.on('edge:mouseover', ({ e, edge }) => {
      e.stopPropagation();
      const targeNode = targetGraph.getCellById(edge.store.data.target.cell);
      const sourceNode = targetGraph.getCellById(edge.store.data.source.cell);
      targeNode.setAttrs({ targetPort: edge.store.data.target.port });
      sourceNode.setAttrs({ sourcePort: edge.store.data.source.port });
    });
    targetGraph.on('edge:mouseout', ({ e, edge }) => {
      e.stopPropagation();
      const targeNode = targetGraph.getCellById(edge.store.data.target.cell);
      const sourceNode = targetGraph.getCellById(edge.store.data.source.cell);
      targeNode.removeAttrs('targetPort');
      sourceNode.removeAttrs('sourcePort');
    });
    targetGraph.on('node:mouseup', ({ e, node }) => {
      e.stopPropagation();
      console.log(targetGraph.positions)
      if (targetGraph.positions.find((v) => v.collectionName === node.store.data.name)) {
        updatePosition({
          collectionName: node.store.data.name,
          ...node.position(),
        });
      } else {
        createPositions({
          collectionName: node.store.data.name,
          ...node.position(),
        });
      }
    });
  };
  const getCollectionData = (rawData, graph) => {
    console.log(rawData);
    const { nodes, edges } = formatData(rawData);
    graph.clearCells();
    getNodes(nodes, graph);
    getEdges(edges, graph);
    layout(graph, positions, createPositions, refreshPositions);
  };

  useLayoutEffect(() => {
    initGraphCollections();
    return () => {
      targetGraph.off('edge:mouseover');
      targetGraph.off('edge:mouseout');
      targetGraph.on('node:mouseup');
      targetGraph = null;
      targetNode = null;
    };
  }, []);

  useEffect(() => {
    api
      .resource('collections')
      .list({
        paginate: false,
        appends: ['fields', 'fields.uiSchema'],
        sort: 'sort',
      })
      .then((v) => {
        const { data } = v;
        targetGraph.collections = data.data;
        targetGraph.positions=positions;
        setCollectionData(data.data);
        setCollectionList(data.data);
        targetGraph && getCollectionData(data.data, targetGraph);
      });
  }, [positions]);

  const handleSearchCollection = (e) => {
    const value = e.target.value.toLowerCase();
    if (value) {
      const targetCollections = collectionData.filter((v) => {
        const collectionTitle = compile(v.title).toLowerCase();
        return collectionTitle.includes(value);
      });
      setCollectionList(targetCollections);
    } else {
      setCollectionList(collectionData);
    }
  };

  const handleSelectCollection = (value) => {
    if (targetNode) {
      targetNode.removeAttrs();
    }
    targetNode = targetGraph.getCellById(value.key);
    targetGraph.unfreeze();
    // 定位到目标节点
    targetGraph.positionCell(targetNode, 'top', { padding: 100 });
    targetNode.setAttrs({
      border: '#165dff',
    });
  };
  return (
    <Layout>
      <Sider
        className={cx(collectionListClass)}
        collapsed={collapsed}
        defaultCollapsed={false}
        theme="light"
        collapsedWidth={0}
        width={150}
      >
        <Input type="search" onChange={handleSearchCollection} style={{ width: '90%' }} placeholder="表搜索" />
        <Menu style={{ width: 150, maxHeight: '900px', overflowY: 'auto' }} mode="inline" theme="light">
          {collectionList.map((v) => {
            return (
              <Menu.Item key={v.key} onClick={(e) => handleSelectCollection(e)}>
                <span>{compile(v.title)}</span>
              </Menu.Item>
            );
          })}
        </Menu>
      </Sider>
      <div className="site-layout-background" style={{ padding: 0 }}>
        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
          className: 'trigger',
          onClick: () => setCollapsed(!collapsed),
        })}
      </div>
      <Layout className="site-layout">
        <Content
          className="site-layout-background"
          style={{
            overflow: 'hidden',
          }}
        >
          <div id="container" style={{ width: 'auto', height: 'auto' }}></div>
        </Content>
      </Layout>
    </Layout>
  );
});
