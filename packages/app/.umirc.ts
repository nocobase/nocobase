import { defineConfig } from 'umi';

export default defineConfig({
  title: false,
  nodeModulesTransform: {
    type: 'none',
  },
  define: {
    'process.env.API': `/api`,
    // 'process.env.API': `http://localhost:${process.env.HTTP_PORT}/api`,
  },
  proxy: {
    '/api': {
      'target': `http://localhost:${process.env.HTTP_PORT}/`,
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
