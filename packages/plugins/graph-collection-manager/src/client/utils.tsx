import { uid } from '@formily/shared';

const shape = {
  ER: 'er-rect',
  EDGE: 'edge',
};

export const formatData = (data) => {
  const edgeData = [];
  const targetTablekeys = [];
  const tableData = data.map((item, index) => {
    const ports = [];
    item.fields.forEach((field) => {
      edgeData.push(field);
      field.uiSchema &&
        ports.push({
          id: field.key,
          name: field.name,
          group: 'list',
          ...field,
        });
    });
    targetTablekeys.push(item.name);
    return {
      id: item.key,
      shape: shape.ER,
      name: item.name,
      title: item.title,
      width: 250,
      ports,
      item: item,
    };
  });
  const edges = formatEdgeData(edgeData, targetTablekeys, tableData);
  return { nodes: tableData, edges };
};

const formatEdgeData = (data, targetTables, tableData) => {
  const edges = [];
  for (let i = 0; i < data.length; i++) {
    if (
      targetTables.includes(data[i].target) &&
      ['obo', 'oho', 'o2o', 'o2m', 'm2o', 'm2m', 'linkTo'].includes(data[i].interface)
    ) {
      const targetTable = tableData.find((v) => v.name === data[i].target);
      const sourceTable = tableData.find((v) => v.name === data[i].collectionName);
      const commonAttrs = {
        attrs: {
          line: {
            strokeWidth: 1,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            stroke: '#ddd',
            sourceMarker: null,
            targetMarker: null,
          },
        },
        router:
          sourceTable.id === targetTable.id
            ? {
                name: 'oneSide',
                args: {
                  side: 'left',
                },
              }
            : {
                name: 'er',
                args: {
                  direction: 'H',
                },
              },
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
                fill: 'rgba(0, 0, 0, 0.3)',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
              },
              labelBody: {
                ref: 'labelText',
                refWidth: '100%',
                refHeight: '100%',
                stroke: '#ddd',
                fill: '#f0f2f5',
                strokeWidth: 1,
                rx: 10,
                ry: 10,
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
                fill: 'rgba(0, 0, 0, 0.3)',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
              },
              labelBody: {
                ref: 'labelText',
                refWidth: '100%',
                refHeight: '100%',
                stroke: '#ddd',
                fill: '#f0f2f5',
                rx: 10,
                ry: 10,
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
      };
      if (['m2m', 'linkTo'].includes(data[i].interface)) {
        const throughTable = tableData.find((v) => v.name === data[i].through);
        throughTable &&
          edges.push({
            id: uid(),
            source: {
              cell: sourceTable.id,
              port: sourceTable.ports.find((v) => v.name === data[i].sourceKey)?.id,
              anchor: {
                name: 'right',
              },
            },
            target: {
              cell: throughTable.id,
              port: throughTable.ports.find((v) => v.name === data[i].foreignKey)?.id,
              anchor: {
                name: 'left',
              },
            },
            ...commonAttrs,
          });
        throughTable &&
          edges.push({
            id: uid(),
            source: {
              cell: targetTable.id,
              port: targetTable.ports.find((v) => v.name === data[i].targetKey)?.id,
              anchor: {
                name: 'right',
              },
            },
            target: {
              cell: throughTable.id,
              port: throughTable.ports.find((v) => v.name === data[i].otherKey)?.id,
              anchor: {
                name: 'left',
              },
            },
            ...commonAttrs,
          });
      } else {
        const isLegalEdge = tableData
          .find((v) => v.name == data[i].collectionName)
          .ports.find((v) => v.name === data[i].foreignKey);
        isLegalEdge &&
          edges.push({
            id: uid(),
            source: {
              cell: sourceTable.id,
              port: isLegalEdge.id,
              anchor: {
                name: 'right',
              },
            },
            target: {
              cell: targetTable.id,
              port: targetTable.ports.find((v) => v.name === data[i].targetKey)?.id,
              anchor: {
                name: 'left',
              },
            },
            ...commonAttrs,
          });
        sourceTable.ports.find((v) => v.name === data[i].sourceKey)?.id &&
          targetTable.ports.find((v) => v.name === data[i].foreignKey)?.id &&
          edges.push({
            id: uid(),
            source: {
              cell: sourceTable.id,
              port: sourceTable.ports.find((v) => v.name === data[i].sourceKey)?.id,
              anchor: {
                name: 'right',
              },
            },
            target: {
              cell: targetTable.id,
              port: targetTable.ports.find((v) => v.name === data[i].foreignKey)?.id,
              anchor: {
                name: 'left',
              },
            },
            ...commonAttrs,
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
      return ['1', 'N'];
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
