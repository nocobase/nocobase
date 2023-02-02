import { Context } from '@nocobase/actions';
import { choicesTypeInterfaceArray } from '../shared';

async function areaHandler(ctx: Context) {
  const { params: { values } } = ctx.action;
  const {
    chartType,
    collectionName,
    filter,
    computedField,
    aggregateFunction,
    type,
    groupByField,
    collectionFields,
  } = values;
  const repo = ctx.db.getRepository(collectionName);
  const collection = ctx.db.getCollection(collectionName);
  const dialect = process.env.DB_DIALECT;
  let chartData;
  let enumOptions;
  const isChoicesTypeGroupByField = choicesTypeInterfaceArray.some(choicesTypeInterface => collectionFields.find(item => ( item.foreignKey ?? item?.name ) === groupByField)?.interface === choicesTypeInterface);
  if (isChoicesTypeGroupByField) {
    enumOptions = collectionFields.find(item => ( item.foreignKey ?? item?.name ) === groupByField)?.uiSchema?.enum;
  }
  let sql;
  //由于目前nocobase暂时不支持聚合函数,简单sql拼接一下
  switch (dialect){
    case 'mysql':
      sql = `SELECT \`${groupByField}\`,${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as \`${`${groupByField}_${computedField}`}\` FROM \`${collection.model.tableName}\` GROUP BY \`${groupByField}\``
      break
    case 'postgres':
      sql = `SELECT \"${groupByField}\",${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as \"${`${groupByField}_${computedField}`}\" FROM \"${collection.model.tableName}\" GROUP BY \"${groupByField}\"`
      break
    case 'sqlite':
      sql = `SELECT \"${groupByField}\",${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as \"${`${groupByField}_${computedField}`}\" FROM \"${collection.model.tableName}\" GROUP BY \"${groupByField}\"`
      break
  }
  const result = await ctx.db.sequelize.query(sql);
  if (result[0].length) {
    chartData = result[0].map((item) => {
      return {
        'type': `${isChoicesTypeGroupByField ? enumOptions.find(i => i.value === item[groupByField]).label : item[groupByField]}`,
        'value': Number(item[`${groupByField}_${computedField}`]),
      };
    });
  } else {
    chartData = [];
  }
  return chartData
}

export {
  areaHandler,
};
