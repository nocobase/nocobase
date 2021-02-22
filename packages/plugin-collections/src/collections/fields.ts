import { TableOptions } from '@nocobase/database';
import { types, getOptions } from '../interfaces';

export default {
  name: 'fields',
  title: '字段配置',
  internal: true,
  draggable: true,
  model: 'FieldModel',
  developerMode: true,
  fields: [
    {
      interface: 'sort',
      type: 'sort',
      name: 'sort',
      scope: ['collection'],
      title: '排序',
      component: {
        type: 'sort',
        className: 'drag-visible',
        width: 60,
        showInTable: true,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '字段名称',
      required: true,
      component: {
        type: 'string',
        className: 'drag-visible',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'name',
      title: '标识',
      required: true,
      createOnly: true,
      developerMode: true,
      component: {
        type: 'string',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'interface',
      title: '字段类型',
      required: true,
      dataSource: getOptions(),
      createOnly: true,
      component: {
        type: 'select',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
        "x-linkages": [
          // TODO(draft): 统一解决字段类型和配置参数联动的一种方式
          // {
          //   type: 'value:schema',
          //   target: 'options',
          //   schema: {
          //     'x-component-props': {
          //       fields: '{{ $self.values[1].fields || [] }}'
          //     }
          //   },
          //   condition: '{{ !!$self.value }}'
          // },
          {
            "type": "value:visible",
            "target": "precision",
            "condition": "{{ ['number', 'percent'].indexOf($self.value) !== -1 }}"
          },
          {
            "type": "value:visible",
            "target": "dataSource",
            "condition": "{{ ['select', 'multipleSelect', 'radio', 'checkboxes'].indexOf($self.value) !== -1 }}"
          },
          {
            "type": "value:visible",
            "target": "dateFormat",
            "condition": "{{ ['datetime', 'createdAt', 'updatedAt'].indexOf($self.value) !== -1 }}"
          },
          {
            "type": "value:visible",
            "target": "showTime",
            "condition": "{{ ['datetime', 'createdAt', 'updatedAt'].indexOf($self.value) !== -1 }}"
          },
          {
            "type": "value:visible",
            "target": "timeFormat",
            "condition": "{{ ['time'].indexOf($self.value) !== -1 }}"
          },
          {
            "type": "value:visible",
            "target": "multiple",
            "condition": "{{ ['linkTo'].indexOf($self.value) !== -1 }}"
          },
          {
            "type": "value:visible",
            "target": "target",
            "condition": "{{ ['linkTo'].indexOf($self.value) !== -1 }}"
          },
          // {
          //   "type": "value:visible",
          //   "target": "labelField",
          //   "condition": "{{ ['linkTo'].indexOf($self.value) !== -1 }}"
          // },
          {
            "type": "value:visible",
            "target": "createable",
            "condition": "{{ ['linkTo'].indexOf($self.value) !== -1 }}"
          },
          {
            "type": "value:visible",
            "target": "children",
            "condition": "{{ ['subTable'].indexOf($self.value) !== -1 }}"
          },
          {
            "type": "value:visible",
            "target": "component.showInTable",
            "condition": "{{ ['subTable', 'description'].indexOf($self.value) === -1 }}"
          },
          {
            "type": "value:visible",
            "target": "component.showInForm",
            "condition": "{{ ['createdAt', 'updatedAt', 'createdBy', 'updatedBy'].indexOf($self.value) === -1 }}"
          },
          {
            "type": "value:visible",
            "target": "required",
            "condition": "{{ ['createdAt', 'updatedAt', 'createdBy', 'updatedBy'].indexOf($self.value) === -1 }}"
          },
          {
            "type": "value:visible",
            "target": "maxLevel",
            "condition": "{{ ['chinaRegion'].includes($self.value) }}"
          },
          {
            "type": "value:visible",
            "target": "incompletely",
            "condition": "{{ ['chinaRegion'].includes($self.value) }}"
          },
        ],
      },
    },
    // TODO(draft): 将 options 作为集合字段开放出来，可以动态的解决字段参数的配置表单联动问题
    // {
    //   interface: 'json',
    //   type: 'json',
    //   name: 'options',
    //   title: '配置信息',
    //   defaultValue: {},
    //   component: {
    //     type: 'subFields',
    //     showInForm: true,
    //   },
    // },
    {
      interface: 'subTable',
      type: 'virtual',
      name: 'dataSource',
      title: '可选项',
      component: {
        type: 'table',
        default: [{}],
        // showInTable: true,
        // showInDetail: true,
        showInForm: true,
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
    {
      interface: 'string',
      type: 'string',
      name: 'type',
      title: '数据类型',
      developerMode: true,
      component: {
        type: 'string',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'number',
      type: 'integer',
      name: 'parent_id',
      title: '所属分组',
      component: {
        type: 'number',
      },
    },
    {
      interface: 'select',
      type: 'virtual',
      name: 'precision',
      title: '精度',
      dataSource: [
        {value: 0, label: '1'},
        {value: 1, label: '1.0'},
        {value: 2, label: '1.00'},
        {value: 3, label: '1.000'},
        {value: 4, label: '1.0000'},
      ],
      component: {
        type: 'number',
        showInForm: true,
        default: 0,
      },
    },
    {
      interface: 'select',
      type: 'virtual',
      name: 'dateFormat',
      title: '日期格式',
      dataSource: [
        {value: 'YYYY/MM/DD', label: '年/月/日'},
        {value: 'YYYY-MM-DD', label: '年-月-日'},
        {value: 'DD/MM/YYYY', label: '日/月/年'},
      ],
      component: {
        type: 'string',
        showInForm: true,
        default: 'YYYY-MM-DD',
      },
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'showTime',
      title: '显示时间',
      component: {
        type: 'boolean',
        showInForm: true,
        default: false,
        "x-linkages": [
          {
            "type": "value:visible",
            "target": "timeFormat",
            "condition": "{{ ($form.values && $form.values.interface === 'time') || $self.value === true }}"
          },
        ],
      },
    },
    {
      interface: 'select',
      type: 'virtual',
      name: 'timeFormat',
      title: '时间格式',
      dataSource: [
        { value: 'HH:mm:ss', label: '24小时制' },
        { value: 'hh:mm:ss a', label: '12小时制' },
      ],
      component: {
        type: 'string',
        showInForm: true,
        default: 'HH:mm:ss',
      },
    },
    // TODO(refactor): 此部分类型相关的参数，后期应拆分出去
    {
      name: 'maxLevel',
      title: '可选层级',
      interface: 'radio',
      type: 'virtual',
      dataSource: [
        { value: 1, label: '省' },
        { value: 2, label: '市' },
        { value: 3, label: '区/县' },
        { value: 4, label: '乡镇/街道' },
        { value: 5, label: '村/居委会' },
      ],
      component: {
        showInForm: true,
        default: 3
      }
    },
    {
      name: 'incompletely',
      title: '可部分选择',
      interface: 'boolean',
      type: 'virtual',
      component: {
        showInForm: true,
      }
    },
    {
      interface: 'linkTo',
      multiple: false,
      type: 'belongsTo',
      name: 'parent',
      title: '所属分组',
      target: 'fields',
      foreignKey: 'parent_id',
      targetKey: 'id',
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'string',
      type: 'virtual',
      name: 'target',
      title: '要关联的数据表',
      required: true,
      createOnly: true,
      component: {
        type: 'remoteSelect',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          mode: 'simple',
          resourceName: 'collections',
          labelField: 'title',
          valueField: 'name',
        },
        "x-linkages": [
          {
            type: "value:state",
            target: "labelField",
            condition: "{{ $self.inputed }}",
            state:{
              value: null,
            }
          },
          {
            "type": "value:visible",
            "target": "labelField",
            "condition": "{{ !!$self.value }}"
          },
          {
            type: "value:schema",
            target: "labelField",
            // condition: "{{ $self.value }}",
            schema: {
              "x-component-props": {
                "associatedKey": "{{ $self.value }}"
              },
            },
          },
          {
            type: 'value:visible',
            target: 'component.x-component-props.filter',
            condition: '{{ !!$self.value }}'
          },
          {
            type: "value:schema",
            target: "component.x-component-props.filter",
            schema: {
              "x-component-props": {
                "associatedKey": "{{ $self.value }}"
              },
            },
          },
        ],
      },
    },
    {
      interface: 'string',
      type: 'virtual',
      name: 'labelField',
      title: '要显示的字段',
      required: true,
      component: {
        type: 'remoteSelect',
        'x-component-props': {
          mode: 'simple',
          resourceName: 'collections.fields',
          labelField: 'title',
          valueField: 'name',
        },
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'multiple',
      title: '允许添加多条记录',
      component: {
        type: 'checkbox',
        showInDetail: true,
        showInForm: true,
        default: true,
      },
    },
    {
      name: 'component.x-component-props.filter',
      interface: 'json',
      type: 'virtual',
      title: '数据范围',
      component: {
        type: 'filter',
        'x-component-props': {
          resourceName: 'collections.fields',
        },
        showInForm: true,
      }
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'createable',
      title: '允许直接在关联的数据表内新建数据',
      component: {
        type: 'checkbox',
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'subTable',
      type: 'hasMany',
      name: 'children',
      target: 'fields',
      sourceKey: 'id',
      foreignKey: 'parent_id',
      title: '子表格字段',
      // visible: true,
      component: {
        type: 'subTable',
        default: [],
        // showInTable: true,
        // showInDetail: true,
        showInForm: true,
      },
    },
    // {
    //   interface: 'linkTo',
    //   multiple: true,
    //   type: 'hasMany',
    //   name: 'children',
    //   title: '子字段',
    //   target: 'fields',
    //   foreignKey: 'parent_id',
    //   sourceKey: 'id',
    //   component: {
    //     type: 'drawerSelect',
    //   },
    // },
    {
      interface: 'textarea',
      type: 'virtual',
      name: 'component.tooltip',
      title: '提示信息',
      component: {
        type: 'textarea',
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'required',
      title: '必填项',
      component: {
        type: 'checkbox',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'component.showInTable',
      title: '显示在表格中',
      component: {
        type: 'checkbox',
        tooltip: '若勾选，该字段将作为一列显示在数据表里',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
        default: true,
      },
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'component.showInForm',
      title: '显示在表单中',
      component: {
        type: 'checkbox',
        tooltip: '若勾选，该字段将出现在表单中',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
        default: true,
      },
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'component.showInDetail',
      title: '显示在详情中',
      component: {
        type: 'checkbox',
        tooltip: '若勾选，该字段将出现在详情中',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
        default: true,
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      title: '所属数据表',
      target: 'collections',
      targetKey: 'name',
      labelField: 'title',
      component: {
        type: 'drawerSelect',
        // showInTable: true,
        'x-component-props': {
          resourceName: 'collections.fields',
          labelField: 'title',
          valueField: 'name',
        },
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'developerMode',
      title: '开发者模式',
      defaultValue: false,
      component: {
        type: 'boolean',
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'component',
      title: '前端组件',
      defaultValue: {},
      component: {
        type: 'hidden',
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'options',
      title: '配置信息',
      defaultValue: {},
      component: {
        type: 'hidden',
      },
    },
  ],
  actions: [
    {
      type: 'list',
      name: 'list',
      title: '查看',
    },
    {
      type: 'destroy',
      name: 'destroy',
      title: '删除',
    },
    {
      type: 'create',
      name: 'create',
      title: '新增',
      viewName: 'form',
    },
    {
      type: 'update',
      name: 'update',
      title: '编辑',
      viewName: 'form',
    },
  ],
  views: [
    {
      type: 'form',
      name: 'form',
      title: '表单',
      template: 'DrawerForm',
      developerMode: true,
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      template: 'Details',
      actionNames: ['update'],
      developerMode: true,
    },
    {
      type: 'table',
      name: 'simple',
      title: '简易模式',
      template: 'Table',
      mode: 'simple',
      default: true,
      actionNames: ['destroy', 'create'],
      detailsViewName: 'details',
      updateViewName: 'form',
      paginated: false,
      draggable: true,
    },
  ],
} as TableOptions;
