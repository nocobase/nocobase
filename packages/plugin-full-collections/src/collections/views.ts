import { TableOptions } from '@nocobase/database';
import { getViewFields } from '../views';

export default {
  name: 'views',
  title: '视图配置',
  internal: true,
  model: 'ViewModel',
  developerMode: true,
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '视图名称',
      required: true,
      component: {
        type: 'string',
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'name',
      title: '标识',
      component: {
        type: 'string',
      },
    },
    ...getViewFields(),
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
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      title: '所属数据表',
      target: 'collections',
      targetKey: 'name',
      component: {
        type: 'drawerSelect',
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
} as TableOptions;
