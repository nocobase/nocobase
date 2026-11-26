import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  demo: {
    preparing: 'Demo-Postfächer werden vorbereitet…',
    setUp: 'Demo-Postfächer einrichten',
    setupFailed: 'Die Demo-Postfächer konnten nicht eingerichtet werden.',
  },
};

export default deDE;
