import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: 'O acesso aos logs de notificação é necessário.',
    logNotFound: 'Log de notificação não encontrado.',
    testHeaderRequired:
      'O cabeçalho da solicitação de teste de notificação é obrigatório.',
    testForbidden: 'A permissão de envio de teste de notificação é necessária.',
    testInvalidRequest:
      'O corpo da solicitação deve conter um alvo de teste e valores de campo.',
    testTargetUnavailable:
      'O destino do teste de notificação não está disponível.',
    testUnknownField: 'Campo de teste de notificação desconhecido "{{name}}".',
    testRequiredField:
      'O campo de teste de notificação "{{name}}" é obrigatório.',
    testFieldTooLong:
      'O campo de teste de notificação "{{name}}" deve ter no máximo caracteres {{maxLength}}.',
    testFailed: 'Falha no teste de notificação.',
    testNotFound: 'O teste de notificação não foi encontrado.',
  },
};

export default ptBR;
