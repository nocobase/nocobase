import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  errors: {
    invalidRecipient:
      'Corrija os endereços de e-mail e os nomes de exibição dos destinatários antes de enviar.',
    accessDenied: 'O acesso ao correio é necessário.',
    idempotencyConflict:
      'A chave de idempotência já está associada a outra solicitação.',
    invalidRequest: 'A solicitação de email é inválida.',
    accountCredentialsInvalid:
      'Falha na autenticação da caixa postal. Verifique seu nome de login e senha ou código de autorização e confirme se IMAP/SMTP está ativado. Gmail e outros serviços podem exigir uma senha de aplicativo.',
    requestFailed: 'A solicitação de correio não pôde ser concluída.',
    providerRateLimited:
      'O serviço de correio está recebendo muitas solicitações. Tente novamente mais tarde.',
    providerUnavailable:
      'Não foi possível contatar o serviço de correio. Tente novamente mais tarde.',
    reauthorizationRequired:
      'Esta conta de e-mail deve ser reconectada antes de poder ser usada.',
    syncRunNotFound:
      'A execução de sincronização de correio não foi encontrada.',
    messageNotFound: 'A mensagem de correio não foi encontrada.',
    authorizationStateRequired:
      'O estado de autorização de correio é necessário.',
  },
};

export default ptBR;
