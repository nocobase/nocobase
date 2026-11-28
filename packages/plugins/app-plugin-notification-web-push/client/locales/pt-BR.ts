import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  'push.deviceCount': 'Registrados: {{total}} · Ativos: {{active}}',
  'push.active': 'Enabled',
  'push.paused': 'Paused',
  'push.pause': 'Pause',
  'push.resume': 'Resume',
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
  'push.testSent': 'O serviço push aceitou a notificação de teste.',
  'push.invalid':
    'O navegador retornou dados de inscrição inválidos. Tente se inscrever novamente.',
  'push.endpoint':
    'O servidor não oferece suporte ao serviço push deste navegador.',
  'push.owned':
    'A inscrição deste navegador pertence a outra conta. Remova-a dessa conta antes de se inscrever novamente.',
  'push.browserFailed':
    'O navegador não conseguiu criar a inscrição push. Verifique as configurações de notificações e a conexão.',
  'push.expired':
    'A inscrição deste dispositivo expirou ou foi removida. Inscreva-se novamente no dispositivo.',
  'push.testPaused':
    'Reative o push para este dispositivo antes de enviar um teste.',
  'push.testLimited': 'Aguarde 30 segundos entre as notificações de teste.',
  'push.testNetwork':
    'O servidor não conseguiu acessar o serviço push. Peça a um administrador que verifique a rede e o proxy de Web Push.',
  'push.testGatewayAuth':
    'O serviço push rejeitou as credenciais do servidor. Peça a um administrador que confira a chave VAPID.',
  'push.testGatewayLimited':
    'O serviço push está limitando as solicitações. Tente novamente mais tarde.',
  'push.testGateway':
    'O serviço push não conseguiu aceitar a notificação de teste. Tente novamente mais tarde.',
  'push.failed':
    'Não foi possível atualizar as notificações push. Por favor, tente novamente.',
  'push.loadingFailed':
    'Não é possível carregar dispositivos. Por favor, tente novamente.',
  'push.retry': 'Tentar novamente',
  'channelType.title': 'Push do navegador',
  'channelType.testHint':
    'Envia uma notificação de teste para os navegadores em que você ativou o push. Ative primeiro em Configurações pessoais › Notificações.',
};

export default ptBR;
