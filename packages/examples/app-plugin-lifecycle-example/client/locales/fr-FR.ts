import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  navigation: {
    parameters: "Paramètres d'exécution",
    group: 'Workflow',
    tickets: "Service d'assistance",
    expenses: 'Notes de frais',
    invoices: 'Facturation électronique',
    orders: 'Paiement de la commande',
    exports: 'Exportations de données',
    purchases: 'Vente flash',
    fulfilments: 'Expédition',
    subscriptions: 'Abonnements',
  },
  parameters: {
    fields: {
      paymentWindowMinutes: {
        title: 'Délai de paiement (minutes)',
        description:
          "Annuler une commande impayée après cette attente. Les modifications s'appliquent aux délais de paiement nouvellement programmés ; les minuteries existantes gardent leur heure due.",
      },
      escalateAfterMinutes: {
        title: 'Expiration du délai de révision du responsable (minutes)',
        description:
          "Transférez une révision en attente du responsable après cette attente. Les modifications s'appliquent aux minuteries de révision nouvellement programmées ; les minuteries existantes gardent leur heure due.",
      },
      waitMinutes: {
        title: 'Délai de réponse du client (minutes)',
        description:
          "Fermez un ticket si le client ne répond pas dans ce délai. Les modifications s'appliquent aux minuteries nouvellement programmées ; les minuteries existantes gardent leur heure due.",
      },
      querySeconds: {
        title: "Délai de requête sur l'état de la facture (secondes)",
        description:
          "Interrogez le fournisseur de facture si aucun rappel n'arrive pendant cette attente. Les modifications s'appliquent aux requêtes nouvellement planifiées ; les requêtes existantes conservent leur heure d'échéance.",
      },
      pollSeconds: {
        title:
          "Intervalle de vérification de la progression de l'exportation (secondes)",
        description:
          "Attendez aussi longtemps avant de vérifier une exportation en cours. Les modifications s'appliquent aux contrôles nouvellement programmés ; les chèques existants conservent leur échéance.",
      },
      maxMinutes: {
        title: "Délai d'expiration de l'exportation (minutes)",
        description:
          "Définissez la date limite d'achèvement au démarrage d'une tâche d'exportation. Un travail inachevé expire à cette date limite. Les modifications ne modifient pas les délais de travail existants.",
      },
      periodMinutes: {
        title: "Période de renouvellement de l'abonnement (minutes)",
        description:
          "Utilisez cette durée pour calculer la nouvelle fin de période après une charge réussie. Les modifications s'appliquent après la prochaine charge réussie ; la fin de la période en cours reste fixe.",
      },
      dunningMinutes: {
        title:
          "Échec de l'intervalle de nouvelle tentative de paiement de renouvellement (minutes)",
        description:
          "Attendez aussi longtemps avant de réessayer un paiement de renouvellement qui a échoué. Les modifications s'appliquent aux tentatives nouvellement planifiées ; les tentatives existantes conservent leur heure d'échéance.",
      },
      maxDunning: {
        title: "Limite d'échec de paiement de renouvellement",
        description:
          "Annulez l'abonnement à la prochaine tentative automatique si le nombre de paiements échoués a atteint cette limite. Les modifications s’appliquent à la prochaine décision de nouvelle tentative.",
      },
      reopenDays: {
        title: 'Date limite de réouverture des billets (jours)',
        description:
          "Autoriser la réouverture dans ce délai après la clôture d'un ticket ; sinon, un nouveau billet est requis. Chaque demande de réouverture utilise le dernier paramètre.",
      },
    },
    loading: 'Chargement des paramètres…',
    title: "Paramètres d'exécution",
    description:
      "Modifiez uniquement les valeurs déclarées par le code. La structure du workflow, les décisions et les délais d'attente restent dans le code.",
    ruleExplanation:
      'Toutes les conditions d’un groupe doivent correspondre. Des groupes séparés sont additionnés. Placez les utilisateurs alternatifs dans des groupes séparés.',
    allConditions: 'Répondre à toutes ces conditions',
    alsoInclude: 'Inclure également',
    selectionType: 'Type de sélection',
    searchReference: 'Recherche par nom',
    noMatches: 'Aucune référence correspondante',
    previousPage: 'Page précédente',
    nextPage: 'Page suivante',
    reference: 'Référence',
    remove: 'Supprimer',
    addCondition: 'Ajouter une condition',
    addGroup: 'Inclure également un autre groupe',
    revision: 'Révision {{revision}}',
    codeDefaults: 'Codes par défaut',
    databaseVersion: 'Configuration enregistrée',
    snapshotEffect:
      'Instantané : corrigé lors de la première soumission ; conservé après retour ou rétractation',
    liveEffect:
      'Les futures lectures de paramètres utilisent la dernière configuration ; les minuteries et les délais existants restent fixes.',
    yes: 'Oui',
    no: 'Non',
    invalidObject: 'Entrez un objet JSON valide.',
    saved: 'Configuration enregistrée.',
    conflict:
      'La révision a changé. Vos entrées ont été conservées ; vérifiez les valeurs actuelles avant de réessayer.',
    currentRevision: 'Révision actuellement enregistrée : {{revision}}',
    keepDraft: 'Conserver mes entrées et utiliser cette révision',
    save: 'Enregistrer les valeurs',
    readOnly:
      'Vous pouvez lire ces valeurs mais vous ne pouvez pas les modifier.',
    preview: 'Aperçu des candidats pour Lin',
    candidates: 'Candidats',
    noCandidates: 'Aucun candidat éligible ; la soumission sera refusée.',
    editCurrent: 'Modifier la configuration actuelle',
    historyBoundary:
      'Ceci modifie la configuration actuelle. Les faits historiques et les candidats assignés existants restent inchangés.',
    history: 'Utilisation réelle des paramètres',
    effectivePreview: 'Valeurs effectives pour cet enregistrement maintenant',
    firstSnapshot: 'Instantané de première soumission',
    notRecorded: 'Non enregistré',
    diagramEntry: 'Entrée de diagramme facultative',
    diagramHint:
      "Cliquez sur un nœud lié ou une transition pour ouvrir l'éditeur partagé. Les entrées non liées affichent leurs détails d'origine. Cliquer n’exécute jamais de transition.",
    workflow: 'Workflow',
    types: {
      department: 'Département',
      role: 'Rôle',
      user: 'Personne',
    },
  },
  invoices: {
    title: 'Facturation électronique',
    list: 'Factures',
    new: 'Nouvelle facture',
    empty: 'Pas de factures ici.',
    pick: 'Choisissez une facture pour suivre son émission.',
    description:
      "Facturez une commande sandbox terminée. Attendez le webhook de la plateforme ; requête après {{seconds}} secondes sans une. La soumission est tentée jusqu'à 3 fois.",
    shows:
      "Les soumissions, les rappels, les requêtes d'expiration et les nouvelles tentatives partagent une seule demande de fournisseur. Les notifications répétées s'appliquent une seule fois et les nouvelles tentatives n'émettent jamais de deuxième facture.",
    orderSummary: 'Commande n° {{order}} · {{amount}}',
    fields: {
      order: 'Commande terminée',
      customer: 'Client',
      amount: 'Montant',
      taxNumber: 'Numéro fiscal',
      request: 'Demande du fournisseur',
      number: 'Numéro de facture',
      queries: 'Requêtes',
    },
    actions: {
      submit: 'Demander une facture',
      retryInvoice: 'Réessayer la facture',
    },
    form: {
      title: 'Demander une facture électronique',
      ordersHint:
        "Choisissez une commande de démonstration complétée. Chaque commande ne peut avoir qu'une seule facture.",
      order: 'Commande n° {{order}} · {{customer}} · {{amount}} · Terminé',
      invoiceTitle: 'Titre de la facture',
      failSubmissions: 'Soumissions qui échouent volontairement',
      failHint:
        'Définissez 1 ou 2 pour voir les tentatives automatiques ; 3 arrêts en cause ont échoué. Réessayez la facture puis récupère.',
      submit: 'Créer',
    },
    banner: {
      draft: 'Pas encore demandé.',
      submitting: 'Soumission de la demande ; les échecs sont retentés…',
      awaiting:
        'En attente du webhook de la plateforme ; interrogation dans {{time}}.',
      querying: 'Interrogation de la plateforme de facturation…',
      issued: 'Facture émise. Le PDF de démonstration est prêt.',
      failed: 'Échec du problème : {{error}} Vous pouvez réessayer la facture.',
    },
    outside: {
      title: 'Plateforme de facturation (bac à sable)',
      description:
        'Simulez la plateforme externe complétant une requête et envoyant son webhook. Aucun véritable système fiscal n’est connecté.',
      result: 'Résultat de la plateforme',
      hint: "Maintenez le webhook et émettez-le avec succès : la facture attend toujours, puis interroge le résultat après 30 secondes. La livraison ultérieure de l'ancien événement ne peut pas le rééditer.",
      issue: 'Problème réussi',
      fail: 'Rejeter la facture',
      download: 'Télécharger un exemple de PDF',
      pdfHint:
        "Le fichier indique SANDBOX INVOICE et n'est pas une facture fiscale valide.",
    },
  },
  identity: {
    label: 'Connecté en tant que',
  },
  roles: {
    agent: "Agents d'assistance",
    customer: 'Clients',
    applicant: 'Employés',
    manager: 'Gestionnaires',
    director: 'Cadres',
    finance: 'Finances',
  },
  common: {
    signedInUser: 'Utilisateur connecté',
    system: 'Système',
    unassigned: 'Non attribué',
    loading: 'Chargement…',
    cancel: 'Annuler',
    close: 'Fermer',
    demoOptions: 'Options de démonstration',
  },
  tickets: {
    title: "Service d'assistance",
    agentDescription:
      "Prenez de nouveaux tickets, répondez aux clients et résolvez-les. Un ticket en attente chez le client se ferme lorsqu'il reste silencieux, et une réponse du client le ramène à son destinataire.",
    customerDescription:
      "Demandez de l'aide à l'équipe d'assistance et suivez la conversation. Un ticket fermé peut être rouvert pour les jours {{days}}.",
    queue: "File d'attente des tickets",
    mine: 'Mes billets',
    newTicket: 'Nouveau billet',
    empty: 'Pas de billets ici.',
    pick: 'Choisissez un ticket pour lire la conversation.',
    filters: {
      all: 'Tous',
      new: 'Nouveau',
      open: 'Ouvert',
      awaitingCustomer: 'En attente',
      closed: 'Fermé',
    },
    form: {
      title: "Contacter l'assistance",
      subject: 'Objet',
      subjectPlaceholder: 'Résumez le problème en une phrase',
      category: 'Catégorie',
      priority: 'Priorité',
      description: 'Description',
      descriptionPlaceholder:
        "Que s'est-il passé, ce à quoi vous vous attendiez et les étapes pour le reproduire",
      failNotifications: "Envois d'e-mails qui échouent volontairement",
      failHint:
        "Chaque réponse à ce ticket vous envoie un e-mail. Faites en sorte que les premières tentatives échouent pour voir l'effet, réessayez.",
      submit: 'Soumettre le ticket',
    },
    categories: {
      account: 'Compte et connexion',
      billing: 'Facturation',
      howto: 'Comment puis-je...',
      incident: 'Quelque chose est cassé',
    },
    priorities: {
      low: 'Faible',
      normal: 'Normale',
      high: 'Élevé',
      urgent: 'Urgent',
    },
    meta: {
      customer: 'Client',
      category: 'Catégorie',
      priority: 'Priorité',
      assignee: 'Responsable assigné',
      created: 'Créé',
    },
    banner: {
      new: "En attente qu'un agent le prenne.",
      open: '{{assignee}} y travaille.',
      awaiting:
        'En attente du client. Se ferme automatiquement dans {{time}} sans réponse.',
      overdue: "L'attente est terminée; le prochain balayage le ferme.",
      resolved: 'Résolu par le support.',
      timeout: "Clôture automatique : le client n'a pas répondu à temps.",
      reopenUntil: "Vous pouvez le rouvrir jusqu'à {{date}}.",
      reopenExpired:
        'On ne peut plus le rouvrir; veuillez ouvrir un nouveau ticket.',
    },
    thread: {
      wrote: '{{name}} · {{time}}',
      accept: '{{actor}} a pris le ticket',
      resolve: '{{actor}} a marqué le problème comme résolu.',
      autoClose:
        'Fermé automatiquement après avoir attendu quelques minutes {{minutes}}',
      reopen: '{{actor}} a rouvert le ticket',
      delivery: {
        queued: "E-mail adressé au client en file d'attente",
        running: "Envoi d'un e-mail au client…",
        succeeded: 'Envoyé par e-mail au client',
        failed:
          "Échec de l'e-mail après les tentatives {{attempts}} : {{error}}",
        retrying:
          "La tentative d'envoi d'e-mail {{attempts}} a échoué. Nouvelle tentative : {{error}}.",
      },
    },
    composer: {
      agentPlaceholder: 'Réponse au client…',
      customerPlaceholder: 'Ajouter une réponse…',
      reopenPlaceholder: 'Dites-nous ce qui ne va pas…',
      reply: 'Envoyer la réponse',
      accept: 'Prendre un ticket',
      resolve: 'Mark résolu',
      customerReply: 'Envoyer',
      reopen: 'Réouvrir',
      nothing: "Vous n'avez rien à faire sur ce ticket pour le moment.",
    },
  },
  expenses: {
    title: 'Notes de frais',
    applicantDescription:
      "Déclarez les dépenses professionnelles. Jusqu'à {{auto}} est approuvé automatiquement ; au-dessus, votre responsable approuve, et au-dessus de {{finance}}, le directeur financier également.",
    approverDescription:
      'Rapports en attente de votre approbation. Un rapport que vous laissez pendant les minutes {{minutes}} est transmis à votre propre responsable.',
    finalApproverDescription: 'Rapports en attente de votre approbation.',
    mine: 'Mes rapports',
    approvals: "M'attend",
    newReport: 'Nouveau rapport',
    empty: 'Aucun rapport ici.',
    emptyApprovals: "Rien n'attend votre approbation.",
    pick: 'Choisissez un rapport pour le voir.',
    number: 'Rapport {{id}}',
    editor: {
      title: 'Objectif',
      titlePlaceholder: 'Par exemple : Salon de Shanghai, octobre',
      purpose: 'Détails',
      purposePlaceholder:
        "Qui est venu, pourquoi et tout ce qu'un approbateur devrait savoir",
      items: 'Dépenses',
      date: 'Date',
      category: 'Catégorie',
      description: 'Description',
      amount: 'Montant (¥)',
      addItem: 'Ajouter une dépense',
      removeItem: 'Supprimer',
      total: 'Total',
      failPayments: 'Tentatives de paiement qui échouent volontairement',
      failHint:
        'Un rapport approuvé se paye par un effet. Faites échouer les premières tentatives pour le regarder réessayer.',
      save: 'Enregistrer le brouillon',
      saved: 'Enregistré.',
      submit: 'Soumettre pour approbation',
      resubmit: 'Soumettre à nouveau',
    },
    categories: {
      transport: 'Transports',
      lodging: 'Hébergement',
      meals: 'Repas',
      office: 'Fournitures de bureau',
      entertainment: 'Divertissement client',
      other: 'Autres',
    },
    steps: {
      submit: 'Soumis',
      manager: 'Gestionnaire',
      finance: 'Finances',
      payment: 'Payé',
    },
    meta: {
      applicant: 'Requérant',
      approver: 'En attendant',
      created: 'Créé',
      paymentRef: 'Référence de paiement',
      total: 'Total',
    },
    banner: {
      draft:
        "Brouillon. Vous seul pouvez le voir jusqu'à ce que vous le soumettiez.",
      awaiting:
        'En attente de {{approver}}. Passe à leur manager dans {{time}} sans décision.',
      awaitingFinal: 'En attente de {{approver}}.',
      overdue: "L'attente est terminée; le prochain balayage le transmet.",
      needsInfo: "{{actor}} l'a renvoyé : {{reason}}",
      rejected: "{{actor}} l'a rejeté : {{reason}}",
      approved: 'Approuvé. Le paiement est en cours.',
      paymentRetrying:
        'Échec de la tentative de paiement {{attempts}}, nouvelle tentative : {{error}}',
      paymentFailed:
        'Le paiement a échoué après les tentatives {{attempts}} : {{error}}. Les finances suivront.',
      paid: 'Payé. Référence {{ref}}.',
    },
    timeline: {
      title: 'Historique des approbations',
      empty: 'Pas encore soumis.',
      autoApproved: 'Dans {{limit}} : approuvé automatiquement',
      escalated: 'Aucune décision à temps ; transmis au manager suivant',
      paid: 'Paiement terminé',
    },
    decision: {
      title: 'Votre décision',
      placeholder: 'Commentaire (obligatoire pour renvoyer ou rejeter)',
      approve: 'Approuver',
      requestInfo: 'Renvoyer',
      reject: 'Rejeter',
    },
    withdraw: 'Retirer',
  },
  flowDiagram: {
    overview: 'Présentation du diagramme',
    actualSize: 'Taille réelle',
    states: 'États',
    transitions: 'Transitions',
    configurable: 'Paramètres',
    current: 'Actuel',
    visited: 'Visité',
    initial: 'Initiale',
    final: 'Finale',
    state: 'État',
    zoomOut: 'Zoom arrière',
    zoomIn: 'Zoomer',
    fit: 'Ajuster à la vue',
    empty: 'Aucun état à afficher.',
    loading: "Schéma d'implantation…",
    failed: 'Impossible de présenter ce diagramme.',
    nodeHelp: 'Appuyez sur Entrée ou Espace pour sélectionner un état.',
    edgeHelp: 'Appuyez sur Entrée ou Espace pour sélectionner une transition.',
  },
  diagramStatus: {
    traversed: 'Traversé',
    end: 'Fin',
    current: 'Actuel',
    visited: 'Visité',
    available: 'Disponible',
    pending: 'Non traversé',
  },
  flows: {
    customer: 'Client',
    final: "Celui-ci est terminé ; plus rien ne l'émeut.",
    process: 'Processus',
    legend:
      "L'état actuel a un remplissage plus fort ; les états visités et les transitions réellement traversées partagent une couleur d’accent. La légende identifie les transitions disponibles et les parties non parcourues. Les états initiaux ont des bordures de pilules, les états finaux ont des doubles bordures. Sélectionnez un état ou une transition pour plus de détails. ⚙ serveur uniquement, ⏱ déclencheur, ✓/✗ continuation de l'effet.",
    nothing:
      "Vous n'avez rien à faire ici pour le moment ; il attend le dehors.",
  },
  webhooks: {
    title: 'Webhooks',
    hint: 'Ce que le bac à sable a envoyé, conservé ou livré, et comment chaque livraison a été répondue. Livrez-en un à nouveau pour voir une rediffusion, ou conservez-les dans un autre ordre.',
    empty: 'Pas encore de webhooks.',
    hold: 'Tenez le webhook',
    deliver: 'Livrer',
    deliverAgain: 'Livrer à nouveau',
    deliveries_one: 'heure de livraison {{count}}',
    deliveries_other: 'délais {{count}} livrés',
    occurred: "C'est arrivé {{time}}",
    outcomes: {
      applied: 'Appliqué',
      replayed: 'Rejoué',
      ignored: 'Ignoré',
      retry: 'Je vais réessayer',
      held: 'Détenu',
    },
    deliveries_many: 'délais {{count}} livrés',
  },
  orders: {
    title: 'Paiement de la commande',
    list: 'Commandes',
    new: 'Nouvelle commande',
    empty: 'Aucune commande ici.',
    pick: 'Choisissez une commande pour voir où en est son paiement.',
    shows:
      "Le paiement est confirmé par le webhook du fournisseur, et non par la page : la commande attend comme un état, et le webhook - aussi tard, tôt ou souvent qu'il arrive - la fait avancer exactement une fois. Un paiement arrivant après l'annulation de la commande est remboursé.",
    description:
      'Les clients paient sur la caisse hébergée par le fournisseur de paiement ; la commande se poursuit lorsque le webhook du fournisseur arrive. Une commande impayée est clôturée après minutes {{minutes}}.',
    nothing:
      'Rien à faire de votre part : la commande attend le prestataire de paiement.',
    actions: {
      checkout: 'Payer',
      cancel: 'Annuler la commande',
      ship: 'Navire',
      refundOrder: 'Rembourser',
      retryRefund: 'Réessayer le remboursement',
    },
    form: {
      title: 'Passer une commande',
      item: 'Objet',
      amount: 'Montant (¥)',
      failCheckouts: 'Tentatives de paiement qui échouent volontairement',
      failRefunds: 'Tentatives de remboursement qui échouent volontairement',
      failHint:
        "L'ouverture de la caisse et le remboursement sont des effets avec les tentatives ; les empêcher de regarder les tentatives et l'endroit où la commande s'arrête.",
      submit: 'Passer la commande',
    },
    fields: {
      customer: 'Client',
      amount: 'Montant',
      attempt: 'Tour de paiement',
      session: 'Session de paiement',
      paymentRef: 'Paiement',
      refundRef: 'Rembourser',
    },
    banner: {
      draft: 'Pas encore payé.',
      creatingCheckout: 'Ouverture de la caisse du fournisseur…',
      awaitingPayment:
        "En attente du prestataire de paiement. Ferme en {{time}} s'il ne paie pas.",
      overdue: 'La fenêtre est terminée ; le prochain balayage le ferme.',
      paymentFailed: '{{error}} Payez à nouveau, ou fermez-le en {{time}}.',
      paid: 'Payé, prêt à être expédié.',
      cancelled: {
        customer: 'Annulé par le client.',
        timeout: 'Fermé : non payé à temps.',
        refundRequested: 'Remboursement demandé par le client.',
      },
      refunding: 'Remboursement en cours…',
      refundNeedsAttention:
        "Le remboursement a échoué : {{error}} Il attend que quelqu'un réessaye.",
      refunded: 'Remboursé.',
      fulfilled: 'Payé et expédié.',
    },
    sessionStatus: {
      open: 'ouvert',
      paid: 'payé',
      declined: 'refusé',
      expired: 'expiré',
    },
    outside: {
      title: 'Fournisseur de paiement (bac à sable)',
      description:
        'Lit le client lors du paiement du fournisseur et le fournisseur envoie son webhook. Tenez un webhook pour le livrer en retard, deux fois ou après une annulation.',
      checkout: 'Paiement hébergé',
      session: 'Séance {{id}} : {{status}}.',
      noSession: "Aucune caisse n'est ouverte ; le client paie en premier.",
      pay: 'Payer',
      decline: 'Refuser la carte',
      tryThis:
        "Essayez : conservez le webhook, payez, annulez la commande, puis livrez le webhook retenu : l'argent arrive après l'annulation et est remboursé.",
    },
  },
  exports: {
    title: 'Exportations de données',
    list: 'Exportations',
    new: 'Nouvelle exportation',
    empty: 'Aucune exportation ici.',
    pick: "Choisissez une exportation pour la regarder en cours d'interrogation.",
    shows:
      "Le fournisseur n'a pas de webhook, donc le cycle de vie demande : un déclencheur déclenche une auto-transition toutes les quelques secondes, et le fait d'entrer dans l'état interroge à nouveau le fournisseur. Un délai fixé au dossier met fin à l'attente.",
    description:
      "Le fournisseur rend les exportations lentement et ne rappelle personne, donc chaque exportation l'interroge toutes les secondes {{seconds}} et abandonne après les minutes {{minutes}}.",
    nothing: "Rien à faire : l'export interroge le fournisseur.",
    actions: {
      submit: "Démarrer l'exportation",
      retry: 'Exporter à nouveau',
      cancel: 'Annuler',
    },
    outcomes: {
      success: 'réussit',
      failure: 'échoue',
      stuck: 'reste bloqué à 60 %',
    },
    jobStatus: {
      running: "en cours d'exécution",
      succeeded: 'fait',
      failed: 'a échoué',
      cancelled: 'annulé',
    },
    form: {
      title: 'Demander une exportation',
      name: 'Nom',
      duration: 'Le fournisseur prend (secondes)',
      outcome: 'Le travail du vendeur',
      hint: "Un travail bloqué ne se termine jamais : l'exportation expire à son échéance et arrête le travail.",
      submit: 'Créer',
    },
    fields: {
      vendor: 'Vendeur',
      vendorValue: '{{seconds}}s, {{outcome}}',
      job: 'Travail du fournisseur',
      polls: 'Sondages',
      deadline: 'Date limite',
    },
    banner: {
      draft: 'Non démarré.',
      starting: 'Soumission du travail au fournisseur…',
      processing: 'Le fournisseur y travaille. Abandonne dans {{time}}.',
      done: 'Prêt : {{url}}',
      failed: 'Échec : {{error}}',
      timedOut:
        "Le vendeur n'a pas terminé avant la date limite ; son travail a été arrêté.",
      cancelled: 'Annulé.',
    },
    outside: {
      title: 'Fournisseur (bac à sable)',
      description:
        "Ce que l’export sait du travail du vendeur : seulement ce que son dernier sondage a vu. Le fournisseur n'envoie aucun webhook, donc rien d'autre ne le peut.",
      lifecycleSide: "Ce que sait l'export",
      lifecycleHint:
        "Job {{id}}, comme l'a vu le dernier sondage; le prochain sondage le mettra à jour.",
      lastPoll:
        'Le dernier sondage a vu {{status}}, {{progress}}% (sondages {{count}}).',
      noPoll: 'Pas encore interrogé.',
      nextPoll: 'Prochain sondage sur {{time}}.',
      pollDue: "Le prochain balayage l'interroge.",
      noJob: 'Pas encore de travail chez le vendeur.',
    },
  },
  purchases: {
    title: 'Vente flash',
    list: 'Achats',
    new: 'Nouvel achat',
    empty: 'Aucun achat ici.',
    pick: 'Choisissez un achat pour suivre ses étapes.',
    shows:
      "Un achat s'étend sur deux systèmes qu'une restauration de base de données ne peut pas annuler. Chaque étape est un état avec un effet, et lorsque la charge est refusée, la réservation est annulée par une étape qui lui est propre — donc ce qui reste dû est toujours l'état du dossier.",
    description:
      "L'entrepôt détient les unités, puis le prestataire de paiement prend l'argent. Lorsque la carte est refusée, les unités sont restituées moyennant une étape compensatoire ; une compensation qui ne cesse d'échouer s'arrête et attend une personne.",
    nothing: "Vous n'avez rien à faire : l'achat suit ses étapes.",
    actions: {
      submit: 'Passer la commande',
      abandon: 'Jeter',
      retryRelease: 'Réessayer la libération du stock',
    },
    items: {
      headphones: 'Écouteurs',
      keyboard: 'Clavier mécanique',
      lamp: 'Lampe de bureau',
    },
    form: {
      title: 'Acheter en vente flash',
      item: 'Objet',
      quantity: 'Quantité',
      total: 'Total {{total}}',
      declineCharge: 'La carte est refusée',
      failReleases: 'Libérations de stock qui échouent volontairement',
      failHint:
        "Refuser la carte pour surveiller la compensation ; faites échouer la version 3 fois ou plus pour la voir s'arrêter et attendre une personne.",
      submit: 'Créer',
    },
    fields: {
      customer: 'Client',
      amount: 'Montant',
      reservation: 'Réservation',
      paymentRef: 'Paiement',
    },
    banner: {
      draft: 'Pas encore placé.',
      reserving: 'Réservation des unités…',
      charging: 'Parts détenues ; recharger la carte…',
      releasing: 'La charge a échoué ({{error}}) ; rendre les unités…',
      compensationNeedsAttention:
        "Les unités n'ont pas pu être restituées : {{error}} Il attend que quelqu'un réessaye la libération.",
      confirmed: 'Confirmé : unités réservées et payées.',
      cancelled: {
        customer: 'Rejeté.',
        outOfStock: 'Annulé : {{error}}',
        paymentDeclined:
          'Annulée : la carte est refusée et les unités sont restituées.',
      },
    },
    outside: {
      title: 'Entrepôt et fournisseur de paiement (bac à sable)',
      description:
        "Chaque étape est un effet sur un système extérieur à l'application ; l'annulation est aussi une étape.",
      steps: 'Étapes',
      stepsHint: 'La dernière exécution de l’effet de chaque étape.',
      reserve: 'Stock de réserve',
      charge: 'Charger la carte',
      release: 'Sortie de stock (compensation)',
      notYet: 'Ne pas exécuter',
      stock: "Stock d'entrepôt",
      stockHint: 'Regardez les unités partir et revenir.',
      item: 'Objet',
      available: 'Disponible',
      reserved: 'Réservé',
    },
  },
  fulfilments: {
    title: 'Expédition',
    list: 'Expéditions',
    new: 'Nouvelle expédition',
    empty: 'Aucune expédition ici.',
    pick: 'Choisissez une expédition pour lire son paiement, son entrepôt et son transporteur.',
    shows:
      'Un envoi attend deux signaux provenant de deux systèmes, quel que soit l’ordre dans lequel ils arrivent, puis suit les événements du transporteur – appliqués en fonction du moment où ils se sont produits et non du moment où ils sont arrivés.',
    description:
      "Un envoi part une fois que le paiement est saisi et que l'entrepôt l'a récupéré, dans l'un ou l'autre ordre. Les webhooks du transporteur arrivent alors en retard et dans le désordre ; seul un événement plus récent le déplace.",
    nothing: "Vous n'avez rien à faire : l'envoi attend l'extérieur.",
    actions: {
      ship: 'Main au transporteur',
      cancel: "Annuler l'expédition",
    },
    signals: {
      payment: 'paiement capturé',
      pick: 'entrepôt prélevé',
    },
    and: 'et',
    carrier: {
      booked: 'Réservé',
      pickedUp: 'Ramassé',
      inTransit: 'En transit',
      outForDelivery: 'En livraison',
      delivered: 'Livré',
      exception: 'Exception',
    },
    form: {
      title: 'Ouvrir une expédition',
      name: 'Nom',
      customer: 'Client',
      submit: 'Créer',
    },
    fields: {
      customer: 'Client',
      paid: 'Paiement capturé',
      picked: 'Choisi',
      tracking: 'Numéro de suivi',
      carrier: 'Carrier dit',
      carrierAt: 'À compter de',
    },
    banner: {
      preparing: 'En attente : {{waiting}}.',
      readyToShip: 'Payé et cueilli : prêt à remettre au transporteur.',
      booking: 'Réservation du transporteur…',
      shipped: 'En route.',
      exception:
        "Le transporteur a signalé un problème ; un événement plus récent l'efface.",
      delivered: 'Livré.',
      cancelled: 'Annulé.',
    },
    outside: {
      title: 'Fournisseur de paiement, entrepôt et transporteur (bac à sable)',
      description:
        'Envoyez le webhook de chaque système, maintenant ou en attente. Livrez ceux retenus dans un autre ordre pour voir lequel s’applique.',
      signals: 'Deux signaux',
      signalsHint:
        "L'un ou l'autre peut venir en premier; le second fait avancer l’envoi.",
      capture: 'Paiement capturé',
      pick: 'Prélèvement en entrepôt',
      carrierTitle: 'Transporteur',
      carrierHint:
        "Événements concernant le colis, chacun avec l'heure à laquelle ils se sont produits.",
      status: 'Statut',
      location: 'Localisation',
      offset: 'Dans quelques minutes',
      send: 'Envoyer',
      offsetHint:
        "Le dernier champ se décale lorsque l'analyse a lieu : un nombre négatif signale une analyse plus ancienne.",
      scramble: "Conservez trois analyses à livrer dans n'importe quel ordre",
    },
  },
  subscriptions: {
    title: 'Abonnements',
    list: 'Abonnements',
    new: 'Abonnez-vous',
    empty: 'Aucun abonnement ici.',
    pick: 'Choisissez un abonnement pour suivre sa facturation.',
    shows:
      "Un abonnement tourne autour de actif → en charge → actif une fois par période, aussi longtemps qu'il est en vigueur. Le renouvellement est dû à la fin de la période d’abonnement constatée par le balayage ; une carte refusée est réessayée par un déclencheur jusqu'à ce qu'elle abandonne.",
    description:
      "Facturé toutes les minutes {{period}}. Une charge refusée est réessayée toutes les minutes {{dunning}} ; après que {{tries}} ait essayé, l'abonnement est annulé.",
    nothing:
      'Rien à faire de votre part : la facturation se déroule toute seule.',
    actions: {
      updateCard: 'Mettre à jour la carte',
      cancel: 'Se désabonner',
    },
    plans: {
      basic: 'De base',
      pro: 'Pro',
    },
    periodN_one: 'Période {{count}}',
    periodN_other: 'Périodes {{count}}',
    form: {
      title: 'Abonnez-vous',
      plan: 'Planifier',
      charge: '{{price}} est facturé maintenant et au début de chaque période.',
      cardDeclines: 'Les frais de la carte diminuent',
      failHint:
        "Les refus sont des réponses, pas des pannes : l'accusation n'est pas retentée d'un coup mais par le déclencheur de relance, sous une nouvelle clé.",
      submit: 'Abonnez-vous',
    },
    fields: {
      customer: 'Client',
      periods: 'Périodes payées',
      periodEnd: 'Fin de période',
      dunning: 'Essais échoués',
      lastCharge: 'Dernière charge',
      card: 'Carte',
      cardWorks: 'Travaux',
      cardValue_one: 'refuse le prochain prélèvement',
      cardValue_other: 'refuse les {{count}} prochains prélèvements',
      cardValue_many: 'refuse les {{count}} prochains prélèvements',
      cardValue_zero: 'ne refuse aucun prélèvement ({{count}})',
    },
    banner: {
      renewing: 'Chargement de la carte…',
      active: 'Actif. Renouvelle en {{time}}.',
      due: 'La période est terminée; le prochain balayage le renouvelle.',
      pastDue:
        '{{error}} Essayez {{tries}} ou {{max}} ; prochain essai dans {{time}}.',
      cancelled: {
        customer: 'Désabonné.',
        unpaid: 'Annulée : la carte était constamment refusée.',
      },
    },
    outside: {
      title: 'Facturation (bac à sable)',
      description:
        "Chaque charge est une série d'effets de charge, déterminés par la période et l'essai.",
      charges: 'Prélèvements',
      chargesHint: 'Le plus ancien en premier.',
      noCharges: "Aucune accusation pour l'instant.",
      sweep: 'Balayage de renouvellement',
      sweepHint:
        "Les renouvellements sont constatés par balayage à chaque fin de période d’abonnement ; il s'exécute toutes les 10 secondes, ou maintenant.",
    },
    periodN_many: 'Périodes {{count}}',
  },
  guide: {
    title: 'À propos de cet exemple',
    show: 'Afficher',
    hide: 'Masquer',
    purpose: 'Ce que ça montre',
    howTo: "Comment l'essayer",
    samples:
      "Les exemples d'enregistrements se chargent lorsque l'application est installée avec des exemples de données (APP_SAMPLE_DATA=true). Sur une base de données installée sans eux, exécutez « pnpm nocobase db sample ».",
    invoices: {
      purpose:
        "Utilisez une demande de fournisseur pour démontrer les rappels, les requêtes d'expiration et les tentatives, avec un exemple de fichier PDF téléchargeable.",
      step1:
        "Ouvrez l'échantillon pour la commande n° 1024, demandez-le, puis cliquez sur Problème réussi dans le bac à sable. Après le webhook, téléchargez l’exemple de PDF.",
      step2:
        "Remettre la même notification : elle est rejouée et aucune seconde facture n'est émise.",
      step3:
        'Sur la commande n° 1026, maintenez le webhook et émettez-le avec succès. Après 30 secondes, la requête le termine. Une livraison ultérieure ne pourra pas le délivrer à nouveau.',
      step4:
        "L'échantillon 晨光书店 échoue à la soumission à trois reprises. Réessayer la facture récupère suite à un échec et conserve la même demande du fournisseur.",
    },
    tickets: {
      purpose:
        "Un ticket reste là où il se trouve dans son propre champ de statut, et chaque modification — accepter, répondre, résoudre, rouvrir — est une transition déclarée dans la source. La conversation est le journal de transition : chaque message est l'entrée de la transition qu'il a provoquée. Les e-mails sont exécutés comme effets après la validation de la transition, avec des tentatives, et un ticket laissé en attente sur son client est fermé par un déclencheur.",
      step1:
        "Utilisez « Connecté en tant que » en haut à droite pour basculer entre les agents de support et les clients. Les agents voient toute la file d'attente ; un client ne voit que ses propres billets.",
      step2:
        "En tant qu'agent, ouvrez le nouveau ticket « 无法登录管理后台 » et répondez. Il attend maintenant le client et se ferme après quelques minutes de silence ; les déclencheurs sont balayés toutes les 10 secondes.",
      step3:
        "Basculez sur 王女士 et répondez à un ticket qui l'attend : il retourne à son agent. Un ticket fermé peut être rouvert par son client pendant 7 jours — essayez-le comme 李先生 sur « 如何导出本月的订单报表？ ».",
      step4:
        "Déposez un ticket en tant que client avec « Les livraisons d'e-mails qui échouent volontairement » définies dans les options de démonstration, puis répondez-y en tant qu'agent : « Sous le capot » montre l'échec de l'effet d'e-mail et une nouvelle tentative.",
    },
    expenses: {
      purpose:
        'Une note de frais est acheminée selon son montant : jusqu’à 5 000 ¥ elle est approuvée automatiquement, au-delà de ce montant, le responsable du demandeur approuve, et au-delà de 50 000 ¥ le directeur financier également. Les approbateurs approuvent, renvoient ou rejettent avec une raison, un gestionnaire inactif est ignoré par un déclencheur et un rapport approuvé est payé par un effet qui le marque ensuite comme payé.',
      step1:
        "Utilisez « Connecté en tant que » pour incarner les employés 林晓 et 何东, leurs managers, le cadre et le directeur financier. Un employé voit ses propres rapports ; un approbateur voit ce qui l'attend.",
      step2:
        "En tant que 林晓, soumettez le projet « 杭州客户拜访 » (¥872) : il est approuvé automatiquement et payé un instant plus tard. « Sous le capot » montre l'effet de paiement et la transition « payante » qu'il a déclenchée.",
      step3:
        'Passez à 赵静, le directeur financier, et approuvez « 法兰克福展会参展 », que 陈明 a déjà approuvé : au-dessus de 50 000 ¥, il a besoin des deux.',
      step4:
        "En tant que 何东, soumettez à nouveau « 北京客户现场支持 », qui a été renvoyé pour plus d'informations, puis approuvez-le comme 孙磊. Un rapport laissé à un responsable pendant 3 minutes est transmis au responsable du responsable.",
      step5:
        "Sous « Sous le capot », « Ce que l'identité actuelle peut faire » donne la raison de chaque action que la personne actuelle ne peut pas entreprendre. Ouvrez un rapport d'attente dans deux fenêtres et agissez dans les deux : la seconde est refusée car la version qu'elle a vue est périmée.",
    },
    orders: {
      purpose:
        "Une commande est marquée comme payée uniquement par le webhook du fournisseur de paiement, jamais par la page. Pendant qu'il attend, il ne s'agit que d'un état enregistré - pas de minuterie, pas de demande ouverte - et un webhook qui arrive en retard, en avance ou deux fois le déplace toujours exactement une fois. L'argent arrivé après l'annulation de la commande est remboursé.",
      step1:
        "Ouvrez l'exemple de commande « 降噪耳机 × 1 » et cliquez sur « Payer » : un effet ouvre la caisse hébergée par le fournisseur et la commande attend le paiement.",
      step2:
        'Dans la carte en pointillés « Fournisseur de paiement (bac à sable) », payez ou refusez la carte. Le webhook envoyé par le fournisseur est ce qui déplace la commande ; « Livrer à nouveau » est répondu Replay.',
      step3:
        "Cochez « Conserver le webhook », payez, cliquez sur « Annuler la commande », puis livrez le webhook retenu : le paiement arrive après l'annulation et est remboursé.",
      step4:
        "L'échantillon « 机械键盘 × 1 » échoue volontairement à sa première extraction, pour montrer l'effet en réessayant. Une commande restée impayée expire au bout de 3 minutes.",
    },
    exports: {
      purpose:
        "Le fournisseur n'envoie aucun webhook, donc l'exportation l'interroge : un déclencheur déclenche le \"sondage\" d'auto-transition, une nouvelle saisie du \"traitement\" exécute la vérification et la date limite inscrite dans l'enregistrement décide du moment où abandonner.",
      step1:
        "Ouvrez « 9 月订单明细 » et cliquez sur « Démarrer l'exportation ». Le vendeur prend 30 secondes ; regardez « Ce que sait le fournisseur » devancer ce que sait l'export jusqu'au prochain sondage.",
      step2:
        "Démarrez « 全年客户名单 », dont le travail du fournisseur reste bloqué : à la date limite, l'export expire et arrête le travail du fournisseur. « Exporter à nouveau » lance un nouveau cycle.",
      step3:
        "Sous « Sous le capot », chaque sondage est une transition dans le journal et chaque vérification est une exécution d'effet.",
    },
    purchases: {
      purpose:
        "Un achat par vente flash s'étend sur deux systèmes : l'entrepôt réserve le stock, puis le prestataire de paiement débite la carte. Lorsque les frais sont refusés, la réservation est annulée par une étape compensatoire propre ; une compensation qui continue d'échouer s'arrête dans un état qu'une personne réessaye.",
      step1:
        "Ouvrez l'exemple d'achat de deux lampes et cliquez sur « Passer la commande » : les unités sont réservées, la carte est chargée et l'achat est terminé.",
      step2:
        "Effectuez l'achat d'un exemple de clavier, dont la carte est refusée, et regardez l'unité quitter le « stock d'entrepôt » et revenir.",
      step3:
        'Créez un achat avec une carte refusée et réglez « Libérations de stock qui échouent volontairement » sur 3 : la libération du stock s’arrête et attend « Réessayer la libération du stock ».',
    },
    fulfilments: {
      purpose:
        'Une expédition attend deux signaux provenant de deux systèmes – le paiement capturé et le prélèvement à l’entrepôt – dans l’ordre dans lequel ils arrivent, puis suit le transporteur. Les événements porteurs sont appliqués au moment où ils se sont produits, et non au moment où ils sont arrivés, et un événement plus ancien est refusé comme obsolète.',
      step1:
        "Ouvrez l'échantillon d'envoi et envoyez « Prélèvement en entrepôt » et « Paiement capturé » dans l'un ou l'autre ordre : le second le déplace vers prêt à être expédié.",
      step2:
        'Cliquez sur « Remettre au transporteur », puis envoyez les scans du transporteur, chacun avec un statut et un emplacement.',
      step3:
        "Cochez « Conserver trois analyses à livrer dans n'importe quel ordre » et livrez d'abord la dernière analyse : les précédentes sont ignorées comme étant obsolètes.",
      step4:
        "Un « Minutes from now » négatif signale une analyse qui s'est produite plus tôt, ce à quoi ressemble un événement tardif.",
    },
    subscriptions: {
      purpose:
        "Un abonnement est facturé au début de chaque période pendant toute sa durée. Le balayage du plugin renouvelle chacun d'entre eux à la fin de sa propre période, et les frais refusés sont retentés par le déclencheur de relance, sous une nouvelle clé, jusqu'à ce qu'ils soient récupérés ou que l'abonnement soit annulé.",
      step1:
        "Cliquez sur « S'abonner » et choisissez un forfait : la première charge s'exécute immédiatement. Il n’existe pas d’exemple d’abonnement, car en créer un facture la carte.",
      step2:
        'Abonnez-vous avec « Frais la carte refusée » défini sur 1 : elle est en retard, est réessayée une minute plus tard et récupère. « Mettre à jour la carte » la récupère immédiatement.',
      step3:
        'Une période dure 3 minutes; « Exécuter les déclencheurs maintenant » sous « Renouvellement du balayage » renouvelle tout ce qui est dû sans attendre le prochain balayage.',
    },
  },
  blockers: {
    invoiceRequestMismatch:
      'Le résultat appartient à une autre demande de facture.',
    agentOnly: 'Seul un agent de support peut travailler sur les tickets.',
    requesterOnly: 'Seul le client qui a déposé le ticket peut le faire.',
    systemOnly: "Le système le fait tout seul une fois l'attente passée.",
    reopenExpired:
      'Fermé depuis trop longtemps pour rouvrir ; déposez plutôt un nouveau ticket.',
    applicantOnly: 'Seul le demandeur peut le faire avec son rapport.',
    approverOnly: "Seul l'approbateur actuel peut décider de ce rapport.",
    topApprover: "L'approbateur actuel est déjà le niveau le plus élevé.",
    customersOnly: 'Seul un client peut déposer un ticket, pour lui-même.',
    applicantsOnly:
      'Seul un employé peut produire une note de dépenses pour lui-même.',
    alreadyPaid: 'Le paiement a déjà été confirmé.',
    alreadyPicked: "L'entrepôt l'a déjà récupéré.",
    staleCarrierEvent:
      'Un événement de transporteur plus récent a déjà été appliqué.',
    periodNotOver: "La période actuelle n'est pas encore terminée.",
  },
  problems: {
    orderRef: 'Choisissez une commande sandbox terminée.',
    taxNumber: 'Entrez un numéro fiscal de 15 à 20 lettres ou chiffres.',
    message: 'Écrivez un message.',
    reason: 'Donnez une raison.',
    subject: 'Donnez un sujet au ticket.',
    description: 'Décrivez le problème.',
    category: 'Choisissez une catégorie.',
    priority: 'Choisissez une priorité.',
    title: 'Donnez-lui un nom.',
    amountCents: 'Le montant doit être supérieur à 0.',
    durationSeconds: 'Le vendeur met entre 5 et 600 secondes.',
    vendorOutcome: 'Choisissez la façon dont le travail se termine.',
    sku: 'Choisissez un élément.',
    quantity: 'Achetez entre 1 et 5.',
    plan: 'Choisissez un plan.',
    customerId: 'Choisissez le client.',
  },
  errors: {
    EXPENSE_NOT_FOUND: "La note de frais n'existe pas.",
    OWN_EXPENSE_ONLY: 'Seul le demandeur peut modifier ce rapport.',
    EXPENSE_LOCKED:
      "Un rapport en cours d'examen ne peut pas être modifié; retirez-le d'abord.",
    EXPENSE_CHANGED:
      "Le rapport a changé pendant que vous l'éditiez ; rechargez-le et réessayez.",
    SANDBOX_SESSION_CLOSED: "La caisse n'est plus ouverte.",
    SANDBOX_NOT_FOUND: "Le bac à sable n'a pas un tel objet.",
    UNKNOWN_WEBHOOK_EVENT: "Le bac à sable n'envoie pas cet événement.",
    WEBHOOK_EVENT_NOT_FOUND: 'Aucun événement webhook de ce type.',
  },
  lifecycle: {
    title: 'Sous le capot',
    hint: 'Quel est le cycle de vie enregistré pour cet enregistrement. Une vraie application ne le montrerait pas à ses utilisateurs.',
    available: "Ce que l'identité actuelle peut faire",
    final: 'Aucune transition ne sort de cet état.',
    diagram: 'Schéma interactif',
    diagramHint:
      "toMermaid(describe()) dessine le cycle de vie sous forme de diagramme d'état ; collez-le dans n'importe quel moteur de rendu Mermaid.",
    retry: 'Réessayer',
    cancel: 'Annuler',
    continue: 'Continuer',
    continuationWaits: '{{transition}} attend : {{error}}',
    continuationAbandoned:
      "{{transition}} abandonné après les tentatives de {{attempts}}, jusqu'à ce qu'il soit repris à la main : {{error}}",
    states: 'États',
    parameters: 'Paramètres',
    transitions: 'Journal de transition',
    effects: "L'effet s'exécute",
    noTransitions: "Aucune transition pour l'instant.",
    noEffects: "Aucun effet pour l'instant.",
    attempts: '{{attempts}}/{{max}}',
    runTriggers: 'Exécuter les déclencheurs maintenant',
    sweepNote:
      'Les déclencheurs sont balayés toutes les 10 secondes de toute façon ; cela exécute le balayage immédiatement.',
    swept_one: 'Le balayage a déclenché la transition {{count}}.',
    swept_other: 'Le balayage a déclenché des transitions {{count}}.',
    columns: {
      time: 'Temps',
      transition: 'Transitions',
      change: 'Changement',
      actor: 'Par',
      input: 'Entrée',
      effect: 'Effet',
      status: 'Statut',
      attempts: 'Tentatives',
      error: 'Dernière erreur',
    },
    swept_many: 'Le balayage a déclenché des transitions {{count}}.',
  },
  states: {
    review: 'En cours de révision',
    submitting: 'Soumission',
    awaitingIssue: "En attente d'émission",
    querying: 'Interrogation',
    issued: 'Publié',
    issueFailed: 'Le problème a échoué',
    new: 'Nouveau',
    open: 'Ouvert',
    awaitingCustomer: 'En attente du client',
    closed: 'Fermé',
    draft: 'Brouillon',
    awaitingManager: 'Gestionnaire en attente',
    awaitingFinance: 'En attente de financement',
    needsInfo: 'Renvoyé',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    paid: 'Payé',
    creatingCheckout: 'Ouverture de la caisse',
    awaitingPayment: 'En attente de paiement',
    paymentFailed: 'Échec du paiement',
    cancelled: 'Annulé',
    refunding: 'Remboursement en cours',
    refundNeedsAttention:
      'Le remboursement nécessite une attention particulière',
    refunded: 'Remboursé',
    fulfilled: 'Expédié',
    starting: 'Démarrage',
    processing: 'Traitement',
    done: 'Terminé',
    failed: 'Échec',
    timedOut: 'Délai dépassé',
    reserving: 'Réserver du stock',
    charging: 'Prélèvement en cours',
    releasing: 'Libération de stock',
    compensationNeedsAttention: 'Compensation bloquée',
    confirmed: 'Confirmé',
    preparing: 'Préparation',
    readyToShip: 'Prêt à expédier',
    booking: 'Opérateur de réservation',
    shipped: 'En transit',
    exception: 'Exception du transporteur',
    delivered: 'Livré',
    renewing: 'Prélèvement en cours',
    active: 'Actif',
    pastDue: 'En souffrance',
  },
  transitions: {
    retry: 'Réessayer',
    jobStarted: 'Travail soumis',
    startFailed: 'Échec de la soumission',
    poll: 'Résultat du sondage',
    jobDone: 'Exportation terminée',
    jobFailed: "Échec de l'exportation",
    cancel: 'Annuler',
    paymentCaptured: 'Paiement capturé',
    picked: 'Prélèvement en entrepôt',
    ship: 'Navire',
    booked: 'Transporteur réservé',
    trackingUpdated: 'Suivi mis à jour',
    checkout: 'Ouvrir la caisse',
    checkoutCreated: 'Caisse ouverte',
    checkoutFailed: 'Échec de la vérification',
    paymentSucceeded: 'Paiement réussi',
    paymentDeclined: 'Paiement refusé',
    paidAfterCancel: 'Paiement après annulation',
    expire: 'Fermer après expiration du délai',
    refundOrder: 'Rembourser',
    refunded: 'Remboursement terminé',
    refundFailed: 'Échec du remboursement',
    retryRefund: 'Réessayer le remboursement',
    charged: 'Charge réussie',
    chargeFailed: 'Échec de la charge',
    renew: "Renouveler à l'échéance",
    retryCharge: 'Réessayer le prélèvement',
    updateCard: 'Mettre à jour la carte',
    abandon: 'Abandonner',
    stockReserved: 'Stock réservé',
    stockUnavailable: 'Stock indisponible',
    stockReleased: 'Stock libéré',
    releaseFailed: 'Échec de la libération des stocks',
    retryRelease: 'Réessayer la libération du stock',
    retryInvoice: 'Réessayer la facture',
    submitted: 'Demande soumise',
    submissionFailed: 'Échec de la soumission',
    query: 'Interroger la facture',
    stillPending: 'Toujours en attente',
    issued: 'Facture émise',
    issueFailed: 'Le problème a échoué',
    queryFailed: 'Échec de la requête',
    create: 'Créé',
    accept: 'Prenez',
    reply: 'Répondre',
    customerReply: 'Réponse du client',
    resolve: 'Résoudre',
    autoClose: 'Fermer automatiquement',
    reopen: 'Réouvrir',
    submit: 'Soumettre',
    approve: 'Approuver',
    reject: 'Rejeter',
    requestInfo: 'Renvoyer',
    resubmit: 'Soumettre à nouveau',
    withdraw: 'Retirer',
    escalate: 'Escalader',
    paid: 'Marc a payé',
  },
  runs: {
    queued: "En file d'attente",
    running: 'En cours d’exécution',
    succeeded: 'Réussi',
    failed: 'Échec',
    dead: 'Abandonné',
    cancelled: 'Annulé',
  },
};

export default frFR;
