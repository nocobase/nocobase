import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  'push.title': 'Notificações push',
  'push.description':
    'Receba lembretes em cada dispositivo, mesmo quando o aplicativo estiver fechado.',
  'push.subscribe': 'Assine este dispositivo',
  'push.name': 'Nome do dispositivo',
  'push.empty': 'Nenhum dispositivo assinado',
  'push.emptyHint':
    'Assine este dispositivo para receber lembretes quando o aplicativo for fechado.',
  'push.ios':
    'No iOS ou iPadOS 16.4 ou posterior, abra o menu Compartilhar do Safari, escolha Adicionar à tela inicial e abra o aplicativo em seu ícone para assinar.',
  'push.unsupported':
    'O Push precisa do HTTPS e de um navegador com suporte para Web Push.',
  'push.unavailable':
    'Push não está configurado. Peça a um administrador para configurar o VAPID e a chave secreta.',
  'push.denied':
    'As notificações estão bloqueadas. Permita-os nas configurações do site do seu navegador e tente novamente.',
  'push.current': 'Este dispositivo',
  'push.more': 'Ações do dispositivo',
  'push.test': 'Enviar notificação de teste',
  'push.remove': 'Remover',
  'push.removeTitle': 'Remover dispositivo “{{name}}”?',
  'push.removeHint':
    'Este dispositivo deixará de receber notificações push. Você pode se inscrever novamente nesse dispositivo.',
  'push.cancel': 'Cancelar',
  'push.saved': 'Configurações do dispositivo salvas',
  'push.saving': 'Salvando configurações do dispositivo',
  'push.testSent': 'Notificação de teste na fila',
  'push.failed':
    'Não foi possível atualizar as notificações push. Por favor, tente novamente.',
  'push.loadingFailed':
    'Não é possível carregar dispositivos. Por favor, tente novamente.',
  'push.retry': 'Tentar novamente',
};

export default ptBR;
