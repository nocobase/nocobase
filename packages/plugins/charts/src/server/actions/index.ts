import { Context } from '@nocobase/actions';
import {
  pieHandler,
  columnHandler,
  barHandler,
  lineHandler,
  areaHandler,
} from '../handlers';

async function handleGetChartData(ctx: Context) {
  const { params: { values } } = ctx.action;
  const { chartType } = values;
  let chartData;
  //处理不同collection chartType filter 对应的数据
  switch (chartType) {
    case 'Pie': {
      chartData = await pieHandler(ctx);
      break;
    }
    case 'Bar': {
      chartData = await barHandler(ctx);
    }
    case 'Column': {
      chartData = await columnHandler(ctx);
    }
    case 'Line': {
      chartData = await lineHandler(ctx);
    }
    case 'Area': {
      chartData = await areaHandler(ctx);
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
