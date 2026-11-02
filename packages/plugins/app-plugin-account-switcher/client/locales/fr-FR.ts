import type { AccountSwitcherResource } from './en-US.js';

const frFR: AccountSwitcherResource = {
  menu: {
    switchAccount: 'Changer de compte',
    search: 'Rechercher un nom ou un e-mail',
    loading: 'Chargement des comptes…',
    empty: 'Aucun compte correspondant',
    more: '{{count}} de plus. Recherchez pour affiner la liste.',
    loadFailed: 'Impossible de charger les comptes.',
  },
  banner: {
    actingAs: 'Vous agissez en tant que {{name}}',
    description: 'Les modifications sont enregistrées sous ce compte.',
    return: 'Revenir à {{name}}',
  },
  errors: {
    switchFailed: 'Impossible de changer de compte. Veuillez réessayer.',
    returnFailed: 'Impossible de revenir à votre compte. Veuillez réessayer.',
  },
};

export default frFR;
