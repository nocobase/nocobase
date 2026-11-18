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
      issues: 'Tarefas',
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
        title: 'Tarefas',
        description: 'Tarefas e seus comentários, em um projeto ou avulsas.',
        actions: {
          view: {
            title: 'Ver tarefas',
            description: 'Ver tarefas em listas, quadros e nos detalhes',
            related: 'Ver tarefas (as que pode ver)',
            relatedLabel: 'Em projetos posso ver',
            relatedHint:
              'Tarefas sem projeto e tarefas de projetos que posso ver',
            all: 'Ver tarefas (todas)',
          },
          create: {
            title: 'Criar tarefas',
            description: 'Criar tarefas, em um projeto ou avulsas',
            related: 'Criar tarefas (em projetos que pode ver)',
            relatedLabel: 'Em projetos posso ver',
            relatedHint: 'Tarefas sem projeto ou em projetos que posso ver',
            all: 'Criar tarefas (todas)',
          },
          edit: {
            title: 'Editar tarefas',
            description:
              'Título, descrição, prioridade, datas, rótulos, executores e status abertos',
            related: 'Editar tarefas (as que pode ver)',
            relatedLabel: 'Em projetos posso ver',
            relatedHint:
              'Tarefas sem projeto e tarefas de projetos que posso ver',
            all: 'Editar tarefas (todas)',
          },
          comment: {
            title: 'Comentar em tarefas',
            description:
              'Comentar, responder e resolver tópicos; editar e excluir seus próprios comentários',
            related: 'Comentar em tarefas (as que pode ver)',
            relatedLabel: 'Em projetos posso ver',
            relatedHint:
              'Tarefas sem projeto e tarefas de projetos que posso ver',
            all: 'Comentar em tarefas (todas)',
          },
          moderateComments: {
            title: 'Comentários moderados',
            description: 'Excluir comentários de outras pessoas',
            related:
              'Moderar comentários (nas suas tarefas ou em projetos que lidera)',
            relatedLabel: 'Nas minhas tarefas ou em projetos que lidero',
            relatedHint:
              'Comentários nas minhas tarefas e em tarefas de projetos que lidero',
            all: 'Comentários moderados (todos)',
          },
          close: {
            title: 'Fechar tarefas',
            description: 'Marcar uma tarefa como concluída ou cancelada',
            related: 'Fechar tarefas (as suas ou de projetos que lidera)',
            relatedLabel: 'Dos que possuo ou em projetos que lidero',
            relatedHint: 'Minhas tarefas e tarefas de projetos que lidero',
            all: 'Fechar tarefas (todas)',
          },
          changeOwner: {
            title: 'Alterar o proprietário',
            description:
              'Passar uma tarefa para outra pessoa ser responsável por ela',
            related:
              'Mudar o proprietário (aqueles que possuem ou cujo projeto lideram)',
            relatedLabel: 'Dos que possuo ou em projetos que lidero',
            relatedHint: 'Minhas tarefas e tarefas de projetos que lidero',
            all: 'Alterar o proprietário (todos)',
          },
          delete: {
            title: 'Excluir e restaurar tarefas',
            description: 'Excluir tarefas e restaurar as excluídas',
            all: 'Excluir e restaurar tarefas',
          },
        },
      },
      attachments: {
        title: 'Anexos',
        description: 'Arquivos anexados a tarefas e comentários.',
        actions: {
          upload: {
            title: 'Carregar anexos',
            description:
              'Anexar arquivos às tarefas que pode editar e aos seus comentários',
            related: 'Enviar anexos (em tarefas que pode ver)',
            relatedLabel: 'Em tarefas de projetos que posso ver',
            relatedHint:
              'Arquivos em tarefas sem projeto e em tarefas de projetos que posso ver',
            all: 'Carregar anexos (todos)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Projetos',
      pmIssues: 'Tarefas',
    },
    recordAccess: {
      visible: 'Projetos e tarefas que pode ver',
      managed: 'Projetos que lidera e tarefas pelas quais responde',
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
        title: 'Tarefas',
        description:
          'Ver tarefas; criar, editar, comentar, fechar e reatribuir; moderar comentários e excluir tarefas.',
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
    batchDone: 'Todas as subtarefas de {{identifier}} foram concluídas',
    batchDoneStage:
      'A etapa {{stage}} das subtarefas de {{identifier}} foi concluída',
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
