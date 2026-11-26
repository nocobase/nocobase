import auditLabels from '../../locales/ja-JP.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  ...auditLabels,
  resourceTitle: '制限ルール',
};

export default jaJP;
