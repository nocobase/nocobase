import auditLabels from '../../locales/de-DE.js';
import type { LocaleResource } from '@nocobase/i18n';

import enUS from './en-US.js';
import { untranslated } from './untranslated.js';

// The API keys pages are not translated into this language yet and show in English.
const resource: LocaleResource<typeof enUS> = {
  ...untranslated(enUS, 'de-DE'),
  ...auditLabels,
};

export default resource;
