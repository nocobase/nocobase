import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Carregando',
  },
  accept: {
    title: 'Aceite o convite',
    description: '{{inviter}} convidou você.',
    summary: 'Você também participará: {{items}}',
    loading: 'Carregando o convite…',
    email: 'E-mail',
    name: 'Nome',
    password: 'Senha',
    nameRequired: 'Digite seu nome.',
    passwordTooShort: 'A senha precisa de pelo menos caracteres {{min}}.',
    submit: 'Crie uma conta e participe',
    join: 'Aceitar convite',
    submitting: 'Juntando-se…',
    signedIn:
      'Você está conectado como {{name}}. Saia para aceitar este convite com uma nova conta.',
    signOut: 'Sair',
    signOutFailed: 'Não foi possível sair.',
    existingAccount:
      'Este endereço já possui uma conta. Faça login com ele para continuar.',
    goToLogin: 'Vá para fazer login',
    errors: {
      notFound: 'Este link de convite não é válido.',
      expired: 'Este convite expirou. Peça um novo.',
      accepted: 'Este convite já foi aceito.',
      revoked: 'Este convite foi revogado.',
      password: 'A senha não atende aos requisitos.',
      accountConflict: 'Uma conta com este endereço não pode ser criada.',
      failed: 'Algo correu mal. Por favor, tente novamente.',
    },
  },
};

export default ptBR;
