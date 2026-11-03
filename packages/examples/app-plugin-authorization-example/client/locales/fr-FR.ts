import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  practice: {
    intro:
      "Utilisez les comptes ci-dessous à la place d'un administrateur. Les administrateurs contournent les restrictions. Il s’agit d’exercices de collaboration commerciale indépendants et non d’un flux de travail complet d’approbation du devis à la commande. Chaque exercice démarre à partir de l'état d'enregistrement prédéfini.",
    read: {
      title: 'Un assistant consulte les informations du projet',
      steps:
        'Connectez-vous en tant que sales_assistant : les projets affichent project-1, project-2 et project-3, mais aucune action de modification. Les devis et commandes restent limités au projet détenu.',
      reason:
        "Le partage de projet autorise les enregistrements à des fins de visualisation uniquement ; il n'accorde ni édition ni enregistrements associés. Le confidentiel project-4 reste exclu.",
    },
    scopes: {
      title: 'Un ingénieur prépare et soumet un devis',
      steps:
        'Connectez-vous en tant que sales_engineer : modifiez et soumettez votre quote-2. Vous pouvez consulter quote-5, mais vous ne pouvez pas modifier ou soumettre le devis d’un collègue. Vous pouvez continuer à préparer le quote-6, mais vous ne pouvez pas le soumettre pour un projet en dehors de votre région.',
      reason:
        "Les citations non confidentielles constituent des documents de référence internes dans toutes les régions. Le préparateur est propriétaire du contenu ; la responsabilité régionale régit la soumission. La visualisation n'autorise pas la modification. Les commandes existantes font référence à des devis acceptés distincts ; la soumission d’un devis pratique ne crée pas de commande.",
    },
    handover: {
      title: 'Un ingénieur délégué reprend un devis',
      steps:
        "Un maître d'ouvrage de la région Sud remet quote-7 à sales_proposal, un ingénieur de la région Nord. Connectez-vous en tant que sales_proposal, modifiez le devis et soumettez-le. En tant qu'administrateur, réinitialisez les enregistrements et supprimez sales_proposal de la règle de partage de transfert de devis de proposition. Reconnectez-vous : le compte ne peut plus modifier ni soumettre ce devis.",
      reason:
        "Le transfert permet d'éditer et de soumettre ce devis ainsi que l'accès au projet nécessaire à la soumission ; il ne délègue pas toute la région Sud. Le rôle d'ingénieur accorde les opérations, tandis que le partage identifie les enregistrements. En tant qu'exercice avancé, retirez soit la portée du projet, soit celle du devis : la soumission nécessite les deux.",
    },
    delivery: {
      title: 'Un spécialiste de la livraison exécute une commande',
      steps:
        'Connectez-vous en tant que sales_delivery. Ouvrez order-2, affectez un transporteur, maintenez les chèques et saisissez une référence de livraison. Après confirmation de la livraison, ni ses relations ni son état de livraison ne pourront plus être modifiés. Réinitialisez les enregistrements avant de répéter l’exercice.',
      reason:
        'Le personnel de livraison saisit uniquement les commandes ; les liens vers des devis et des projets ne donnent pas accès à ces pages.',
    },
  },
  reset: {
    action: "Réinitialiser les enregistrements d'entraînement",
    cancel: 'Annuler',
    confirm:
      'Restaurer les projets, devis et commandes prédéfinis pour chaque compte démo ? Les modifications apportées à ces enregistrements seront écrasées.',
    description:
      "Un administrateur peut réinitialiser ici les enregistrements commerciaux avant de répéter un exercice. Les comptes et les paramètres d'autorisation sont conservés ; restaurer manuellement toutes les modifications d’autorisation.",
    done: "Dossiers d'entraînement restaurés. Actualisez toutes les listes d’enregistrements ouvertes.",
  },
  access: {
    title: 'Vos rôles',
    direct: 'Affectation directe',
    coverage:
      'Chaque exemple de compte assume ses responsabilités professionnelles via une affectation directe.',
  },
  rules: {
    public: 'Exclure les projets confidentiels',
    delivery: 'Commandes régionales pour livraison',
    handover: 'Remise du devis de proposition',
    projects: 'Exemples de projets partagés',
  },
  accountMenus: {
    assistant: 'Projets, devis et commandes (lecture seule)',
    engineer:
      'Consulter des citations non confidentielles; modifier vos propres devis et les soumettre dans la région assignée',
    manager:
      'Gérer les projets détenus ; les devis et les commandes sont en lecture seule',
    delivery: 'Commandes uniquement ; confirmer les livraisons régionales',
    proposal: 'Modifier et soumettre le quote-7 remis',
    coordinator: "Gérer project-8, en dehors de la région d'origine",
  },
  relations: {
    access: {
      notGranted:
        "Lecture seule : la coordination de la livraison n'est pas accordée.",
      outsideScope:
        'Lecture seule : cette commande ne fait pas partie de votre périmètre de livraison.',
      notReady: 'Les commandes livrées ne peuvent pas être modifiées.',
    },
    title: "Relations d'ordre",
    description:
      "Attribuez un transporteur actif, effectuez les contrôles et gérez les transporteurs collaborateurs. Essayez un compte de livraison et un compte en lecture seule pour comparer l'accès.",
    order: 'Commande',
    carrier: 'Transporteur',
    unassigned: 'Aucun attribué',
    assign: 'Attribuer un transporteur',
    disconnect: "Supprimer l'affectation",
    checks: 'Chèques de livraison',
    done: 'Terminé',
    pending: 'En attente',
    toggle: "Basculer l'achèvement",
    delete: 'Supprimer le point de contrôle',
    checkTitle: 'Vérifier le titre',
    add: 'Ajouter un chèque',
    collaborators: 'Transporteurs collaborateurs',
    note: 'Note de collaboration',
    addProposal: 'Ajouter le transporteur sélectionné',
    replace: 'Remplacer par le transporteur sélectionné',
    clear: 'Supprimer tous les collaborateurs',
    unavailable: 'Ces relations ne sont pas accessibles.',
    loading: 'Chargement des relations…',
  },
  sales: {
    manageRelations: 'Organiser la livraison des commandes',
    saveFirst: 'Enregistrez les modifications avant de les soumettre.',
    states: {
      draft: 'Brouillon',
      submitted: 'Soumis',
      accepted: 'Accepté',
      ready: 'Prêt',
      delivered: 'Livré',
    },
    errors: {
      session: 'La session a expiré. Connectez-vous à nouveau.',
      input: 'Vérifiez le montant et les champs obligatoires.',
      conflict:
        "L'état de l'enregistrement a changé. Actualisez avant de réessayer.",
      request: 'La demande a échoué. Vérifiez votre connexion et réessayez.',
    },
    operation: {
      outsideScope: "Hors du champ d'application autorisé",
      notReady: 'Seules les commandes prêtes peuvent être livrées',
      allowed: 'Dans le cadre de la soumission',
      notGranted: 'Lecture seule — opération non accordée',
      quoteScope: 'Hors périmètre de cotation autorisé',
      projectScope: 'Projet hors périmètre autorisé',
      notDraft: 'Seuls les brouillons peuvent être soumis',
      invalidAmount: 'Le montant doit être positif',
    },
    preparedBy: 'Préparé par',
    parentProject: 'Projet',
    sourceQuote: 'Citation source',
    relationships: 'Enregistrements associés',
    relatedQuotes: 'Citations de projets',
    relatedOrders: 'Commandes de projets',
    filtered: 'Filtré par',
    clearFilter: 'Effacer le filtre',
    noPageAccess: 'Aucun accès aux pages',
    descriptions: {
      projects:
        'Ouvrir les devis et les commandes associés à un projet. Les listes associées affichent uniquement les enregistrements auxquels ce compte peut accéder.',
      quotes:
        'Un projet peut avoir plusieurs devis. La soumission vérifie la portée du projet et le préparateur de devis de manière indépendante, puis valide le statut et le montant du brouillon.',
      orders:
        'Chaque commande fait référence à son devis source et à son projet. Les comptes de livraison saisissent uniquement les commandes ; les références ne donnent pas accès à d’autres pages ou enregistrements.',
    },
    delivery: 'Livraison',
    orders: 'Commandes',
    editProject: 'Modifier les informations du projet',
    editQuote: 'Modifier les prix',
    submit: 'Soumettre un devis',
    submitScopes: {
      projects: 'Projets liés aux devis',
      quotes: 'Devis autorisés à être soumis',
    },
    deliver: 'Confirmer la livraison',
    amount: 'Montant',
    status: 'Statut',
    deliveryReference: 'Référence de livraison',
    group: 'Collaboration commerciale',
    title: "Exemple d'autorisations de vente",
    projects: 'Projets',
    quotes: 'Devis',
    view: 'Afficher',
    edit: 'Modifier les notes',
    intro:
      "Explorez les limites d'accès des assistants consultant les dossiers, des ingénieurs préparant les devis, des transferts de devis délégués et du personnel de livraison exécutant les commandes.",
    record: 'Enregistrement',
    notes: 'Notes',
    save: 'Enregistrer',
    refresh: 'Actualiser',
    loading: 'Chargement…',
    empty: 'Aucun dossier accessible',
    readOnly: 'Lecture seule',
    saved: 'Enregistré',
    scope: {
      prepared: 'Citations préparées par moi',
      title: 'Périmètre des données de ventes',
      unrestricted: 'Aucune restriction',
      region: 'Ma région',
      own: "Projet parent qui m'appartient",
      public: 'Projets non confidentiels',
    },
  },
  title: "Exemple d'autorisations de vente",
  overview: 'Guide',
  actions: 'Actions',
  testAccounts: 'Exemples de comptes',
  account: 'Compte',
  permissionSet: 'Autorisation définie',
  password: 'Exemple de mot de passe : AuthzExample123 !',
  tryTitle: 'Configurer et vérifier',
  roles: {
    assistant: 'Assistante commerciale',
    engineer: 'Ingénieur commercial',
    manager: 'Chef de projet',
    delivery: 'Spécialiste de la livraison',
  },
  forbidden: "Vous n'avez pas l'autorisation pour cette opération.",
  error: 'Échec du chargement. Veuillez réessayer.',
};

export default frFR;
