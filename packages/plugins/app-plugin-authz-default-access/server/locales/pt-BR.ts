import auditLabels from '../../locales/pt-BR.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  ...auditLabels,
  resourceTitle: 'Escopo de dados padrão',
};

export default ptBR;
