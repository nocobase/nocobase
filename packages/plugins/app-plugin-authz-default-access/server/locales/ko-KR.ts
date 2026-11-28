import auditLabels from '../../locales/ko-KR.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  ...auditLabels,
  resourceTitle: '기본 데이터 범위',
};

export default koKR;
