import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  nav: {
    plugins: 'Plugins',
    pluginsDescription:
      'Os plugins que este aplicativo usa, suas versões e como ativar os demais.',
  },
  access: {
    section: 'Sistema',
    settings: {
      plugins: 'Plugins',
    },
    actions: {
      read: 'Visualizar',
    },
  },
  page: {
    title: 'Plugins',
    description:
      'Os plugins que este aplicativo usa. Ativar ou desativar um deles altera o código do aplicativo e só vale depois de reiniciá-lo, por isso esta página mostra os comandos a executar em vez de chaves.',
    deployed:
      'Este é um aplicativo implantado: só aparecem os plugins implantados com ele. Plugins visíveis apenas durante o desenvolvimento não aparecem aqui.',
    attention_one: '{{count}} plugin precisa de atenção e aparece primeiro.',
    attention_other:
      '{{count}} plugins precisam de atenção e aparecem primeiro.',
    attention_many:
      '{{count}} plugins precisam de atenção e aparecem primeiro.',
    search: 'Pesquisar por nome ou pacote',
    loading: 'Carregando plugins…',
    loadFailed: 'Não foi possível carregar os plugins.',
    retry: 'Tentar novamente',
    empty: 'Nenhum plugin corresponde.',
  },
  filters: {
    label: 'Mostrar',
    all: 'Todos {{count}}',
    enabled: 'Ativados {{count}}',
    disabled: 'Não ativados {{count}}',
    attention: 'Precisam de atenção {{count}}',
  },
  columns: {
    plugin: 'Plugin',
    version: 'Versão',
    status: 'Status',
    actions: 'Ações',
  },
  groups: {
    enabled: 'Ativados {{count}}',
    disabled: 'Não ativados {{count}}',
  },
  status: {
    enabled: 'Ativado',
    skillsOnly: 'Ativado · Apenas Skills',
    enabledAttention: 'Ativado · Precisa de atenção',
    disabled: 'Não ativado',
    preinstalled: 'Não ativado · Só no desenvolvimento',
    disabledAttention: 'Não ativado · Precisa de atenção',
    unknown: 'Não é possível saber · Recompilar',
  },
  reasons: {
    partial:
      'Ativado só em parte: as páginas abrem, mas os dados não carregam. Execute o comando de ativação novamente para corrigir.',
    devDependency:
      'Está ativado, mas não é incluído quando o aplicativo é implantado, então o aplicativo em produção ficará sem ele. Execute o comando de ativação novamente para corrigir.',
    missingRequires: '“{{title}}” precisa de {{names}}, que não está ativado.',
    other:
      'Não está configurado por completo neste aplicativo. Execute o comando de ativação novamente para corrigir.',
    requiresFirst: 'Ative antes: {{names}} (o comando de ativação já inclui)',
    unknown:
      'Este aplicativo foi compilado antes de a compilação registrar quais plugins de linha de comando ele usa, então não é possível saber aqui se este está habilitado. Execute pnpm build novamente e reimplante.',
  },
  actions: {
    commands: 'Comandos',
    commandsFor: 'Comandos de {{title}}',
    enable: 'Como ativar',
    enableFor: 'Como ativar {{title}}',
  },
  commands: {
    title: 'Comandos de {{title}}',
    description:
      'Execute no diretório do código do aplicativo e reinicie-o; em produção, compile e implante novamente.',
    fix: 'Corrige o que precisa de atenção',
    update: 'Atualiza para a versão mais recente',
    unregister: 'Desativa; os dados são mantidos',
    dependents:
      'Plugins ativados que dependem dele: {{names}}. Desative-os junto com ele.',
    noDependents:
      'Nenhum plugin ativado depende dele, então ele pode ser desativado sozinho.',
    optionalDependents:
      'Plugins ativados que o usam de forma opcional: {{names}}. Continuam funcionando sem ele, mas perdem os recursos que precisam dele.',
  },
  enable: {
    title: 'Ativar {{title}}',
    description: 'Execute no diretório do código do aplicativo:',
    requires:
      '{{title}} depende de {{names}}, que também ainda não está ativado; o comando já inclui.',
    development:
      'Desenvolvimento local: reinicie o pnpm dev depois de executar e recarregue esta página para vê-lo ativado.',
    live: 'Aplicativo em produção: faça commit da alteração, execute pnpm build --tar e atualize com o instalador.',
    data: 'A primeira inicialização cria as tabelas dele. Se depois for desativado com plugin unregister, os dados são mantidos.',
  },
  dialog: {
    copy: 'Copiar comando',
    copied: 'Copiado',
    copyFailed: 'Não foi possível copiar; selecione o comando e copie.',
    close: 'Entendi',
  },
};

export default ptBR;
