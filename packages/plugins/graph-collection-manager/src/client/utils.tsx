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
      field.uiSchema&&ports.push({
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
      width: 210,
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
      console.log(data[i])
      const commonAttrs = {
        attrs: {
          line: {
            strokeWidth: 1,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            stroke: 'rgb(201 205 212)',
          },
        },
        connector: { name: 'smooth' },
        router:
          sourceTable.id === targetTable.id
            ? {
                name: 'oneSide',
                args: {
                  side: 'left',
                },
              }
            : {
                name: 'metro',
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
      const anchor = {
        anchor: 'center',
        direction: 'v',
      };
      if (data[i].interface === 'm2m') {
        const throughTable = tableData.find((v) => v.name === data[i].through);
        throughTable &&
          edges.push({
            id: uid(),
            source: {
              cell: sourceTable.id,
              port: sourceTable.ports.find((v) => v.name === data[i].sourceKey).id,
              ...anchor,
            },
            target: {
              cell: throughTable.id,
              port: throughTable.ports.find((v) => v.name === data[i].foreignKey).id,
              ...anchor,
            },
            ...commonAttrs,
          });
      } else {
        const legalEdge = tableData
          .find((v) => v.name == data[i].collectionName)
          .ports.find((v) => v.name === data[i].foreignKey);
        legalEdge &&
          edges.push({
            id: uid(),
            source: {
              cell: sourceTable.id,
              port: legalEdge.id,
              ...anchor,
            },
            target: {
              cell: targetTable.id,
              port: targetTable.ports.find((v) => v.name === data[i].targetKey)?.id,
              ...anchor,
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
