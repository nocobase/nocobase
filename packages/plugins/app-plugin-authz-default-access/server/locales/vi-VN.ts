import auditLabels from '../../locales/vi-VN.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  ...auditLabels,
  resourceTitle: 'Phạm vi dữ liệu mặc định',
};

export default viVN;
