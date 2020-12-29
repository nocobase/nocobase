import { Op, Utils, Sequelize } from 'sequelize';

function toArray(value: any): any[] {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

const op = new Map<string, typeof Op | Function>();

// Sequelize 内置
for (const key in Op) {
  op.set(key, Op[key]);
  const val = Utils.underscoredIf(key, true);
  op.set(val, Op[key]);
  op.set(val.replace(/_/g, ''), Op[key]);
}

// 通用

// 是否为空：数据库意义的 null
op.set('$null', (value, {fieldPath, database}) => {
  // const field = database.getFieldByPath(fieldPath);
  // console.log({field});
  return { [Op.is]: null };
});
op.set('$notNull', () => ({ [Op.not]: null }));

op.set('$isTruly', () => ({
  [Op.eq]: true,
}));
op.set('$isFalsy', () => ({
  [Op.or]: [
    {
      [Op.eq]: false,
    },
    {
      [Op.is]: null,
    },
  ],
}));

// 字符串

// 包含：指对应字段的值包含某个子串
op.set('$includes', (value: string) => ({ [Op.iLike]: `%${value}%` }));
// 不包含：指对应字段的值不包含某个子串（慎用：性能问题）
op.set('$notIncludes', (value: string) => ({ [Op.notILike]: `%${value}%` }));
// 以之起始
op.set('$startsWith', (value: string) => ({ [Op.iLike]: `${value}%` }));
// 不以之起始
op.set('$notStartsWith', (value: string) => ({ [Op.notILike]: `${value}%` }));
// 以之结束
op.set('$endsWith', (value: string) => ({ [Op.iLike]: `%${value}` }));
// 不以之结束
op.set('$notEndsWith', (value: string) => ({ [Op.notILike]: `%${value}` }));

// 多选（JSON）类型

// 包含组中任意值（命名来源：`Array.prototype.some`）
op.set('$anyOf', (values: any[], options) => {
  if (!values) {
    return Sequelize.literal('');
  }
  values = Array.isArray(values) ? values : [values];
  if (values.length === 0) {
    return Sequelize.literal('');
  }
  const { field, fieldPath } = options;
  const column = fieldPath.split('.').map(name => `"${name}"`).join('.');
  const sql = values.map(value => `(${column})::jsonb @> '${JSON.stringify(value)}'`).join(' OR ');
  console.log(sql);
  return Sequelize.literal(sql);
});
// 包含组中所有值
op.set('$allOf', (values: any) => ({ [Op.contains]: toArray(values) }));
// TODO(bug): 不包含组中任意值
op.set('$noneOf', (values: any[], options) => {
  if (!values) {
    return Sequelize.literal('');
  }
  values = Array.isArray(values) ? values : [values];
  if (values.length === 0) {
    return Sequelize.literal('');
  }
  const { field, fieldPath } = options;
  const column = fieldPath.split('.').map(name => `"${name}"`).join('.');
  const sql = values.map(value => `(${column})::jsonb @> '${JSON.stringify(value)}'`).join(' OR ');
  console.log(sql);
  return Sequelize.literal(`not (${sql})`);
});
// 与组中值匹配
op.set('$match', (values: any[], options) => {
  const array = toArray(values);
  if (values.length === 0) {
    return Sequelize.literal('');
  }
  const { field, fieldPath } = options;
  const column = fieldPath.split('.').map(name => `"${name}"`).join('.');
  const sql = `(${column})::jsonb @> '${JSON.stringify(array)}' AND (${column})::jsonb <@ '${JSON.stringify(array)}'`
  return Sequelize.literal(sql);
});
op.set('$notMatch', (values: any[], options) => {
  const array = toArray(values);
  if (values.length === 0) {
    return Sequelize.literal('');
  }
  const { field, fieldPath } = options;
  const column = fieldPath.split('.').map(name => `"${name}"`).join('.');
  const sql = `(${column})::jsonb @> '${JSON.stringify(array)}' AND (${column})::jsonb <@ '${JSON.stringify(array)}'`
  return Sequelize.literal(`not (${sql})`);
  // return Sequelize.literal(`(not (${sql})) AND ${column} IS NULL`);
});

export default op;
