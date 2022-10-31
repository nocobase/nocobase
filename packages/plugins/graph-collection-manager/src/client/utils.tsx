import { uniqBy } from 'lodash';
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
      ['obo', 'oho', 'o2o', 'o2m', 'm2o', 'm2m', 'linkTo'].includes(field.interface) && edgeData.push(field);
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
  return { nodesData: tableData, edgesData: edges };
};

const formatEdgeData = (data, targetTables, tableData) => {
  const edges = [];
  for (let i = 0; i < data.length; i++) {
    if (targetTables.includes(data[i].target)) {
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
      const isuniq = (id) => {
        const targetEdge = edges.find((v) => v.id === id);
        if (targetEdge) {
          targetEdge.associated.push(data[i].name);
          return false;
        }
        return true;
      };
      if (['m2m', 'linkTo'].includes(data[i].interface)) {
        const throughTable = tableData.find((v) => v.name === data[i].through);
        if (throughTable) {
          const sCellId1 = sourceTable.id;
          const tCellId1 = throughTable.id;
          const sPortId1 = sourceTable.ports.find((v) => v.name === data[i].sourceKey)?.id;
          const tPortId1 = throughTable.ports.find((v) => v.name === data[i].foreignKey)?.id;
          const sCellId2 = targetTable.id;
          const tCellId2 = throughTable.id;
          const sPortId2 = targetTable.ports.find((v) => v.name === data[i].targetKey)?.id;
          const tPortId2 = throughTable.ports.find((v) => v.name === data[i].otherKey)?.id;
          const id1 = sCellId1 + sPortId1 + tCellId1 + tPortId1;
          const id2 = sCellId2 + sPortId2 + tCellId2 + tPortId2;
          edges.push({
            id: id1,
            source: {
              cell: sCellId1,
              port: sPortId1,
              anchor: {
                name: 'right',
              },
            },
            target: {
              cell: tCellId1,
              port: tPortId1,
              anchor: {
                name: 'left',
              },
            },
            ...commonAttrs,
          });
          edges.push({
            id: id2,
            source: {
              cell: sCellId2,
              port: sPortId2,
              anchor: {
                name: 'right',
              },
            },
            target: {
              cell: tCellId2,
              port: tPortId2,
              anchor: {
                name: 'left',
              },
            },
            ...commonAttrs,
          });
        }
      } else {
        const isLegalEdge = tableData
          .find((v) => v.name == data[i].collectionName)
          .ports.find((v) => v.name === data[i].foreignKey);
        const sCellId1 = sourceTable.id;
        const tCellId1 = targetTable.id;
        const sPortId1 = isLegalEdge?.id;
        const tPortId1 = targetTable.ports.find((v) => v.name === data[i].targetKey)?.id;
        const sCellId2 = sourceTable.id;
        const tCellId2 = targetTable.id;
        const sPortId2 = sourceTable.ports.find((v) => v.name === data[i].sourceKey)?.id;
        const tPortId2 = targetTable.ports.find((v) => v.name === data[i].foreignKey)?.id;
        const id1 = sCellId1 + sPortId1 + tCellId1 + tPortId1;
        const id2 = sCellId2 + sPortId2 + tCellId2 + tPortId2;
        isuniq(tCellId1 + tPortId1 + sCellId1 + sPortId1) &&
          isLegalEdge &&
          tPortId1 &&
          edges.push({
            id: id1,
            source: {
              cell: sCellId1,
              port: sPortId1,
              anchor: {
                name: 'right',
              },
            },
            target: {
              cell: tCellId1,
              port: tPortId1,
              anchor: {
                name: 'left',
              },
            },
            associated: [data[i].name],
            ...commonAttrs,
          });
        isuniq(tCellId2 + tPortId2 + sCellId2 + sPortId2) &&
          sPortId2 &&
          tPortId2 &&
          edges.push({
            id: id2,
            source: {
              cell: sCellId2,
              port: sPortId2,
              anchor: {
                name: 'right',
              },
            },
            target: {
              cell: tCellId2,
              port: tPortId2,
              anchor: {
                name: 'left',
              },
            },
            associated: [data[i].name],
            ...commonAttrs,
          });
      }
    }
  }
  return uniqBy(edges, 'id');
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

export const getDiffNode = (newNodes, oldNodes, targetNode) => {
  let arr = [];
  const length1 = newNodes.length;
  const length2 = oldNodes.length;
  for (let i = 0; i < length1; i++) {
    if (!oldNodes.find((v) => v.id === newNodes[i].id)) {
      arr.push({
        status: 'add',
        node: newNodes[i],
      });
    } else {
      const oldNode = oldNodes.find((v) => v.id === newNodes[i].id);
      const oldPorts = oldNode?.ports.items;
      const newPorts = newNodes[i].ports;
      if (oldNode) {
        for (let h = 0; h < newPorts.length; h++) {
          if (!oldPorts.find((v) => v.id === newPorts[h].id)) {
            arr.push({
              status: 'insertPort',
              node: newNodes[i],
              port: { index: h, port: newPorts[h] },
            });
          }
        }
        for (let k = 0; k < oldPorts.length; k++) {
          if (!newPorts.find((v) => v.id === oldPorts[k].id)) {
            arr.push({
              status: 'deletePort',
              node: newNodes[i],
              port: oldPorts[k],
            });
          }
        }

        if (oldNode.title !== newNodes[i].title) {
          arr.push({
            status: 'updateNode',
            node: newNodes[i],
          });
        }
      }
    }
  }
  for (let i = 0; i < length2; i++) {
    if (!newNodes.find((v) => v.id === oldNodes[i].id)) {
      arr.push({
        status: 'delete',
        node: oldNodes[i],
      });
    }
  }
  return arr;
};

export const getDiffEdge = (newEdges, oldEdges) => {
  const length1 = newEdges.length;
  const length2 = oldEdges.length;
  const edges = [];
  for (let i = 0; i < length1; i++) {
    if (!oldEdges.find((v) => v.id === newEdges[i].id)) {
      edges.push({
        status: 'add',
        edge: newEdges[i],
      });
    }
  }
  for (let i = 0; i < length2; i++) {
    if (!newEdges.find((v) => v.id === oldEdges[i].id)) {
      edges.push({
        status: 'delete',
        edge: oldEdges[i],
      });
    }
  }
  return edges;
};
