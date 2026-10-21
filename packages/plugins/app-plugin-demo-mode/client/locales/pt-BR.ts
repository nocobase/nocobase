import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Dados de demonstração',
    read: 'Visualizar',
    manage: 'Gerar e limpar',
    configuration: 'Configuração de demonstração',
    configure: 'Configurar',
  },
  accounts: {
    title: 'Contas de demonstração',
    description:
      'Entre na demonstração com qualquer uma destas contas para ver o que cada uma vê.',
    enter: 'Entrar',
    signedInAs: 'Conectado como {{name}} · Trocar',
    current: 'Atual',
    entering: 'Entrando…',
    failed: 'Não foi possível entrar com esta conta de demonstração.',
    unavailable: 'Nenhuma conta de demonstração disponível no momento.',
    password: 'Entrar com senha',
  },
  refused: {
    title: 'Esta é uma demonstração. As alterações não podem ser salvas.',
    description: 'As demais funções operam normalmente.',
  },
};
export default resource;
