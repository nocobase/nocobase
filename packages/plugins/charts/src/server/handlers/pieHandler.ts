import { Context } from '@nocobase/actions';

async function pieHandler(ctx: Context) {
  const { params: { values } } = ctx.action;
  const { chartType, collectionName, filter, computedField, aggregateFunction, type, groupByField } = values;
  const repo = ctx.db.getRepository(collectionName);
  const collection = ctx.db.getCollection(collectionName);
  const dialect = process.env.DB_DIALECT
  let chartData
  let sql
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
  console.log(sql, 'sql!!!!!!!!!!!!!!!');
  if (result[0].length) {
    chartData = result[0].map((item) => {
      return {
        'type': `${item[groupByField]}`,
        'value': Number(item[`${groupByField}_${computedField}`]),
      };
    });
  } else {
    chartData = [
      { type: '分类一', value: 27 },
      { type: '分类二', value: 25 },
      { type: '分类三', value: 18 },
      { type: '分类四', value: 15 },
      { type: '分类五', value: 10 },
      { type: '其他', value: 5 },
    ];
  }
  return chartData
}

export {
  pieHandler,
};
