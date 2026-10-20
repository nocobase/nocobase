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
  retry: 'Solicitação de nova tentativa',
  plugin: 'Plug-in',
  scope: 'Escopo',
  message: 'Mensagem',
};

export default ptBR;
