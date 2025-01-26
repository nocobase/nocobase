/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// @ts-ignore
import { version } from '../../package.json';

const deps: Record<string, string> = {
  '@nocobase': `${version.split('.').slice(0, 2).join('.')}.x`, // 0.12.x
  '@formily': '2.x',

  '@formily/antd-v5': '1.x',
  jsonwebtoken: '8.x',
  'cache-manager': '5.x',
  sequelize: '6.x',
  umzug: '3.x',
  'async-mutex': '0.5.x',
  '@formulajs/formulajs': '4.x',
  mathjs: '10.x',
  winston: '3.x',
  'winston-daily-rotate-file': '4.x',
  koa: '2.x',
  '@koa/cors': '3.x',
  '@koa/router': '9.x',
  multer: '1.x',
  '@koa/multer': '3.x',
  'koa-bodyparser': '4.x',
  'koa-static': '5.x',
  'koa-send': '5.x',
  react: '18.x',
  'react-dom': '18.x',
  'react-router': '6.x',
  'react-router-dom': '6.x',
  antd: '5.x',
  'antd-style': '3.x',
  '@ant-design/icons': '5.x',
  '@ant-design/cssinjs': '1.x',
  i18next: '22.x',
  'react-i18next': '11.x',
  '@dnd-kit/accessibility': '3.x',
  '@dnd-kit/core': '6.x',
  '@dnd-kit/modifiers': '6.x',
  '@dnd-kit/sortable': '6.x',
  '@dnd-kit/utilities': '3.x',
  dayjs: '1.x',
  mysql2: '3.x',
  pg: '8.x',
  'pg-hstore': '2.x',
  sqlite3: '5.x',
  supertest: '6.x',
  axios: '1.7.x',
  '@emotion/css': '11.x',
  ahooks: '3.x',
  lodash: '4.x',
  'china-division': '2.x',
  cronstrue: '2.x',
};

export default deps;
