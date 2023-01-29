import { Context } from '@nocobase/actions';

async function handleGetChartData(ctx: Context) {
  const { params: { values } } = ctx.action;
  const { chartType, collectionName, filter, computedField, aggregateFunction, type, groupByField } = values;
  const repo = ctx.db.getRepository(collectionName);
  const collection = ctx.db.getCollection(collectionName);
  let chartData;
  //处理不同collection chartType filter 对应的数据
  switch (chartType) {
    case 'Pie': {
      //由于目前nocobase暂时不支持聚合函数,简单sql拼接一下
      const sql = `SELECT ${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as ${`${groupByField}_${computedField}`} FROM ${collection.model.tableName} GROUP BY ${groupByField}`;
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
      const sql = `SELECT ${groupByField},${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as ${`${groupByField}_${computedField}`} FROM ${collection.model.tableName} GROUP BY ${groupByField}`;
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
      const sql = `SELECT ${groupByField},${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as ${`${groupByField}_${computedField}`} FROM ${collection.model.tableName} GROUP BY ${groupByField}`;
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
      const sql = `SELECT ${groupByField},${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as ${`${groupByField}_${computedField}`} FROM ${collection.model.tableName} GROUP BY ${groupByField}`;
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
      break;
    }
    case 'Area': {
      //由于目前nocobase暂时不支持聚合函数,简单sql拼接一下
      const sql = `SELECT ${groupByField},${aggregateFunction}(${aggregateFunction==='COUNT' ?'*':computedField}) as ${`${groupByField}_${computedField}`} FROM ${collection.model.tableName} GROUP BY ${groupByField}`;
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
