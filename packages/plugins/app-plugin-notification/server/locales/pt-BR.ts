import type { NotificationServerResource } from './en-US.js';

const ptBR: NotificationServerResource = {
  errors: {
    logNotFound: 'Registro de notificação não encontrado.',
    kindNotFound: 'Tipo de notificação não encontrado.',
    channelNotFound: 'Não há canal de notificação ativado chamado "{{name}}".',
    channelTestUnsupported:
      'O canal "{{name}}" não pode enviar uma mensagem de teste.',
    channelNoRecipient:
      'O canal "{{name}}" não tem um endereço ou dispositivo seu.',
    deliveryNotFound: 'Entrega não encontrada.',
    deliveryNotRetryable:
      'Esta entrega não pode ser tentada novamente: só uma entrega com falha cujo canal não mudou pode.',
    retryReasonRequired: 'Informe o motivo da nova tentativa.',
    preferenceUnknown: 'Esta notificação não tem esse canal.',
    preferenceRequired:
      'Esta notificação é sempre enviada por este canal; não pode ser desativada.',
  },
  test: {
    title: 'Notificação de teste',
    body: 'Este é um teste de Configurações › Notificações para o canal "{{channel}}".',
  },
  authorization: {
    section: 'Mensagens',
    title: 'Notificações',
    read: 'Visualizar',
    manage: 'Gerenciar',
  },
};

export default ptBR;
