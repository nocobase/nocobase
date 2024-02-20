import lodash from 'lodash';
import { useTranslation } from 'react-i18next';
import { CollectionOptions } from '@nocobase/client';

const { groupBy, reduce, uniq, uniqBy } = lodash;

const shape = {
  ER: 'er-rect',
  EDGE: 'edge',
};

export const useGCMTranslation = () => {
  return useTranslation('graph-collection-manager');
};

export const getInheritCollections = (collections, name) => {
  const parents = [];
  const getParents = (name) => {
    const collection = collections?.find((collection) => collection.name === name);
    if (collection) {
      const { inherits } = collection;
      if (inherits) {
        for (let index = 0; index < inherits.length; index++) {
          const collectionKey = inherits[index];
          parents.push(collectionKey);
          getParents(collectionKey);
        }
      }
    }
    return uniq(parents);
  };

  return getParents(name);
};

export const getChildrenCollections = (collections, name) => {
  const childrens = [];
  const getChildrens = (name) => {
    const inheritCollections = collections.filter((v) => {
      return v.inherits?.includes(name);
    });
    inheritCollections.forEach((v) => {
      const collectionKey = v.name;
      childrens.push(v);
      return getChildrens(collectionKey);
    });
    return childrens;
  };
  return getChildrens(name);
};
export const formatData = (data) => {
  const edgeData = [];
  const targetTablekeys = [];

  const tableData = data.map((item) => {
    const ports = [];
    const totalFields = [...item.fields];
    const inheritCollections = getInheritCollections(data, item.name);
    const inheritedFields = reduce(
      inheritCollections,
      (result, value) => {
        const arr = result;
        const parentFields = data
          .find((k) => k.name === value)
          ?.fields.map((v) => {
            return { ...v, sourceCollectionName: item.name };
          });
        return parentFields ? arr.concat(parentFields) : arr;
      },
      [],
    );
    uniqBy(totalFields.concat(inheritedFields), 'name').forEach((field) => {
      field.uiSchema &&
        ports.push({
          id: field.name,
          group: 'list',
          ...field,
        });
      ['obo', 'oho', 'o2o', 'o2m', 'm2o', 'm2m', 'linkTo'].includes(field.interface) && edgeData.push(field);
    });

    targetTablekeys.push(item.name);
    const portsData = formatPortData(ports);
    return {
      id: item.name,
      shape: shape.ER,
      name: item.name,
      title: item.title,
      width: 250,
      // height: 40 * portsData.initPorts?.length || 40,
      ports: [...(portsData.initPorts || []), ...(portsData.morePorts || [])],
      item: item,
    };
  });
  const edges = formatRelationEdgeData(edgeData, targetTablekeys, tableData);
  const inheritEdges = formatInheritEdgeData(data);
  return { nodesData: tableData, edgesData: edges, inheritEdges };
};

export const formatPortData = (ports) => {
  const portsData = groupBy(ports, (v) => {
    if (
      v.isForeignKey ||
      v.primaryKey ||
      ['obo', 'oho', 'o2o', 'o2m', 'm2o', 'm2m', 'linkTo', 'id'].includes(v.interface)
    ) {
      return 'initPorts';
    } else {
      return 'morePorts';
    }
  });
  return portsData;
};

export const formatInheritEdgeData = (collections) => {
  const commonAttrs = {
    attrs: {
      line: {
        strokeWidth: 1,
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        stroke: '#ddd',
        sourceMarker: null,
      },
    },
    router: {
      name: 'smooth',
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
            style: {
              cursor: 'pointer',
            },
          },
          {
            tagName: 'text',
            selector: 'labelText',
            style: {
              cursor: 'pointer',
            },
          },
        ],
        attrs: {
          labelText: {
            text: 'inherits',
            fill: 'rgba(0, 0, 0, 0.3)',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
          },
          labelBody: {
            ref: 'labelText',
            refWidth: '100%',
            refHeight: '100%',
            fill: 'var(--nb-box-bg)',
          },
        },
        position: {
          distance: 0.5,
          args: {
            keepGradient: true,
            ensureLegibility: true,
          },
        },
      },
    ],
  };
  const inheritEdges = [];
  collections.forEach((v) => {
    const parentCollectonKeys = v.inherits || [];
    if (parentCollectonKeys.length) {
      parentCollectonKeys.forEach((k) => {
        inheritEdges.push({
          id: v.name + k,
          source: {
            cell: v.name,
            connectionPoint: 'rect',
          },
          target: {
            cell: k,
            connectionPoint: 'rect',
          },
          connector: {
            name: 'normal',
            zIndex: 1000,
          },
          connectionType: 'inherited',
          ...commonAttrs,
        });
      });
    }
  });
  return inheritEdges;
};

const formatRelationEdgeData = (data, targetTables, tableData) => {
  const edges = [];
  for (let i = 0; i < data.length; i++) {
    if (targetTables.includes(data[i].target)) {
      const targetTable = tableData.find((v) => v.name === data[i].target);
      const sourceTable = tableData.find((v) => v.name === (data[i].sourceCollectionName || data[i].collectionName));
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
                style: {
                  cursor: 'pointer',
                },
              },
              {
                tagName: 'text',
                selector: 'labelText',
                style: {
                  cursor: 'pointer',
                },
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
                fill: 'var(--nb-box-bg)',
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
                style: {
                  cursor: 'pointer',
                },
              },
              {
                tagName: 'text',
                selector: 'labelText',
                style: {
                  cursor: 'pointer',
                },
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
                fill: 'var(--nb-box-bg)',
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
        connector: {
          name: 'normal',
          zIndex: 1000,
        },
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
            associated: [data[i].name],
            m2m: [id1, id2],
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
            associated: [data[i].name],
            m2m: [id1, id2],
            ...commonAttrs,
          });
        }
      } else {
        const isLegalEdge = tableData
          .find((v) => v.name == (data[i].sourceCollectionName || data[i].collectionName))
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

export const getDiffNode = (newNodes, oldNodes) => {
  const arr = [];
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
  const length2 = oldEdges?.length;
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

let graphContainer;
/**
 * 所有的 getPopupContainer 都需要保证返回的是唯一的 div。React 18 concurrent 下会反复调用该方法
 * 参考：https://ant.design/docs/react/migration-v5-cn#%E5%8D%87%E7%BA%A7%E5%87%86%E5%A4%87
 */
export const getPopupContainer = () => {
  if (graphContainer) {
    return graphContainer;
  }
  return (graphContainer = document.getElementById('graph_container'));
};

export const cleanGraphContainer = () => {
  graphContainer = null;
};

export const collection: CollectionOptions = {
  name: 'collections',
  filterTargetKey: 'name',
  targetKey: 'name',
  sortable: true,
  fields: [
    {
      type: 'integer',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Collection display name") }}',
        type: 'number',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Collection name") }}',
        type: 'string',
        'x-component': 'Input',
        description:
          '{{t("Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.")}}',
      },
    },
    {
      type: 'string',
      name: 'template',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Collection Template") }}',
        type: 'string',
        'x-component': 'Input',
      },
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'fields',
      collectionName: 'collections',
      sourceKey: 'name',
      targetKey: 'name',
      uiSchema: {},
    },
    {
      type: 'hasMany',
      name: 'inherits',
      interface: 'select',
      uiSchema: {
        title: '{{ t("Inherits") }}',
        type: 'string',
        'x-component': 'Select',
        'x-component-props': {
          mode: 'multiple',
        },
      },
    },
    {
      type: 'string',
      name: 'description',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Description") }}',
        type: 'string',
        'x-component': 'Input',
      },
    },
  ],
};
