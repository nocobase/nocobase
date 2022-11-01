import { FullscreenExitOutlined, FullscreenOutlined, MenuOutlined } from '@ant-design/icons';
import { Graph } from '@antv/x6';
import '@antv/x6-react-shape';
import { css, cx } from '@emotion/css';
import { SchemaOptionsContext } from '@formily/react';
import {
  APIClientProvider,
  CollectionManagerProvider,
  SchemaComponent,
  SchemaComponentOptions,
  useAPIClient,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';
import { useFullscreen } from 'ahooks';
import { Button, Input, Layout, Menu, Popover, Tooltip } from 'antd';
import dagre from 'dagre';
import { last, maxBy, minBy, uniq } from 'lodash';
import React, { createContext, useContext, useEffect, useLayoutEffect, useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateActionAndRefreshCM } from './action-hooks';
import Entity from './components/Entity';
import { collection } from './schemas/collection';
import { collectionListClass, graphCollectionContainerClass } from './style';
import { formatData, getDiffNode, getDiffEdge } from './utils';

const LINE_HEIGHT = 40;
const NODE_WIDTH = 250;
let targetGraph;
let targetNode;
let dir = 'TB'; // LR RL TB BT 横排

const getGridData = (num, arr) => {
  const newArr = [];
  while (arr.length > 0) {
    newArr.push(arr.splice(0, num));
  }
  return newArr;
};

//计算布局
async function layout(createPositions) {
  const { positions } = targetGraph;
  let graphPositions = [];
  const nodes: any[] = targetGraph.getNodes();
  const edges = targetGraph.getEdges();
  const g: any = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: dir, nodesep: 50, edgesep: 50, rankSep: 50, align: 'DL', controlPoints: true });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach((node, i) => {
    const width = NODE_WIDTH;
    const height = node.getPorts().length * 32 + 30;
    g.setNode(node.id, { width, height });
  });
  dagre.layout(g);
  targetGraph.freeze();
  const dNodes = getGridData(15, g.nodes());
  dNodes.forEach((arr, row) => {
    arr.forEach((id, index) => {
      const node = targetGraph.getCell(id);
      const col = index % 15;
      if (node) {
        const targetPosition =
          (positions &&
            positions.find((v) => {
              return v.collectionName === node.store.data.name;
            })) ||
          {};
        const calculatedPosition = { x: col * 325 + 50, y: row * 400 + 60 };
        node.position(targetPosition.x || calculatedPosition.x, targetPosition.y || calculatedPosition.y);
        if (positions && !positions.find((v) => v.collectionName === node.store.data.name)) {
          // 位置表中没有的表都自动保存
          graphPositions.push({
            collectionName: node.store.data.name,
            x: calculatedPosition.x,
            y: calculatedPosition.y,
          });
        }
      }
    });
  });
  edges.forEach((edge) => {
    optimizeEdge(edge);
  });
  targetGraph.unfreeze();
  if (targetNode) {
    typeof targetNode === 'string'
      ? targetGraph.positionCell(last(nodes), 'top', { padding: 100 })
      : targetGraph.positionCell(targetNode, 'top', { padding: 100 });
  } else {
    targetGraph.positionCell(nodes[0], 'top-left', { padding: 100 });
  }
  if (graphPositions.length > 0) {
    await createPositions(graphPositions);
    graphPositions = [];
  }
}

