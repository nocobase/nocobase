import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  access: {
    section: 'Управление Agent',
    businessSection: 'Управление Agent',
    businesses: {
      agents: {
        title: 'Agent и навыки',
        description: 'Agent и навыки, которые они используют.',
        actions: {
          edit: {
            title: 'Управлять Agent и навыками',
            description:
              'Изменять настройки, навыки и переменные Agent, архивировать, восстанавливать и удалять его, редактировать навыки. Agent не получает возможностей сверх прав редактора',
            related:
              'Управлять Agent и навыками (своими Agent и созданными навыками)',
            relatedLabel: 'Мои Agent и созданные мной навыки',
            relatedHint:
              'Agent, владельцем которых я являюсь, и навыки, которые я создал',
            all: 'Управлять Agent и навыками (всеми)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agent',
        runners: 'Среды выполнения',
        prices: 'Цены моделей',
        services: 'Сервисы моделей',
      },
    },
    actions: {
      read: 'Просмотр',
      manage: 'Управление',
    },
    keyScopes: {
      agents: {
        title: 'Agent',
        description:
          'Просмотр Agent, навыков и запусков; изменение Agent и навыков, отмена и повтор запусков.',
      },
      runners: {
        title: 'Среды выполнения',
        description:
          'Просмотр сред выполнения и токенов регистрации; управление средами выполнения.',
      },
      prices: {
        title: 'Цены моделей',
        description:
          'Просмотр цен моделей, по которым оцениваются затраты; их изменение.',
      },
      services: {
        title: 'Сервисы моделей',
        description:
          'Просмотр сервисов моделей и предлагаемых ими моделей, без их ключей.',
      },
    },
  },
  runnerConversation: {
    title: 'Разговор: {{title}}',
    other: 'Чужой разговор',
    untitled: 'Новый разговор',
  },
};

export default ruRU;
