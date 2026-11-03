import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  errors: {
    generic: 'Algo correu mal. Por favor, tente novamente.',
    network:
      'Não foi possível acessar o servidor. Verifique sua conexão e tente novamente.',
    rateLimited: 'Muitas tentativas. Aguarde um momento e tente novamente.',
    INVALID_EMAIL_OR_PASSWORD: 'E-mail ou senha incorretos.',
    INVALID_USERNAME_OR_PASSWORD: 'Nome de usuário ou senha incorretos.',
    INVALID_PASSWORD: 'Senha incorreta.',
    INVALID_EMAIL: 'Insira um endereço de e-mail válido.',
    INVALID_USERNAME:
      'Os nomes de usuário podem conter apenas letras, dígitos, sublinhados e pontos.',
    USERNAME_TOO_SHORT: 'Este nome de usuário é muito curto.',
    USERNAME_TOO_LONG: 'Este nome de usuário é muito longo.',
    USERNAME_IS_ALREADY_TAKEN: 'Este nome de usuário já está em uso.',
    USER_ALREADY_EXISTS: 'Já existe uma conta com este e-mail.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      'Já existe uma conta com este e-mail. Use outro e-mail.',
    PASSWORD_TOO_SHORT: 'Esta senha é muito curta.',
    RESET_PASSWORD_DISABLED:
      'A redefinição de senha de autoatendimento não está habilitada. Entre em contato com um administrador para redefinir sua senha.',
    PASSWORD_TOO_LONG: 'Esta senha é muito longa.',
    EMAIL_NOT_VERIFIED:
      'Verifique seu endereço de e-mail antes de fazer login.',
    INVALID_TOKEN: 'Este link é inválido ou expirou.',
    TOKEN_EXPIRED: 'Este link expirou.',
    ACCOUNT_DISABLED:
      'Esta conta está desativada. Entre em contato com seu administrador.',
    SERVICE_ACCOUNT_NO_LOGIN:
      'Uma conta de serviço não pode fazer login; ele atua apenas por meio de chaves API.',
    invalidOriginWithAddress:
      'Esta origem não é confiável. Defina app.publicOrigin em config.yml como {{origin}}, reinicie o aplicativo e tente novamente.',
    INVALID_ORIGIN:
      'Esta origem não é confiável. Verifique app.publicOrigin em config.yml, reinicie o aplicativo e tente novamente.',
    INVALID_CSRF_ORIGIN:
      'Este pedido veio de outro site e foi recusado. Atualize a página e tente novamente.',
  },
};

export default ptBR;
