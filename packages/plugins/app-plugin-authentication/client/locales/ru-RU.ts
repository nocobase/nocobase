import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  errors: {
    generic: 'Что-то пошло не так. Повторите попытку.',
    network:
      'Не удалось связаться с сервером. Проверьте подключение и повторите попытку.',
    rateLimited: 'Слишком много попыток. Подождите немного и повторите.',
    INVALID_EMAIL_OR_PASSWORD: 'Неверный адрес эл. почты или пароль.',
    INVALID_USERNAME_OR_PASSWORD: 'Неверное имя пользователя или пароль.',
    INVALID_PASSWORD: 'Неверный пароль.',
    INVALID_EMAIL: 'Введите корректный адрес эл. почты.',
    INVALID_USERNAME:
      'Имя пользователя может содержать только буквы, цифры, подчёркивания и точки.',
    USERNAME_TOO_SHORT: 'Имя пользователя слишком короткое.',
    USERNAME_TOO_LONG: 'Имя пользователя слишком длинное.',
    USERNAME_IS_ALREADY_TAKEN: 'Это имя пользователя уже занято.',
    USER_ALREADY_EXISTS: 'Аккаунт с этим адресом эл. почты уже существует.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      'Аккаунт с этим адресом эл. почты уже существует. Укажите другой адрес.',
    PASSWORD_TOO_SHORT: 'Пароль слишком короткий.',
    RESET_PASSWORD_DISABLED:
      'Самостоятельный сброс пароля не включён. Обратитесь к администратору, чтобы сбросить пароль.',
    PASSWORD_TOO_LONG: 'Пароль слишком длинный.',
    EMAIL_NOT_VERIFIED: 'Подтвердите адрес эл. почты перед входом.',
    INVALID_TOKEN: 'Ссылка недействительна или устарела.',
    TOKEN_EXPIRED: 'Срок действия ссылки истёк.',
    ACCOUNT_DISABLED: 'Этот аккаунт отключён. Обратитесь к администратору.',
    SERVICE_ACCOUNT_NO_LOGIN:
      'Сервисный аккаунт не может входить в систему: он работает только через API-ключи.',
    invalidOriginWithAddress:
      'Этот источник не является доверенным. Укажите app.publicOrigin в config.yml как {{origin}}, перезапустите приложение и повторите попытку.',
    INVALID_ORIGIN:
      'Этот источник не является доверенным. Проверьте app.publicOrigin в config.yml, перезапустите приложение и повторите попытку.',
    INVALID_CSRF_ORIGIN:
      'Запрос пришёл с другого сайта и был отклонён. Перезагрузите страницу и повторите попытку.',
  },
};

export default ruRU;
