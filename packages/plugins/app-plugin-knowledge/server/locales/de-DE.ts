import type { KnowledgeServerResource } from './en-US.js';

const deDE: KnowledgeServerResource = {
  access: {
    businessSection: 'Wissen',
    businesses: {
      knowledge: {
        title: 'Wissen',
        description: 'Die Dokumente jedes Wissensraums.',
        actions: {
          read: {
            title: 'Wissen lesen',
            description:
              'Lesen Sie das Systemwissen und das der damit verbundenen Räume',
            related: 'Wissen lesen (dazu gehörende Räume)',
            relatedLabel: 'Räume, die mit mir in Zusammenhang stehen',
            relatedHint:
              'Die Anwendung entscheidet, welche Räume sich auf wen beziehen',
            all: 'Wissen lesen (alle)',
          },
          propose: {
            title: 'Wissen vorschlagen',
            description:
              'Eine Änderung vorschlagen, damit jemand, der sie bearbeiten kann, darüber entscheiden kann; welche Wirkstoffe gegeben werden können',
            related: 'Wissen vorschlagen (dazu gehörende Räume)',
            relatedLabel: 'Räume, die mit mir in Zusammenhang stehen',
            relatedHint:
              'Die Anwendung entscheidet, welche Räume sich auf wen beziehen',
            all: 'Wissen vorschlagen (alle)',
          },
          edit: {
            title: 'Wissen bearbeiten',
            description:
              'Vorschläge bearbeiten, archivieren und als verifiziert markieren und entscheiden; Systemwissen braucht jeder',
            related: 'Wissen bearbeiten (dazu gehörende Bereiche)',
            relatedLabel: 'Räume, die mit mir in Zusammenhang stehen',
            relatedHint:
              'Die Anwendung entscheidet, welche Räume sich auf wen beziehen',
            all: 'Wissen bearbeiten (alle)',
          },
          manage: {
            title: 'Wissenszugriff verwalten',
            description:
              'Ändern Sie, wer auf jeden Ordner und Artikel zugreifen darf, und behalten Sie den Zugriff auf alles bei. Systemwissen braucht alles',
            related: 'Wissenszugriff verwalten (dazugehörige Bereiche)',
            relatedLabel: 'Räume, die mit mir in Zusammenhang stehen',
            relatedHint:
              'Die Anwendung entscheidet, welche Räume sich auf wen beziehen',
            all: 'Wissenszugriff verwalten (alle)',
          },
        },
      },
    },
  },
};

export default deDE;
