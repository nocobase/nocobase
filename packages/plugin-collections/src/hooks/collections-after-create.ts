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
};

export default async function (model: CollectionModel, options: any = {}) {
  const { migrate = true } = options;
  console.log('plugin-collections hook', {migrate})
  if (migrate) {
    await model.migrate({...options, isNewRecord: true});
  }
  await model.updateAssociations(defaultValues, options);
}
