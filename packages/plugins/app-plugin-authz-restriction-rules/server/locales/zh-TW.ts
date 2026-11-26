import auditLabels from '../../locales/zh-TW.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  ...auditLabels,
  resourceTitle: '限制規則',
};

export default zhTW;
