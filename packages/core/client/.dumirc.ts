import { defineConfig } from 'dumi';
import { defineThemeConfig } from 'dumi-theme-nocobase'
import { getUmiConfig } from '@nocobase/devtools/umiConfig';
import fs from 'fs';
import path from 'path';

const contributingPath = path.resolve(__dirname, './contributing.md');
const docsContributingPath = path.resolve(__dirname, './docs/contributing.md');

// check if the target path already exists, and remove it if it does
if (fs.existsSync(docsContributingPath)) {
  fs.unlinkSync(docsContributingPath);
}

fs.copyFileSync(contributingPath, docsContributingPath);

const umiConfig = getUmiConfig();

export default defineConfig({
  hash: true,
  alias: {
    ...umiConfig.alias,
  },
  resolve: {
    atomDirs: [
      { type: 'component', dir: 'src' },
      { type: 'component', dir: 'src/schema-component/antd' },
      { type: 'component', dir: 'src/route-switch/antd' },
    ]
  },
  themeConfig: defineThemeConfig({
    title: 'NocoBase',
    logo: 'https://www.nocobase.com/images/logo.png',
    github: 'https://github.com/nocobase/nocobase',
    footer: 'nocobase | Copyright © 2022',
    sidebarGroupModePath: ['/components'],
    nav: [
      {
        title: 'Intro',
        link: '/intro',
      },
      {
        title: 'Client',
        link: '/components/acl',
      },
      {
        title: 'Develop',
        link: '/develop',
      },
      {
        title: 'Contributing',
        link: '/contributing',
      }
    ]
  })
});