function optimizeEdge(edge) {
  const source = edge.getSource();
  const target = edge.getTarget();
  const sorceNodeX = targetGraph.getCell(source.cell).position().x;
  const targeNodeX = targetGraph.getCell(target.cell).position().x;
  if (sorceNodeX > targeNodeX) {
    edge.setSource({
      cell: source.cell,
      port: source.port,
      anchor: {
        name: 'left',
      },
    });
    edge.setTarget({
      cell: target.cell,
      port: target.port,
      anchor: {
        name: 'right',
      },
    });
    edge.setRouter('er', {
      direction: 'H',
    });
  } else if (sorceNodeX === targeNodeX) {
    edge.setSource({
      cell: source.cell,
      port: source.port,
      anchor: {
        name: 'left',
      },
    });
    edge.setTarget({
      cell: target.cell,
      port: target.port,
      anchor: {
        name: 'left',
      },
    });
    edge.setRouter('oneSide', { side: 'left' });
  } else {
    edge.setSource({
      cell: source.cell,
      port: source.port,
      anchor: {
        name: 'right',
      },
    });
    edge.setTarget({
      cell: target.cell,
      port: target.port,
      anchor: {
        name: 'left',
      },
    });
    edge.setRouter('er', {
      direction: 'H',
    });
  }
}

function getNodes(nodes) {
  nodes.forEach((item) => {
    targetGraph.addNode(item);
  });
}

function getEdges(edges) {
  edges.forEach((item) => {
    if (item.source && item.target) {
      targetGraph.addEdge({
        ...item,
        connector: {
          name: 'normal',
          zIndex: 10000,
        },
      });
    }
  });
}

const getPopupContainer = () => {
  return document.getElementById('graph_container');
};

const CollapsedContext = createContext<any>({});

