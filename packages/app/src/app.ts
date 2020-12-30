import './css_browser_selector';
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

export async function getInitialState() {
  const { pathname, search } = location;
  console.log(location);
  let redirect = '';
  // if (href.includes('?')) {
    redirect = `?redirect=${pathname}${search}`;
  // }

  if (pathname !== '/login' && pathname !== '/register') {
    try {
      const { data = {} } = await umiRequest('/users:check', {
        method: 'post',
      });

      if (!data.id) {
        history.push('/login' + redirect);
        return {
          currentUser: {},
        };
      }

      return {
        currentUser: data,
      };
    } catch (error) {
      console.log(error)
      history.push('/login' + redirect);
    }
  }

  return {};
}