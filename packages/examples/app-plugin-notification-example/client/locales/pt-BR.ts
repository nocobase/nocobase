import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  notificationTemplates: {
    contributor: 'Exemplos de notificação',
    category: 'Tarefas',
    assigned: {
      name: 'Tarefa atribuída',
      trigger: 'Uma tarefa é criada.',
      recipients: 'O responsável, mesmo quando atribuiu a tarefa a si mesmo.',
    },
    updated: {
      name: 'Tarefa atualizada',
      trigger: 'Uma tarefa é alterada, inclusive quando é reatribuída.',
      recipients:
        'O criador, o responsável anterior e o novo responsável, uma vez cada. Quem fez a alteração não é notificado.',
    },
    businessRule:
      'Enviado sempre que a ação da tarefa acontece. Não há uma opção separada para desativá-lo.',
    languagePolicy:
      'Sempre em inglês, qualquer que seja o idioma do destinatário.',
    channel: 'Caixa de tarefas',
    variables: {
      title: 'Título da tarefa',
      description: 'Descrição da tarefa',
      status: 'Status da tarefa',
    },
  },
  navigation: {
    tasks: 'Exemplos de notificação',
    taskManagement: 'Tarefas',
    taskDetail: 'Detalhes da tarefa',
  },
  common: {
    close: 'Fechar',
    loading: 'Carregando…',
    saving: 'Salvando…',
  },
  fields: {
    title: 'Título',
    description: 'Descrição',
    status: 'Status',
    assignee: 'Responsável atribuído',
    creator: 'Criador',
    chooseAssignee: 'Escolha um usuário',
  },
  status: {
    open: 'Abrir',
    'in-progress': 'Em andamento',
    done: 'Concluído',
  },
  tasks: {
    title: 'Tarefas',
    description:
      'Atribua uma pequena tarefa a outro usuário. O responsável recebe uma notificação no aplicativo com o resumo da tarefa e pode editar a tarefa na página de detalhes. Use o botão de notificação na barra superior para abrir suas notificações de mensagens.',
    listTitle: 'Todas as tarefas',
    listDescription:
      'Todas as tarefas que você criou ou para as quais foi atribuído.',
    count: 'Registros {{count}}',
    empty: 'Nenhuma tarefa ainda.',
    assignee: 'Atribuído a',
    columns: {
      title: 'Título',
      description: 'Descrição',
      status: 'Status',
      creator: 'Criador',
      assignee: 'Responsável atribuído',
      updatedAt: 'Última atualização',
      actions: 'Ações',
    },
    view: 'Ver detalhes',
    retryRead: 'Tentar novamente',
    previous: 'Anterior',
    next: 'Próximo',
    page: 'Página {{page}}',
    add: 'Nova tarefa',
    drawerTitle: 'Nova tarefa',
    drawerDescription:
      'A criação de uma tarefa envia suas informações básicas ao destinatário.',
    create: 'Criar tarefa',
    cancel: 'Cancelar',
  },
  taskDetail: {
    title: 'Detalhes da tarefa',
    summary: 'Detalhes da tarefa',
    createdAt: 'Criado',
    updatedAt: 'Última atualização',
    notificationHint:
      'Depois que uma tarefa é salva, as pessoas relacionadas que não sejam o editor atual são notificadas: o criador e o responsável atual. Se o destinatário mudar, tanto o destinatário anterior quanto o novo serão notificados.',
    edit: 'Editar tarefa',
    retryRead: 'Tentar novamente',
    save: 'Salvar alterações',
    cancel: 'Cancelar',
    back: 'Voltar às tarefas',
  },
};

export default ptBR;
