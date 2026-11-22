import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  demo: {
    preparing: 'Preparando as caixas de demonstração…',
    setUp: 'Preparar caixas de demonstração',
    setupFailed: 'Não foi possível preparar as caixas de demonstração.',
  },
};

export default ptBR;
