import { Context } from '@nocobase/actions';

async function lineHandler(ctx: Context) {
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
        'type': '2011-11',
        'value': 1325,
      },
      {
        'type': '2011-12',
        'value': 1250,
      },
      {
        'type': '2012-01',
        'value': 1394,
      },
      {
        'type': '2012-02',
        'value': 1406,
      },
      {
        'type': '2012-03',
        'value': 1578,
      },
      {
        'type': '2012-04',
        'value': 1465,
      },
      {
        'type': '2012-05',
        'value': 1689,
      },
      {
        'type': '2012-06',
        'value': 1755,
      },
      {
        'type': '2012-07',
        'value': 1495,
      },
      {
        'type': '2012-08',
        'value': 1508,
      },
      {
        'type': '2012-09',
        'value': 1433,
      },
      {
        'type': '2012-10',
        'value': 1344,
      },
      {
        'type': '2012-11',
        'value': 1201,
      },
      {
        'type': '2012-12',
        'value': 1065,
      },
      {
        'type': '2013-01',
        'value': 1255,
      },
      {
        'type': '2013-02',
        'value': 1429,
      },
      {
        'type': '2013-03',
        'value': 1398,
      },
    ];
  }
  return chartData;
}

export {
  lineHandler,
};
