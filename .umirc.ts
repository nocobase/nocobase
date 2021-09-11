import { defineConfig } from 'dumi';

console.log('process.env.API_URL', process.env.API_URL)

export default defineConfig({
  title: ' ',
  hash: true,
  define: {
    'process.env.API_URL': process.env.API_URL,
  },
  // mfsu: {},
  // ssr: {},
  // exportStatic: {},
  mode: 'doc',
  logo: 'https://www.nocobase.com/dist/images/logo.png',
  navs: {
    'en-US': [
      null,
      { title: 'GitHub', path: 'https://github.com/nocobase/nocobase' },
      { title: 'Changelog', path: 'https://github.com/nocobase/nocobase/releases' },
    ],
    'zh-CN': [
      null,
      { title: 'GitHub', path: 'https://github.com/nocobase/nocobase' },
      { title: '更新日志', path: 'https://github.com/nocobase/nocobase/releases' },
    ],
  },
  // more config: https://d.umijs.org/config
});
