import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  storage: {
    title: 'Stockage des fichiers',
    navDescription:
      'Où sont stockés les fichiers envoyés, et quelles fonctionnalités les stockent',
    description:
      'Où sont stockés les fichiers envoyés, la taille maximale d’un fichier et les fonctionnalités qui stockent des fichiers. Le stockage est défini dans la configuration de l’application (`drive`) et prend effet après un redéploiement ; cette page affiche les paramètres en vigueur et vérifie que le stockage peut réellement être lu et écrit.',
    checkAction: 'Vérifier le stockage',
    loading: 'Chargement du stockage des fichiers…',
    loadFailed: 'Impossible de charger le stockage des fichiers.',
    retry: 'Réessayer',
    tabs: { disks: 'Stockage', usages: 'Fonctionnalités' },
    hints: {
      title_one: '{{count}} avertissement',
      title_many: '{{count}} avertissements',
      title_other: '{{count}} avertissements',
      incomplete:
        'Le disque {{disk}} n’est pas entièrement configuré ({{problems}}) : sans conséquence tant qu’il n’est pas utilisé, il échoue lorsqu’il est choisi.',
      localDefault:
        'Le stockage par défaut est un disque local : l’application ne peut fonctionner qu’en une seule instance. Utilisez un stockage partagé pour plusieurs instances.',
      seeCluster: 'Voir Cluster et distribué.',
    },
    columns: {
      name: 'Nom',
      type: 'Type · emplacement',
      visibility: 'Visibilité',
      maxFileSize: 'Taille max. de fichier',
      usages: 'Fonctionnalités',
      status: 'Statut',
      feature: 'Fonctionnalité',
      collection: 'Table de fichiers',
      disk: 'Stocké sur',
      download: 'Téléchargement',
      files: 'Fichiers',
      setting: 'Paramètre',
      value: 'Valeur actuelle',
      source: 'Source',
    },
    default: 'Par défaut',
    details: 'Détails',
    usageCount_one: '{{count}} fonctionnalité',
    usageCount_many: '{{count}} fonctionnalités',
    usageCount_other: '{{count}} fonctionnalités',
    drivers: {
      fs: 'Disque local',
      s3: 'Stockage compatible S3',
      oss: 'Alibaba Cloud OSS',
      custom: 'Pilote personnalisé',
    },
    location: {
      inApp: '{{path}} (dans le répertoire de l’application)',
      outsideApp: 'En dehors du répertoire de l’application',
      bucketMissing: 'bucket non défini',
      unknown: 'Défini dans le code',
    },
    visibility: {
      private: 'Privé',
      public: 'Public',
      privateLong: 'Privé : téléchargeable uniquement via l’application',
      publicLong: 'Public : toute personne disposant de l’URL peut télécharger',
      unknown: 'Déterminé par le pilote',
    },
    urls: {
      application: 'Servi par l’application (stream)',
      public: 'URL publique',
      signed: 'URL signée qui expire',
    },
    sizeMb: '{{size}} Mo',
    status: {
      ok: 'Lecture et écriture OK',
      failed: 'Échec de la vérification',
      incomplete: 'Configuration incomplète',
      unchecked: 'Non vérifié',
      checkedAgo: 'Vérifié {{time}}',
    },
    problems: {
      LOCATION_MISSING: 'location est vide',
      BUCKET_MISSING: 'bucket est vide',
      REGION_MISSING: 'region est vide',
      CREDENTIALS_MISSING: 'identifiants manquants',
      REGION_INVALID: 'region doit être de la forme oss-<region>',
      CREDENTIALS_INVALID:
        'les identifiants mélangent deux sources ou sont invalides',
      SETTINGS_INVALID: 'timeout ou domain est invalide',
      NOT_LOADED: 'non chargé par l’application',
    },
    sources: {
      code: 'Code',
      config: 'Configuration',
      default: 'Valeur par défaut',
    },
    settings: {
      driver: 'Type',
      location: 'Emplacement',
      visibility: 'Visibilité',
      maxFileSize: 'Taille max. de fichier',
      urls: 'Liens de téléchargement',
    },
    backToList: 'Stockage des fichiers',
    defaultSubtitle: 'Les nouveaux envois sont stockés ici par défaut.',
    notDefaultSubtitle:
      'Utilisé uniquement par les fonctionnalités qui le désignent.',
    notFound: 'Le disque {{disk}} n’est pas configuré.',
    howToChange: 'Comment modifier',
    howToChangeNote:
      'Alibaba Cloud OSS (`oss`) et les pilotes personnalisés sont également pris en charge. Redéployez après la modification et relevez la limite de taille du corps des requêtes du proxy inverse au moins à la taille max. de fichier.',
    check: {
      title: 'Vérification',
      run: 'Vérifier',
      rerun: 'Vérifier à nouveau',
      running: 'Vérification…',
      failed: 'La vérification n’a pas pu être exécutée.',
      never:
        'Ce disque n’a pas été vérifié sur cette instance depuis son démarrage.',
      scope:
        'Seul un fichier temporaire du répertoire `nocobase-check/` du disque est écrit, lu et supprimé ; les fichiers métier ne sont pas touchés. Avec plusieurs instances, seule cette instance est vérifiée.',
      steps: {
        write: 'Écrire un fichier temporaire',
        read: 'Le relire et comparer',
        url: 'Créer un lien de téléchargement',
        delete: 'Supprimer le fichier temporaire',
      },
      details: {
        bytes: '{{bytes}} octets identiques',
        APPLICATION: 'Servi via l’application',
        PUBLIC: 'URL publique créée',
        SIGNED: 'URL signée créée',
        deleted: 'Supprimé',
        skipped: 'Ignoré',
      },
      reasons: {
        CONFIG_INCOMPLETE: 'Configuration incomplète : {{detail}}',
        DISK_UNAVAILABLE: 'Le disque n’a pas pu être ouvert',
        WRITE_FAILED: 'Échec de l’écriture',
        READ_FAILED: 'Échec de la lecture',
        CONTENT_MISMATCH: 'Le contenu relu est différent',
        URL_FAILED: 'Aucun lien n’a pu être créé',
        DELETE_FAILED: 'Échec de la suppression',
        unknown: 'Échec',
      },
    },
    usedBy: 'Fonctionnalités utilisant ce disque',
    noUsagesOnDisk:
      'Aucune fonctionnalité ne stocke de fichiers sur ce disque.',
    download: {
      authenticated: 'Connexion et autorisation',
      public: 'Lien public',
    },
    diskDefault: 'Par défaut ({{disk}})',
    diskConfig: '{{path}} → {{disk}}',
    diskConfigDefault: '{{path}} → Par défaut ({{disk}})',
    plugin: 'Plugin {{plugin}}',
    application: 'Application',
    filesValue: '{{files}} fichiers · {{size}}',
    filesUnavailable: 'Impossible de compter',
    empty: {
      title: 'Aucune fonctionnalité ne stocke encore de fichiers',
      description:
        'Les tables de fichiers sont créées par des plugins ou par le code de l’application. Une fois un plugin avec pièces jointes installé (projets, bases de connaissances ou agents, par exemple), il apparaît ici sans autre configuration.',
      defaultDisk:
        'Les paramètres de stockage s’appliquent toujours : les tables de fichiers ajoutées plus tard stockent leurs fichiers sur {{disk}} par défaut.',
    },
    notes: {
      title: 'Remarques',
      firstUse:
        'Le stockage est connecté à la première utilisation ; un démarrage réussi ne prouve donc pas qu’il peut être lu et écrit. La vérification écrit, lit et supprime un fichier temporaire pour le confirmer.',
      changeDefault:
        'Changer le stockage par défaut n’affecte que les envois ultérieurs ; les fichiers existants sont toujours lus depuis le stockage indiqué par leurs enregistrements et ne sont pas déplacés.',
      deleteRecords:
        'Supprimer un enregistrement ne supprime pas son fichier du disque.',
      publicLinks:
        'Un lien public peut être ouvert par toute personne qui le connaît, sans connexion. Les fichiers sensibles doivent être servis par les routes authentifiées propres au plugin.',
      noBrowser:
        'Il n’existe pas d’explorateur de fichiers global : les fichiers appartiennent à leurs fonctionnalités et se consultent selon les autorisations de chacune.',
      readOnly:
        'Les fonctionnalités sont déclarées par le code des plugins ou de l’application (table de fichiers, disque, mode de téléchargement). Cette liste est en lecture seule ; aucune table de fichiers ne peut être créée ici.',
    },
  },
  'files.ooxmlLoadFailed':
    'Impossible de restituer ce fichier Office Open XML.',
  'files.ooxmlLoadTimedOut':
    "Le chargement de l'aperçu n'a pas été terminé dans les minutes {{minutes}}.",
  'files.previewRequestFailed': "La demande d'aperçu a échoué ({{status}}).",
  uploadFailed: 'Le téléchargement du fichier a échoué.',
  fileLimitReached: 'Le nombre maximum de fichiers a été atteint.',
  fileTooLarge: 'Le fichier dépasse la taille maximale.',
  fileTypeNotAllowed: "Le type de fichier n'est pas autorisé.",
  removalFailed: 'La ​​suppression du fichier a échoué.',
  urlNotAllowed: "Le fichier URL n'est pas autorisé.",
  downloadFailed: 'Le téléchargement du fichier a échoué.',
  invalidUrl: "Le fichier URL est manquant ou n'est pas autorisé.",
  pdfPreviewFailed: "Impossible de charger l'aperçu PDF.",
  pdfPreviewMarkup:
    "Le fichier URL renvoie du HTML ou du XML au lieu d'un PDF.",
  previewFailed: "Impossible de charger l'aperçu du fichier.",
  'files.empty': 'Aucun dossier.',
  'files.preview': 'Aperçu',
  'files.download': 'Télécharger',
  'files.remove': 'Supprimer',
  'files.chooseMany': 'Choisir les fichiers',
  'files.chooseOne': 'Choisir un fichier',
  'files.retry': 'Réessayer',
  'files.done': 'Terminé',
  'files.uploading': 'Téléchargement',
  'files.failed': 'Échec',
  'files.pending': 'En attente',
  'files.previous': 'Fichier précédent',
  'files.next': 'Fichier suivant',
  'files.loadingPreview': "Chargement de l'aperçu...",
  'files.downloadFile': 'Télécharger le fichier',
  'files.previewUnavailable':
    "L'aperçu n'est pas disponible pour ce type de fichier.",
  'files.imageFailed':
    "Cette image n'a pas pu être affichée. Il est peut-être corrompu ou dans un format non pris en charge.",
  'files.officeFailed': "Office Online n'a pas pu charger ce fichier.",
  'files.officeUrl':
    'Office Online nécessite un fichier absolu URL accessible sur Internet.',
  'files.cancelFile': 'Annuler {{filename}}',
  'files.status.uploading': 'Téléchargement',
  'files.status.pending': 'En attente',
  'files.status.error': 'Échec',
};

export default frFR;
