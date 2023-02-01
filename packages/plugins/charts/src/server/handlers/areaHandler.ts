import { Context } from '@nocobase/actions';

async function areaHandler(ctx: Context) {
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
  if (result[0].length) {
    chartData = result[0].map((item) => {
      return {
        'type': `${item[groupByField]}`,
        'value': Number(item[`${groupByField}_${computedField}`]),
      };
    });
  } else {
    chartData = [
      {
        'type': '2019 Q1',
        'value': 2.31,
      },
      {
        'type': '2019 Q2',
        'value': 2.04,
      },
      {
        'type': '2019 Q3',
        'value': 1.83,
      },
      {
        'type': '2019 Q4',
        'value': 1.71,
      },
      {
        'type': '2020 Q1',
        'value': 1.65,
      },
      {
        'type': '2020 Q2',
        'value': 1.59,
      },
      {
        'type': '2020 Q3',
        'value': 1.58,
      },
    ];
  }
  return chartData
}

export {
  areaHandler,
};
