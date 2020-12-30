// merge：interface 模板，旧数据，用户数据
// TODO: 删除的情况怎么处理
// 联动的原则：尽量减少干预，尤其是尽量少改动 type，type 兼容
// 参数的优先级：
// 1、interface，type 尽量只随 interface 变动，而不受别的字段影响（特殊情况除外）
// 2、
// TODO: interface 的修改
export const string = {
  title: '单行文本',
  options: {
    interface: 'string',
    type: 'string',
    filterable: true,
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
      'x-rules': 'phone',
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
      'x-rules': 'email',
    },
  },
};

/**
 * 通过 precision 控制精确度
 */
export const number = {
  title: '数字',
  options: {
    interface: 'number',
    type: 'float',
    filterable: true,
    sortable: true,
    precision: 0, // 需要考虑
    component: {
      type: 'number',
    },
  }
};

/**
 * 通过 precision 控制精确度
 * 百分比转化是前端处理还是后端处理
 */
export const percent = {
  title: '百分比',
  options: {
    interface: 'percent',
    type: 'float',
    filterable: true,
    sortable: true,
    precision: 0,
    component: {
      type: 'percent',
    },
  },
};

export const wysiwyg = {
  title: '可视化编辑器',
  disabled: true,
  options: {
    interface: 'wysiwyg',
    type: 'text',
    component: {
      type: 'wysiwyg',
    },
  },
};

/**
 * 特殊的关系字段
 */
export const attachment = {
  title: '附件',
  // disabled: true,
  options: {
    interface: 'attachment',
    type: 'belongsToMany',
    filterable: true,
    target: 'attachments',
    // storage: {
    //   name: 'local',
    // },
    component: {
      type: 'upload',
    },
  },
};

/**
 * 
 */
export const select = {
  title: '下拉选择（单选）',
  options: {
    interface: 'select',
    type: 'string',
    filterable: true,
    dataSource: [],
    component: {
      type: 'select',
    },
  },
};

/**
 * type 怎么处理
 * 暂时 json 处理
 * 后续：扩展 type=array 的字段
 * array 的情况怎么兼容
 * filter 要处理
 * 不能处理 json 搜索的数据库可以用 hasMany 转化
 * 
 * 思考：🤔 如果 select合并成一个 interface，multiple 会影响 type
 */
export const multipleSelect = {
  title: '下拉选择（多选）',
  options: {
    interface: 'multipleSelect',
    type: 'json', // json 过滤
    filterable: true,
    dataSource: [],
    defaultValue: [],
    multiple: true, // 需要重点考虑
    component: {
      type: 'select',
    },
  },
};

export const radio = {
  title: '单选框',
  options: {
    interface: 'radio',
    type: 'string',
    filterable: true,
    dataSource: [],
    component: {
      type: 'radio',
    },
  },
};

