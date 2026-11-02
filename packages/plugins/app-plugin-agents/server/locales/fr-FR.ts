import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  access: {
    section: 'Équipe d’agents',
    businessSection: 'Équipe d’agents',
    businesses: {
      agents: {
        title: 'Agents et compétences',
        description:
          "Les agents de l'équipe et les compétences qu'ils utilisent.",
        actions: {
          edit: {
            title: 'Agents de changement et compétences',
            description:
              "Modifier les paramètres, les compétences et les variables d'un agent, l'archiver, le restaurer et le supprimer, et modifier les compétences. Un agent ne dispose d'aucune capacité autre que celle de l'éditeur.",
            related:
              "Agents de changement et compétences (agents qu'ils possèdent et compétences qu'ils ont créées)",
            relatedLabel:
              "Agents que je possède et compétences que j'ai créées",
            relatedHint:
              "Agents dont je suis propriétaire et compétences que j'ai créées",
            all: 'Agents de changement et compétences (tous)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agents',
        runners: 'Environnements d’exécution',
        prices: 'Tarifs des modèles',
        services: 'Services modèles',
      },
    },
    actions: {
      read: 'Afficher',
      manage: 'Gérer',
    },
    keyScopes: {
      agents: {
        title: 'Agents',
        description:
          "Voir agents, compétences et courses ; changer d'agent et de compétence, annuler et réessayer les exécutions.",
      },
      runners: {
        title: 'Environnements d’exécution',
        description:
          "Voir exécuteurs et jetons d'inscription ; gérer les exécuteurs.",
      },
      prices: {
        title: 'Tarifs des modèles',
        description:
          'Voir le modèle de prix à partir duquel les coûts sont estimés ; changez-les.',
      },
      services: {
        title: 'Services modèles',
        description:
          "Voir les services modèles et les modèles qu'ils proposent, jamais leurs clés.",
      },
    },
  },
  runnerConversation: {
    title: 'Conversation : {{title}}',
    other: 'Conversation de quelqu’un d’autre',
    untitled: 'Nouvelle conversation',
  },
};

export default frFR;
