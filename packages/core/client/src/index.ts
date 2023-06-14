// 解决 build 报 dayjs 相关类型错误的问题
import 'dayjs/plugin/isBetween';
import 'dayjs/plugin/isSameOrAfter';
import 'dayjs/plugin/isoWeek';
import 'dayjs/plugin/localeData';
import 'dayjs/plugin/quarterOfYear';
import 'dayjs/plugin/utc';
import 'dayjs/plugin/weekday';

// 重置浏览器样式
import 'antd/dist/reset.css';

import './global.less';

export * from './acl';
export * from './antd-config-provider';
export * from './api-client';
export * from './appInfo';
export * from './application';
export * from './async-data-provider';
export * from './auth';
export * from './block-provider';
export * from './board';
export * from './china-region';
export * from './collection-manager';
export * from './document-title';
export * from './filter-provider';
export * from './formula';
export * from './hooks';
export * from './i18n';
export * from './icon';
export * from './plugin-manager';
export * from './pm';
export * from './powered-by';
export * from './record-provider';
export * from './route-switch';
export * from './schema-component';
export * from './schema-initializer';
export * from './schema-items';
export * from './schema-settings';
export * from './schema-templates';
export * from './system-settings';
export * from './user';

