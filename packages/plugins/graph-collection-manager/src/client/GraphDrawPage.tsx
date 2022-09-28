import React, { useLayoutEffect, useRef, useEffect, useContext, createContext } from 'react';
import { Graph, Cell } from '@antv/x6';
import ReactDOM from 'react-dom'
import { Spin } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useRequest } from '@nocobase/client';
import '@antv/x6-react-shape';
import { headClass, tableNameClass, tableBtnClass } from './style';
import { formatData } from './utils';

const LINE_HEIGHT = 24;
const NODE_WIDTH = 170;

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
  if (loading) {
    return <Spin />;
  }
  return <GraphDrawerContext.Provider value={data?.data}>{props.children}</GraphDrawerContext.Provider>;
};

//表格头
class AlgoNode extends React.Component<{ node?: Node }> {
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
          <DeleteOutlined
            onClick={() => {
              console.log('table delete');
            }}
          />
          <EditOutlined
            onClick={() => {
              console.log('table edit ');
            }}
          />
        </div>
      </div>
    );
  }
}

class FieldNode extends React.Component<{ node?: Node }> {
  render() {
    const { node } = this.props;
    const {
      store: {
        data: { label },
      },
    } = node;
    console.log(node);
    return (
      <div>
        <span>{label}</span>
      </div>
    );
  }
}



export const Editor = () => {
  const graph = useRef(null);
  graph.current = null;
  const rawData = useContext(GraphDrawerContext);
  const getCollectionData = () => {
    const collectionData: any[] = formatData(rawData);
    const cells: Cell[] = [];
    collectionData.forEach((item: any) => {
      if (item.shape === 'edge') {
        cells.push(graph.current.createEdge(item));
      } else {
        cells.push(graph.current.createNode(item));
      }
    });
    graph.current.resetCells(cells);
    graph.current.zoomToFit({ padding: 10, maxScale: 1 });
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

  return <div id="container" style={{ width: '100%', height: '800px' }}></div>;
};
