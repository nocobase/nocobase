import React, { useLayoutEffect, useRef, useEffect, useContext, createContext } from 'react';
import { Graph, Cell, Shape } from '@antv/x6';
import { Spin } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useRequest } from '@nocobase/client';
import '@antv/x6-react-shape';
import { headClass, tableNameClass,tableBtnClass } from './style';

const LINE_HEIGHT = 24;
const NODE_WIDTH = 150;
const data = [
  {
    id: '1',
    shape: 'er-rect',
    label: '学生',
    width: 150,
    height: 24,
    position: {
      x: 24,
      y: 150,
    },
    ports: [
      {
        id: '1-1',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'ID',
          },
          portTypeLabel: {
            text: 'STRING',
          },
        },
      },
      {
        id: '1-2',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'Name',
          },
          portTypeLabel: {
            text: 'STRING',
          },
        },
      },
      {
        id: '1-3',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'Class',
          },
          portTypeLabel: {
            text: 'NUMBER',
          },
        },
      },
      {
        id: '1-4',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'Gender',
          },
          portTypeLabel: {
            text: 'BOOLEAN',
          },
        },
      },
    ],
  },
  {
    id: '2',
    shape: 'er-rect',
    label: '课程',
    width: 150,
    height: 24,
    position: {
      x: 250,
      y: 210,
    },
    ports: [
      {
        id: '2-1',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'ID',
          },
          portTypeLabel: {
            text: 'STRING',
          },
        },
      },
      {
        id: '2-2',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'Name',
          },
          portTypeLabel: {
            text: 'STRING',
          },
        },
      },
      {
        id: '2-3',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'StudentID',
          },
          portTypeLabel: {
            text: 'STRING',
          },
        },
      },
      {
        id: '2-4',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'TeacherID',
          },
          portTypeLabel: {
            text: 'STRING',
          },
        },
      },
      {
        id: '2-5',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'Description',
          },
          portTypeLabel: {
            text: 'STRING',
          },
        },
      },
    ],
  },
  {
    id: '3',
    shape: 'er-rect',
    label: '老师',
    width: 150,
    height: 24,
    position: {
      x: 480,
      y: 350,
    },
    ports: [
      {
        id: '3-1',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'ID',
          },
          portTypeLabel: {
            text: 'STRING',
          },
        },
      },
      {
        id: '3-2',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'Name',
          },
          portTypeLabel: {
            text: 'STRING',
          },
        },
      },
      {
        id: '3-3',
        group: 'list',
        attrs: {
          portNameLabel: {
            text: 'Age',
          },
          portTypeLabel: {
            text: 'NUMBER',
          },
        },
      },
    ],
  },
  {
    id: '4',
    shape: 'edge',
    source: {
      cell: '1',
      port: '1-1',
    },
    target: {
      cell: '2',
      port: '2-3',
    },
    labels: 'true',
    attrs: {
      line: {
        stroke: '#A2B1C3',
        strokeWidth: 1,
      },
      text: {
        text: '1:N',
      },
    },
    connector: 'rounded',
    zIndex: 0,
  },
  {
    id: '5',
    shape: 'edge',
    labels: 'true',
    source: {
      cell: '3',
      port: '3-1',
    },
    target: {
      cell: '2',
      port: '2-4',
    },
    connector: 'rounded',
    attrs: {
      line: {
        stroke: '#A2B1C3',
        strokeWidth: 1,
      },
      text: { text: 'N:1' },
    },
    zIndex: 0,
  },
];

export const GraphDrawerContext = createContext(null);

export const GraphDrawerProver: React.FC = (props) => {
  const { data, loading } = useRequest({
    resource: 'collections',
    action: 'list',
    params: {
      paginate: false,
      appends: ['fields', 'fields.uiSchema'],
    },
  });
  //   console.log(data);
  if (loading) {
    return <Spin />;
  }
  return <GraphDrawerContext.Provider value={data?.data}>{props.children}</GraphDrawerContext.Provider>;
};

