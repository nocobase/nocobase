import './css_browser_selector';
import { RequestConfig, request as umiRequest, history } from 'umi';

import { configResponsive } from 'ahooks';

configResponsive({
  small: 0,
  middle: 800,
  large: 1200,
});

export const request: RequestConfig = {
  prefix: process.env.API,
  errorConfig: {
    adaptor: resData => {
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
    },
  ],
};

// TODO：目前这块是写在代码里的，待改进
const pathnames = ['/login', '/register', '/lostpassword', '/resetpassword'];

export async function getInitialState() {
  const { pathname, search } = location;
  console.log(location);
  const { data: systemSettings = {} } = await umiRequest(
    '/system_settings:get?fields[appends]=logo,logo.storage',
    {
      method: 'get',
    },
  );
  let redirect = `?redirect=${pathname}${search}`;

  if (!pathnames.includes(pathname)) {
    try {
      const { data = {} } = await umiRequest('/users:check', {
        method: 'post',
      });

      if (!data.id) {
        history.push('/login' + redirect);
        return {
          systemSettings,
          currentUser: {},
        };
      }

      return {
        systemSettings,
        currentUser: data,
      };
    } catch (error) {
      console.log(error);
      history.push('/login' + redirect);
    }
  }

  return {
    systemSettings,
    currentUser: {},
  };
}
