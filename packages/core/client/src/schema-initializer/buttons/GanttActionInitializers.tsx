import { TableActionInitializers } from './TableActionInitializers';
// 甘特图区块action配置
export const GanttActionInitializers = {
  ...TableActionInitializers,
  items: TableActionInitializers.items.filter((v) => {
    return v.component !== 'ActionBarAssociationFilterAction';
  }),
};
