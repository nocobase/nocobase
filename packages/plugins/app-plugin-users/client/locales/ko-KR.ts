import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  page: {
    loading: '로드 중',
  },
  accept: {
    title: '초대 수락',
    description: '{{inviter}} 님이 초대했습니다.',
    summary: '다음에도 참여하게 됩니다: {{items}}',
    loading: '초대를 불러오는 중…',
    email: '이메일',
    name: '이름',
    username: '사용자 이름(선택)',
    usernameHint: '이 사용자 이름으로 로그인할 수 있습니다.',
    password: '비밀번호',
    nameRequired: '이름을 입력하세요.',
    passwordTooShort: '비밀번호는 {{min}}자 이상이어야 합니다.',
    submit: '계정 만들고 참여',
    join: '초대 수락',
    submitting: '참여하는 중…',
    signedIn:
      '{{name}}(으)로 로그인되어 있습니다. 새 계정으로 이 초대를 수락하려면 로그아웃하세요.',
    signOut: '로그아웃',
    signOutFailed: '로그아웃할 수 없습니다.',
    existingAccount:
      '이 주소로 이미 계정이 있습니다. 계속하려면 해당 계정으로 로그인하세요.',
    alreadyHaveAccount: '이미 계정이 있으신가요? 로그인',
    goToLogin: '로그인으로 이동',
    errors: {
      notFound: '유효하지 않은 초대 링크입니다.',
      expired: '초대가 만료되었습니다. 새 초대를 요청하세요.',
      accepted: '이미 수락된 초대입니다.',
      revoked: '취소된 초대입니다.',
      password: '비밀번호가 요구 사항을 충족하지 않습니다.',
      usernameConflict:
        '이 이름은 이미 사용자 이름 또는 이메일로 사용 중입니다. 다른 이름을 선택하세요.',
      accountConflict: '이 주소로는 계정을 만들 수 없습니다.',
      failed: '문제가 발생했습니다. 다시 시도하세요.',
    },
  },
};

export default koKR;
