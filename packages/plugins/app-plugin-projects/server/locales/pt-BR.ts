import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  roles: {
    owner: 'Responsável',
    admin: 'Administrador',
    member: 'Membro',
  },
  access: {
    sections: {
      projects: 'Projetos',
      issues: 'Questões',
      settings: 'Configurações do projeto',
      members: 'Membros e funções',
    },
    businesses: {
      projects: {
        title: 'Projetos',
        description: 'Projetos, seus membros, repositórios e andamento.',
        actions: {
          view: {
            title: 'Ver projetos',
            description: 'Veja os projetos, sua visão geral e andamento',
            related: 'Ver projetos (aqueles que eles podem ver)',
            relatedLabel: 'Aqueles que posso ver',
            relatedHint: 'Projetos públicos e privados que lidero ou participo',
            all: 'Ver projetos (todos)',
          },
          create: {
            title: 'Criar projetos',
            description: 'Iniciar um novo projeto e liderá-lo',
            all: 'Criar projetos',
          },
          manage: {
            title: 'Gerenciar projetos',
            description:
              'Renomear, alterar status, datas e lead, gerenciar membros e repositórios',
            related: 'Gerenciar projetos (aqueles que eles lideram)',
            relatedLabel: 'Aqueles que eu lidero',
            relatedHint: 'Projetos dos quais sou líder',
            all: 'Gerenciar projetos (todos)',
          },
          delete: {
            title: 'Excluir projetos',
            description: 'Excluir projetos e restaurar os excluídos',
            all: 'Excluir projetos',
          },
        },
      },
      issues: {
        title: 'Questões',
        description:
          'Questões e seus comentários, em projeto ou por conta própria.',
        actions: {
          view: {
            title: 'Ver problemas',
            description: 'Ver problemas em listas, quadros e seus detalhes',
            related: 'Ver problemas (aqueles que eles podem ver)',
            relatedLabel: 'Em projetos posso ver',
            relatedHint:
              'Problemas sem projeto e problemas em projetos que posso ver',
            all: 'Ver problemas (todos)',
          },
          create: {
            title: 'Criar problemas',
            description: 'Criar problemas, em um projeto ou por conta própria',
            related: 'Criar problemas (em projetos que eles possam ver)',
            relatedLabel: 'Em projetos posso ver',
            relatedHint: 'Problemas sem projeto, ou em projetos que posso ver',
            all: 'Criar problemas (todos)',
          },
          edit: {
            title: 'Editar problemas',
            description:
              'Título, descrição, prioridade, datas, rótulos, executores e status abertos',
            related: 'Editar problemas (aqueles que eles podem ver)',
            relatedLabel: 'Em projetos posso ver',
            relatedHint:
              'Problemas sem projeto e problemas em projetos que posso ver',
            all: 'Editar problemas (todos)',
          },
          comment: {
            title: 'Comentário sobre questões',
            description:
              'Comentar, responder e resolver tópicos; editar e excluir seus próprios comentários',
            related: 'Comente sobre questões (aquelas que eles podem ver)',
            relatedLabel: 'Em projetos posso ver',
            relatedHint:
              'Problemas sem projeto e problemas em projetos que posso ver',
            all: 'Comentário sobre questões (todas)',
          },
          moderateComments: {
            title: 'Comentários moderados',
            description: 'Excluir comentários de outras pessoas',
            related:
              'Comentários moderados (sobre questões de sua propriedade ou cujo projeto lideram)',
            relatedLabel: 'Em questões que possuo ou em projetos que lidero',
            relatedHint:
              'Comentários sobre questões de minha propriedade e sobre questões de projetos que lidero',
            all: 'Comentários moderados (todos)',
          },
          close: {
            title: 'Encerrar problemas',
            description: 'Marcar um problema como concluído ou cancelado',
            related:
              'Questões encerradas (de sua propriedade ou cujo projeto lideram)',
            relatedLabel: 'Dos que possuo ou em projetos que lidero',
            relatedHint:
              'Questões que possuo e questões em projetos que lidero',
            all: 'Encerrar problemas (todos)',
          },
          changeOwner: {
            title: 'Alterar o proprietário',
            description:
              'Entregar um problema a outra pessoa para que ele seja responsável por ele',
            related:
              'Mudar o proprietário (aqueles que possuem ou cujo projeto lideram)',
            relatedLabel: 'Dos que possuo ou em projetos que lidero',
            relatedHint:
              'Questões que possuo e questões em projetos que lidero',
            all: 'Alterar o proprietário (todos)',
          },
          delete: {
            title: 'Excluir e restaurar problemas',
            description: 'Excluir problemas e restaurar os excluídos',
            all: 'Excluir e restaurar problemas',
          },
        },
      },
      attachments: {
        title: 'Anexos',
        description: 'Arquivos anexados a questões e comentários.',
        actions: {
          upload: {
            title: 'Carregar anexos',
            description:
              'Anexe arquivos a problemas que eles possam editar e aos seus comentários',
            related: 'Carregar anexos (sobre problemas que eles possam ver)',
            relatedLabel: 'Em questões em projetos posso ver',
            relatedHint:
              'Arquivos sobre problemas sem projeto e sobre problemas em projetos que posso ver',
            all: 'Carregar anexos (todos)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Projetos',
      pmIssues: 'Questões',
    },
    recordAccess: {
      visible: 'Projetos e problemas que eles podem ver',
      managed: 'Projetos que lideram e questões de sua propriedade',
    },
    settings: {
      pm: {
        general: 'Geral',
        labels: 'Etiquetas',
        members: 'Membros',
      },
    },
    keyScopes: {
      projects: {
        title: 'Projetos',
        description: 'Ver projetos; gerenciá-los; crie e exclua-os.',
        objects: 'Projetos',
      },
      issues: {
        title: 'Questões',
        description:
          'Ver questões; criar, editar, comentar, fechar e reatribuir; moderar comentários e excluir problemas.',
      },
      settings: {
        title: 'Configurações do projeto',
        description: 'Configurações gerais e rótulos.',
      },
    },
    actions: {
      view: 'Visualizar',
      create: 'Criar',
      manage: 'Gerenciar',
      edit: 'Editar',
      close: 'Fechar',
      comment: 'Comentário',
      moderateComments: 'Comentários moderados',
      changeOwner: 'Alterar proprietário',
      delete: 'Excluir',
      upload: 'Enviar',
      read: 'Visualizar',
      update: 'Editar',
      invite: 'Convidar',
      assign: 'Atribuir funções',
      'define-roles': 'Definir funções',
    },
  },
  notifications: {
    batchDone: 'Todas as subedições de {{identifier}} foram concluídas',
    batchDoneStage:
      'A etapa {{stage}} das subedições de {{identifier}} foi concluída',
    commented: '{{actor}} comentou em {{identifier}}',
    dependencyReleased:
      '{{releasedBy}} foi finalizado, então {{identifier}} pode iniciar',
    executorAssigned: '{{actor}} atribuiu {{identifier}} a você',
    mentioned: {
      comment: '{{actor}} mencionou você em {{identifier}}',
      description: '{{actor}} mencionou você em {{identifier}}',
    },
    ownerAssigned: '{{actor}} tornou você o proprietário de {{identifier}}',
    someone: 'Alguém',
    statusChanged: '{{identifier}} movido para {{status}}',
    ownerNotified: '{{identifier}} agora é {{status}}',
  },
  status: {
    backlog: 'Pendências',
    blocked: 'Bloqueado',
    cancelled: 'Cancelado',
    done: 'Concluído',
    in_progress: 'Em andamento',
    in_review: 'Em revisão',
  },
};

export default ptBR;
