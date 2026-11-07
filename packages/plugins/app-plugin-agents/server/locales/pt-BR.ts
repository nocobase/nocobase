import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  access: {
    section: 'Equipe de agentes',
    businessSection: 'Equipe de agentes',
    businesses: {
      agents: {
        title: 'Agentes e habilidades',
        description: 'Os agentes da equipe e as habilidades que utilizam.',
        actions: {
          edit: {
            title: 'Agents de mudança e competências',
            description:
              'Altere as configurações, habilidades e variáveis de um Agent, arquive, restaure e exclua, e edite habilidades. Um Agent não recebe nenhuma capacidade além da do próprio editor',
            related:
              'Agents de mudança e habilidades (Agents que eles possuem e habilidades que eles criaram)',
            relatedLabel: 'Agentes que possuo e habilidades que criei',
            relatedHint:
              'Agentes dos quais sou proprietário e habilidades que criei',
            all: 'Agents de mudança e habilidades (todos)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agentes',
        runners: 'Ambientes de execução',
        prices: 'Preços dos modelos',
        services: 'Serviços modelo',
      },
    },
    actions: {
      read: 'Visualizar',
      manage: 'Gerenciar',
    },
    keyScopes: {
      agents: {
        title: 'Agentes',
        description:
          'Veja Agents, habilidades e corridas; altere Agents e habilidades, cancele e tente novamente.',
      },
      runners: {
        title: 'Ambientes de execução',
        description:
          'Veja ambientes de execução e tokens de registro; gerenciar ambientes de execução.',
      },
      prices: {
        title: 'Preços dos modelos',
        description:
          'Veja os preços do modelo a partir dos quais os custos são estimados; mude-os.',
      },
      services: {
        title: 'Serviços modelo',
        description:
          'Veja os serviços de modelo e os modelos que eles oferecem, nunca suas chaves.',
      },
    },
  },
  runnerConversation: {
    title: 'Conversa: {{title}}',
    other: 'Conversa de outra pessoa',
    untitled: 'Nova conversa',
  },
};

export default ptBR;
