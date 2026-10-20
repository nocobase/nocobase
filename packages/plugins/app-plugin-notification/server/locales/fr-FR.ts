import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: "L'accès aux journaux de notification est requis.",
    logNotFound: 'Journal de notification introuvable.',
    testHeaderRequired:
      'L’en-tête de demande de test de notification est requis.',
    testForbidden:
      "L'autorisation d'envoi de test de notification est requise.",
    testInvalidRequest:
      'Le corps de la demande doit contenir une cible de test et des valeurs de champ.',
    testTargetUnavailable:
      "La ​​cible du test de notification n'est pas disponible.",
    testUnknownField: 'Champ de test de notification inconnu "{{name}}".',
    testRequiredField:
      'Le champ de test de notification « {{name}} » est requis.',
    testFieldTooLong:
      'Le champ de test de notification « {{name}} » doit contenir au maximum des caractères {{maxLength}}.',
    testFailed: 'Le test de notification a échoué.',
    testNotFound: "Le test de notification n'a pas été trouvé.",
  },
};

export default frFR;
