import { generateRandomString } from '../utils';

export const string = {
  title: '单行文本',
  group: 'basic',
  options: {
    type: 'string',
    filterable: true,
    component: {
      type: 'string',
    },
  },
};

export const textarea = {
  title: '多行文本',
  group: 'basic',
  options: {
    type: 'text',
    filterable: true,
    component: {
      type: 'textarea',
    },
  }
};

export const phone = {
  title: '手机号码',
  group: 'basic',
  options: {
    type: 'string',
    filterable: true,
    format: 'phone', // 验证的问题
    component: {
      type: 'string',
      'x-rules': 'phone',
    },
  },
};

export const email = {
  title: '邮箱',
  group: 'basic',
  options: {
    type: 'string',
    filterable: true,
    format: 'email',
    component: {
      type: 'string',
      'x-rules': 'email',
    },
  },
};

export const number = {
  title: '数字',
  group: 'basic',
  options: {
    type: 'float',
    filterable: true,
    sortable: true,
    precision: 0,
    component: {
      type: 'number',
    },
  },
  properties: {
    precision: {
      interface: 'select',
      type: 'virtual',
      title: '精度',
      dataSource: [
        { value: 0, label: '1' },
        { value: 1, label: '1.0' },
        { value: 2, label: '1.00' },
        { value: 3, label: '1.000' },
        { value: 4, label: '1.0000' },
      ],
      component: {
        type: 'number',
        default: 0,
      },
    },
  },
};

export const percent = {
  title: '百分比',
  group: 'basic',
  options: {
    type: 'float',
    filterable: true,
    sortable: true,
    precision: 0,
    component: {
      type: 'percent',
    },
  },
  properties: {
    precision: {
      interface: 'select',
      type: 'virtual',
      title: '精度',
      dataSource: [
        { value: 0, label: '1' },
        { value: 1, label: '1.0' },
        { value: 2, label: '1.00' },
        { value: 3, label: '1.000' },
        { value: 4, label: '1.0000' },
      ],
      component: {
        type: 'number',
        default: 0,
      },
    },
  },
};

export const wysiwyg = {
  title: '可视化编辑器',
  group: 'media',
  disabled: true,
  options: {
    type: 'text',
    component: {
      type: 'wysiwyg',
    },
  },
};

export const boolean = {
  title: '是/否',
  group: 'choices',
  options: {
    type: 'boolean',
    filterable: true,
    component: {
      type: 'checkbox', // switch
    },
  },
};

export const select = {
  title: '下拉选择（单选）',
  group: 'choices',
  options: {
    type: 'string',
    filterable: true,
    dataSource: [],
    component: {
      type: 'select',
    },
  },
  properties: {
    dataSource: {
      interface: 'subTable',
      type: 'virtual',
      title: '可选项',
      component: {
        type: 'table',
        default: [{}],
        items: {
          type: 'object',
          properties: {
            value: {
              type: "string",
              title: "值",
              required: true
            },
            label: {
              type: "string",
              title: "选项",
              required: true
            },
          },
        },
      },
    },
  },
  initialize: (data: any) => {
    if (Array.isArray(data.dataSource)) {
      data.dataSource = data.dataSource.map((item: any) => {
        if (item.value === null || typeof item.value === 'undefined') {
          item.value = generateRandomString();
        }
        return { ...item };
      });
    }
  },
};

export const multipleSelect = {
  title: '下拉选择（多选）',
  group: 'choices',
  options: {
    type: 'json', // TODO: json 不是个通用的方案
    filterable: true,
    dataSource: [],
    defaultValue: [],
    multiple: true,
    component: {
      type: 'select',
    },
  },
  properties: {
    dataSource: select.properties.dataSource,
  },
  initialize: select.initialize,
};

export const radio = {
  title: '单选框',
  group: 'choices',
  options: {
    type: 'string',
    filterable: true,
    dataSource: [],
    component: {
      type: 'radio',
    },
  },
  properties: {
    dataSource: select.properties.dataSource,
  },
  initialize: select.initialize,
};

export const checkboxes = {
  title: '多选框',
  group: 'choices',
  options: {
    type: 'json', // TODO: json 不是个通用的方案
    filterable: true,
    dataSource: [],
    defaultValue: [],
    component: {
      type: 'checkboxes',
    },
  },
  properties: {
    dataSource: select.properties.dataSource,
  },
  initialize: select.initialize,
};

