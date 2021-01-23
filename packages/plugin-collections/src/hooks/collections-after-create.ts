import CollectionModel from '../models/collection';

const defaultValues = {
  actions: [
    {
      type: 'filter',
      name: 'filter',
      title: '筛选',
    },
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
    // {
    //   type: 'table',
    //   name: 'simple',
    //   title: '简易模式',
    //   template: 'SimpleTable',
    //   actionNames: ['create', 'destroy'],
    //   detailsViewName: 'details',
    //   updateViewName: 'form',
    // },
    {
      type: 'table',
      name: 'table',
      title: '全部数据',
      template: 'Table',
      actionNames: ['filter', 'destroy', 'create'],
      default: true,
    },
  ],
  tabs: [
    {
      type: 'details',
      name: 'details',
      title: '详情',
      viewName: 'details',
      default: true,
    },
  ],
};

export default async function (model: CollectionModel, options: any = {}) {
  const { migrate = true } = options;
  console.log('plugin-collections hook', {migrate})
  if (migrate) {
    await model.migrate({...options, isNewRecord: true});
  }
  await model.updateAssociations(defaultValues, options);
}
