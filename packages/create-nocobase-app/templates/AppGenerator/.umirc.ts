import { defineConfig } from 'umi';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, './.env'),
});

process.env.MFSU_AD = 'none';

const baseUrl = `http://localhost:${process.env.API_PORT || '13001'}/`;

export default defineConfig({
  favicon: '/favicon.png',
  nodeModulesTransform: {
    type: 'none',
  },
  define: {
    'process.env.API_URL': process.env.API_URL || `${baseUrl}api/`,
    'process.env.API_PORT': process.env.API_PORT || '13001',
  },
  proxy: {
    '/api': {
      target: `http://localhost:${process.env.API_PORT || '13001'}/`,
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
    },
  },
  routes: [{ path: '/', exact: false, component: '@/pages/index' }],
  fastRefresh: {},
  locale: {
    default: 'zh-CN',
    // antd: false,
    // title: false,
    baseNavigator: false,
    baseSeparator: '-',
  },
});
