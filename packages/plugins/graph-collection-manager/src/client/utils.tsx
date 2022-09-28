import { uid } from '@formily/shared';
const shape = {
  ER: 'er-rect',
  EDGE: 'edge',
};

export const formatData = (data) => {
  const edgeData = [];
  const targetTablekeys = [];
  const tableData = data.map((item, index) => {
    const ports = item.fields.map((field) => {
      if (['linkTo', 'belongsTo', 'hasMany', 'belongsToMany'].includes(field.type)) {
        edgeData.push(field);
      }
      return {
        id: field.key,
        group: 'list',
        attrs: {
          portNameLabel: {
            text: field.name,
          },
          portTypeLabel: {
            text: field.type || field.interface,
          },
        },
      };
    });
    targetTablekeys.push(item.name);
    return {
      id: index + 1,
      shape: shape.ER,
      label: item.name,
      width: 170,
      height: 24,
      position: {
        x: 24 + 200 * index + 40 * (index + 1),
        y: 170 + 50 * index,
      },
      ports,
    };
  });
  const edges = formatEdgeData(edgeData, targetTablekeys, tableData);
  console.log([...tableData, ...edges]);
  return [...tableData, ...edges];
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
      edges.push({
        id: uid(),
        shape: shape.EDGE,
        source: {
          cell: sourceTable.id,
          port: data[i].key,
        },
        target: {
          cell: targetTable.id,
          port: targetTable.ports.find((v) => v.attrs.portNameLabel.text === data[i].targetKey).id,
        },
        // labels: 'true',
        attrs: {
          line: {
            stroke: '#A2B1C3',
            strokeWidth: 1,
            textAnchor: "middle",
            textVerticalAnchor: "middle"
          },
        },
        connector: 'rounded',
        zIndex: 0,
        labels: [
            // label1
            {
              markup: [
                {
                  tagName: 'rect',
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
                  refX: -8,
                  refY: -5,
                  refWidth: '100%',
                  refHeight: '100%',
                  refWidth2: 16,
                  refHeight2: 10,
                  stroke: '#ffa940',
                  fill: '#fff',
                  strokeWidth: 1,
                  rx: 5,
                  ry: 5,
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
            // label 2
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
                  fill: '#31d0c6',
                  textAnchor: 'middle',
                  textVerticalAnchor: 'middle',
                },
                labelBody: {
                  ref: 'labelText',
                  refRx: '80%',
                  refRy: '80%',
                  stroke: '#31d0c6',
                  fill: '#fff',
                  strokeWidth: 1,
                },
              },
              position: {
                distance: 0.7,
                angle: 45,
              },
            },
          ],
      });
    }
  }
  return edges;
};

const getRelationship = (relatioship) => {
  switch (relatioship) {
    case 'm2m':
    case 'linkTo':
      return ['N','N'];
    case 'o2m':
      return ['1','N'];
    case 'm2o':
      return ['N','1'];
    case 'obo':
    case 'oho':
      return['1','1'];
    default:
      return [];
  }
};
