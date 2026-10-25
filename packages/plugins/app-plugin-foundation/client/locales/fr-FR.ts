import type { FoundationResource } from './en-US.js';

const frFR: FoundationResource = {
  nav: {
    settings: 'Paramètres système',
    foundation: 'Socle de l’application',
  },
  page: {
    identified: 'Identifiés : {{value}}',
    counted: 'Comptabilisé : {{value}}',
    partial: 'Certaines données attendent une mise à jour',
    title: 'Socle de l’application',
    description:
      'Votre application se concentre sur le métier. NocoBase Core soutient les données, permissions et processus avec des capacités communes développées, testées et maintenues par NocoBase, puis mises à jour avec les versions officielles.',
    bandTitle: 'NocoBase Core',
    bandDescription:
      'Sélectionnez une capacité pour voir comment elle soutient cette application.',
    score: '{{active}} / {{total}}',
    scoreCaption: 'capacités soutiennent l’application',
    refresh: 'Actualiser',
    refreshing: 'Collecte…',
    updatedAt: 'Dernière vérification {{time}}',
    loading: 'Collecte des capacités…',
    refreshFailed:
      'L’actualisation a échoué. Le dernier résultat collecté avec succès est affiché.',
    loadFailed: 'Informations en attente de mise à jour',
    forbidden:
      'Seuls les administrateurs avec accès illimité peuvent consulter cette page.',
    retry: 'Réessayer',
    undetermined_one: 'Informations en attente de mise à jour ({{count}})',
    undetermined_many: 'Informations en attente de mise à jour ({{count}})',
    undetermined_other: 'Informations en attente de mise à jour ({{count}})',
    highlightsLabel: 'Chiffres clés',
    unavailable: 'Informations en attente de mise à jour',
    lowerBound: 'Valeur minimale : une partie des données est illisible.',
  },
  matrix: {
    apiPath: 'Requête API : {{method}} {{path}}',
    successPath: 'Requête API réussie : {{method}} {{path}}',
    conditions: {
      databaseAvailable: 'Base de données disponible',
      authenticated: 'Authentification acceptée',
      bodyWithinLimit: 'Corps de la requête dans la limite de taille',
      validInput: 'Validation des entrées réussie',
    },
    collections: 'Collections de données : {{names}}',
    title: 'Modules métier et capacités du socle',
    description:
      'Découvrez les capacités qui soutiennent chaque module. Sélectionnez une coche pour voir le lien et ce que vous devriez développer vous-même.',
    modules: 'Modules métier',
    summary: '{{count}} capacités · {{pages}} pages',
    inspect: 'Voir {{module}} × {{capability}}',
    unknown: 'Non identifié',
    empty:
      'Aucun module trouvé. Les modules apparaîtront automatiquement avec les pages et la navigation.',
    legend:
      '✓ Intégration identifiée ; · lien non identifié. Les références du code décrivent des dépendances, pas des exécutions.',
    partial:
      'Certaines dépendances des pages n’ont pas pu être établies ; seules les connexions confirmées sont affichées.',
    evidence: {
      page: 'Page enregistrée dans l’application',
      authentication: 'Connexion requise pour la page',
      authorization: 'Accès à la page contrôlé par les permissions',
      provider: 'Page fournie par ce fournisseur',
      source: 'Fournisseur référencé dans le code de la page',
      apiSource: 'Fournisseur référencé par le traitement de l’API associée',
    },
  },
  inventory: {
    recognitionNotes: 'Notes sur l’identification',
    title: 'Capacités et fournisseurs',
    description:
      'Les capacités reflètent le noyau, les plugins officiels et Pro et les extensions connectées à cette application.',
    discovered: 'paquets fournisseurs détectés',
    mapped: 'paquets fournisseurs classés',
    unmapped: 'en attente de classement',
    partial: 'Détection incomplète. Lecture impossible : {{sources}}.',
    selectedCategory: 'Fournisseurs de {{category}}',
    usageBoundary:
      'L’état concerne la catégorie entière ; il ne signifie pas que chaque paquet est activé, configuré ou utilisé.',
    noCategoryProviders:
      'Aucun fournisseur de cette catégorie reconnu par le catalogue actuel.',
    extensionsTitle: 'Fournisseurs supplémentaires · à identifier',
    extensionsDescription:
      'Les fournisseurs non classés restent visibles. Ils ne sont pas automatiquement considérés comme des intégrations ou comme inutilisés.',
    noExtensions:
      'Aucun fournisseur supplémentaire trouvé dans le périmètre actuel.',
    discoveryBoundary:
      'Périmètre : dépendances directes, fournisseurs connus, contributions publiques de base de données et d’API relayées, et contributions client observées dans le navigateur. Toutes les contributions, extensions indirectes et modules locaux ne sont pas recensés. L’origine et l’édition Pro nécessitent un catalogue fiable ; le nom et la licence ne suffisent pas.',
    versionUnknown: 'Version indisponible',
    origin: 'Origine',
    officialCatalog: 'Catalogue NocoBase',
    unverifiedOrigin: 'Origine non vérifiée',
    installation: 'Installation',
    installed: 'Manifeste trouvé',
    manifestUnavailable: 'Manifeste indisponible',
    registration: 'Enregistrement',
    observed: 'Contribution actuelle observée à l’exécution',
    registrationUnknown: 'Non confirmé · ne signifie pas désactivé',
    evidence: 'Preuve',
    noEvidence: 'Aucune preuve confirmée',
    categories: 'Catégories',
    awaitingRecognition: 'Classement en attente',
    evidenceLabels: {
      manifest: 'Manifeste du paquet installé',
      databaseContribution: 'Contribution de tâches de base de données',
      apiContribution: 'Contribution d’API relayée',
      foundationRuntime: 'Service du socle en cours d’exécution',
      clientContribution: 'Contribution client observée dans le navigateur',
      serverRegistration: 'Enregistrement du plugin serveur',
    },
  },
  status: {
    active: 'Utilisé',
    needsSetup: 'Disponible, à configurer',
    unused: 'Non utilisé',
    undetermined: 'Informations en attente de mise à jour',
    legendActive: 'Utilisé {{count}}',
    legendNeedsSetup: 'À configurer {{count}}',
    legendUnused: 'Non utilisé {{count}}',
  },
  detail: {
    retainedAt: 'Dernière confirmation {{time}}',
    readNotes: 'Détails de lecture',
    collectionCount: '{{count}} tables',
    collectionPreview: 'Aperçu des tables',
    collectionsTitle: 'Tables',
    noCollectionMatches: 'Aucune table correspondante',
    noCollectionMatchesHint: 'Essayez un autre nom ou effacez la recherche.',
    collectionRange: '{{from}}–{{to}} sur {{total}}',
    closeCollections: 'Fermer les tables',
    viewCollections: 'Voir toutes les collections',
    searchCollections: 'Rechercher des collections',
    collectionResults: '{{count}} collections correspondantes',
    previousPage: 'Précédent',
    nextPage: 'Suivant',
    countRecords: 'Compter les enregistrements',
    recordsOnDemand:
      'Compte à la demande les tables identifiées, hors tables système connues. Les grandes bases peuvent prendre plus de temps.',
    recordsCountedAt: 'Enregistrements comptés {{time}}',

    businessModules: 'Modules métier associés',
    inThisApp: 'Dans cette application',
    withoutFoundation: 'Sans le socle',
    onceInUse: 'Après activation',
    whyNot: 'Pourquoi cette capacité n’est pas utilisée',
    liveData: 'Statistiques',
    parts: 'Composants',
    packages: 'Fourni par les paquets NocoBase',
    noPackages: 'Aucun paquet de cette capacité n’est installé.',
    noFacts: 'Aucun fait établi.',
    partial: 'Certaines données attendent une mise à jour.',
    failed: 'Informations en attente de mise à jour.',
    unreadable: 'Lecture impossible : {{sources}}',
    timeout: 'Le délai d’examen est dépassé.',
  },
  capabilities: {
    dataModeling: {
      name: 'Modélisation des données',
      tagline: 'Collections, champs, relations et migrations',
      without:
        'Il faudrait programmer les changements de schéma, requêtes, filtres, pagination, protection contre l’injection et compatibilité des bases.',
      onceInUse:
        'Les migrations définissent les collections, interrogées par une interface commune sur les bases compatibles.',
    },
    files: {
      name: 'Gestion des fichiers',
      tagline: 'Téléversement, stockage et pièces jointes',
      without:
        'Il faudrait créer téléversements, adaptateurs, contrôles de taille et de type et liens de téléchargement.',
      onceInUse:
        'Un contrat commun de collection et de stockage gère les pièces jointes.',
    },
    usersAndOrganizations: {
      name: 'Utilisateurs et organisations',
      tagline: 'Comptes, connexion et invitations',
      without:
        'Il faudrait créer inscription, sessions, réinitialisation et administration sécurisée des comptes.',
      onceInUse: 'Comptes, connexions et invitations sont centralisés.',
    },
    permissions: {
      name: 'Permissions',
      tagline: 'Jeux de permissions et règles d’accès',
      without:
        'Il faudrait vérifier les droits dans chaque API, sans gestion centralisée.',
      onceInUse:
        'Les jeux autorisent pages, données et actions, avec contrôle serveur à chaque requête.',
    },
    workflows: {
      name: 'Processus et approbations',
      tagline: 'Cycles de vie, transitions et planifications',
      without:
        'Il faudrait programmer états, transitions, historique, nouvelles tentatives et délais.',
      onceInUse:
        'Les cycles de vie offrent transitions contrôlées, historique et effets avec nouvelles tentatives.',
    },
    aiAgents: {
      name: 'IA et agents',
      tagline: 'Services de modèles, agents et exécuteurs',
      without:
        'Il faudrait intégrer les modèles, protéger les clés, suivre la consommation et exécuter les agents en sécurité.',
      onceInUse:
        'Activez des services de modèles pour OnlineAgent et la passerelle de modèles, ou enregistrez des exécuteurs pour les agents.',
    },
    knowledge: {
      name: 'Base de connaissances',
      tagline: 'Espaces, documents et recherche',
      without:
        'Il faudrait créer stockage documentaire, versions, accès et recherche.',
      onceInUse:
        'Les espaces gèrent documents, versions et accès pour les personnes et agents.',
    },
    mail: {
      name: 'Courrier',
      tagline: 'Boîtes, synchronisation et envoi',
      without:
        'Il faudrait connecter les services, synchroniser les dossiers et gérer autorisations et nouvelles tentatives.',
      onceInUse:
        'Connectez les boîtes pour lire, synchroniser et envoyer dans l’application.',
    },
    notifications: {
      name: 'Notifications',
      tagline: 'Canaux, livraisons et messages internes',
      without:
        'Il faudrait créer envoi, nouvelles tentatives, dédoublonnage et historique pour chaque canal.',
      onceInUse:
        'Les canaux configurés offrent envois, nouvelles tentatives, dédoublonnage et historique.',
    },
    integrations: {
      name: 'Intégrations',
      tagline: 'Clés API et accès externe',
      without:
        'Il faudrait émettre et vérifier les identifiants de chaque système externe.',
      onceInUse:
        'Les systèmes externes utilisent des clés API avec les permissions de leur propriétaire.',
    },
    interface: {
      name: 'Interface et configuration',
      tagline: 'Pages, navigation, langues et thèmes',
      without:
        'Il faudrait créer routage, menus, traductions et thèmes avant les pages métier.',
      onceInUse: 'Le client NocoBase fournit pages, menus, langues et thèmes.',
    },
    audit: {
      name: 'Journal d’audit',
      tagline: 'Historique des opérations sensibles',
      without:
        'Il faudrait consigner manuellement l’auteur de chaque modification importante.',
      onceInUse:
        'Un journal central conserve les opérations sensibles de l’application.',
    },
    operations: {
      name: 'Exploitation',
      tagline: 'Migrations, tâches, files et secrets',
      without:
        'Il faudrait gérer mises à niveau, tâches de fond, files et secrets avec du code dédié.',
      onceInUse:
        'Le serveur fournit migrations historisées, tâches, files et gestion des secrets.',
    },
  },
  reasons: {
    installedNotUsed:
      'Installé, mais aucune preuve d’activation ou d’utilisation actuelle n’a été identifiée.',
    noRecognizedAudit:
      'Le catalogue actuel ne reconnaît aucun fournisseur d’audit ; d’autres extensions peuvent en proposer.',
    noDatabase: 'L’application fonctionne sans base de données.',
    notRegistered:
      'Le plugin fournisseur n’est pas enregistré dans l’application.',
    notProvided: 'NocoBase Core ne fournit pas encore cette capacité.',
    noFileCollection: 'Aucune collection ne stocke de fichiers.',
    noDrive:
      'Des collections de fichiers existent, mais le stockage n’est pas configuré.',
    noAccounts: 'L’application n’a aucun compte.',
    onlyUnrestrictedAccess:
      'Seuls les administrateurs ont un accès illimité ; aucun droit n’est encore accordé aux autres utilisateurs.',
    noWorkflows: 'Aucun cycle de vie persistant ni planification active.',
    noSchedules: 'Aucune planification active.',
    noModelOrRunner: 'Aucun service de modèles activé ni exécuteur enregistré.',
    noModelService: 'Aucun service de modèle actif.',
    noAgent: 'Aucun agent défini.',
    noDocuments: 'Aucun document dans les espaces de connaissances.',
    noConnectedMailbox: 'Aucune boîte connectée.',
    noChannel: 'Aucun canal de notification configuré.',
    noApiKey: 'Aucune clé API.',
    noUsedApiKey: 'Des clés API existent, mais n’ont pas encore été utilisées.',
    noClient: 'L’application ne fournit pas de client NocoBase.',
    notConfigured: 'Non configuré.',
  },
  facts: {
    fileCollectionsPartial:
      'Collections de fichiers comptabilisées : {{count}} : {{names}}.',
    collectionOwnershipUnknown:
      'Les tables système NocoBase connues sont exclues. L’appartenance des autres tables reste à identifier ; ces observations ne constituent pas un total métier ou de toute l’application.',
    noApplicationCollections: 'Aucune autre table de données identifiée.',
    applicationCollectionsPreview:
      '{{count}} tables de données identifiées, dont {{names}}.',
    applicationCollections:
      '{{count}} tables de données identifiées : {{names}}.',
    relations: '{{count}} relations les relient.',
    fileCollections: '{{count}} collections de fichiers : {{names}}.',
    accounts: '{{count}} comptes utilisent l’authentification NocoBase.',
    permissionSets:
      '{{count}} jeux de permissions hors accès illimité : {{names}}.',
    accessRules:
      '{{count}} règles de partage, restriction ou accès par défaut.',
    lifecyclesWithoutTransitions:
      'Le stockage des cycles de vie est prêt ; aucune transition enregistrée.',
    lifecycles:
      '{{count}} cycles de vie avec {{transitions}} transitions : {{names}}.',
    schedules: '{{count}} planifications actives.',
    modelServices:
      '{{count}} services de modèles activés prennent en charge OnlineAgent et la passerelle de modèles.',
    runners: '{{count}} exécuteurs enregistrés prennent en charge les agents.',
    agents: '{{count}} agents, {{runs}} exécutions.',
    documents: '{{count}} documents de connaissances.',
    mailboxes: '{{count}} boîtes connectées.',
    mailboxesNeedAttention:
      '{{count}} boîtes nécessitent une intervention pour reprendre la synchronisation.',
    channels: '{{count}} canaux de notification : {{names}}.',
    usedApiKeys: '{{count}} clés API utilisées pour appeler l’application.',
    locales: '{{count}} langues : {{names}}.',
    migrations:
      '{{count}} migrations exécutées, dont {{own}} propres à l’application.',
    latestMigration: 'Dernière exécution : {{at}}.',
    registeredExtension: 'L’extension est enregistrée dans cette application.',
  },
  parts: {
    accounts: 'Comptes',
    organizations: 'Organisations',
    permissionSets: 'Jeux de permissions',
    sharingRules: 'Règles de partage',
    restrictionRules: 'Règles de restriction',
    defaultAccess: 'Accès par défaut',
    lifecycles: 'Cycles de vie',
    schedules: 'Planifications',
    modelServices: 'Services de modèles',
    agents: 'Agents',
    runners: 'Exécuteurs',
    migrations: 'Migrations',
    jobs: 'Tâches',
    queue: 'File',
    secrets: 'Secrets',
    caching: 'Cache',
  },
  metrics: {
    businessRecords: 'enregistrements',
    businessCollections: 'tables de données',
    views: 'vues',
    fields: 'champs',
    relations: 'relations',
    systemCollections: 'collections système NocoBase',
    files: 'fichiers',
    storedBytes: 'stockage enregistré',
    fileCollections: 'collections de fichiers',
    accounts: 'comptes',
    disabledAccounts: 'comptes désactivés',
    invitations: 'invitations',
    grants: 'autorisations',
    permissionSets: 'jeux de permissions',
    assignments: 'affectations',
    sharingRules: 'règles de partage',
    restrictionRules: 'règles de restriction',
    defaultAccess: 'règles d’accès par défaut',
    transitions: 'transitions d’état',
    lifecycles: 'cycles de vie avec transitions',
    effectsSucceeded: 'effets réussis',
    effectsFailed: 'effets échoués',
    effectsPending: 'effets en attente',
    schedules: 'planifications actives',
    scheduleOccurrences: 'occurrences planifiées',
    agents: 'agents',
    modelServices: 'services de modèles actifs',
    runners: 'exécuteurs',
    runs: 'exécutions',
    modelCalls: 'appels de modèle hors exécutions',
    tokens: 'jetons',
    documents: 'documents',
    spaces: 'espaces de connaissances',
    chunks: 'fragments',
    connectedMailboxes: 'boîtes connectées',
    mailboxesNeedAttention: 'boîtes nécessitant une intervention',
    messages: 'messages',
    submissions: 'messages soumis à l’envoi',
    failedSubmissions: 'envois échoués',
    acceptedDeliveries: 'livraisons acceptées par les fournisseurs',
    notifications: 'notifications',
    deliveries: 'livraisons',
    failedDeliveries: 'livraisons échouées',
    pendingDeliveries: 'livraisons en cours',
    deliveryAttempts: 'tentatives de livraison',
    inAppMessages: 'messages internes',
    inAppMessagesRead: 'messages internes lus',
    channels: 'canaux',
    usedApiKeys: 'clés API utilisées',
    apiKeys: 'clés API actives',
    locales: 'langues',
    migrations: 'migrations exécutées',
    applicationMigrations: 'migrations propres à l’application',
    seeds: 'initialisations exécutées',
  },
  dynamic: {
    pending: 'Identification en attente',
    pendingDescription:
      'Le plugin est enregistré ; sa configuration et son utilisation réelle restent à déterminer.',
  },
};

export default frFR;
