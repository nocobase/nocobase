import type { AuditLocaleResource } from './en-US.js';

const koKR: AuditLocaleResource = {
  audit: {
    operations: {
      createPersonalKey: '개인 API 키 만들기',
      rotatePersonalKey: '개인 API 키 교체',
      revokePersonalKey: '개인 API 키 철회',
      revokeMemberKey: '구성원의 개인 API 키 철회',
      updateRules: 'API 키 규칙 수정',
      createSystemKey: '시스템 API 키 만들기',
      updateSystemKey: '시스템 API 키 수정',
      replaceSystemKeyPermissions: '시스템 API 키 권한 바꾸기',
      rotateSystemKey: '시스템 API 키 교체',
      disableSystemKey: '시스템 API 키 비활성화',
      enableSystemKey: '시스템 API 키 활성화',
      deleteSystemKey: '시스템 API 키 삭제',
    },
  },
};

export default koKR;
