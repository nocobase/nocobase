import { Context } from '@nocobase/actions';

async function handleGetChartData(ctx: Context) {
  const { params: { values } } = ctx.action;
  const { chartType, collectionName, filter, computedField, aggregateFunction, type, groupByField } = values;
  const repo = ctx.db.getRepository(collectionName);
  let chartData;
  //处理不同collection chartType filter 对应的数据
  switch (chartType) {
    case 'Pie': {
      //由于目前nocobase暂时不支持聚合函数,简单sql拼接一下
      const sql = `SELECT ${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as ${`${groupByField}_${computedField}`} FROM ${collectionName} GROUP BY ${groupByField}`;
      console.log(sql, 'sql==========');
      const result = await ctx.db.sequelize.query(sql);
      console.log(result, '_result==========');
      console.log(JSON.stringify(result));
      if (result[0].length) {
        chartData = result[0].map((item) => {
          return {
            'type': `${groupByField}_${computedField ?? "COUNT"}`,
            'value': item[`${groupByField}_${computedField}`],
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
      break;
    }
    case 'Bar': {
      chartData = [
        { year: '1951 年', value: 38 },
        { year: '1952 年', value: 52 },
        { year: '1956 年', value: 61 },
        { year: '1957 年', value: 145 },
        { year: '1958 年', value: 48 },
      ];
      break;
    }
  }
  return chartData;
}

export const getChartData = async (ctx: Context, next) => {
  const chartData = await handleGetChartData(ctx);
  ctx.body = {
    chartData,
  };
  return next();
};
