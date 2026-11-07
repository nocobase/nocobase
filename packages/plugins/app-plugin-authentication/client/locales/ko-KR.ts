import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  errors: {
    generic: '문제가 발생했습니다. 다시 시도하세요.',
    network: '서버에 연결할 수 없습니다. 연결 상태를 확인하고 다시 시도하세요.',
    rateLimited: '시도 횟수가 너무 많습니다. 잠시 후 다시 시도하세요.',
    INVALID_EMAIL_OR_PASSWORD: '이메일 또는 비밀번호가 올바르지 않습니다.',
    INVALID_USERNAME_OR_PASSWORD:
      '사용자 이름 또는 비밀번호가 올바르지 않습니다.',
    INVALID_PASSWORD: '비밀번호가 올바르지 않습니다.',
    INVALID_EMAIL: '올바른 이메일 주소를 입력하세요.',
    INVALID_USERNAME:
      '사용자 이름에는 영문자, 숫자, 밑줄, 점만 사용할 수 있습니다.',
    USERNAME_TOO_SHORT: '사용자 이름이 너무 짧습니다.',
    USERNAME_TOO_LONG: '사용자 이름이 너무 깁니다.',
    USERNAME_IS_ALREADY_TAKEN: '이미 사용 중인 사용자 이름입니다.',
    USER_ALREADY_EXISTS: '이 이메일로 된 계정이 이미 있습니다.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      '이 이메일로 된 계정이 이미 있습니다. 다른 이메일을 사용하세요.',
    PASSWORD_TOO_SHORT: '비밀번호가 너무 짧습니다.',
    RESET_PASSWORD_DISABLED:
      '셀프 비밀번호 재설정이 활성화되어 있지 않습니다. 관리자에게 비밀번호 재설정을 요청하세요.',
    PASSWORD_TOO_LONG: '비밀번호가 너무 깁니다.',
    EMAIL_NOT_VERIFIED: '로그인하기 전에 이메일 주소를 인증하세요.',
    INVALID_TOKEN: '링크가 유효하지 않거나 만료되었습니다.',
    TOKEN_EXPIRED: '링크가 만료되었습니다.',
    ACCOUNT_DISABLED: '비활성화된 계정입니다. 관리자에게 문의하세요.',
    SERVICE_ACCOUNT_NO_LOGIN:
      '서비스 계정은 로그인할 수 없으며 API 키를 통해서만 작동합니다.',
    invalidOriginWithAddress:
      '신뢰할 수 없는 출처입니다. config.yml의 app.publicOrigin을 {{origin}}(으)로 설정하고 애플리케이션을 다시 시작한 후 다시 시도하세요.',
    INVALID_ORIGIN:
      '신뢰할 수 없는 출처입니다. config.yml의 app.publicOrigin을 확인하고 애플리케이션을 다시 시작한 후 다시 시도하세요.',
    INVALID_CSRF_ORIGIN:
      '다른 사이트에서 온 요청이라 거부되었습니다. 페이지를 새로 고친 후 다시 시도하세요.',
  },
};

export default koKR;
