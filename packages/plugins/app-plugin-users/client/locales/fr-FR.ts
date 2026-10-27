import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Chargement',
  },
  accept: {
    title: "Accepter l'invitation",
    description: '{{inviter}} vous a invité.',
    summary: 'Vous rejoindrez également : {{items}}',
    loading: "Chargement de l'invitation…",
    email: 'E-mail',
    name: 'Nom',
    password: 'Mot de passe',
    nameRequired: 'Entrez votre nom.',
    passwordTooShort:
      'Le mot de passe nécessite au moins des caractères {{min}}.',
    submit: 'Créer un compte et rejoindre',
    join: "Accepter l'invitation",
    submitting: 'Rejoindre…',
    signedIn:
      'Vous êtes connecté en tant que {{name}}. Déconnectez-vous pour accepter cette invitation avec un nouveau compte.',
    signOut: 'Se déconnecter',
    signOutFailed: 'Impossible de se déconnecter.',
    existingAccount:
      'Cette adresse possède déjà un compte. Connectez-vous avec pour continuer.',
    goToLogin: 'Allez vous connecter',
    errors: {
      notFound: "Ce lien d'invitation n'est pas valide.",
      expired: 'Cette invitation a expiré. Demandez-en un nouveau.',
      accepted: 'Cette invitation a déjà été acceptée.',
      revoked: 'Cette invitation a été révoquée.',
      password: 'Le mot de passe ne répond pas aux exigences.',
      accountConflict: 'Un compte avec cette adresse ne peut pas être créé.',
      failed: "Quelque chose s'est mal passé. Veuillez réessayer.",
    },
  },
};

export default frFR;
