import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: "L'accès aux journaux de notification est requis.",
    logNotFound: 'Journal de notification introuvable.',
  },
};

export default frFR;
