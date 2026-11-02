import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  errors: {
    promptNotFound: 'Nenhuma mensagem com esta identidade existe na sessão.',
    promptStarted:
      'A mensagem iniciou o processamento e não pode ser retirada.',
    withdrawalUnsupported:
      'Esta mensagem mais antiga não pode ser retirada com segurança. Atualize a linha de comando e reinicie a conexão do computador.',
    bridgeReplaced:
      'Outra ponte registrou este computador. Reinicie esta conexão.',
    submissionConflict:
      'Este ID de envio já está sendo usado para outra solicitação.',
    authenticationRequired: 'Faça login para usar sessões de agente.',
    computerNotFound:
      'Nenhum computador com este ID está conectado à sua conta.',
    sessionNotFound: 'Nenhuma sessão com este id é sua.',
    computerOffline:
      'O computador está off-line. Inicie a ponte nele e tente novamente.',
    agentUnavailable: 'O computador não pode executar este agente.',
    directoryNotAllowed:
      'As sessões neste computador funcionam apenas nos diretórios permitidos pela sua ponte.',
    sessionArchived: 'A sessão é arquivada. Restaure-o primeiro.',
    permissionRequestNotFound:
      'Esta solicitação de permissão já foi respondida ou não está mais aguardando.',
    choiceNotFound: 'O agente não oferece esta escolha ou valor.',
    linkNotFound:
      'Nada deste tipo com este id está vinculado à sessão, ou seu trabalho não pode começar a partir daqui.',
    invalidPageToken: 'O token da página não foi emitido por esta lista.',
    upgradeRequired:
      'A ponte fala outra versão do protocolo. Atualize a linha de comando neste computador.',
    computerNotAnswering:
      'O computador não respondeu a tempo. Verifique se a conexão está funcionando e tente novamente.',
    folderUnavailable: 'A pasta não pode ser aberta no computador.',
    discoveryFailed:
      'Não foi possível carregar as configurações do agente. Verifique o agente neste computador e tente novamente.',
    projectNotFound: 'Esse projeto não existe ou você não consegue vê-lo.',
    referenceNotFound: 'Algo mencionado não existe ou você não pode ver.',
    imageNotFound: 'Nenhuma imagem com este nome foi enviada na sessão.',
    computerKeyInvalid:
      'Este computador não está mais conectado: foi removido ou conectado novamente de outro lugar. Execute `acp start` nele para conectá-lo novamente.',
  },
};

export default ptBR;
