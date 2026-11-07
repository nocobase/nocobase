import type { KnowledgeServerResource } from './en-US.js';

const ptBR: KnowledgeServerResource = {
  access: {
    businessSection: 'Conhecimento',
    businesses: {
      knowledge: {
        title: 'Conhecimento',
        description: 'Os documentos de cada espaço de conhecimento.',
        actions: {
          read: {
            title: 'Leia o conhecimento',
            description:
              'Leia o conhecimento do sistema e dos espaços relacionados a ele',
            related: 'Ler conhecimentos (espaços relacionados a eles)',
            relatedLabel: 'Espaços relacionados a mim',
            relatedHint:
              'A aplicação decide quais espaços dizem respeito a quem',
            all: 'Leia o conhecimento (todos)',
          },
          propose: {
            title: 'Propor conhecimento',
            description:
              'Propor uma mudança para que alguém que possa editar decida; quais agentes podem receber',
            related: 'Propor conhecimentos (espaços a eles relacionados)',
            relatedLabel: 'Espaços relacionados a mim',
            relatedHint:
              'A aplicação decide quais espaços dizem respeito a quem',
            all: 'Propor conhecimento (todos)',
          },
          edit: {
            title: 'Editar conhecimento',
            description:
              'Editar, arquivar e marcar propostas verificadas e decidir; o conhecimento do sistema precisa de tudo',
            related: 'Editar conhecimentos (espaços relacionados a eles)',
            relatedLabel: 'Espaços relacionados a mim',
            relatedHint:
              'A aplicação decide quais espaços dizem respeito a quem',
            all: 'Editar conhecimento (todos)',
          },
          manage: {
            title: 'Gerenciar o acesso ao conhecimento',
            description:
              'Alterar quem pode acessar cada pasta e artigo e manter o acesso a todos; o conhecimento do sistema precisa de tudo',
            related:
              'Gerenciar o acesso ao conhecimento (espaços a eles relacionados)',
            relatedLabel: 'Espaços relacionados a mim',
            relatedHint:
              'A aplicação decide quais espaços dizem respeito a quem',
            all: 'Gerenciar o acesso ao conhecimento (todos)',
          },
        },
      },
    },
  },
};

export default ptBR;
