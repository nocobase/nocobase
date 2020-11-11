import { defineConfig } from 'umi';

export default defineConfig({
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
  routes: [
    {
      exact: false,
      path: '/:path(.*)',
      component: '@/pages/index',
    },
  ],
});
