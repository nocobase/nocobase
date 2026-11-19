import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Carregando',
  },
  notificationTemplates: {
    invitation: {
      contributor: 'Usuários',
      category: 'Contas',
      name: 'Convite de usuário',
      trigger:
        'Um administrador convida alguém, ou reenvia um convite, com e-mail selecionado.',
      recipients:
        'A pessoa convidada, no endereço de e-mail informado para ela.',
      businessRule:
        'Enviado sempre que um convite é criado ou reenviado com e-mail selecionado. Não há uma opção separada para desativá-lo.',
      languagePolicy:
        'Escrito em um único idioma, escolhido ao convidar: o idioma da interface de quem convida, a menos que outro seja escolhido. O reenvio mantém o mesmo idioma. Se esse idioma não tiver texto de e-mail, o e-mail usa o idioma padrão do aplicativo e o inglês.',
      channel: 'Remetente do e-mail de convite',
      variables: {
        app: 'Nome do aplicativo',
        inviter: 'Nome de quem enviou o convite',
        items: 'Funções ou acessos concedidos pelo convite',
        date: 'Quando o convite expira, no idioma do e-mail e em UTC',
        url: 'Link para aceitar o convite; a pré-visualização usa um link fictício',
      },
    },
  },
  accept: {
    title: 'Aceite o convite',
    language: 'Idioma',
    description: '{{inviter}} convidou você.',
    summary: 'Você também participará: {{items}}',
    loading: 'Carregando o convite…',
    email: 'E-mail',
    name: 'Nome',
    username: 'Nome de usuário (opcional)',
    usernameHint: 'Você pode usar este nome de usuário para entrar.',
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
    alreadyHaveAccount: 'Já tem uma conta? Entre',
    goToLogin: 'Vá para fazer login',
    errors: {
      notFound: 'Este link de convite não é válido.',
      expired: 'Este convite expirou. Peça um novo.',
      accepted: 'Este convite já foi aceito.',
      revoked: 'Este convite foi revogado.',
      password: 'A senha não atende aos requisitos.',
      usernameConflict:
        'Este nome já é usado como nome de usuário ou e-mail. Escolha outro.',
      accountConflict: 'Uma conta com este endereço não pode ser criada.',
      failed: 'Algo correu mal. Por favor, tente novamente.',
    },
  },
};

export default ptBR;
