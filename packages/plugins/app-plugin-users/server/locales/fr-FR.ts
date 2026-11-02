import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  invitationEmail: {
    subject: '{{inviter}} vous a invité à {{app}}',
    intro: '{{inviter}} vous a invité à {{app}}.',
    summary: 'Vous rejoindrez également : {{items}}.',
    separator: ', ',
    action: "Accepter l'invitation",
    validity:
      "Ouvrez le lien pour définir votre nom et votre mot de passe. Cela fonctionne une fois, jusqu'à {{date}}.",
    fallback: "Si le lien ne s'ouvre pas, copiez-le dans votre navigateur :",
  },
};

export default frFR;
