import type { KnowledgeServerResource } from './en-US.js';

const frFR: KnowledgeServerResource = {
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
};

export default frFR;
