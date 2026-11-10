import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Chargement',
  },
  notificationTemplates: {
    invitation: {
      contributor: 'Utilisateurs',
      category: 'Comptes',
      name: "Invitation d'utilisateur",
      trigger:
        "Un administrateur invite une personne, ou renvoie une invitation, avec l'option e-mail sélectionnée.",
      recipients: "La personne invitée, à l'adresse e-mail saisie pour elle.",
      businessRule:
        "Envoyé à chaque création ou renvoi d'une invitation avec l'option e-mail sélectionnée. Aucun interrupteur séparé ne permet de le désactiver.",
      languagePolicy:
        "Le corps de l'e-mail présente toutes les langues l'une après l'autre. L'objet est en anglais.",
      channel: "Expéditeur de l'e-mail d'invitation",
      variables: {
        app: "Nom de l'application",
        inviter: "Nom de la personne qui a envoyé l'invitation",
        items: "Rôles ou accès accordés par l'invitation",
        date: "Date d'expiration de l'invitation",
        url: "Lien pour accepter l'invitation ; l'aperçu utilise un lien fictif",
      },
    },
  },
  accept: {
    title: "Accepter l'invitation",
    description: '{{inviter}} vous a invité.',
    summary: 'Vous rejoindrez également : {{items}}',
    loading: "Chargement de l'invitation…",
    email: 'E-mail',
    name: 'Nom',
    username: 'Nom d’utilisateur (facultatif)',
    usernameHint:
      'Vous pouvez utiliser ce nom d’utilisateur pour vous connecter.',
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
    alreadyHaveAccount: 'Vous avez déjà un compte ? Connectez-vous',
    goToLogin: 'Allez vous connecter',
    errors: {
      notFound: "Ce lien d'invitation n'est pas valide.",
      expired: 'Cette invitation a expiré. Demandez-en un nouveau.',
      accepted: 'Cette invitation a déjà été acceptée.',
      revoked: 'Cette invitation a été révoquée.',
      password: 'Le mot de passe ne répond pas aux exigences.',
      usernameConflict:
        'Ce nom est déjà utilisé comme nom d’utilisateur ou adresse e-mail. Choisissez-en un autre.',
      accountConflict: 'Un compte avec cette adresse ne peut pas être créé.',
      failed: "Quelque chose s'est mal passé. Veuillez réessayer.",
    },
  },
};

export default frFR;
