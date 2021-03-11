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
    { label: '常规页面', value: 'default' },
    { label: '快捷抽屉', value: 'simple' },
  ],
  defaultValue: 'default',
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
    fields: {
      ...fields,
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
    actions,
    fields: {
      ...fields,
      title: '显示在详情里的字段'
    },
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
    detailsOpenMode: 'default',
    // actions,
    // fields,
    // details,
    // labelField,
  },
  properties: {
    // 数据配置
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
    // 操作配置
    actions,
    // 详情配置
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
    // 数据配置
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
    // 详情配置
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
  },
};
