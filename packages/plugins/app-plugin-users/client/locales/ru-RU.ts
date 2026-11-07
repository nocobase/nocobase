import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Загрузка',
  },
  accept: {
    title: 'Принять приглашение',
    description: '{{inviter}} приглашает вас.',
    summary: 'Вы также присоединитесь к: {{items}}',
    loading: 'Загрузка приглашения…',
    email: 'Эл. почта',
    name: 'Имя',
    username: 'Имя пользователя (необязательно)',
    usernameHint: 'С этим именем пользователя можно входить в систему.',
    password: 'Пароль',
    nameRequired: 'Введите имя.',
    passwordTooShort: 'Пароль должен содержать не менее {{min}} символов.',
    submit: 'Создать аккаунт и присоединиться',
    join: 'Принять приглашение',
    submitting: 'Присоединение…',
    signedIn:
      'Вы вошли как {{name}}. Выйдите, чтобы принять это приглашение с новым аккаунтом.',
    signOut: 'Выйти',
    signOutFailed: 'Не удалось выйти.',
    existingAccount:
      'Для этого адреса уже есть аккаунт. Войдите с ним, чтобы продолжить.',
    alreadyHaveAccount: 'Уже есть аккаунт? Войти',
    goToLogin: 'Перейти ко входу',
    errors: {
      notFound: 'Ссылка-приглашение недействительна.',
      expired: 'Срок действия приглашения истёк. Запросите новое.',
      accepted: 'Это приглашение уже принято.',
      revoked: 'Это приглашение отозвано.',
      password: 'Пароль не соответствует требованиям.',
      usernameConflict:
        'Это имя уже используется как имя пользователя или адрес эл. почты. Выберите другое.',
      accountConflict: 'Аккаунт с этим адресом создать нельзя.',
      failed: 'Что-то пошло не так. Повторите попытку.',
    },
  },
};

export default ruRU;
