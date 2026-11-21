import type { DistributedResource } from './en-US.js';

const frFR: DistributedResource = {
  nav: {
    title: 'Cluster et distribution',
    description:
      'Les backends utilisés par cette instance, et si l’application peut fonctionner sur plusieurs instances.',
  },
  page: {
    description:
      'Pour fonctionner sur plusieurs serveurs ou processus, le cache, les verrous, les tâches en arrière-plan, les files d’attente, les messages en temps réel et la génération d’ID doivent utiliser des backends partagés. Cette page affiche les backends réellement sélectionnés par cette instance et l’origine de chaque paramètre, et vérifie si l’application peut fonctionner en toute sécurité sur plusieurs instances. Les paramètres se trouvent dans la configuration de l’application ; redéployez après les avoir modifiés.',
    loading: 'Chargement…',
    loadFailed: 'Impossible de charger l’état.',
    retry: 'Réessayer',
  },
  summary: {
    single: 'Instance unique',
    singleCaption: 'La configuration actuelle convient à une instance',
    shared: '{{shared}} / {{total}}',
    sharedCaption: 'services partagés',
    requiredCaption: 'à corriger',
    recommendedCaption: 'recommandés',
  },
  sections: {
    scale: 'Peut-elle fonctionner sur plusieurs instances ?',
    services: 'Services partagés',
    idGeneration: 'Génération d’ID',
    checklist: 'Avant la mise en production',
    notes: 'Remarques',
  },
  level: {
    required: 'À corriger',
    recommended: 'Recommandé',
    ok: 'OK',
  },
  singleHint:
    'Une seule instance ne nécessite aucune modification. Pour passer à plusieurs instances : préparez Redis et une base de données PostgreSQL ou MySQL partagée → installez les plugins Redis nécessaires → modifiez la configuration → vérifiez avec deux instances.',
  fix: 'Comment corriger',
  table: {
    service: 'Service',
    backend: 'Backend sélectionné',
    sharing: 'Portée',
    plugin: 'Plugin Redis',
    source: 'Source',
    adapter: 'Adaptateur',
  },
  services: {
    caching: {
      name: 'Cache',
      usage: 'État de connexion, permissions, cache de configuration',
    },
    concurrency: {
      name: 'Verrous de concurrence',
      usage: 'Migrations, numérotation, idempotence',
    },
    jobs: {
      name: 'Tâches en arrière-plan',
      usage: 'Tâches planifiées, indexation des connaissances',
    },
    queue: { name: 'File d’attente', usage: 'Envoi des notifications' },
    realtime: {
      name: 'Messages en temps réel',
      usage: 'Boîte de réception, présence',
    },
  },
  sharing: {
    shared: 'Partagé entre les instances',
    local: 'Cette instance uniquement',
    unknown: 'Non déclaré',
  },
  source: { configured: 'Configuré', default: 'Par défaut' },
  notSet: '(non défini)',
  unavailable: 'Non utilisé par cette application',
  unregistered: 'Adaptateur non enregistré',
  selections: 'Choisis par nom',
  selection: '{{consumer}} → {{backend}}',
  howToChange: 'Comment modifier',
  howToChangeIntro:
    'Installez le plugin Redis de chaque service, enregistrez son plugin serveur, puis sélectionnez-le dans la configuration :',
  idGeneration: {
    mode: 'Mode',
    modeHint:
      'Avec plusieurs instances, attribuez les worker ID automatiquement afin que chaque instance obtienne le sien.',
    auto: 'Automatique · un worker ID par instance',
    manual: 'Manuel · workerId {{workerId}}',
  },
  checklist: {
    intro:
      'La page ne peut pas vérifier ces points elle-même. Confirmez-les en agissant sur deux instances :',
    files:
      'Un fichier envoyé sur l’instance A peut être téléchargé depuis l’instance B',
    realtime:
      'Un message produit sur A parvient en temps réel à un utilisateur connecté à B, et rien n’est perdu après une reconnexion',
    queue:
      'Une tâche mise en file sur A peut être traitée par B, et les nouvelles tentatives ne répètent pas les effets de bord',
    secrets:
      'Toutes les instances utilisent les mêmes secrets.keys, et la connexion fonctionne d’une instance à l’autre',
    websocket:
      'Le répartiteur de charge transmet les connexions WebSocket et correspond au chemin et au domaine de l’application',
  },
  notes: {
    current:
      'Cette page n’affiche que l’instance à laquelle vous êtes connecté. Elle ne peut pas savoir si les autres instances sont configurées de la même façon ; déployez-les à partir d’une même configuration.',
    noTest:
      'Il n’y a pas de « Tester la connexion » : les plugins Redis se connectent au démarrage de l’application, et l’application ne démarre pas s’ils n’y parviennent pas. Les erreurs de connexion en cours d’exécution apparaissent dans les journaux.',
    instances:
      'La liste des instances en cours d’exécution n’apparaît qu’avec l’attribution automatique des worker ID, fournie par un plugin commercial.',
  },
  checks: {
    database: {
      sqlite: {
        title: 'Base de données',
        detail:
          'SQLite ne sert qu’une seule instance. Plusieurs instances nécessitent PostgreSQL ou MySQL.',
        fix: 'Migrez les données vers PostgreSQL ou MySQL et faites pointer la connexion principale à la base de données vers celle-ci.',
      },
      shared: {
        title: 'Base de données',
        detail:
          '{{dialect}} : toutes les instances se connectent à la même base de données.',
      },
    },
    service: {
      unregistered: {
        title: '{{service}}',
        detail:
          '{{configPath}} sélectionne l’adaptateur « {{adapter}} », qu’aucun plugin enregistré ne fournit. Le service échouera à sa première utilisation.',
        fix: 'Installez et enregistrez le plugin qui fournit « {{adapter}} », ou sélectionnez un autre backend.',
      },
      local: {
        title: '{{service}} reste local à cette instance',
        detail:
          'Chaque instance conserve son propre état. Installez {{plugin}} et définissez {{configPath}} sur un backend Redis.',
        fix: 'Installez {{plugin}}, enregistrez son plugin serveur, puis sélectionnez-le :',
      },
      selectionLocal: {
        title: '{{service}}',
        detail:
          '{{consumer}} utilise explicitement le backend « {{backend}} », qui est local à cette instance.',
      },
    },
    services: {
      local: {
        title:
          'Cache, verrous, tâches en arrière-plan, file d’attente, messages en temps réel',
        detail: 'Tout est local à cette instance : {{services}}.',
      },
    },
    files: {
      local: {
        title: 'Stockage des fichiers',
        detail:
          'Les fichiers de {{collections}} se trouvent sur le disque de cet hôte ; les autres instances ne peuvent pas les lire.',
        fix: 'Utilisez un stockage partagé tel que S3 pour ces collections de fichiers, et déplacez-y leurs fichiers existants.',
      },
      defaultLocal: {
        title: 'Stockage des fichiers',
        detail:
          'Le stockage par défaut enregistre les fichiers sur le disque de cet hôte ; les autres instances ne peuvent pas les lire.',
        fix: 'Définissez comme stockage par défaut un stockage partagé tel que S3.',
      },
      shared: {
        title: 'Stockage des fichiers',
        detail:
          'Aucune collection de fichiers ne conserve ses fichiers sur le disque de cet hôte.',
      },
    },
    idGeneration: {
      auto: {
        title: 'Génération d’ID',
        detail:
          'Attribution automatique : chaque instance obtient son propre worker ID.',
      },
      manual: {
        title: 'Génération d’ID',
        detail:
          'Worker ID manuel {{workerId}}. Deux instances ayant le même worker ID peuvent générer les mêmes ID.',
        fix: 'Attribuez à chaque instance son propre SNOWFLAKE_WORKER_ID, ou installez un plugin qui attribue les worker ID automatiquement.',
      },
    },
    secrets: {
      set: {
        title: 'Secrets',
        detail:
          'secrets.keys est défini. Assurez-vous que toutes les instances utilisent les mêmes clés.',
      },
      missing: {
        title: 'Secrets',
        detail:
          'secrets.keys n’est pas défini. Toutes les instances ont besoin des mêmes clés pour lire ce que les autres chiffrent.',
        fix: 'Générez une clé avec openssl rand -hex 32 et définissez-la sur toutes les instances.',
      },
    },
    publicOrigin: {
      set: {
        title: 'Adresse publique',
        detail: 'app.publicOrigin = {{origin}}',
      },
      missing: {
        title: 'Adresse publique',
        detail:
          'app.publicOrigin n’est pas défini. Derrière un répartiteur de charge, les liens et les rappels ont besoin de l’adresse publique.',
        fix: 'Définissez app.publicOrigin sur l’adresse que les utilisateurs ouvrent.',
      },
    },
    checkFailed: {
      title: 'Une vérification n’a pas pu s’exécuter',
      detail:
        'La vérification « {{check}} » a échoué ; consultez les journaux.',
    },
  },
};

export default frFR;
