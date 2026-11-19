import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  providerDescription:
    'Esta página usa um provedor fornecido pelo mesmo plugin cliente.',
  loadError: 'Não é possível carregar a rota do servidor.',
  clientExample: 'Exemplo de rota do cliente',
  title: 'Exemplo de rotas',
  pageDescription:
    'Ele foi carregado lentamente e lê uma resposta da rota do servidor do mesmo plugin.',
  loading: 'Carregando dados do servidor…',
  retry: 'Tentar a solicitação novamente',
  plugin: 'Plug-in',
  scope: 'Escopo',
  message: 'Mensagem',
  settingsTitle: 'Configurações do exemplo de rotas',
  settingsDescription:
    'Declarado pelo plugin de exemplo de rotas com defineSettingsRoutes().',
  settingsBody:
    'Esta página de configurações vem de um plugin. Ela é declarada com defineSettingsRoutes(), entra na categoria Sistema e fica em /settings.',
};

export default ptBR;
