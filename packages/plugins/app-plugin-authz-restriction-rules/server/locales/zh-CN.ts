import auditLabels from '../../locales/zh-CN.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhCN: LocaleResource<typeof enUS> = {
  ...auditLabels,
  resourceTitle: '限制规则',
};

export default zhCN;
