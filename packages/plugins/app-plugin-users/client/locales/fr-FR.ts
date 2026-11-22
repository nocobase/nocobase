import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  // The shared list, form and overlay components (`components/`).
  actions: {
    close: 'Fermer',
  },
  dataTable: {
    filters: 'Filtres',
    filtersApplied: 'Filtres · {{count}}',
    firstPage: 'Aller à la première page',
    hideColumn: 'Masquer',
    lastPage: 'Aller à la dernière page',
    nextPage: 'Aller à la page suivante',
    pageOf: 'Page {{page}} sur {{pageCount}}',
    previousPage: 'Aller à la page précédente',
    rowsPerPage: 'Lignes par page',
    selectPage: 'Tout sélectionner sur cette page',
    selectedCount: '{{selected}} ligne(s) sélectionnée(s) sur {{total}}.',
    sort: 'Trier',
    sortAscending: 'Croissant',
    sortBy: 'Trier par',
    sortDescending: 'Décroissant',
    toggleColumns: 'Afficher ou masquer les colonnes',
    view: 'Affichage',
  },
  formFeedback: {
    denied:
      'Vous ne pouvez pas envoyer ce formulaire avec vos accès actuels. Votre saisie a été conservée.',
    failed:
      'Enregistrement impossible. Votre saisie a été conservée. Réessayez.',
    field: 'Cette valeur a été refusée. Vérifiez-la et réessayez.',
    invalid: 'Vérifiez les champs signalés et réessayez.',
    network:
      'Connexion impossible. Vérifiez votre connexion et réessayez. Votre saisie a été conservée.',
  },
  listFeedback: {
    clear: 'Effacer les filtres',
    loading: 'Chargement',
    refreshFailed:
      'Échec de l’actualisation ; affichage des données précédentes',
    retry: 'Réessayer',
    retrying: 'Nouvelle tentative…',
    signIn: 'Se connecter',
    empty: 'Aucune donnée pour le moment',
    noResults: 'Aucun résultat',
    forbidden: 'Accès refusé',
    unauthenticated: 'Session expirée',
    failed: 'Impossible de charger la liste',
  },
  pendingFeedback: {
    longWait:
      'Cela prend plus de temps que d’habitude. Vous pouvez continuer à patienter.',
    working: 'Traitement…',
  },
  routeOverlay: {
    close: 'Fermer',
  },
  status: {
    loading: 'Chargement',
    refreshing: 'Actualisation',
  },
  management: {
    actions: 'Actions',
    actionsFor: 'Actions pour {{name}}',
    all: 'Tous les statuts',
    allRoles: 'Tous les rôles',
    assignedRoles: 'Rôles attribués',
    backToSource: 'Revenir à la page précédente',
    cancel: 'Annuler',
    clear: 'Effacer les filtres',
    confirm: 'Confirmer',
    conflict:
      'La demande entre en conflit avec les données actuelles. Consultez l’enregistrement le plus récent avant de réessayer.',
    create: 'Créer',
    created: 'Utilisateur « {{name}} » créé',
    denied: 'Vous n’avez pas accès. Contactez un administrateur.',
    disable: 'Désactiver',
    disableHint:
      'Cet utilisateur ne pourra plus se connecter et ses sessions en cours prendront fin.',
    disableTitle: 'Désactiver l’utilisateur « {{name}} » ?',
    disabled: 'Désactivé',
    discardHint: 'Vos modifications non enregistrées seront perdues.',
    discardTitle: 'Abandonner les modifications ?',
    editUser: 'Modifier l’utilisateur',
    email: 'E-mail',
    enable: 'Activer',
    enableHint: 'Cet utilisateur pourra de nouveau se connecter.',
    enableTitle: 'Activer l’utilisateur « {{name}} » ?',
    enabled: 'Activé',
    failed: 'Impossible de terminer la demande. Réessayez.',
    identityConflict:
      'Cette adresse e-mail ou ce nom d’utilisateur est déjà utilisé.',
    invalidEmail: 'Saisissez une adresse e-mail valide',
    invalidRequest:
      'Certaines valeurs ne sont pas valides. Vérifiez votre saisie ou vos filtres, puis réessayez.',
    listChanged: 'La liste a changé. Réessayez.',
    loading: 'Chargement',
    missing: 'Cet enregistrement n’existe pas ou a été supprimé.',
    name: 'Nom',
    newUser: 'Nouvel utilisateur',
    noAssignedRoles: 'Aucun rôle attribué',
    noRoleAccess:
      'Cet utilisateur peut toujours se connecter et utiliser les fonctions de base du compte. Aucun accès métier n’est accordé par des rôles.',
    noRolesFound: 'Aucun rôle trouvé.',
    password: 'Mot de passe initial',
    passwordPolicy:
      'Le mot de passe ne respecte pas la politique de mot de passe actuelle.',
    required: 'Renseignez ce champ',
    retry: 'Réessayer',
    revokeHint: 'Cet utilisateur devra se reconnecter.',
    revokeRoleHint: 'L’accès accordé par les rôles listés sera retiré.',
    revokeRoleTitle: 'Retirer des rôles à « {{name}} » ?',
    revokeSessions: 'Révoquer les sessions',
    revokeTitle: 'Révoquer les sessions de « {{name}} » ?',
    roleFilter: 'Filtrer par rôle',
    roleFilterIncomplete:
      'Choisissez à la fois une portée de rôle et un rôle, ou effacez les filtres.',
    save: 'Enregistrer',
    saved: '« {{name}} » enregistré',
    saving: 'Enregistrement…',
    searchRoles: 'Rechercher des rôles',
    selectRoles: 'Sélectionner des rôles',
    sessionEnded: 'Votre session a expiré. Reconnectez-vous.',
    signInAgain: 'Se reconnecter',
    status: 'Statut',
    total_one: '{{count}} utilisateur',
    total_other: '{{count}} utilisateurs',
    userActionSaved: {
      disable: 'Utilisateur « {{name}} » désactivé',
      enable: 'Utilisateur « {{name}} » activé',
      revokeSessions: 'Sessions actives de « {{name}} » révoquées',
    },
    userSearch: 'Rechercher par nom, nom d’utilisateur ou e-mail',
    username: 'Nom d’utilisateur',
    users: 'Utilisateurs',
    usersDescription: 'Gérez les comptes, les accès et les sessions actives.',
    total_many: '{{count}} d’utilisateurs',
  },
  humanOnly: {
    manageAccounts:
      "Seule une personne gère les comptes : aucune clé d'API ne le peut.",
  },
  page: {
    roles: 'Rôles',
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
        "Rédigé dans une seule langue, choisie lors de l'invitation : la langue d'interface de la personne qui invite, sauf si une autre est choisie. Le renvoi la conserve. Si cette langue n'a pas de texte d'e-mail, l'e-mail utilise la langue par défaut de l'application et l'anglais.",
      channel: "Expéditeur de l'e-mail d'invitation",
      variables: {
        app: "Nom de l'application",
        inviter: "Nom de la personne qui a envoyé l'invitation",
        items: "Rôles ou accès accordés par l'invitation",
        date: "Date d'expiration de l'invitation, dans la langue de l'e-mail et en UTC",
        url: "Lien pour accepter l'invitation ; l'aperçu utilise un lien fictif",
      },
    },
  },
  accept: {
    title: "Accepter l'invitation",
    language: 'Langue',
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
