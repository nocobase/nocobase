import { RequestConfig, request as umiRequest, history } from 'umi';

export const request: RequestConfig = {
  prefix: process.env.API,
  errorConfig: {
    adaptor: (resData) => {
      return {
        ...resData,
        success: true,
        showType: 0,
      };
    },
  },
  middlewares: [
    async (ctx, next) => {
      const { headers } = ctx.req.options as any;
      const token = localStorage.getItem('NOCOBASE_TOKEN');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await next();
    }
  ],
};