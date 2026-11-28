import auditLabels from '../../locales/ko-KR.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  ...auditLabels,
  resourceTitle: '공유 규칙',
};

export default koKR;
