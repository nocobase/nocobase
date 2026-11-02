import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  closeDialog: 'Fermer',
  sortTitle: 'Trier les exemples',
  sortIntro:
    "Exécutez des exemples de tri en lecture seule à l'aide du client Repository HTTP. Des extraits de code du générateur accompagnent les requêtes sérialisées réelles ; les tables préservent l’ordre de réponse du serveur. Les requêtes renvoient au maximum 10 racines et réutilisent les graines CRM et relationnelles existantes.",
  sortLimits:
    "Utilisez des noms de champs logiques. De nombreux chemins nécessitent des agrégats ; les inclusions to-one n’acceptent pas le tri local. Le curseur nécessite des axes scalaires directs non nullables et un tie-break unique ; distinct n'accepte que le tri scalaire direct avec un tie-break unique. Le texte et JSON ne peuvent pas être triés.",
  sortRequest: 'Demande actuelle · JSON AST',
  sortResultHint:
    "Les lignes conservent l'ordre du serveur. Les valeurs de relation sont sélectionnées explicitement ; les aperçus des enregistrements peuvent être plus courts que les décomptes globaux.",
  sortExpectedError: 'Erreur de validation attendue',
  sortUnexpectedSuccess:
    'Cette requête non valide a réussi de manière inattendue.',
  sort_default_title: 'Ordre des clés primaires par défaut',
  sort_default_description:
    'Omettre le tri : les clients sont renvoyés par clé primaire ascendante.',
  sort_asc_title: 'Prix du produit croissant',
  sort_asc_description:
    'Renvoie une seule expression ascendante pour unitPriceCents ; les prix sont des centimes entiers.',
  sort_desc_title: 'Prix du produit décroissant',
  sort_desc_description:
    'Renvoie une seule expression décroissante pour unitPriceCents ; les prix sont des centimes entiers.',
  sort_multi_title: 'Champs multiples et départage automatique',
  sort_multi_description:
    "Quantité décroissante, puis prix instantané croissant. Les paires égales utilisent l'ordre croissant des ID ajoutés ; demo-item-3 et demo-item-7 démontrent l'égalité.",
  'sort_nulls-first_title': 'Valeurs NULL en premier',
  'sort_nulls-first_description':
    "AsseeId nullable croissant avec NULL en premier. Les tâches non attribuées restent visibles et l'ID rompt les égalités.",
  'sort_nulls-last_title': 'Dernières valeurs NULL',
  'sort_nulls-last_description':
    'AsseeId nullable croissant avec NULL en dernier. Le placement explicite évite les valeurs par défaut NULL spécifiques à la base de données.',
  'sort_to-one_title': 'Trier selon une relation à un',
  'sort_to-one_description':
    'Nom du cessionnaire par ordre décroissant, les cessionnaires manquants en dernier. Une inclusion distincte renvoie le nom utilisé pour le tri.',
  sort_count_title: 'Nombre de relations et sélection filtrée',
  sort_count_description:
    "Classement selon toutes les commandes, y compris le nombre 0.paidCount sélectionne uniquement les commandes payées ; son filtre n'affecte pas le tri racine.",
  sort_include_title: "Ordre d'inclusion indépendant",
  sort_include_description:
    "Les clients montent par ID tandis que les commandes de chaque client descendent par numéro. La limite de deux enregistrements s'applique par client.",
  sort_duplicate_title: 'Rejeté : cible de tri en double',
  sort_duplicate_description:
    'Le même champ ne peut pas apparaître deux fois, même avec des directions différentes. Exécutez pour inspecter INVALID_SORT.',
  'sort_to-many_title': 'Rejeté : chemin de champ direct vers plusieurs',
  'sort_to-many_description':
    'items.quantity comporte plusieurs valeurs par produit. Utilisez plutôt un agrégat explicite de relation.',
  sort_sum_title: 'Classement de la relation SUM',
  sort_sum_description:
    "Classez les produits par SOMME de la quantité d'articles, en commençant par les valeurs NULL en ordre décroissant. Les relations vides sont triées comme 0, bien que la SOMME sélectionnée soit NULL. Les métriques et les lignes d’éléments sont sélectionnées explicitement.",
  sort_avg_title: 'Relation Classement AVG',
  sort_avg_description:
    "Classez les produits par moyenne de quantité d'articles, en commençant par les valeurs NULL en ordre décroissant. Les relations vides sont triées comme NULL. Les métriques et les lignes d’éléments sont sélectionnées explicitement.",
  sort_min_title: 'Classement MIN de la relation',
  sort_min_description:
    "Classez les produits par quantité MIN d'articles, en commençant par les valeurs NULL en ordre décroissant. Les relations vides sont triées comme NULL. Les métriques et les lignes d’éléments sont sélectionnées explicitement.",
  sort_max_title: 'Classement relation MAX',
  sort_max_description:
    "Classez les produits par quantité MAX d'articles, en décroissant avec les valeurs NULL en premier. Les relations vides sont triées comme NULL. Les métriques et les lignes d’éléments sont sélectionnées explicitement.",
  selectCombineTitle: 'Sélectionner combiner',
  selectCombineIntro:
    "Renvoie les listes d'enregistrements nommés et les agrégats scalaires de la même relation avec select.combine. Chaque exemple exécute une requête findMany du référentiel en lecture seule.",
  combineScopeHint:
    "Affiche les 10 premiers enregistrements racine par ID. Des limites de relation s'appliquent par parent et par branche. Exécutez les migrations et les graines d'application s'il n'existe aucun exemple d'enregistrement.",
  combineRequest: 'Demande · sélectionner AST',
  combineTable: 'Tableau de données',
  combineJson: 'JSON brut',
  combineNoRelated: 'Aucun dossier associé',
  combineTableHint:
    "Les colonnes utilisent des chemins de champ de réponse. Les branches d'enregistrement apparaissent sous forme de tables imbriquées ; NULL diffère des listes nulles et vides.",
  combineRun: 'Exécuter la requête',
  combineResult: 'Résultat de la requête',
  combineResultHint:
    "Réponse réelle : les branches nommées vivent à l'intérieur de chaque objet relation.",
  combineEmpty:
    "Aucun enregistrement racine. Exécutez les migrations et les graines d'application, ou créez des exemples d'enregistrements.",
  combine_preview_title: 'Aperçu des commandes et branches indépendantes',
  combine_preview_description:
    'Une commande en aperçu, le nombre total de commandes, le nombre payé et les enregistrements annulés. La limite d’aperçu ne limite pas les branches sœurs. Les clients sans commandes conservent des listes vides et des comptes nuls.',
  combine_statistics_title: "Enregistrements d'articles et agrégats multiples",
  combine_statistics_description:
    "Deux lignes d'articles à côté du COUNT, de la quantité SUM et des prix unitaires instantanés AVG/MIN/MAX en cents. AVG n'est pas pondéré ; une relation vide renvoie le compte 0 et null pour les autres agrégats.",
  combine_nested_title: 'Commandes, articles et produits imbriqués',
  combine_nested_description:
    "Chaque client reçoit un aperçu et un décompte de sa commande. Chaque commande prévisualisée combine un aperçu de l'article, un nombre et une quantité ; Les enregistrements d'articles incluent également le nom de leur produit.",
  combine_scoped_title: 'Filtre partagé et filtres locaux de succursale',
  combine_scoped_description:
    "Le filtre de tâche brouillon s'applique à chaque branche. COUNT(assigneeId) compte les destinataires non nuls ; non attribué ajoute assigneeId = null. L’aperçu sur une seule ligne ne modifie aucun des deux comptes.",
  combine_tags_title: 'Combinaisons de balises plusieurs à plusieurs',
  combine_tags_description:
    'Renvoie les balises liées, le nombre total et le nombre de documentation de chaque projet. Les filtres de branche restent à l’intérieur de la relation de ce projet ; les balises non liées sont exclues.',
  apiExamples: 'Exemples de référentiel',
  labIntro:
    "Explorez une opération relationnelle à la fois. Choisissez une relation, préparez un exemple indépendant, puis utilisez sa forme et son tableau. Chaque carte possède son projet et ses cibles ; charger cette page n'écrit rien.",
  labOperations: 'Opérations relationnelles',
  labBoth: 'à un / à plusieurs',
  labManyOnly: 'à plusieurs seulement',
  labRelation: 'Type de relation',
  labPrepare: "Préparer l'exemple",
  labPrepareAgain: 'Préparer un nouvel exemple',
  labRefresh: 'Actualiser le tableau',
  labPrepareHint:
    'La préparation crée un projet et quatre cibles privées. La nouvelle préparation préserve les exemples antérieurs. La préparation utilise plusieurs requêtes ; chaque écriture individuelle est transactionnelle.',
  labProject: 'Exemple de projet',
  labDefaultContent: 'Exemple {{operation}} {{id}}',
  labSummary: 'Résumé du profil',
  labLabel: 'Étiquette de balise',
  labTitle: 'Titre de la tâche',
  labPoints: 'Points',
  labTarget: 'Enregistrement cible',
  labChoose: 'Choisir un enregistrement',
  labNewTarget: 'Créer une nouvelle cible lors de la première exécution',
  labNoEligible:
    'Aucune cible éligible. Préparez un nouvel exemple pour réessayer.',
  labSetTargets: 'Gardez ces cibles liées',
  labSetEmpty:
    "Décochez tout pour envoyer l'ensemble : []. Les cibles supprimées restent dans la table des cibles.",
  labThroughRole: 'Rôle sur ce lien (through.role)',
  labCurrentProfile: 'Profil actuel',
  labNoProfile: "Aucun profil n'est actuellement lié.",
  labDeleteHint:
    "Ceci supprime l'exemple d'enregistrement cible sélectionné. Il ne s'agit pas d'une déconnexion ; la ligne ci-dessous restera comme résultat de la suppression.",
  labUpsertHint:
    'La première exécution peut créer une cible ; les exécutions ultérieures avec cette même cible la mettent à jour. Les cibles en dehors de cette relation ne sont pas éligibles.',
  labExecute: 'Exécuter {{operation}}',
  labRequest: 'Prévisualiser la demande de cette opération',
  labSaved: "L'écriture {{operation}} a réussi.",
  labRefreshFailed:
    "L'écriture a réussi, mais l'actualisation de la table a échoué. Utilisez Actualiser la table avant une autre écriture.",
  labTargets: 'Cibles et état de la relation',
  labTableHint:
    'Chaque cible est lue indépendamment : déconnecter/définir conserver les cibles, tandis que delete les supprime. Seules les cibles de cette carte sont répertoriées.',
  labRecord: 'Enregistrement',
  labLinked: 'Lié à ce projet',
  labExists: 'La cible existe',
  labDeleted: 'Cible supprimée',
  labYes: 'Oui',
  labNo: 'Non',
  labLastCall: 'Dernière requête et réponse exécutées',
  lab_create_title: 'Créer et lier',
  lab_create_description:
    'Créer une cible à travers la relation. Le référentiel remplit les clés de relation. Une création hasOne nécessite une relation vide dans cet exemple.',
  lab_connect_title: 'Lier une cible existante',
  lab_connect_description:
    "Choisissez une cible non liée préparée pour cette carte. Aucune cible n'est créée par connect. Une cible hasOne doit être disponible.",
  lab_disconnect_title: 'Dissocier et conserver la cible',
  lab_disconnect_description:
    'Supprimez un lien hasOne nullable, détachez une cible hasMany ou supprimez un lien de table de jointure. La cible demeure.',
  lab_set_title: "Remplacer l'ensemble de relations",
  lab_set_description:
    'Conserver exactement les cibles existantes sélectionnées. Ensemble de support de relations uniquement vers plusieurs ; nullable hasMany clés permettent la suppression.',
  lab_update_title: 'Modifier une cible liée',
  lab_update_description:
    'Modifiez une cible dans la relation actuelle. Une mise à jour to-one utilise sa cible actuelle sans sélecteur.',
  lab_upsert_title: 'Mettre à jour ou créer dans la portée de la relation',
  lab_upsert_description:
    "Créer lorsqu'aucune cible correspondante n'est liée, sinon mettez-la à jour. To-many utilise un identifiant unique stable pour la recherche et la création.",
  lab_delete_title: "Supprimer l'enregistrement cible",
  lab_delete_description:
    'Supprimer une cible liée, sous réserve de contraintes. Utilisez uniquement les cibles dédiées préparées pour cette carte ; les objectifs partagés peuvent affecter d’autres relations.',
  relationMutationsTitle: 'Relation écrit',
  relationMutationsIntro:
    'Exécutez un workflow de relation de référentiel HTTP complet sur AppartientTo, hasOne, hasMany et appartientToMany. Chaque bouton utilise api.repository(name); aucun point final de mutation spécifique à un exemple n’est impliqué.',
  relationBaselineTitle: 'Base de référence de la relation prédéfinie',
  relationBaselineDescription:
    "Les enregistrements déterministes reflètent la documentation d'écriture des relations du référentiel tout en utilisant des noms de collection préfixés par un plugin.",
  relationSeedHint:
    "Exécutez les migrations et les graines d'application pour créer les exemples d'enregistrements de relation.",
  relationRunTitle: 'Procédure pas à pas complète de mutation',
  relationRunDescription:
    'Crée un graphique de projet isolé, applique des opérations de relation incrémentielles, puis remplace son jeu de balises. Chaque mutation racine est transactionnelle.',
  relationRunButton: "Exécuter l'écriture complète de la relation",
  relationRunIsolation:
    'Chaque exécution utilise de nouveaux identifiants, de sorte que les exemples antérieurs restent disponibles pour inspection.',
  relationResultTitle: 'État final de la relation',
  relationResultDescription:
    "Le propriétaire et le profil ont été mis à jour, les opérations de tâche ont été appliquées dans la portée de la relation et l'ensemble a conservé uniquement les balises sélectionnées.",
  relationLifetimeTitle: 'Vérifications de la durée de vie cible',
  relationLifetimeDescription:
    "déconnectez et définissez la suppression des liens mais conservez les cibles ; delete supprime l'enregistrement cible.",
  relationTraceHint:
    'Noms réels du référentiel, charges utiles createOne/updateOne et réponses émises par cette exécution.',
  relationOwnerLabel: 'appartient à · propriétaire',
  relationProfileLabel: 'hasOne · profil',
  relationTasksLabel: 'hasMany · tâches',
  relationTagsLabel: 'appartient à plusieurs · balises',
  relationTasks: 'Tâches associées',
  relationPoints: 'Points',
  relationAssignee: 'Responsable assigné',
  relationDisconnectCheck:
    'déconnexion : la tâche existe = {{exists}}, projectId = {{projectId}}',
  relationDeleteCheck: 'supprimer : la tâche existe={{exists}}',
  relationSetCheck: 'défini : la balise supprimée existe = {{exists}}',
  findManyTitle: 'findMany : tableau et flux',
  findManyIntro:
    "Exécutez la même requête de référentiel dans deux modes de consommation. Attendre se résout une fois avec le tableau complet ; L'itération asynchrone lit les enregistrements NDJSON encadrés dès leur arrivée. La requête de base de données, les filtres, le tri et les limites restent les mêmes.",
  findManyArrayTitle: 'Attendre un tableau',
  findManyArrayDescription:
    'En attente de findMany envoie une requête JSON normale et résout avec tous les enregistrements correspondants.',
  findManyStreamTitle: 'Itérer un flux',
  findManyStreamDescription:
    "L'utilisation de for wait envoie une requête NDJSON et ajoute chaque enregistrement décodé à la table de résultats.",
  findManyProtocol: 'Réponse HTTP',
  findManyRunArray: 'Exécuter une requête de tableau',
  findManyRunStream: 'Exécuter une requête de flux',
  findManyReceived: 'Dossiers reçus',
  findManyReceivedCount: 'Enregistrements {{count}} reçus',
  findManyResults: 'Résultats',
  findManyRecordTitle: 'Titre',
  findManyCategory: 'Catégorie',
  findManyDescription: 'Description',
  findManyEmpty:
    "Exécutez cette requête pour charger les exemples d'enregistrements prédéfinis.",
  atomicTitle: 'Mises à jour numériques atomiques',
  atomicIntro:
    "Mettez à jour les nombres directement dans la base de données avec incrémentation, décrémentation et multiplication. Les requêtes envoient l'opération, jamais une valeur calculée à partir d'un instantané de navigateur potentiellement obsolète. Tous les utilisateurs connectés partagent ces exemples de compteurs.",
  atomicStock: "Stock d'entrepôt",
  atomicStockHint:
    'Recevoir ou déduire des unités. La déduction vérifie le stock disponible dans la même mise à jour, évitant ainsi un inventaire négatif.',
  atomicWallet: 'Solde du compte (centimes)',
  atomicWalletHint:
    "Rechargez ou dépensez des centimes entiers. La condition d'équilibre et la soustraction sont évaluées ensemble dans la base de données.",
  atomicPoints: 'Points de récompense',
  atomicPointsHint:
    'Ajoutez des points ou doublez les points actuels en utilisant la multiplication : 2. Le doublement utilise la valeur actuelle de la base de données.',
  atomicVisits: 'Compteur de visites',
  atomicVisitsHint:
    "Incrémentez une fois ou envoyez 10 incréments simultanés : 1 requêtes. D'autres utilisateurs peuvent également modifier ce compteur partagé.",
  atomicAmount: 'Montant',
  atomic_increment: 'Augmentation',
  atomic_decrement: 'Diminution (gardé)',
  atomic_multiply: 'Doubler ×2',
  atomic_concurrent: '10 simultanés +1',
  atomicSeedHint:
    "Exécutez les migrations et les seed d'application pour créer cet exemple de compteur.",
  atomicInsufficient:
    "Le compteur a été supprimé ou sa valeur actuelle est insuffisante. Rien n'a été déduit.",
  atomicUpdated: 'La base de données a renvoyé la nouvelle valeur : {{value}}.',
  atomicConcurrentResult:
    '{{count}} de 10 incréments simultanés a réussi. La valeur affichée est relue à partir de la base de données.',
  atomicPartial:
    'Certains incréments ont échoué. Les demandes retenues restent engagées ; inspectez les résultats avant de réessayer.',
  atomicTraceHint:
    "Entrées et réponses actuelles de updateOne, y compris les mises à jour rejetées. Aucune tentative automatique n'est effectuée.",
  groupByExamples: "Plus d'exemples groupBy",
  groupByMinimumCount:
    'Nombre minimum de lignes par groupe (nouveaux exemples)',
  groupByEmpty:
    'Aucun groupe ne correspond à ces filtres. Réduisez le nombre minimum ou modifiez le statut.',
  groupBy_customerRanking: 'Classement des commandes clients',
  groupBy_customerRankingHint:
    'GROUP BY customerId · COUNT(*) · HAVING count ≥ minimum · count DESC, customerId ASC. Les clients sans commandes correspondantes ne forment pas un groupe.',
  groupBy_customerStatus: 'Client × statut de la commande',
  groupBy_customerStatusHint:
    "GROUP BY customerId, statut. Un même client peut apparaître dans plusieurs groupes de statuts. HAVING s'applique à chaque combinaison, pas au total du client. Les groupes d'énumération conservent les valeurs exactes ; le tri utilise count et customerId.",
  groupBy_productPrice: "Produit × prix unitaire de l'article",
  groupBy_productPriceHint:
    "GROUP BY productId, unitPriceCents · COUNT(*) et SUM(quantity). Les prix instantanés des différents articles restent distincts, même pour le même produit. Trier par quantité DESC, productId ASC, prix ASC. Les prix sont en centimes ; COUNT mesure les lignes d'éléments, pas les unités.",
  aggregateApply: 'Appliquer',
  aggregateTitle: 'Requêtes agrégées',
  aggregateIntro:
    "Statistiques côté base de données sur les commandes et les articles existants : agrégation, groupBy avec HAVING et nombre de relations par client. Les filtres d'état s'appliquent à tous les panneaux ; la quantité minimale s'applique uniquement aux groupes de produits. Le nombre minimum de lignes s’applique aux trois exemples groupBy supplémentaires.",
  aggregateAll: 'Tous les statuts',
  aggregateHaving: 'Quantité minimum groupée (HAVING)',
  aggregateMetrics: "Agrégats d'articles",
  aggregate_count: "COUNT · lignes d'articles",
  aggregate_quantity: 'SOMME · quantité',
  aggregate_averagePrice: 'AVG · prix unitaire (cents)',
  aggregate_minimumPrice: 'MIN · prix unitaire (centimes)',
  aggregate_maximumPrice: 'MAX · prix unitaire (cents)',
  aggregateSemantics:
    'Le prix moyen est la moyenne non pondérée des prix unitaires des articles, et non le total de la commande ou un prix pondéré en fonction de la quantité. Les ensembles vides renvoient le compte 0 et NULL pour SUM/AVG/MIN/MAX. Les panneaux exécutent des requêtes distinctes et peuvent observer des modifications simultanées.',
  aggregateStatuses: 'Commandes regroupées par statut · groupBy',
  aggregateCustomers: 'Agrégats de la relation client',
  aggregateCustomerHint:
    'Premiers clients {{count}} par ID, y compris les clients sans aucune commande correspondante. Les décomptes utilisent le statut sélectionné.',
  aggregateProducts: 'Articles regroupés par produit',
  aggregateTraceHint:
    "Appelle les actions d'agrégation/groupBy du référentiel HTTP configurées avec les AST JSON ; le nombre de clients utilise les sélections de relations findMany. Développez les requêtes pour inspecter les expressions réelles.",
  crm: 'Exemple CRM',
  ordersTitle: 'Exemple de commandes',
  subtitle:
    'Clients, relations et commandes, alimentés par les API du référentiel.',
  customer: 'Client',
  contact: 'Contacter',
  product: 'Produit',
  order: 'Commande',
  orderItem: 'Article de commande',
  customers: 'Clients',
  contacts: 'Contacts',
  products: 'Produits',
  orders: 'Commandes',
  items: 'Articles de commande',
  name: 'Nom',
  company: 'Société',
  email: 'E-mail',
  phone: 'Téléphone',
  status: 'Statut',
  sku: 'UGS',
  unitPriceCents: 'Prix unitaire (centimes)',
  number: 'Numéro de commande',
  customerId: 'Client',
  orderId: 'Commande',
  productId: 'Produit',
  quantity: 'Quantité',
  lead: 'Prospect',
  active: 'Actif',
  inactive: 'Inactif',
  draft: 'Brouillon',
  confirmed: 'Confirmé',
  paid: 'Payé',
  cancelled: 'Annulé',
  new: 'Nouveau record',
  edit: 'Modifier',
  view: 'Afficher les détails',
  delete: 'Supprimer',
  save: 'Enregistrer',
  cancel: 'Annuler',
  search: 'Recherche par nom/numéro/ID',
  apply: 'Rechercher',
  refresh: 'Actualiser',
  previous: 'Précédent',
  next: 'Suivant',
  page: 'Page {{page}}',
  count: 'Enregistrements {{count}}',
  empty:
    "Aucun enregistrement pour l'instant. Créez le premier enregistrement pour commencer.",
  loading: 'Chargement…',
  listFeedback: {
    loading: 'Chargement',
    empty: 'Aucune donnée',
    noResults: 'Aucun résultat',
    forbidden: 'Accès refusé',
    unauthenticated: 'La session a expiré',
    failed: 'Impossible de charger la liste',
    refreshFailed:
      'Échec de l’actualisation ; affichage des données précédentes',
    retry: 'Réessayer',
    retrying: 'Nouvelle tentative…',
    clear: 'Effacer les filtres',
    signIn: 'Se connecter',
  },
  select: 'Sélectionnez un enregistrement',
  createTitle: 'Créer {{entity}}',
  editTitle: 'Modifier {{entity}}',
  details: "Détails de l'enregistrement",
  relations: 'Enregistrements associés',
  none: 'Aucun',
  lookup: 'Rechercher par ID',
  check: 'Vérifier et ouvrir',
  notFound: 'Aucun enregistrement avec cet ID.',
  found: "L'enregistrement existe.",
  saved: 'Enregistrement sauvegardé.',
  deleted: 'Enregistrement supprimé.',
  confirmDelete:
    'Supprimer cet enregistrement ? Les contacts ou articles de commande associés seront également supprimés. Les clients ayant des commandes et les produits utilisés par les articles de commande ne peuvent pas être supprimés.',
  confirm: 'Confirmer la suppression',
  trace: 'Appels au référentiel',
  traceHint:
    'La dernière requête et le résultat affichent le API utilisé par cet écran.',
  error: "L'opération a échoué.",
  loadError:
    'Impossible de charger les enregistrements. Réessayez avec Actualiser.',
  conflict:
    "Cet ordre a changé depuis que vous l'avez ouvert. Actualisez-le et rouvrez-le avant de le modifier.",
  choicesHint:
    "Créez d'abord les clients et les produits, puis les commandes et leurs articles.",
  moneyHint:
    'Les prix sont des centimes entiers. Total de la ligne = quantité × prix unitaire ; pas de calcul de devise à virgule flottante.',
  version: 'Version',
  addItem: 'Ajouter un élément',
  removeItem: "Supprimer l'élément",
  orderTotal: 'Total de la commande (centimes)',
  noItems: 'Aucun article de commande.',
  itemRow: 'Objet {{number}}',
  lineTotal: 'Total de ligne (centimes)',
  id: "pièce d'identité",
  back: 'Retour à la liste',
  close: 'Fermer les détails',
  request: 'Demande',
  response: 'Réponse',
  loadingChoices: 'Chargement des enregistrements associés…',
};

export default frFR;
