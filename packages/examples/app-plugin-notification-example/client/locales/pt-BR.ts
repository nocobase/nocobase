import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
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
    refresh: 'Atualizar',
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
    refresh: 'Atualizar',
    save: 'Salvar alterações',
    cancel: 'Cancelar',
    back: 'Voltar às tarefas',
  },
};

export default ptBR;