export class AlgoNode extends React.Component<{ node?: Node }> {
  shouldComponentUpdate() {
    const { node } = this.props;
    if (node) {
      if (node.hasChanged('data')) {
        return true;
      }
    }
    return false;
  }

  render() {
    const { node } = this.props;
    const {
      store: {
        data: { label },
      },
    } = node;
    return (
      <div className={headClass}>
        <span className={tableNameClass}>{label}</span>
        <div className={tableBtnClass}>
          <DeleteOutlined  onClick={()=>{console.log('table delete')}}/>
          <EditOutlined  onClick={()=>{
            console.log('table edit ')
          }}/>
        </div>
      </div>
    );
  }
}

export const Editor = () => {
  console.log(useContext(GraphDrawerContext));
  const graph = useRef(null);
  graph.current = null;
  const getCollectionData = () => {
    const cells: Cell[] = [];
    data.forEach((item: any) => {
      if (item.shape === 'edge') {
        cells.push(graph.current.createEdge(item));
      } else {
        cells.push(graph.current.createNode(item));
      }
    });
    graph.current.resetCells(cells);
    graph.current.zoomToFit({ padding: 10, maxScale: 1 });
    setup();
  };

  useLayoutEffect(() => {
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
        component: <AlgoNode />,
        // markup: [
        //   {
        //     tagName: 'rect',
        //     selector: 'body',
        //   },
        //   {
        //     tagName: 'text',
        //     selector: 'label',
        //   },
        //   {
        //     tagName: 'g',
        //     attrs: {
        //       class: 'btn del',
        //     },
        //     children: [
        //       {
        //         tagName: 'circle',
        //         attrs: {
        //           class: 'del',
        //         },
        //       },
        //       {
        //         tagName: 'text',
        //         attrs: {
        //           class: 'del',
        //         },
        //       },
        //     ],
        //   },
        //   {
        //     tagName: 'g',
        //     attrs: {
        //       class: 'btn edit',
        //     },
        //     children: [
        //       {
        //         tagName: 'circle',
        //         attrs: {
        //           class: 'edit',
        //         },
        //       },
        //       {
        //         tagName: 'text',
        //         attrs: {
        //           class: 'edit',
        //         },
        //       },
        //     ],
        //   },
        // ],
        // attrs: {
        //   rect: {
        //     strokeWidth: 1,
        //     stroke: '#5F95FF',
        //     fill: '#5F95FF',
        //   },
        //   label: {
        //     fontWeight: 'bold',
        //     fill: '#ffffff',
        //     fontSize: 12,
        //   },
        // },
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
    const myGraph = new Graph({
      container: document.getElementById('container')!,
      //   minimap:true,
      panning: true,
      scroller: {
        enabled: !0,
        pageVisible: !1,
        pageBreak: !1,
        pannable: !0,
      },
      autoResize: true,
      selecting: false,
      connecting: {
        connector: {
          name: 'rounded',
        },
        router: {
          name: 'er',
          args: {
            offset: 25,
            direction: 'H',
          },
        },
      },
      snapline: {
        enabled: !0,
      },
      keyboard: {
        enabled: !0,
      },
      clipboard: {
        enabled: !0,
      },
    });
    myGraph.centerContent();
    myGraph.disableSelection();
    graph.current = myGraph;
  }, []);

  //监听数据，实时更新并渲染
  useEffect(() => {
    graph.current && getCollectionData();
  }, [graph.current]);

  // 监听自定义事件
  const setup = () => {
    graph.current.on('node:edit', ({ e, node }) => {
      e.stopPropagation();
      console.log('edit');
    });

    graph.current.on('node:delete', ({ e, node }) => {
      e.stopPropagation();
      console.log('delete');
    });
  };

  return <div id="container" style={{ width: '100%', height: '800px' }}></div>;
};
