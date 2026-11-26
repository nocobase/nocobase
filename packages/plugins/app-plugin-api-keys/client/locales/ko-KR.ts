import auditLabels from '../../locales/ko-KR.js';
import type { LocaleResource } from '@nocobase/i18n';

import enUS from './en-US.js';
import { untranslated } from './untranslated.js';

// The API keys pages are not translated into this language yet and show in English.
const resource: LocaleResource<typeof enUS> = {
  ...untranslated(enUS, 'ko-KR'),
  ...auditLabels,
};

export default resource;
