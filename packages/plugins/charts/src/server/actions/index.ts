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
      const result = await ctx.db.sequelize.query(sql);
      if (result[0].length) {
        chartData = result[0].map((item) => {
          return {
            'type': `${groupByField}_${computedField ?? 'COUNT'}`,
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
      //由于目前nocobase暂时不支持聚合函数,简单sql拼接一下
      const sql = `SELECT ${groupByField},${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as ${`${groupByField}_${computedField}`} FROM ${collectionName} GROUP BY ${groupByField}`;
      const result = await ctx.db.sequelize.query(sql);
      if (result[0].length) {
        chartData = result[0].map((item) => {
          return {
            'type': `${item[groupByField]}`,
            'value': item[`${groupByField}_${computedField}`],
          };
        });
      } else {
        chartData = [
          { type: '1951 年', value: 27 },
          { type: '1952 年', value: 25 },
          { type: '1953 年', value: 18 },
          { type: '1954 年', value: 15 },
          { type: '1955 年', value: 10 },
          { type: '1956 年', value: 5 },
        ];
      }
      break;
    }
    case 'Column': {
      //由于目前nocobase暂时不支持聚合函数,简单sql拼接一下
      const sql = `SELECT ${groupByField},${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as ${`${groupByField}_${computedField}`} FROM ${collectionName} GROUP BY ${groupByField}`;
      const result = await ctx.db.sequelize.query(sql);
      if (result[0].length) {
        chartData = result[0].map((item) => {
          return {
            'type': `${item[groupByField]}`,
            'value': item[`${groupByField}_${computedField}`],
          };
        });
      } else {
        chartData = [
          { type: '1951 年', value: 27 },
          { type: '1952 年', value: 25 },
          { type: '1953 年', value: 18 },
          { type: '1954 年', value: 15 },
          { type: '1955 年', value: 10 },
          { type: '1956 年', value: 5 },
        ];
      }
      break;
    }
    case 'Line': {
      //由于目前nocobase暂时不支持聚合函数,简单sql拼接一下
      const sql = `SELECT ${groupByField},${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as ${`${groupByField}_${computedField}`} FROM ${collectionName} GROUP BY ${groupByField}`;
      const result = await ctx.db.sequelize.query(sql);
      if (result[0].length) {
        chartData = result[0].map((item) => {
          return {
            'type': `${item[groupByField]}`,
            'value': item[`${groupByField}_${computedField}`],
          };
        });
      } else {
        chartData = [
          {
            'Date': '2011-11',
            'scales': 1325,
          },
          {
            'Date': '2011-12',
            'scales': 1250,
          },
          {
            'Date': '2012-01',
            'scales': 1394,
          },
          {
            'Date': '2012-02',
            'scales': 1406,
          },
          {
            'Date': '2012-03',
            'scales': 1578,
          },
          {
            'Date': '2012-04',
            'scales': 1465,
          },
          {
            'Date': '2012-05',
            'scales': 1689,
          },
          {
            'Date': '2012-06',
            'scales': 1755,
          },
          {
            'Date': '2012-07',
            'scales': 1495,
          },
          {
            'Date': '2012-08',
            'scales': 1508,
          },
          {
            'Date': '2012-09',
            'scales': 1433,
          },
          {
            'Date': '2012-10',
            'scales': 1344,
          },
          {
            'Date': '2012-11',
            'scales': 1201,
          },
          {
            'Date': '2012-12',
            'scales': 1065,
          },
          {
            'Date': '2013-01',
            'scales': 1255,
          },
          {
            'Date': '2013-02',
            'scales': 1429,
          },
          {
            'Date': '2013-03',
            'scales': 1398,
          },
        ];
      }
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
