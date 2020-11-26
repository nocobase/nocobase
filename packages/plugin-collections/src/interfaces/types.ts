export const string = {
  title: '单行文本',
  options: {
    interface: 'string',
    type: 'string',
    component: {
      type: 'string',
    },
  },
};

export const textarea = {
  title: '多行文本',
  options: {
    interface: 'textarea',
    type: 'text',
    filterable: true,
    component: {
      type: 'textarea',
    },
  }
};

export const phone = {
  title: '手机号码',
  options: {
    interface: 'phone',
    type: 'string',
    filterable: true,
    format: 'phone', // 验证的问题
    component: {
      type: 'string',
    },
  },
};

export const email = {
  title: '邮箱',
  options: {
    interface: 'email',
    type: 'string',
    filterable: true,
    format: 'email',
    component: {
      type: 'string',
    },
  },
};

export const number = {
  title: '数字',
  options: {
    interface: 'number',
    type: 'integer',
    filterable: true,
    sortable: true,
    component: {
      type: 'number',
      precision: 0,
    },
  }
};

export const percent = {
  title: '百分比',
  options: {
    interface: 'percent',
    type: 'integer',
    filterable: true,
    sortable: true,
    component: {
      type: 'number',
      suffix: '%',
      precision: 0,
    },
  },
};

export const wysiwyg = {
  title: '可视化编辑器',
  options: {
    interface: 'wysiwyg',
    type: 'text',
    component: {
      type: 'wysiwyg',
    },
  },
};

export const attachment = {
  title: '附件',
  options: {
    interface: 'attachment',
    type: 'belongsToMany',
    filterable: true,
    target: 'attachments',
    component: {
      type: 'fileManager',
    },
  },
};

export const select = {
  title: '下拉选择（单选）',
  options: {
    interface: 'select',
    type: 'belongsTo',
    filterable: true,
    fields: [
      {
        interface: 'sort',
        type: 'integer',
        name: 'title',
        title: '排序',
        component: {
          type: 'sort',
        },
      },
      {
        interface: 'string',
        type: 'string',
        name: 'title',
        title: '选项',
        component: {
          type: 'string',
        },
      },
    ],
    component: {
      type: 'select',
    },
  },
};

export const multipleSelect = {
  title: '下拉选择（多选）',
  options: {
    interface: 'multipleSelect',
    type: 'belongsToMany',
    filterable: true,
    fields: [
      {
        interface: 'sort',
        type: 'integer',
        name: 'title',
        title: '排序',
        component: {
          type: 'sort',
        },
      },
      {
        interface: 'string',
        type: 'string',
        name: 'title',
        title: '选项',
        component: {
          type: 'string',
        },
      },
    ],
    component: {
      type: 'select',
      multiple: true,
    },
  },
};

export const radio = {
  title: '单选框',
  options: {
    interface: 'radio',
    type: 'belongsTo',
    filterable: true,
    fields: [
      {
        interface: 'sort',
        type: 'integer',
        name: 'title',
        title: '排序',
        component: {
          type: 'sort',
        },
      },
      {
        interface: 'string',
        type: 'string',
        name: 'title',
        title: '选项',
        component: {
          type: 'string',
        },
      },
    ],
    component: {
      type: 'radio',
    },
  },
};

export const checkboxes = {
  title: '多选框',
  options: {
    interface: 'checkboxes',
    type: 'belongsToMany',
    filterable: true,
    fields: [
      {
        interface: 'sort',
        type: 'integer',
        name: 'title',
        title: '排序',
        component: {
          type: 'sort',
        },
      },
      {
        interface: 'string',
        type: 'string',
        name: 'title',
        title: '选项',
        component: {
          type: 'string',
        },
      },
    ],
    component: {
      type: 'checkboxes',
    },
  },
};

export const boolean = {
  title: '是/否',
  options: {
    interface: 'boolean',
    type: 'boolean',
    filterable: true,
    component: {
      type: 'checkbox', // switch
    },
  },
};

export const date = {
  title: '日期',
  options: {
    interface: 'date',
    type: 'date',
    filterable: true,
    sortable: true,
    component: {
      type: 'date',
    },
  },
};

export const time = {
  title: '时间',
  options: {
    interface: 'time',
    type: 'time',
    filterable: true,
    sortable: true,
    component: {
      type: 'time',
    },
  },
};

export const subTable = {
  title: '子表格',
  options: {
    interface: 'subTable',
    type: 'hasMany',
    component: {
      type: 'subTable',
    },
  },
};

export const linkTo = {
  title: '关联数据',
  options: {
    interface: 'linkTo',
    type: 'belongsToMany',
    filterable: true,
    component: {
      type: 'drawerSelect',
    },
  },
};

export const createdBy = {
  title: '创建者',
  options: {
    interface: 'createdBy',
    type: 'belongsTo',
    filterable: true,
    component: {
      type: 'drawerSelect',
    },
  },
};

export const createdAt = {
  title: '创建时间',
  options: {
    interface: 'createdAt',
    type: 'date',
    required: true,
    filterable: true,
    sortable: true,
    component: {
      type: 'date',
    },
  },
};

export const updatedBy = {
  title: '更新人',
  options: {
    interface: 'updatedBy',
    type: 'belongsTo',
    filterable: true,
    component: {
      type: 'drawerSelect',
    },
  },
};

export const updatedAt = {
  title: '更新日期',
  options: {
    interface: 'updatedAt',
    type: 'date',
    required: true,
    filterable: true,
    sortable: true,
    component: {
      type: 'date',
    },
  },
};

export const primaryKey = {
  title: '主键',
  options: {
    interface: 'primaryKey',
    name: 'id',
    type: 'integer',
    required: true,
    autoIncrement: true,
    primaryKey: true,
    filterable: true,
    component: {
      type: 'number',
    },
  },
};

export const sort = {
  title: '排序',
  options: {
    interface: 'sort',
    type: 'integer',
    required: true,
    component: {
      type: 'sort',
    },
  },
};

export const password = {
  title: '密码',
  options: {
    interface: 'password',
    type: 'password',
    component: {
      type: 'password',
    },
  },
};

export const json = {
  title: 'JSON',
  options: {
    interface: 'json',
    type: 'json',
    component: {
      type: 'hidden',
    },
  },
};
