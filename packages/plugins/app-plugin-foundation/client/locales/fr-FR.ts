import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  nav: {
    plugins: 'Plugins',
    pluginsDescription:
      'Les plugins utilisés par cette application, leurs versions et comment activer les autres.',
  },
  access: {
    section: 'Système',
    settings: {
      plugins: 'Plugins',
    },
    actions: {
      read: 'Consulter',
    },
  },
  page: {
    title: 'Plugins',
    description:
      'Les plugins utilisés par cette application. Activer ou désactiver un plugin modifie le code de l’application et ne prend effet qu’après un redémarrage ; cette page donne donc les commandes à exécuter plutôt que des interrupteurs.',
    deployed:
      'Cette application est déployée : seuls les plugins déployés avec elle sont listés. Les plugins visibles uniquement pendant le développement n’apparaissent pas ici.',
    attention_one:
      '{{count}} plugin demande votre attention et apparaît en premier.',
    attention_other:
      '{{count}} plugins demandent votre attention et apparaissent en premier.',
    attention_many:
      '{{count}} plugins demandent votre attention et apparaissent en premier.',
    search: 'Rechercher par nom ou paquet',
    loading: 'Chargement des plugins…',
    loadFailed: 'Impossible de charger les plugins.',
    retry: 'Réessayer',
    empty: 'Aucun plugin ne correspond.',
  },
  filters: {
    label: 'Afficher',
    all: 'Tous {{count}}',
    enabled: 'Activés {{count}}',
    disabled: 'Non activés {{count}}',
    attention: 'À vérifier {{count}}',
  },
  columns: {
    plugin: 'Plugin',
    version: 'Version',
    status: 'État',
    actions: 'Actions',
  },
  groups: {
    enabled: 'Activés {{count}}',
    disabled: 'Non activés {{count}}',
  },
  status: {
    enabled: 'Activé',
    skillsOnly: 'Activé · Skills uniquement',
    enabledAttention: 'Activé · À vérifier',
    disabled: 'Non activé',
    preinstalled: 'Non activé · Développement uniquement',
    disabledAttention: 'Non activé · À vérifier',
  },
  reasons: {
    partial:
      'Activé en partie seulement : ses pages s’ouvrent, mais leurs données ne se chargent pas. Exécutez de nouveau la commande d’activation pour corriger.',
    devDependency:
      'Activé, mais pas inclus au déploiement de l’application : il manquera dans l’application en production. Exécutez de nouveau la commande d’activation pour corriger.',
    missingRequires: '« {{title}} » nécessite {{names}}, qui n’est pas activé.',
    other:
      'Pas entièrement mis en place dans cette application. Exécutez de nouveau la commande d’activation pour corriger.',
    requiresFirst:
      'À activer d’abord : {{names}} (la commande d’activation l’inclut)',
  },
  actions: {
    commands: 'Commandes',
    commandsFor: 'Commandes pour {{title}}',
    enable: 'Comment l’activer',
    enableFor: 'Comment activer {{title}}',
  },
  commands: {
    title: 'Commandes pour {{title}}',
    description:
      'À exécuter dans le répertoire du code de l’application, puis redémarrez-la ; en production, recompilez et redéployez.',
    fix: 'Corrige ce qui demande votre attention',
    update: 'Met à jour vers la dernière version',
    unregister: 'Le désactive ; ses données sont conservées',
    dependents:
      'Plugins activés qui en dépendent : {{names}}. Désactivez-les en même temps.',
    noDependents:
      'Aucun plugin activé n’en dépend : il peut être désactivé seul.',
  },
  enable: {
    title: 'Activer {{title}}',
    description: 'À exécuter dans le répertoire du code de l’application :',
    requires:
      '{{title}} dépend de {{names}}, qui n’est pas encore activé non plus ; la commande l’inclut.',
    development:
      'Développement local : redémarrez pnpm dev après l’avoir exécutée, puis rechargez cette page pour le voir activé.',
    live: 'Application en production : validez la modification, exécutez pnpm build --tar, puis mettez à niveau avec l’installateur.',
    data: 'Son premier démarrage crée ses tables. Le désactiver ensuite avec plugin unregister conserve ses données.',
  },
  dialog: {
    copy: 'Copier la commande',
    copied: 'Copié',
    copyFailed: 'La copie a échoué ; sélectionnez la commande et copiez-la.',
    close: 'Compris',
  },
};

export default frFR;