export const checkboxes = {
  title: '多选框',
  options: {
    interface: 'checkboxes',
    type: 'json',
    filterable: true,
    dataSource: [],
    defaultValue: [],
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

/**
 * dateonly 要不要变 type
 * 如果是 dateonly 时间怎么办？
 */
export const datetime = {
  title: '日期',
  options: {
    interface: 'datetime',
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
};

export const time = {
  title: '时间',
  options: {
    interface: 'time',
    type: 'time',
    filterable: true,
    sortable: true,
    timeFormat: 'HH:mm:ss',
    component: {
      type: 'time',
    },
  },
};

/**
 * 重点：
 * 初始化子表和子字段
 * hasMany 相关的设置参数
 * fields 是子字段
 * 
 * 分组字段 - virtual：不考虑字段分组
 * 子表格 - hasMany
 * - 子字段只属于子表格字段关联的表（target），不属于当前表（source）
 */
// database.table({
//   name: 'tablename',
//   fields: [
//     {
//       type: 'hasMany',
//       name: 'foos',
//       target: 'foos',
//       fields: [
//         {
//           type: 'string',
//           name: 'xxx',
//         }
//       ],
//     }
//   ],
// });
// database.table({
//   name: 'foos',
//   fields: [
//     {
//       type: 'string',
//       name: 'xxx',
//     }
//   ],
// });
export const subTable = {
  title: '子表格',
  // disabled: true,
  options: {
    interface: 'subTable',
    type: 'hasMany',
    // fields: [],
    component: {
      type: 'subTable',
    },
  },
};

/**
 * 尽量减少更新 multiple 造成的影响
 * 同步生成配对的关系字段
 *
 * 只传 name 没有 target，可以通过 addField 处理，找到 target
 * 没有 name 但是有 target，name 随机生成
 * 有 name 也有 target
 */

// database.table({
//   name: 'foos',
//   fields: [
//     {
//       type: 'hasMany',
//       name: 'bars',
//       // target: 'bars',
//       // sourceKey: 'id',
//       // foreignKey: 'foo_id',
//     },
//     {
//       type: 'hasMany',
//       name: 'xxxxx', // 如果没有随机生成
//       target: 'bars',
//       // sourceKey: 'id',
//       // foreignKey: 'foo_id',
//     },
//     {
//       type: 'hasMany',
//       name: 'xxxxx', // 如果没有随机生成
//       target: 'bars',
//       sourceKey: 'id',
//       foreignKey: 'foo_id',
//     }
//   ],
// });

// const field = table.addField({
//   type: 'hasMany',
//   name: 'xxx', // xxx
// });

export const linkTo = {
  title: '关联数据',
  // disabled: true,
  options: {
    interface: 'linkTo',
    multiple: true, // 可能影响 type
    paired: false,
    type: 'belongsToMany',
    // name,
    // target: '关联表', // 用户会输入
    filterable: false,
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
    // name: 'created_at',
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
};

export const updatedAt = {
  title: '修改时间',
  options: {
    interface: 'updatedAt',
    type: 'date',
    // name: 'updated_at',
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
};

export const createdBy = {
  title: '创建人',
  // disabled: true,
  options: {
    interface: 'createdBy',
    type: 'createdBy',
    // name: 'createdBy',
    // filterable: true,
    target: 'users',
    labelField: 'nickname',
    foreignKey: 'created_by_id',
    appends: true,
    component: {
      type: 'drawerSelect',
    },
  },
};

export const updatedBy = {
  title: '修改人',
  // disabled: true,
  options: {
    interface: 'updatedBy',
    // name: 'updatedBy',
    type: 'updatedBy',
    // filterable: true,
    target: 'users',
    labelField: 'nickname',
    foreignKey: 'created_by_id',
    appends: true,
    component: {
      type: 'drawerSelect',
    },
  },
};

/**
 * 字段分组（暂缓）
 *
 * 影响数据输出结构，树形结构输出
 */
export const group = {
  title: '字段组',
  disabled: true,
  options: {
    interface: 'group',
    // name: 'id',
    type: 'virtual',
    component: {
      type: 'hidden',
    },
  },
};

/**
 * 主键（暂缓）
 */
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
    developerMode: true,
    component: {
      type: 'number',
    },
  },
};

/**
 * 自增长
 * scope 的问题
 */
export const sort = {
  title: '排序',
  options: {
    interface: 'sort',
    type: 'integer',
    required: true,
    component: {
      type: 'sort',
      showInTable: true,
    },
  },
};

export const password = {
  title: '密码',
  options: {
    interface: 'password',
    type: 'password',
    hidden: true, // hidden 用来控制 api 不输出这个字段，但是可能这个字段显示在表单里 showInForm
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
    mode: 'replace',
    // developerMode: true,
    component: {
      type: 'hidden',
    },
  },
};

export const icon = {
  title: '图标',
  options: {
    interface: 'icon',
    type: 'string',
    component: {
      type: 'icon',
    },
  },
};
