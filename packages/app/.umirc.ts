import { defineConfig } from 'umi';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

console.log('process.env.API_PORT', process.env.API_PORT);

export default defineConfig({
  title: false,
  nodeModulesTransform: {
    type: 'none',
  },
  define: {
    'process.env.API': `/api`,
    // 'process.env.API': `http://localhost:${process.env.API_PORT}/api`,
  },
  proxy: {
    '/api': {
      'target': `http://localhost:${process.env.API_PORT}/`,
      'changeOrigin': true,
      'pathRewrite': { '^/api' : '/api' },
    },
  },
  locale: {
    default: 'zh-CN',
    // antd: false,
    // title: false,
    baseNavigator: false,
    baseSeparator: '-',
  },
  routes: [
    {
      exact: false,
      path: '/:path(.*)',
      component: '@/pages/index',
    },
  ],
});