export const datetime = {
  title: '日期',
  group: 'datetime',
  options: {
    type: 'date',
    showTime: false,
    filterable: true,
    sortable: true,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    component: {
      type: 'date',
    },
  },
  properties: {
    dateFormat: {
      interface: 'select',
      type: 'virtual',
      title: '日期格式',
      dataSource: [
        { value: 'YYYY/MM/DD', label: '年/月/日' },
        { value: 'YYYY-MM-DD', label: '年-月-日' },
        { value: 'DD/MM/YYYY', label: '日/月/年' },
      ],
      defaultValue: 'YYYY-MM-DD',
      component: {
        type: 'string',
        default: 'YYYY-MM-DD',
      },
    },
    showTime: {
      interface: 'boolean',
      type: 'virtual',
      title: '显示时间',
      component: {
        type: 'boolean',
        default: false,
      },
    },
    timeFormat: {
      interface: 'select',
      type: 'virtual',
      title: '时间格式',
      dataSource: [
        { value: 'HH:mm:ss', label: '24小时制' },
        { value: 'hh:mm:ss a', label: '12小时制' },
      ],
      defaultValue: 'HH:mm:ss',
      component: {
        type: 'string',
        default: 'HH:mm:ss',
      },
    },
  },
  linkages: {
    showTime: [
      {
        "type": "value:visible",
        "target": "timeFormat",
        "condition": "{{ ($form.values && $form.values.control === 'time') || $self.value === true }}"
      },
    ],
  },
};

export const time = {
  title: '时间',
  group: 'datetime',
  options: {
    type: 'time',
    filterable: true,
    sortable: true,
    timeFormat: 'HH:mm:ss',
    component: {
      type: 'time',
    },
  },
};

export const subTable = {
  title: '子表格',
  group: 'relation',
  // disabled: true,
  options: {
    type: 'hasMany',
    // target,
    // children: [],
    component: {
      type: 'subTable',
    },
  },
  properties: {
    children: {
      interface: 'subTable',
      type: 'hasMany',
      target: 'fields',
      sourceKey: 'id',
      foreignKey: 'parent_id',
      title: '子表格字段',
      component: {
        type: 'subTable',
        default: [],
      },
    },
  },
  initialize(data: any) {
    if (!data.target) {
      data.target = generateRandomString({ prefix: 't_', length: 12 });
    }
  },
};

