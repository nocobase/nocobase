import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  errors: {
    generic: "Quelque chose s'est mal passé. Veuillez réessayer.",
    network:
      "Impossible d'atteindre le serveur. Vérifiez votre connexion et réessayez.",
    rateLimited:
      'Trop de tentatives. Veuillez patienter un moment et réessayer.',
    INVALID_EMAIL_OR_PASSWORD: 'E-mail ou mot de passe incorrect.',
    INVALID_USERNAME_OR_PASSWORD:
      "Nom d'utilisateur ou mot de passe incorrect.",
    INVALID_PASSWORD: 'Mot de passe incorrect.',
    INVALID_EMAIL: 'Entrez une adresse e-mail valide.',
    INVALID_USERNAME:
      "Les noms d'utilisateur ne peuvent contenir que des lettres, des chiffres, des traits de soulignement et des points.",
    USERNAME_TOO_SHORT: "Ce nom d'utilisateur est trop court.",
    USERNAME_TOO_LONG: "Ce nom d'utilisateur est trop long.",
    USERNAME_IS_ALREADY_TAKEN: "Ce nom d'utilisateur est déjà pris.",
    USER_ALREADY_EXISTS: 'Un compte avec cette adresse e-mail existe déjà.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      'Un compte avec cette adresse e-mail existe déjà. Utilisez un autre e-mail.',
    PASSWORD_TOO_SHORT: 'Ce mot de passe est trop court.',
    RESET_PASSWORD_DISABLED:
      "La réinitialisation du mot de passe en libre-service n'est pas activée. Contactez un administrateur pour réinitialiser votre mot de passe.",
    PASSWORD_TOO_LONG: 'Ce mot de passe est trop long.',
    EMAIL_NOT_VERIFIED:
      'Vérifiez votre adresse e-mail avant de vous connecter.',
    INVALID_TOKEN: "Ce lien n'est pas valide ou a expiré.",
    TOKEN_EXPIRED: 'Ce lien a expiré.',
    ACCOUNT_DISABLED:
      'Ce compte est désactivé. Contactez votre administrateur.',
    SERVICE_ACCOUNT_NO_LOGIN:
      'Un compte de service ne peut pas se connecter ; il agit uniquement via les clés API.',
    invalidOriginWithAddress:
      "Cette origine n'est pas fiable. Définissez app.publicOrigin dans config.yml sur {{origin}}, redémarrez l'application et réessayez.",
    INVALID_ORIGIN:
      "Cette origine n'est pas fiable. Vérifiez app.publicOrigin dans config.yml, redémarrez l'application et réessayez.",
    INVALID_CSRF_ORIGIN:
      "Cette demande provenait d'un autre site et a été refusée. Actualisez la page et réessayez.",
  },
};

export default frFR;
