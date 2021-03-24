const fields = {
  interface: 'json',
  type: 'virtual',
  title: '要显示的字段',
  target:  'views_fields_v2',
  component: {
    type: 'subTable',
  },
};

const actions = {
  interface: 'json',
  type: 'virtual',
  title: '操作按钮配置',
  target:  'views_actions_v2',
  component: {
    type: 'subTable',
  },
};

const details = {
  interface: 'json',
  type: 'virtual',
  title: '详情标签页里要显示的视图',
  target:  'views_details_v2',
  component: {
    type: 'subTable',
  },
};

const detailsOpenMode = {
  interface: 'radio',
  // type: 'string',
  title: '单条数据详情页的打开方式',
  required: true,
  dataSource: [
    { label: '常规页面', value: 'window' },
    { label: '快捷抽屉', value: 'drawer' },
  ],
  defaultValue: 'drawer',
  component: {
    type: 'radio',
    default: 'default',
  },
};

export const form = {
  // fields,
  title: '表单',
  options: {
    // fields,
  },
  properties: {
    info1: {
      interface: 'description',
      type: 'virtual',
      title: '表单配置',
      component: {
        type: 'description',
      },
    },
    fields: {
      ...fields,
      viewName: 'tableForForm',
      title: '显示在表单里的字段'
    },
  },
  linkages: {
    
  },
};

export const descriptions = {
  title: '详情',
  options: {
    // actions,
    // fields,
  },
  properties: {
    info1: {
      interface: 'description',
      type: 'virtual',
      title: '详情配置',
      component: {
        type: 'description',
      },
    },
    fields: {
      ...fields,
      title: '显示在详情里的字段'
    },
    info2: {
      interface: 'description',
      type: 'virtual',
      title: '操作按钮配置',
      component: {
        type: 'description',
      },
    },
    actions,
  },
  linkages: {
    
  },
};

export const table = {
  title: '表格',
  options: {
    defaultPerPage: 20,
    draggable: false,
    filter: {},
    sort: [],
    detailsOpenMode: 'drawer',
    // actions,
    // fields,
    // details,
    // labelField,
  },
  properties: {
    info1: {
      interface: 'description',
      type: 'virtual',
      title: '表格配置',
      component: {
        type: 'description',
      },
    },
    // 表格配置
    labelField: {
      interface: 'select',
      type: 'virtual',
      title: '作为单条数据标题的字段',
      name: 'labelField',
      required: true,
      component: {
        type: 'remoteSelect',
        resourceName: 'collections.fields',
        labelField: 'title',
        valueField: 'name',
        filter: {
          type: 'string',
        },
      },
    },
    fields: {
      ...fields,
      title: '显示在表格里的字段'
    },
    defaultPerPage: {
      interface: 'radio',
      type: 'virtual',
      name: 'defaultPerPage',
      title: '每页默认显示几条数据',
      defaultValue: 50,
      dataSource: [
        {label: '10', value: 10},
        {label: '20', value: 20},
        {label: '50', value: 50},
        {label: '100', value: 100},
      ],
    },
    draggable: {
      interface: 'boolean',
      type: 'virtual',
      title: '表格里支持拖拽数据排序',
    },
    info2: {
      interface: 'description',
      type: 'virtual',
      title: '数据配置',
      component: {
        type: 'description',
      },
    },
    filter: {
      interface: 'json',
      type: 'virtual',
      title: '只显示符合以下条件的数据',
      mode: 'replace',
      defaultValue: {},
      component: {
        type: 'filter',
      },
    },
    // sort: {
    //   interface: 'json',
    //   type: 'virtual',
    //   title: '默认排序',
    //   mode: 'replace',
    //   defaultValue: [],
    //   component: {
    //     type: 'string',
    //   },
    // },
    info3: {
      interface: 'description',
      type: 'virtual',
      title: '操作按钮配置',
      component: {
        type: 'description',
      },
    },
    actions,
    info4: {
      interface: 'description',
      type: 'virtual',
      title: '单条数据页面配置',
      component: {
        type: 'description',
      },
    },
    detailsOpenMode,
    details,
  },
  linkages: {
  },
};

export const calendar = {
  title: '日历',
  options: {
    // filter,
    // labelField,
    // startDateField,
    // endDateField,
    // openMode,
    // details,
  },
  properties: {
    info1: {
      interface: 'description',
      type: 'virtual',
      title: '日历配置',
      component: {
        type: 'description',
      },
    },
    // 日历配置
    labelField: {
      interface: 'select',
      type: 'virtual',
      title: '作为单条数据标题的字段',
      name: 'labelField',
      required: true,
      component: {
        type: 'remoteSelect',
        resourceName: 'collections.fields',
        labelField: 'title',
        valueField: 'name',
        filter: {
          type: 'string',
        },
      },
    },
    startDateField: {
      interface: 'select',
      type: 'virtual',
      title: '开始日期字段',
      // required: true,
      component: {
        type: 'remoteSelect',
        placeholder: '默认为创建时间字段',
        resourceName: 'collections.fields',
        labelField: 'title',
        valueField: 'name',
        filter: {
          type: 'date',
        },
      },
    },
    endDateField: {
      interface: 'select',
      type: 'virtual',
      title: '结束日期字段',
      // required: true,
      component: {
        type: 'remoteSelect',
        placeholder: '默认为创建时间字段',
        resourceName: 'collections.fields',
        labelField: 'title',
        valueField: 'name',
        filter: {
          type: 'date',
        },
      },
    },
    info2: {
      interface: 'description',
      type: 'virtual',
      title: '数据配置',
      component: {
        type: 'description',
      },
    },
    filter: {
      interface: 'json',
      type: 'virtual',
      title: '只显示符合以下条件的数据',
      mode: 'replace',
      defaultValue: {},
      component: {
        type: 'filter',
      },
    },
    info3: {
      interface: 'description',
      type: 'virtual',
      title: '单条数据页面配置',
      component: {
        type: 'description',
      },
    },
    detailsOpenMode,
    details,
  },
  linkages: {
    
  },
};

export const wysiwyg = {
  title: '富文本',
  options: {
    // html,
  },
  properties: {
    // 数据配置
    html: {
      interface: 'wysiwyg',
      type: 'virtual',
      title: '富文本内容',
      component: {
        type: 'wysiwyg',
      },
    },
  },
  linkages: {
    type: [
      {
        type: "value:visible",
        target: 'collection',
        condition: `{{ $self.value && $self.value !== 'wysiwyg' }}`,
      },
      {
        type: "value:visible",
        target: 'dataSourceType',
        condition: `{{ $self.value && $self.value !== 'wysiwyg' }}`,
      },
      // {
      //   type: "value:visible",
      //   target: 'targetField',
      //   condition: `{{ $self.value && $self.value !== 'wysiwyg' }}`,
      // },
    ],
  },
};
