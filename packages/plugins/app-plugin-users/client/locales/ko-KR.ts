import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  page: {
    loading: '로드 중',
  },
  notificationTemplates: {
    invitation: {
      contributor: '사용자',
      category: '계정',
      name: '사용자 초대',
      trigger:
        '관리자가 이메일을 선택하여 사람을 초대하거나 초대를 다시 보낼 때.',
      recipients: '초대받은 사람. 해당 사람에게 입력된 이메일 주소로 보냅니다.',
      businessRule:
        '이메일을 선택하여 초대를 만들거나 다시 보낼 때마다 발송됩니다. 따로 끌 수 있는 스위치는 없습니다.',
      languagePolicy:
        '이메일 본문에 모든 언어가 차례로 들어갑니다. 제목은 영어입니다.',
      channel: '초대 이메일 발신 설정',
      variables: {
        app: '애플리케이션 이름',
        inviter: '초대를 보낸 사람의 이름',
        items: '초대로 부여되는 역할 또는 접근 권한',
        date: '초대 만료 시각',
        url: '초대를 수락하는 링크. 미리 보기에서는 가상의 링크를 사용합니다',
      },
    },
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
