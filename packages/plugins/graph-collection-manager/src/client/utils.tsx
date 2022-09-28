import { uid } from '@formily/shared';
const shape = {
  ER: 'er-rect',
  EDGE: 'edge',
};

const collectionData = [
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

export const formatData = (data) => {
  console.log(data);
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
        x: 24 + 200 * index + 20 * (index + 1),
        y: 170 + 50 * index,
      },
      ports,
    };
  });
  const edges = formatEdgeData(edgeData, targetTablekeys, tableData);
  console.log(edges);
  console.log([...tableData, ...edges]);
  return [...tableData, ...edges];
};

const formatEdgeData = (data, targetTables, tableData) => {
  const edges = [];
  for (let i = 0; i < data.length; i++) {
    if (targetTables.includes(data[i].target) &&['obo', 'oho', 'o2o', 'o2m', 'm2o', 'm2m', 'linkTo'].includes(data[i].interface)) {
      const targetTable = tableData.find((v) => v.label === data[i].target);
      const sourceTable = tableData.find((v) => v.label === data[i].collectionName);
      console.log(targetTable, sourceTable);
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
        labels: 'true',
        attrs: {
          line: {
            stroke: '#A2B1C3',
            strokeWidth: 1,
          },
          text: {
            text: getRelationship(data[i].interface)
          },
        },
        connector: 'rounded',
        zIndex: 0,
      });
    }
  }
  return edges;
};

const getRelationship = (relatioship) => {
    console.log(relatioship)
  switch (relatioship) {
    case 'm2m':
    case 'linkTo':
      return 'N:N';
    case 'o2m':
      return '1:N';
    case 'm2o':
      return 'N:1';
    case 'obo':
    case 'oho':
      return '1:1';
    default:
      return '';
  }
};