export const linkTo = {
  title: '关联数据',
  group: 'relation',
  // disabled: true,
  options: {
    type: 'belongsToMany',
    // name,
    // target: '关联表',
    // targetKey,
    // sourceKey,
    // otherKey,
    // foreignKey,
    // labelField,
    // valueField,
    filterable: false,
    // multiple: true,
    component: {
      type: 'drawerSelect',
      // labelField,
      // valueField,
    },
  },
  properties: {
    target: {
      interface: 'string',
      type: 'virtual',
      name: 'target',
      title: '要关联的数据表',
      required: true,
      createOnly: true,
      component: {
        type: 'remoteSelect',
        labelField: 'title',
        valueField: 'name',
        resourceName: 'collections',
        'x-component-props': {
          mode: 'simple',
        },
      },
    },
    'component.labelField': {
      interface: 'string',
      type: 'virtual',
      title: '要显示的字段',
      required: true,
      component: {
        type: 'remoteSelect',
        resourceName: 'collections.fields',
        labelField: 'title',
        valueField: 'name',
        'x-component-props': {
          mode: 'simple',
        },
      },
    },
    'component.filter': {
      interface: 'json',
      type: 'virtual',
      title: '数据范围',
      component: {
        type: 'filter',
        resourceName: 'collections.fields',
      },
    },
    multiple: {
      interface: 'boolean',
      type: 'virtual',
      name: 'multiple',
      title: '允许添加多条记录',
      defaultValue: true,
      component: {
        type: 'checkbox',
      },
    },
  },
  linkages: {
    target: [
      {
        type: "value:state",
        target: "component.labelField",
        condition: "{{ $self.inputed }}",
        state: {
          value: null,
        }
      },
      {
        "type": "value:visible",
        "target": "component.labelField",
        "condition": "{{ !!$self.value }}"
      },
      {
        type: "value:schema",
        target: "component.labelField",
        // condition: "{{ $self.value }}",
        schema: {
          "x-component-props": {
            "associatedKey": "{{ $self.value }}"
          },
        },
      },
      {
        type: 'value:visible',
        target: 'component.filter',
        condition: '{{ !!$self.value }}'
      },
      {
        type: "value:schema",
        target: "component.filter",
        schema: {
          "x-component-props": {
            "associatedKey": "{{ $self.value }}"
          },
        },
      },
    ],
  },
  initialize(data: any, model: any) {
    if (!['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(data.type)) {
      return;
    }
    if (!data.foreignKey) {
      data.foreignKey = generateRandomString({ prefix: 'f_', length: 6 });
    }
    if (data.type === 'belongsToMany') {
      if (!data.through) {
        data.through = generateRandomString({ prefix: 't_', length: 12 });
      }
      if (!data.otherKey) {
        data.otherKey = generateRandomString({ prefix: 'f_', length: 6 });
      }
    }
    if (data.type !== 'belongsTo' && !data.sourceKey) {
      data.sourceKey = model.constructor.primaryKeyAttribute;
    }
    if (['belongsTo', 'belongsToMany'].includes(data.type) && !data.targetKey) {
      const TargetModel = model.database.getModel(data.target);
      data.targetKey = TargetModel.primaryKeyAttribute;
    }
  }
};

export const createdAt = {
  title: '创建时间',
  group: 'systemInfo',
  options: {
    interface: 'createdAt',
    type: 'date',
    field: 'created_at',
    showTime: false,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    required: true,
    filterable: true,
    sortable: true,
    component: {
      type: 'date',
    },
  },
  properties: {
    ...datetime.properties,
  },
  linkages: {
    ...datetime.linkages,
  },
};

export const updatedAt = {
  title: '修改时间',
  group: 'systemInfo',
  options: {
    interface: 'updatedAt',
    type: 'date',
    field: 'updated_at',
    showTime: false,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    required: true,
    filterable: true,
    sortable: true,
    component: {
      type: 'date',
    },
  },
  properties: {
    ...datetime.properties,
  },
  linkages: {
    ...datetime.linkages,
  },
};

export const group = {
  title: '字段组',
  disabled: true,
  options: {
    type: 'virtual',
    component: {
      type: 'hidden',
    },
  },
};

export const description = {
  title: '说明文字',
  group: 'others',
  options: {
    type: 'virtual',
    component: {
      type: 'description',
    },
  },
};

export const primaryKey = {
  title: '主键',
  group: 'developerMode',
  options: {
    name: 'id',
    type: 'integer',
    required: true,
    autoIncrement: true,
    primaryKey: true,
    filterable: true,
    developerMode: true,
    component: {
      type: 'number',
    },
  },
};

export const sort = {
  title: '排序',
  group: 'developerMode',
  options: {
    type: 'integer',
    required: true,
    // scope: [],
    component: {
      type: 'sort',
    },
  },
};

export const password = {
  title: '密码',
  group: 'developerMode',
  options: {
    type: 'password',
    hidden: true, // hidden 用来控制 api 不输出这个字段
    component: {
      type: 'password',
    },
  },
};

export const json = {
  title: 'JSON',
  group: 'developerMode',
  options: {
    type: 'json',
    mode: 'replace',
    // developerMode: true,
    component: {
      type: 'hidden',
    },
  },
};

export const icon = {
  title: '图标',
  group: 'developerMode',
  options: {
    type: 'string',
    component: {
      type: 'icon',
    },
  },
};

export const createdBy = {
  title: '创建人',
  group: 'systemInfo',
  options: {
    type: 'createdBy',
    // filterable: true,
    target: 'users',
    foreignKey: 'created_by_id',
    component: {
      type: 'drawerSelect',
      labelField: 'nickname',
    },
  },
};

export const updatedBy = {
  title: '修改人',
  group: 'systemInfo',
  options: {
    type: 'updatedBy',
    // filterable: true,
    target: 'users',
    foreignKey: 'updated_by_id',
    component: {
      type: 'drawerSelect',
      labelField: 'nickname',
    },
  },
};

export const attachment = {
  title: '附件',
  group: 'media',
  // disabled: true,
  options: {
    type: 'belongsToMany',
    filterable: false,
    target: 'attachments',
    // storage: {
    //   name: 'local',
    // },
    component: {
      type: 'upload',
    },
  },
  initialize(data: any, model: any) {
    if (data.type === 'belongsToMany' && !data.through) {
      data.through = generateRandomString({ prefix: 't_', length: 12 });
    }
  },
};

export const chinaRegion = {
  title: '中国行政区划',
  group: 'choices',
  options: {
    type: 'belongsToMany',
    // 数据来源的数据表，与 dataSource 不同，需要从表数据加载后转化成 dataSource
    target: 'china_regions',
    targetKey: 'code',
    // 可选层级，最大层级
    maxLevel: 3,
    // 可以选到任意一级结束
    incompletely: false,
    component: {
      type: 'cascader',
      // 值字段
      valueField: 'code',
      // 名称字段
      labelField: 'name',
      // TODO(refactor): 等 toWhere 重构完成后要改成 parent
      // 上级字段名
      parentField: 'parent_code',
    },
  },
  properties: {
    maxLevel: {
      interface: 'radio',
      type: 'virtual',
      title: '可选层级',
      defaultValue: 3,
      dataSource: [
        { value: 1, label: '省' },
        { value: 2, label: '市' },
        { value: 3, label: '区/县' },
        { value: 4, label: '乡镇/街道' },
        { value: 5, label: '村/居委会' },
      ],
    },
    incompletely: {
      interface: 'boolean',
      type: 'virtual',
      title: '可以选到任意一级结束',
      defaultValue: false,
    }
  },
  initialize(data: any, model: any) {
    if (data.type === 'belongsToMany' && !data.through) {
      data.through = generateRandomString({ prefix: 't_', length: 12 });
    }
  },
};
