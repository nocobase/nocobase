import { defineConfig } from 'dumi';

export default defineConfig({
  title: ' ',
  hash: true,
  ssr: {},
  exportStatic: {},
  mode: 'site',
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
