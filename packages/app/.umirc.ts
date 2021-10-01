import { defineConfig } from 'umi';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  define: {
    'process.env.API_URL': process.env.API_URL,
    'process.env.API_PORT': process.env.API_PORT,
  },
  proxy: {
    '/api': {
      'target': `http://localhost:${process.env.API_PORT}/`,
      'changeOrigin': true,
      'pathRewrite': { '^/api': '/api' },
    },
  },
  routes: [
    { path: '/', exact: false, component: '@/pages/index' },
  ],
  fastRefresh: {},
  locale: {
    default: 'zh-CN',
    // antd: false,
    // title: false,
    baseNavigator: false,
    baseSeparator: '-',
  },
});
