import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  language: {
    label: 'Sprache',
    switchError: 'Die Sprache kann nicht gewechselt werden.',
  },
};

export default deDE;
