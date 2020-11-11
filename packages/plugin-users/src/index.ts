// @ts-ignore
import { history, request } from 'umi';

export async function getInitialState() {
  const { pathname, search } = location;
  console.log(location);
  let redirect = '';
  // if (href.includes('?')) {
    redirect = `?redirect=${pathname}${search}`;
  // }

  if (pathname !== '/login' && pathname !== '/register') {
    try {
      const { data = {} } = await request('/users:check', {
        method: 'post',
      });

      if (!data.data) {
        history.push('/login' + redirect);
        return {
          currentUser: {},
        };
      }

      return {
        currentUser: data.data,
      };
    } catch (error) {
      console.log(error)
      history.push('/login' + redirect);
    }
  }

  return {};
}