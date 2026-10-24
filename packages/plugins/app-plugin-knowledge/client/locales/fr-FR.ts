import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  access: {
    businessSection: 'Connaissance',
    businesses: {
      knowledge: {
        title: 'Connaissance',
        description: 'Les documents de chaque espace de connaissances.',
        actions: {
          read: {
            title: 'Lire la connaissance',
            description:
              'Lire les connaissances du système et celles des espaces qui leur sont liés',
            related: 'Lire les connaissances (espaces qui leur sont liés)',
            relatedLabel: 'Espaces qui me concernent',
            relatedHint:
              "L'application décide quels espaces se rapportent à qui",
            all: 'Lire les connaissances (toutes)',
          },
          propose: {
            title: 'Proposer des connaissances',
            description:
              "Proposer un changement pour que quelqu'un qui puisse éditer décide ; quels agents peuvent être administrés",
            related: 'Proposer des connaissances (espaces qui leur sont liés)',
            relatedLabel: 'Espaces qui me concernent',
            relatedHint:
              "L'application décide quels espaces se rapportent à qui",
            all: 'Proposer des connaissances (tous)',
          },
          edit: {
            title: 'Modifier les connaissances',
            description:
              'Modifier, archiver et marquer comme vérifiées, et décider des propositions ; la connaissance du système a besoin de tous',
            related: 'Modifier les connaissances (espaces qui leur sont liés)',
            relatedLabel: 'Espaces qui me concernent',
            relatedHint:
              "L'application décide quels espaces se rapportent à qui",
            all: 'Modifier les connaissances (toutes)',
          },
          manage: {
            title: "Gérer l'accès aux connaissances",
            description:
              "Changer qui peut accéder à chaque dossier et article, et conserver l'accès à l'ensemble de ceux-ci ; la connaissance du système a besoin de tous",
            related:
              "Gérer l'accès aux connaissances (espaces qui leur sont liés)",
            relatedLabel: 'Espaces qui me concernent',
            relatedHint:
              "L'application décide quels espaces se rapportent à qui",
            all: "Gérer l'accès aux connaissances (tous)",
          },
        },
      },
    },
  },
  knowledge: {
    directory: {
      title: 'Connaissance',
      system: 'Connaissance du système',
      count_one: 'Document {{count}}',
      count_other: 'Documents {{count}}',
      archivedCount_one: 'Document archivé {{count}}',
      archivedCount_other: 'Documents archivés {{count}}',
      selectTarget: 'Ouvrir {{title}}',
      target: 'Créer dans {{title}}',
      chooseTarget:
        'Choisir un projet ou une connaissance système à créer dans',
      expandAll: 'Tout développer',
      collapseAll: 'Tout réduire',
      retry: 'Réessayer',
      allProposals: 'Toutes les propositions',
      reviewPage: 'Page {{page}} de {{pages}} · Total {{total}}',
      previous: 'Précédent',
      next: 'Suivant',
      empty: 'Aucun espace de connaissances accessible',
      emptyAccessHint:
        "Demandez à un administrateur d'accéder aux connaissances du projet ou du système.",
      noAccess:
        "Cette connaissance n'est pas disponible ou vous n'y avez plus accès.",
      emptyHint:
        "Ouvrez cet espace pour créer un document, ou demandez à un éditeur d'en ajouter un.",
      createFailed:
        'Impossible de créer cette entrée. Vérifiez la cible et réessayez.',
      showResults: 'Afficher les meilleurs résultats pour « {{q}} »',
      topResults:
        'Sections les mieux classées pour tous les projets et connaissances du système.',
      welcome:
        "Développez les connaissances d'un projet ou d'un système partagé pour parcourir les documents. Sélectionnez un espace à créer ou effectuez une recherche parmi toutes les connaissances autorisées.",
      count_many: 'Documents {{count}}',
      archivedCount_many: 'Documents archivés {{count}}',
    },
    title: 'Connaissance',
    someone: "Quelqu'un",
    loading: 'Chargement',
    index: {
      states: {
        pending: 'En attente',
        done: 'Indexé',
        failed: 'Échec',
      },
      done: 'Indexé',
      pending: 'Indexation {{indexed}}/{{total}}',
      failed: "Échec de l'indexation",
      failedHint:
        "Certaines sections n'ont pas pu être intégrées après chaque tentative.",
      reason: 'Raison : {{reason}}',
      retry: 'Indexer à nouveau',
      refreshFailed: "Impossible d'actualiser l'état d'indexation",
      retryRefresh: "Réessayez d'actualiser",
      queued: "De nouveau en file d'attente pour l'indexation",
    },
    chunks: {
      open: 'Afficher les sections',
      title: 'Sections',
      description:
        'Les sections {{count}} dans lesquelles la version actuelle de "{{title}}" est découpée ; la recherche et les citations fonctionnent section par section. Choisissez-en un pour le retrouver dans le document.',
      lead: '(Avant le premier titre)',
      lines: 'Lignes {{start}}–{{end}}',
      chars_one: 'Caractère {{count}}',
      chars_other: 'Caractères {{count}}',
      empty: 'Ce document ne comporte pas encore de sections.',
      showing: 'Mise en surbrillance des lignes {{start}}–{{end}}.',
      clear: 'Effacer la surbrillance',
      chars_many: 'Caractères {{count}}',
    },
    chunking: {
      title: 'Paramètres des sections',
      description:
        'Les articles et fichiers (leur texte extrait) dans {{space}} sont découpés en sections au niveau de leurs titres pour la recherche et les citations : Word conserve ses propres titres, chaque page PDF ou diapositive et chaque feuille est un titre de niveau 2, et le texte sans titres est coupé en longueur. Cet espace peut être coupé différemment de celui par défaut.',
      own: 'Définir pour cet espace',
      defaults:
        "Par défaut : descentes jusqu'au niveau {{depth}}, visant les caractères {{target}}, au maximum {{max}}.",
      depth: 'Couper aux titres',
      depths: {
        '1': 'Niveau 1 uniquement (#)',
        '2': "Jusqu'au niveau 2 (##)",
        '3': "Jusqu'au niveau 3 (###)",
      },
      depthHint:
        "Les titres plus profonds restent à l'intérieur de leur section. Au niveau 1 uniquement, les fichiers ne sont pas découpés par page ou par feuille.",
      target: 'Longueur cible (caractères)',
      max: 'Limite (caractères)',
      sizesHint:
        'Une section plus longue que la limite est coupée entre les paragraphes en morceaux à proximité de la cible ; les blocs de code et les tables ne sont jamais coupés.',
      invalid:
        'Les longueurs vont de {{min}} à {{max}}, et la cible est au maximum de la limite.',
      effect:
        "L'enregistrement coupe à nouveau les documents en arrière-plan et réindexe leurs sections lorsque la recherche sémantique est activée.",
      rechunking: 'Couper à nouveau les documents en arrière-plan…',
      save: 'Enregistrer',
      saved: 'Paramètres de section enregistrés',
    },
    loadFailed: 'Impossible de charger les connaissances',
    kinds: {
      folder: 'Dossier',
      article: 'Article',
      file: 'Fichier',
    },
    folder: {
      empty: 'Ce dossier est vide.',
    },
    new: {
      label: 'Nouveau',
      article: 'Nouvel article',
      folder: 'Nouveau dossier',
      childArticle: "Nouvel article à l'intérieur",
      childFolder: "Nouveau dossier à l'intérieur",
    },
    files: {
      upload: 'Télécharger des fichiers',
      uploadHere: 'Téléchargez des fichiers ici',
      dropHint:
        'Déposez les fichiers ici ou dans un dossier pour les télécharger.',
      uploaded_one:
        "Fichier {{count}} téléchargé ; son texte est en cours d'extraction.",
      uploaded_other:
        "Fichiers {{count}} téléchargés ; leur texte est en cours d'extraction.",
      download: 'Télécharger',
      version: 'Version {{version}}',
      statusHint: {
        parsing:
          "Le texte est en cours d'extraction ; La recherche trouve le fichier une fois qu'il est prêt.",
        ready:
          'Son texte est extrait, donc la recherche et les agents le lisent.',
        failed: "Le texte n'a pas pu être extrait.",
        unsupported:
          "Le texte n'est pas extrait des fichiers de ce type ; il est stocké tel quel.",
      },
      replace: 'Remplacer',
      replaced: 'Remplacé : version {{version}}.',
      reparse: 'Extraire à nouveau',
      file: 'Fichier',
      propose: 'Proposer',
      proposeNew: 'Proposer un fichier',
      proposeNewHint:
        "Celui qui peut éditer cette connaissance décide ; l'accepter ajoute le fichier.",
      proposeReplace: 'Proposer un remplacement',
      proposeReplaceHint:
        "Celui qui peut éditer cette connaissance décide ; l'accepter fait de votre fichier la prochaine version de {{title}}.",
      proposeReasonHint: 'Pourquoi cela a sa place ici, pour celui qui décide.',
      proposed: "Proposé; quelqu'un qui peut éditer décide.",
      preview: 'Aperçu',
      text: 'Texte extrait',
      failed: "Le texte n'a pas pu être extrait : {{reason}}",
      status: {
        parsing: 'Extraction du texte',
        ready: 'Texte extrait',
        failed: "Échec de l'extraction",
        unsupported: 'Stocké uniquement',
      },
      noText: {
        parsing:
          "Le texte est en cours d'extraction ; il apparaît ici une fois prêt.",
        ready: 'Le fichier ne contient aucun texte.',
        failed: "Le texte n'a pas pu être extrait.",
        unsupported:
          "Le texte n'est pas extrait des fichiers de ce type ; le fichier est stocké tel quel.",
      },
      uploaded_many:
        "Fichiers {{count}} téléchargés ; leur texte est en cours d'extraction.",
    },
    spaces: {
      actions: 'Actions spatiales',
      access: "Accès à l'espace",
      proposeOnly: 'Proposer seulement',
      inherited: 'Hérité',
      inheritedHint: "Hérité d'un autre espace ; en lecture seule ici.",
      default: 'Connaissance',
      readOnly: 'Lecture seule',
      empty: "Aucun document pour l'instant.",
    },
    tree: {
      actions: 'Actions',
      expand: 'Développer',
      collapse: 'Réduire',
      label: 'Documents',
      newDoc: 'Nouveau document',
      archived: 'Afficher archivé',
      archivedBadge: 'Archivé',
      pending: '{{count}} en attente',
      back: 'Tous les documents',
      restricted:
        'Restreint : seules les personnes répertoriées peuvent y accéder',
    },
    doc: {
      permissions: 'Autorisations',
      restricted: 'Restreint · {{count}}',
      restrictedHint:
        "Seules les personnes répertoriées et celui qui gère l'espace peuvent y accéder.",
      verifiedLabel: 'Vérifié',
      versionBy: 'v{{version}} · {{name}}',
      proposeChanges: 'Proposer des modifications',
      more: "Plus d'actions",
      pending_one: '{{count}} en attente',
      pending_other: '{{count}} en attente',
      updatedAgo: 'Mise à jour de {{time}}',
      updatedDetail: '{{name}} · v{{version}}',
      renameTitle: 'Renommer « {{title}} »',
      renamedToast: 'Renommé.',
      notFound:
        "Ce document n'existe plus, ou vous ne le verrez peut-être pas.",
      notVerified: 'Pas encore vérifié',
      contents: 'Contenu',
      edit: 'Modifier',
      rename: 'Renommer',
      history: 'Histoire',
      verify: 'Marque vérifiée',
      verifiedToast: 'Marqué vérifié.',
      archive: 'Archiver',
      archiveTitle: 'Archives « {{title}} » ?',
      archiveDescription:
        "Il disparaît de l'arbre et des agents. Vous pourrez le restaurer plus tard ; ses versions sont conservées.",
      archivedToast: 'Archivé.',
      restore: 'Restaurer',
      restoredToast: 'Restauré.',
      move: 'Déplacer',
      moveTitle: 'Déplacer « {{title}} »',
      moveTo: 'Sous',
      root: 'Au plus haut niveau',
      movedToast: 'Déplacé.',
      archivedNotice: 'Ce document est archivé et en lecture seule.',
      oldVersion: 'Vous lisez la version {{version}}.',
      backToCurrent: 'Retour à la version actuelle',
      proposals: 'Propositions en attente',
      empty: 'Ce document est vide.',
      pending_many: '{{count}} en attente',
    },
    editor: {
      editing: 'Édition',
      proposing: 'Proposer des changements',
      properties: 'Propriétés',
      propertiesHint:
        'Ce que les agents et les liens lisent à propos de ce document.',
      nothingToPreview: "Rien à prévisualiser pour l'instant.",
      reasonPlaceholder: 'Pourquoi cela devrait changer, car celui qui décide',
      submitProposal: 'Soumettre une proposition',
      proposed: "Proposé; quelqu'un qui peut éditer décide.",
      title: 'Titre',
      slug: 'Limace',
      slugHint:
        "Lettres minuscules, chiffres et traits d'union ; comment les agents et les liens le nomment. Laissé vide, il est constitué à partir du titre.",
      summary: 'Résumé',
      summaryHint: "Les agents d'une seule ligne lisent dans l'index.",
      content: 'Contenu',
      contentPlaceholder: 'Markdown',
      write: 'Écrire',
      preview: 'Aperçu',
      note: 'Modifier la note',
      notePlaceholder: "Ce qui a changé, pour l'historique (facultatif)",
      parent: 'Parent',
      save: 'Enregistrer',
      saved: 'Enregistré sous la version {{version}}.',
      unchanged: "Rien n'a changé.",
      create: 'Créer',
      created: 'Document créé.',
      cancel: 'Annuler',
      conflict:
        "Quelqu'un a enregistré la version {{version}} pendant que vous la modifiiez. Copiez votre texte, rechargez et appliquez à nouveau votre modification.",
      reload: 'Recharger',
    },
    history: {
      by: 'par {{name}}',
      title: 'Histoire',
      current: 'Actuel',
      fromProposal: "D'une proposition",
      compare: 'Comparer',
      with: 'avec',
      previous: 'la version avant',
      noChanges: 'Aucune différence.',
      view: 'Afficher',
      unchangedLines: 'Lignes inchangées {{count}}',
      approvedBy: 'approuvé par {{name}}',
    },
    search: {
      description:
        'Rechercher les documents de cet espace et les espaces dont il hérite.',
      hint: 'Tapez pour rechercher des titres et du texte.',
      emptyHint: "Essayez d'autres mots, ou moins.",
      all: 'Afficher tous les résultats pour « {{q}} »',
      resultsFor: 'Résultats pour “{{q}}”',
      placeholder: 'Rechercher des connaissances',
      label: 'Rechercher des connaissances',
      empty: 'Rien trouvé pour « {{q}} ».',
      results: 'Résultats',
      inherited: 'Hérité',
    },
    home: {
      emptyTitle: "Aucun document dans {{space}} pour l'instant",
      emptyEdit:
        'Écrivez le premier article ou téléchargez des fichiers pour commencer.',
      emptyPropose:
        "Proposez un fichier et quelqu'un qui peut le modifier décide s'il est ajouté.",
      emptyRead: "Rien n'a encore été écrit ici.",
      count_one: 'Document {{count}}',
      count_other: 'Documents {{count}}',
      pending_one: 'En attente de révision ({{count}})',
      pending_other: 'En attente de révision ({{count}})',
      all: 'Tout voir',
      recent: 'Récemment mis à jour',
      updated: '{{time}} · {{name}}',
      unindexed: 'Pas entièrement indexé',
      unindexedFailed: 'Échec de {{failed}} · {{pending}} en attente',
      unindexedPending_one: 'Section {{count}} en attente',
      unindexedPending_other: 'Sections {{count}} en attente',
      unverified: 'Non vérifié récemment',
      verifiedAgo: 'Vérifié {{time}}',
      count_many: 'Documents {{count}}',
      pending_many: 'En attente de révision ({{count}})',
      unindexedPending_many: 'Sections {{count}} en attente',
    },
    diff: {
      changes_one: 'Modification {{count}}',
      changes_other: 'Modifications du {{count}}',
      previous: 'Modification précédente',
      next: 'Prochain changement',
      layout: 'Disposition des différences',
      inline: 'En ligne',
      split: 'Diviser',
      changes_many: 'Modifications du {{count}}',
    },
    access: {
      you: {
        manage: 'Vous pouvez gérer',
        edit: 'Vous pouvez modifier',
        propose: 'Vous pouvez proposer',
        read: 'Vous pouvez lire',
        none: "Pas d'accès",
      },
      title: "Accès à l'espace",
      description: 'Qui peut lire, proposer et éditer dans {{space}}.',
      yours: 'Votre accès',
      actions: {
        read: 'Lire les documents et les rechercher',
        propose:
          "Proposer des modifications à quelqu'un qui peut modifier pour décider",
        edit: 'Modifier, organiser et vérifier les documents et décider des propositions',
        manage: 'Changer qui peut accéder à chaque dossier et article',
      },
      allowed: 'Autorisé',
      notAllowed: 'Non autorisé',
      matrix: 'Par rôle',
      role: 'Rôle',
      columns: {
        read: 'Lire',
        propose: 'Proposer',
        edit: 'Modifier',
        manage: 'Gérer',
      },
      from: 'Source : {{source}}',
      source: {
        space: 'votre accès à {{space}}',
        manager: 'vous gérez {{space}}',
        entry: '{{subject}}, réglé sur « {{title}} »',
      },
      restrictedAt:
        'Restreint à « {{title}} » : seules les personnes qui y sont répertoriées peuvent y accéder.',
      viewOnly:
        'Seule la personne qui le gère peut modifier les personnes autorisées à y accéder.',
      mine: '(le vôtre)',
      howTitle: "Comment fonctionne l'accès ici",
      agents:
        "Les agents agissant pour le compte de quelqu'un lisent et proposent tout au plus ; ils ne modifient ni ne décident jamais.",
      manage: 'Changement de rôles',
    },
    permissions: {
      title: 'Autorisations de « {{title}} »',
      description: {
        folder:
          "Qui peut lire, proposer, éditer et gérer ce dossier et ce qu'il contient.",
        article: 'Qui peut lire, proposer, éditer et gérer cet article.',
        file: 'Qui peut lire, proposer, éditer et gérer ce fichier.',
      },
      modeLabel: 'Accès',
      modes: {
        inherit: 'Hériter de son parent',
        custom: 'Seules les personnes répertoriées',
      },
      inheritHint:
        'Quiconque peut accéder à son parent peut y accéder aussi, et les personnes ajoutées ci-dessous obtiennent au moins leur niveau.',
      customHint:
        "Seules les personnes listées ci-dessous peuvent y accéder, quelle que soit l'autorisation de son parent ; ce qui est en dessous suit à moins qu'il ne soit lui-même restreint.",
      inherited: 'Hérité',
      fromSpace:
        'Toutes les personnes ayant accès à {{space}}, selon leurs rôles',
      fromDoc: 'De « {{title}} »',
      fromRestricted:
        'Depuis « {{title}} », auquel seules les personnes répertoriées peuvent accéder',
      added: 'A également accès',
      listed: 'Personnes répertoriées',
      add: 'Ajouter des personnes',
      addPlaceholder: 'Ajouter des personnes, des rôles…',
      noMatches: 'Aucun match.',
      noneAdded: 'Personne au-delà de ce qui est hérité.',
      noneListed:
        "Personne répertoriée : seul celui qui gère l'espace peut y accéder.",
      managers:
        "Celui qui gère l'espace en garde toujours l'accès. Les agents lisent et proposent tout au plus, et seulement ce qu'eux et leur personne peuvent.",
      levelOf: 'Niveau de {{subject}}',
      levels: {
        read: 'Peut lire',
        propose: 'Peut proposer',
        edit: 'Peut modifier',
        manage: 'Peut gérer',
      },
      remove: 'Supprimer',
      removedSubject: 'Supprimé ({{id}})',
      save: 'Enregistrer',
      close: 'Fermer',
      saved: 'Autorisations enregistrées.',
      loadFailed: 'Impossible de charger les autorisations.',
    },
    searchTest: {
      title: 'Test de recherche',
      description:
        'Exécute une recherche comme vous le feriez et montre comment chaque hit a été classé : sa pertinence, son classement par mots-clés et par signification, le score de reclassement et où il se trouve dans son document.',
      keyword: 'Mots-clés',
      semantic: 'Signification',
      relevance: 'Pertinence {{score}}',
      rank: '{{name}} #{{rank}} · {{score}}',
      unranked: '{{name}} : introuvable',
      lines: 'Lignes {{start}}–{{end}}',
      notExplained:
        "Les détails du classement sont affichés uniquement aux personnes qui gèrent l'espace ou les paramètres de recherche.",
      query: 'Mots à rechercher',
      run: 'Rechercher',
      fused: '{{score}} fusionné',
      provider: '{{name}} #{{rank}} · {{score}}',
      reranked: '{{score}} reclassé',
      notReranked: 'Non reclassé',
    },
    proposals: {
      listTitle: 'Propositions',
      statuses: {
        pending: 'En attente',
        accepted: 'Accepté',
        rejected: 'Rejeté',
        withdrawn: 'Retiré',
      },
      none: {
        pending: "Rien n'est en attente de révision.",
        accepted: 'Aucune proposition acceptée pour le moment.',
        rejected: 'Aucune proposition rejetée.',
      },
      about: 'Sur « {{title}} »',
      clearAbout: 'Afficher toutes les propositions',
      onBehalf: '{{proposer}} au nom de {{person}}',
      overview: 'Aperçu',
      changes: 'Modifications',
      staleTitle: 'Le document a changé depuis',
      decision: 'Décision',
      commentLabel: 'Commentaire',
      pendingEntry: 'En attente de révision · {{count}}',
      kinds: {
        update: 'Changement',
        create: 'Nouveau document',
        verify: 'Tient toujours',
      },
      by: '{{proposer}} pour {{person}}',
      from: 'De {{source}}',
      reason: 'Raison',
      summary: 'Résumé',
      stale:
        "Le document a changé depuis sa rédaction (v{{base}} → v{{current}}). L'acceptation remplace la version actuelle par la proposition entière.",
      diffProposed: 'Modification proposée (v{{base}} → proposition)',
      diffCurrent:
        'Par rapport à la version actuelle (v{{current}} → proposition)',
      newContent: 'Contenu proposé',
      newFile: 'Dossier proposé',
      replacementFile: 'Remplacement de la version {{base}}',
      fileNote: 'Son texte est extrait une fois accepté.',
      verifyNote:
        "Rien ne change dans le document ; il est marqué vérifié aujourd'hui.",
      accept: 'Accepter',
      acceptAnyway: 'Accepter quand même',
      reject: 'Rejeter',
      comment: 'Commentaire (facultatif)',
      accepted: 'Accepté.',
      rejected: 'Rejeté.',
      decided: '{{outcome}} par {{name}}',
      open: 'Ouvrir',
      readOnly: 'Celui qui peut éditer cette connaissance en décide.',
    },
  },
  errors: {
    KNOWLEDGE_PROPOSAL_PENDING:
      "Votre proposition antérieure pour ce document est toujours en attente ; il faut d'abord le décider.",
    KNOWLEDGE_PROPOSAL_REJECTED:
      'Le même changement a déjà été rejeté; proposer quelque chose de différent.',
    EMPTY_CONTENT: 'Le contenu proposé est vide.',
    INVALID_REASON:
      'Dites pourquoi cela devrait changer (au maximum 500 caractères).',
    KNOWLEDGE_VERSION_CONFLICT:
      "Quelqu'un a enregistré une version plus récente entre-temps ; rechargez et appliquez à nouveau votre modification.",
    KNOWLEDGE_SLUG_TAKEN: 'Un autre document dans cet espace contient ce slug.',
    KNOWLEDGE_HAS_CHILDREN: "Archivez ou déplacez d'abord ses sous-documents.",
    KNOWLEDGE_ARCHIVED: "Le document est archivé ; restaurez-le d'abord.",
    KNOWLEDGE_DEPTH_EXCEEDED:
      "Les documents s'imbriquent sur quatre niveaux au maximum.",
    KNOWLEDGE_INVALID_MOVE:
      "Un document ne peut pas relever de lui-même ou d'un des siens.",
    KNOWLEDGE_PROPOSAL_STALE:
      'Le document a changé depuis la rédaction de la proposition.',
    KNOWLEDGE_PROPOSAL_DECIDED: 'Cette proposition a déjà été décidée.',
    INVALID_SLUG:
      "Le slug accepte les lettres minuscules, les chiffres et les traits d'union.",
    INVALID_TITLE: 'Un titre est requis (au maximum 200 caractères).',
    FILE_TOO_LARGE: 'Le fichier est trop volumineux.',
    FILES_UNAVAILABLE: 'Cette application ne stocke aucun fichier.',
    INVALID_FILE: 'Envoyez un fichier.',
    INVALID_PARENT: 'Rien ne rentre dans un dossier.',
    KNOWLEDGE_NOT_FAILED:
      "Seul un fichier dont le texte n'a pas pu être extrait est à nouveau extrait.",
  },
  ui: {
    nav: {
      knowledge: 'Connaissance',
    },
  },
  common: {
    forbidden: "Vous n'avez pas la permission de faire cela.",
    requestFailed: 'La demande a échoué. Veuillez réessayer.',
  },
};

export default frFR;
