import { Context } from '@nocobase/actions';
import { getRepositoryFromParams } from '../utils';

function toTree(arr: Array<any>, map: Map<any, any>, primaryKeyField: any, __path: string) {
  arr.forEach((value, index) => {
    let curPath = __path.length > 0 ? `${__path}.${index}` : `${index}`;
    const childrenArr = map.get(value.get(primaryKeyField));
    value.dataValues.__path = curPath;
    if (!!childrenArr && childrenArr.length > 0) {
      value.dataValues.children = childrenArr;
      toTree(childrenArr, map, primaryKeyField, `${curPath}.children`);
    }
  });
}

export async function getTree(ctx: Context, next) {
  // list with no Paged
  const repository = getRepositoryFromParams(ctx);
  const { fields, filter, appends, except, sort } = ctx.action.params;
  const rows = await repository.find({ fields, filter, appends, except, sort });
  const model = repository.collection.model;
  const primaryKeyField = model['primaryKeyField'] || model.primaryKeyAttribute;

  // trans list to tree
  // map - key: id , value: children array
  const map = new Map();
  // root node array
  const rootArray = [];
  for (let row of rows) {
    const id = row.get(primaryKeyField);
    const parent = row.get(model.associations.children.foreignKey);
    if (!parent) {
      rootArray.push(row);
      map.set(id, []);
    } else {
      let children = map.get(parent);
      if (!children) {
        children = [];
        map.set(parent, children);
      }
      children.push(row);
    }
  }
  toTree(rootArray, map, primaryKeyField, '');

  ctx.body = rootArray;
  await next();
}
