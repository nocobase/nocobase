import { uid } from '@formily/shared';
const shape = {
  ER: 'er-rect',
  EDGE: 'edge',
};

export const formatData = (data) => {
  console.log(data);
  const edgeData = [];
  const targetTablekeys = [];
  const tableData = data.map((item, index) => {
    const ports = item.fields.map((field) => {
      edgeData.push(field);
      return {
        id: field.key,
        group: 'list',
        attrs: {
          portNameLabel: {
            text: field.name,
            fill:''
          },
          portTypeLabel: {
            text: field.type || field.interface,
          },
        },
      };
    });
    targetTablekeys.push(item.name);
    return {
      id: item.key,
      shape: shape.ER,
      label: item.name,
      width: 170,
      height: 24,
      ports,
    };
  });
  const edges = formatEdgeData(edgeData, targetTablekeys, tableData);
  console.log([...tableData, ...edges]);
  return { nodes: tableData, edges };
};

const formatEdgeData = (data, targetTables, tableData) => {
  const edges = [];
  for (let i = 0; i < data.length; i++) {
    if (
      targetTables.includes(data[i].target) &&
      ['obo', 'oho', 'o2o', 'o2m', 'm2o', 'm2m', 'linkTo'].includes(data[i].interface)
    ) {
      const targetTable = tableData.find((v) => v.label === data[i].target);
      const sourceTable = tableData.find((v) => v.label === data[i].collectionName);
      if (data[i].interface === 'm2m') {
        const throughTable = tableData.find((v) => v.label === data[i].through);
        throughTable &&
          edges.push({
            id: uid(),
            shape: shape.EDGE,
            source: {
              cell: sourceTable.id,
              port: sourceTable.ports.find((v) => v.attrs.portNameLabel.text === data[i].sourceKey).id,
            },
            target: {
              cell: throughTable.id,
              port: throughTable.ports.find((v) => v.attrs.portNameLabel.text === data[i].foreignKey).id,
            },
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 1,
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
              },
            },
            connector: 'rounded',
            router: 'metro',
            labels: [
              {
                markup: [
                  {
                    tagName: 'ellipse',
                    selector: 'labelBody',
                  },
                  {
                    tagName: 'text',
                    selector: 'labelText',
                  },
                ],
                attrs: {
                  labelText: {
                    text: '1',
                    fill: '#ffa940',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                  },
                  labelBody: {
                    ref: 'labelText',
                    refWidth: '100%',
                    refHeight: '100%',
                    stroke: '#ffa940',
                    fill: '#fff',
                    strokeWidth: 1,
                    rx: 15,
                    ry: 15,
                  },
                },
                position: {
                  distance: 0.3,
                  args: {
                    keepGradient: true,
                    ensureLegibility: true,
                  },
                },
              },
              {
                markup: [
                  {
                    tagName: 'ellipse',
                    selector: 'labelBody',
                  },
                  {
                    tagName: 'text',
                    selector: 'labelText',
                  },
                ],
                attrs: {
                  labelText: {
                    text: 'N',
                    fill: '#ffa940',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                  },
                  labelBody: {
                    ref: 'labelText',
                    refWidth: '100%',
                    refHeight: '100%',
                    stroke: '#ffa940',
                    fill: '#fff',
                    rx: 15,
                    ry: 15,
                    strokeWidth: 1,
                  },
                },
                position: {
                  distance: 0.7,
                  args: {
                    keepGradient: true,
                    ensureLegibility: true,
                  },
                },
              },
            ],
          });
      } else {
        const legalEdge = tableData
          .find((v) => v.label == data[i].collectionName)
          .ports.find((v) => v.attrs.portNameLabel.text === data[i].foreignKey);
        legalEdge &&
          edges.push({
            id: uid(),
            shape: shape.EDGE,
            source: {
              cell: sourceTable.id,
              port: legalEdge.id,
            },
            target: {
              cell: targetTable.id,
              port: targetTable.ports.find((v) => v.attrs.portNameLabel.text === data[i].targetKey).id,
            },
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 1,
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
              },
            },
            connector: 'rounded',
            router:
              sourceTable.id === targetTable.id
                ? {
                    name: 'oneSide',
                    args: {
                      side: 'right',
                    },
                  }
                : 'metro',
            labels: [
              {
                markup: [
                  {
                    tagName: 'ellipse',
                    selector: 'labelBody',
                  },
                  {
                    tagName: 'text',
                    selector: 'labelText',
                  },
                ],
                attrs: {
                  labelText: {
                    text: getRelationship(data[i].interface)[0],
                    fill: '#ffa940',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                  },
                  labelBody: {
                    ref: 'labelText',
                    refWidth: '100%',
                    refHeight: '100%',
                    stroke: '#ffa940',
                    fill: '#fff',
                    strokeWidth: 1,
                    rx: 15,
                    ry: 15,
                  },
                },
                position: {
                  distance: 0.3,
                  args: {
                    keepGradient: true,
                    ensureLegibility: true,
                  },
                },
              },
              {
                markup: [
                  {
                    tagName: 'ellipse',
                    selector: 'labelBody',
                  },
                  {
                    tagName: 'text',
                    selector: 'labelText',
                  },
                ],
                attrs: {
                  labelText: {
                    text: getRelationship(data[i].interface)[1],
                    fill: '#ffa940',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                  },
                  labelBody: {
                    ref: 'labelText',
                    refWidth: '100%',
                    refHeight: '100%',
                    stroke: '#ffa940',
                    fill: '#fff',
                    rx: 15,
                    ry: 15,
                    strokeWidth: 1,
                  },
                },
                position: {
                  distance: 0.7,
                  args: {
                    keepGradient: true,
                    ensureLegibility: true,
                  },
                },
              },
            ],
          });
      }
    }
  }
  return edges;
};

const getRelationship = (relatioship) => {
  switch (relatioship) {
    case 'm2m':
    case 'linkTo':
      return ['N', 'N'];
    case 'o2m':
      return ['1', 'N'];
    case 'm2o':
      return ['N', '1'];
    case 'obo':
    case 'oho':
      return ['1', '1'];
    default:
      return [];
  }
};
