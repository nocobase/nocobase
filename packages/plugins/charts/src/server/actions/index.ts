import {Context} from "@nocobase/actions";

async function handleGetChartData(ctx: Context) {
  // {
  //   filterByTk: undefined,
  //   resourceName: 'chartData',
  //   actionName: 'data',
  //   values: {
  //     collectionName: 'users',
  //     chartType: 'Pie',
  //     type: 'builtIn',
  //     filter: { '$and': [] },
  //     aggregateFunction: 'SUM',
  //     computedField: 'id'
  // }
  // } =======================

  // const {
  //   params: {type},
  // } = ctx.action;
  // const repo = ctx.db.getRepository(MapConfigurationCollectionName);
  // const record = await repo.findOne({
  //   filter: {
  //     type,
  //   },
  // });
  const {params:{values}} = ctx.action;
  console.log(values)
  const {chartType,collectionName,filter,computedField,aggregateFunction} =values
  const repo = ctx.db.getRepository(collectionName);
  let chartData
  //处理不同collection chartType filter 对应的数据
  switch (chartType) {
    case 'Pie': {
      //根据filter computedField aggregateFunction 分组查询聚合函数（SUM，COUNT，AVG）的值,这里只模拟Count
      //由于目前nocobase暂时不支持聚合函数,简单模拟一下
      const result = await repo.findAndCount({
        fields: [computedField],
        filter: filter,
      });
      console.log(JSON.stringify(result)) /*[[{"id":1},{"id":2}],2] */
      if(result[0].length){
        chartData = result[0].map((item)=>{
          return {
            type:computedField,
            value:item[computedField]
          }
        })
      }else{
        chartData = [
          {type: '分类一', value: 27},
          {type: '分类二', value: 25},
          {type: '分类三', value: 18},
          {type: '分类四', value: 15},
          {type: '分类五', value: 10},
          {type: '其他', value: 5},
        ]
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
  return chartData
}

export const getChartData = async (ctx: Context, next) => {
  const chartData = await handleGetChartData(ctx)
  ctx.body = {
    chartData
  };
  return next();
};