export const GraphDrawPage = React.memo(() => {
  let options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  const compile = useCompile();
  const { t } = useTranslation('graphPositions');
  const [collectionData, setCollectionData] = useState<any>([]);
  const [collectionList, setCollectionList] = useState<any>([]);
  const { refreshCM } = useCollectionManager();
  const scope = { ...options?.scope };
  const components = { ...options?.components };

  const useSaveGraphPositionAction = async (data) => {
    await api.resource('graphPositions').create({ values: data });
    await refreshPositions();
  };
  const useUpdatePositionAction = async (position) => {
    await api.resource('graphPositions').update({
      filter: { collectionName: position.collectionName },
      values: { ...position },
    });
    await refreshPositions();
  };
  const refreshPositions = async () => {
    const { data } = await api.resource('graphPositions').list({ paginate: false });
    targetGraph.positions = data.data;
    return Promise.resolve();
  };
  const setTargetNode = (node) => {
    targetNode = node;
    if (node === 'destory') {
      refreshPositions();
    }
  };
  const refreshGM = async () => {
    const data = await refreshCM();
    targetGraph.collections = data;
    const currentNodes = targetGraph.getNodes();
    setCollectionData(data);
    setCollectionList(data);
    if (!currentNodes.length) {
      renderInitGraphCollection(data);
    } else {
      renderDiffGraphCollection(data);
    }
  };
  const initGraphCollections = () => {
    targetGraph = new Graph({
      container: document.getElementById('container')!,
      moveThreshold: 3,
      scroller: {
        enabled: true,
        pannable: true,
        padding: { top: 0, left: 500, right: 300, bottom: 400 },
      },
      connecting: {
        anchor: {
          name: 'midSide',
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
      async: true,
    });
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
              <CollectionManagerProvider collections={targetGraph?.collections} refreshCM={refreshGM}>
                <div style={{ height: 'auto' }}>
                  <Entity node={node} setTargetNode={setTargetNode} targetGraph={targetGraph} />
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
                  // magnet: true,
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
    targetGraph.on('edge:mouseover', ({ e, edge }) => {
      const { associated } = edge.store?.data;
      e.stopPropagation();
      edge.setAttrs({
        line: {
          stroke: '#1890ff',
          strokeWidth: 1,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          sourceMarker: null,
          targetMarker: null,
        },
      });
      edge.setLabels(
        edge.getLabels().map((v) => {
          return {
            ...v,
            attrs: {
              labelText: {
                ...v.attrs.labelText,
                fill: '#1890ff',
              },
              labelBody: {
                ...v.attrs.labelBody,

                stroke: '#1890ff',
              },
            },
          };
        }),
      );
      const targeNode = targetGraph.getCellById(edge.store.data.target.cell);
      const sourceNode = targetGraph.getCellById(edge.store.data.source.cell);
      targeNode.setAttrs({ targetPort: edge.store.data.target.port });
      sourceNode.setAttrs({ sourcePort: edge.store.data.source.port });
      sourceNode.setAttrs({ associated });
      targeNode.setAttrs({ associated });
    });
    targetGraph.on('edge:mouseout', ({ e, edge }) => {
      e.stopPropagation();
      const targeNode = targetGraph.getCellById(edge.store.data.target.cell);
      const sourceNode = targetGraph.getCellById(edge.store.data.source.cell);
      targeNode.removeAttrs('targetPort');
      sourceNode.removeAttrs('sourcePort');
      sourceNode.removeAttrs('associated');
      targeNode.removeAttrs('associated');
      edge.setAttrs({
        line: {
          stroke: '#ddd',
        },
      });
      edge.setLabels(
        edge.getLabels().map((v) => {
          return {
            ...v,
            attrs: {
              labelText: {
                ...v.attrs.labelText,
                fill: 'rgba(0, 0, 0, 0.3)',
              },
              labelBody: {
                ...v.attrs.labelBody,
                stroke: '#ddd',
              },
            },
          };
        }),
      );
    });
    targetGraph.on('node:moved', ({ e, node }) => {
      const connectEdges = targetGraph.getConnectedEdges(node);
      const currentPosition = node.position();
      const oldPosition = targetGraph.positions.find((v) => v.collectionName === node.store.data.name);
      e.stopPropagation();
      if (oldPosition) {
        (oldPosition.x !== currentPosition.x || oldPosition.y !== currentPosition.y) &&
          useUpdatePositionAction({
            collectionName: node.store.data.name,
            ...currentPosition,
          });
      } else {
        useSaveGraphPositionAction({
          collectionName: node.store.data.name,
          ...currentPosition,
        });
      }
      connectEdges.forEach((edge) => {
        optimizeEdge(edge);
      });
    });
  };
  // 首次渲染
  const renderInitGraphCollection = (rawData) => {
    const { nodesData, edgesData } = formatData(rawData);
    targetGraph.clearCells();
    getNodes(nodesData);
    getEdges(edgesData);
    layout(useSaveGraphPositionAction);
  };

  // 增量渲染
  const renderDiffGraphCollection = (rawData) => {
    const { positions }: any = targetGraph;
    const { nodesData, edgesData } = formatData(rawData);
    const currentNodes = targetGraph.getNodes().map((v) => v.store.data);
    const currentEdges = targetGraph.getEdges().map((v) => v.store.data);
    const diffNodes = getDiffNode(nodesData, currentNodes, targetNode);
    const diffEdges = getDiffEdge(edgesData, currentEdges);
    diffNodes.forEach(({ status, node, port }) => {
      const updateNode = targetGraph.getCellById(node.id);
      switch (status) {
        case 'add':
          //@ts-ignore
          const maxY = maxBy(positions, 'y').y;
          const yNodes = positions.filter((v) => {
            return v.y === maxY;
          });
          let referenceNode: any = maxBy(yNodes, 'x');
          let position;
          if (referenceNode.x > 4500) {
            referenceNode = minBy(yNodes, 'x');
            position = { x: referenceNode.x, y: referenceNode.y + 400 };
          } else {
            position = { x: referenceNode.x + 350, y: referenceNode.y };
          }
          targetNode = targetGraph.addNode({
            ...node,
            position,
          });
          useSaveGraphPositionAction({
            collectionName: node.name,
            ...position,
          });
          targetGraph && targetGraph.positionCell(targetNode, 'top', { padding: 200 });
          break;
        case 'insertPort':
          updateNode.insertPort(port.index, port.port);
          break;
        case 'deletePort':
          updateNode.removePort(port.id);
          break;
        case 'updateNode':
          updateNode.setProp({ title: node.title });
          break;
        case 'delete':
          targetGraph.removeCell(node.id);
        default:
          return null;
      }
    });
    const renderDiffEdges = (data) => {
      data.forEach(({ status, edge }) => {
        switch (status) {
          case 'add':
            const newEdge = targetGraph.addEdge({
              ...edge,
            });
            optimizeEdge(newEdge);
            break;
          case 'delete':
            targetGraph.removeCell(edge.id);
            break;
          default:
            return null;
        }
      });
    };
    setTimeout(() => {
      renderDiffEdges(diffEdges);
    });
  };

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
    const nodes = targetGraph.getNodes();
    let visibleNode = [];
    if (value) {
      visibleNode.push(value.key);
      if (targetNode && typeof targetNode !== 'string') {
        targetNode.removeAttrs();
      }
      targetNode = targetGraph.getCellById(value.key);
      const connectEdges = targetGraph.getConnectedEdges(targetNode);
      connectEdges.map((v) => {
        visibleNode.push(v.getSourceCellId());
        visibleNode.push(v.getTargetCellId());
      });
      // 定位到目标节点
      targetGraph.positionCell(targetNode, 'top-left', { padding: 200 });
      targetNode.setAttrs({
        boxShadow: '0 1px 2px -2px rgb(0 0 0 / 16%), 0 3px 6px 0 rgb(0 0 0 / 12%), 0 5px 12px 4px rgb(0 0 0 / 9%)',
      });
    } else {
      targetGraph.positionCell(nodes[0], 'top-left', { padding: 100 });
    }
    targetGraph.unfreeze();
    nodes.map((v) => {
      if (value && !uniq(visibleNode).includes(v.id)) {
        v.hide();
      } else {
        v.show();
      }
    });
  };

  useLayoutEffect(() => {
    initGraphCollections();
    return () => {
      targetGraph.off('edge:mouseover');
      targetGraph.off('edge:mouseout');
      targetGraph.off('node:moved');
      targetGraph = null;
      targetNode = null;
    };
  }, []);

  useEffect(() => {
    refreshPositions().then(() => {
      refreshGM();
    });
  }, []);
  return (
    <Layout>
      <div className={cx(graphCollectionContainerClass)}>
        <CollectionManagerProvider collections={targetGraph?.collections} refreshCM={refreshGM}>
          <CollapsedContext.Provider value={{ collectionList, handleSearchCollection }}>
            <div className={cx(collectionListClass)}>
              <SchemaComponent
                schema={{
                  type: 'void',
                  properties: {
                    block1: {
                      type: 'void',
                      'x-collection': 'collections',
                      'x-decorator': 'ResourceActionProvider',
                      'x-decorator-props': {
                        collection,
                        request: {
                          resource: 'collections',
                          action: 'list',
                          params: {
                            pageSize: 50,
                            filter: {
                              inherit: false,
                            },
                            sort: ['sort'],
                            appends: [],
                          },
                        },
                      },
                      properties: {
                        actions: {
                          type: 'void',
                          'x-component': 'ActionBar',
                          'x-component-props': {
                            style: {
                              fontSize: 16,
                            },
                          },
                          properties: {
                            create: {
                              type: 'void',
                              'x-component': 'Action',
                              'x-component-props': {
                                type: 'primary',
                                icon: 'PlusOutlined',
                              },
                              properties: {
                                drawer: {
                                  type: 'void',
                                  title: '{{ t("Create collection") }}',
                                  'x-component': 'Action.Drawer',
                                  'x-component-props': {
                                    getContainer: () => {
                                      return document.getElementById('graph_container');
                                    },
                                  },
                                  'x-decorator': 'Form',
                                  'x-decorator-props': {
                                    useValues: '{{ useCollectionValues }}',
                                  },
                                  properties: {
                                    title: {
                                      'x-component': 'CollectionField',
                                      'x-decorator': 'FormItem',
                                    },
                                    name: {
                                      'x-component': 'CollectionField',
                                      'x-decorator': 'FormItem',
                                      'x-validator': 'uid',
                                    },
                                    footer: {
                                      type: 'void',
                                      'x-component': 'Action.Drawer.Footer',
                                      properties: {
                                        action1: {
                                          title: '{{ t("Cancel") }}',
                                          'x-component': 'Action',
                                          'x-component-props': {
                                            useAction: '{{ cm.useCancelAction }}',
                                          },
                                        },
                                        action2: {
                                          title: '{{ t("Submit") }}',
                                          'x-component': 'Action',
                                          'x-component-props': {
                                            type: 'primary',
                                            useAction: '{{ useCreateActionAndRefreshCM }}',
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                            fullScreen: {
                              type: 'void',
                              'x-component': 'Action',
                              'x-component-props': {
                                component: forwardRef(() => {
                                  const [isFullscreen, { toggleFullscreen }] = useFullscreen(
                                    document.getElementById('graph_container'),
                                  );
                                  return (
                                    <Tooltip title={t('Full Screen')} getPopupContainer={getPopupContainer}>
                                      <Button
                                        onClick={() => {
                                          toggleFullscreen();
                                        }}
                                      >
                                        {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                                      </Button>
                                    </Tooltip>
                                  );
                                }),
                                useAction: () => {
                                  return {
                                    run() {},
                                  };
                                },
                              },
                            },
                            collectionList: {
                              type: 'void',
                              'x-component': () => {
                                const { handleSearchCollection, collectionList } = useContext(CollapsedContext);
                                const [selectedKeys, setSelectKey] = useState([]);
                                const content = (
                                  <div>
                                    <Input
                                      style={{ margin: '4px 0' }}
                                      bordered={false}
                                      placeholder={t('Collection Search')}
                                      onChange={handleSearchCollection}
                                    />
                                    <Menu
                                      selectedKeys={selectedKeys}
                                      selectable={true}
                                      className={css`
                                        .ant-menu-item {
                                          height: 32px;
                                          line-height: 32px;
                                        }
                                      `}
                                      style={{ maxHeight: '70vh', overflowY: 'auto', border: 'none' }}
                                    >
                                      <Menu.Divider />
                                      {collectionList.map((v) => {
                                        return (
                                          <Menu.Item
                                            key={v.key}
                                            onClick={(e: any) => {
                                              if (e.key !== selectedKeys[0]) {
                                                setSelectKey([e.key]);
                                                handleSelectCollection(e);
                                              } else {
                                                handleSelectCollection(false);
                                                setSelectKey([]);
                                              }
                                            }}
                                          >
                                            <span>{compile(v.title)}</span>
                                          </Menu.Item>
                                        );
                                      })}
                                    </Menu>
                                  </div>
                                );
                                return (
                                  <Popover
                                    content={content}
                                    autoAdjustOverflow
                                    placement="bottomRight"
                                    trigger={['click']}
                                    getPopupContainer={getPopupContainer}
                                    overlayClassName={css`
                                      .ant-popover-inner-content {
                                        padding: 0;
                                      }
                                    `}
                                  >
                                    <Button>
                                      <MenuOutlined />
                                    </Button>
                                  </Popover>
                                );
                              },
                              'x-component-props': {
                                icon: 'MenuOutlined',
                                useAction: () => {
                                  return {
                                    run() {},
                                  };
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                }}
                scope={{
                  useCreateActionAndRefreshCM: () => useCreateActionAndRefreshCM(setTargetNode),
                }}
              />
            </div>
          </CollapsedContext.Provider>
          <div id="container" style={{ width: '100vw', height: '100vh' }}></div>
        </CollectionManagerProvider>
      </div>
    </Layout>
  );
});
