// @ts-nocheck

import { extend } from 'umi-request';

export const request = extend({
  prefix: '/api',
  timeout: 1000,
  headers: {
  },
});

export { default as useRequest  } from '@ahooksjs/use-request';

// @ts-ignore
export { history } from 'umi';
