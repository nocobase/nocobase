import fileOverview from './file-overview-zh-CN.js';
import databaseExplorerOverview from './database-explorer-overview-zh-CN.js';
import concurrencyOverview from './concurrency-overview-zh-CN.js';
import authenticationOverview from './authentication-overview-zh-CN.js';
import authorizationOverview from './authorization-overview-zh-CN.js';
import i18nOverview from './i18n-overview-zh-CN.js';
import agentsOverview from './agents-overview-zh-CN.js';
import databaseOverview from './database-overview-zh-CN.js';
import { featureOverview } from './feature-overview-zh-CN.js';

const copy: Readonly<Record<string, unknown>> = {
  fileOverview,
  databaseExplorerOverview,
  concurrencyOverview,
  authenticationOverview,
  authorizationOverview,
  i18nOverview,
  agentsOverview,
  databaseOverview,
  featureOverview,
  databaseExplorer: {
    expired: '登录已过期，请重新登录后继续。',
    forbidden: '你没有浏览此数据库的权限。',
    failed: '无法加载数据库信息。',
    signIn: '登录',
    retry: '重试',
    defaultConnection: '默认',
  },
};

export default copy;
