import type { AuditLocaleResource } from './en-US.js';

const jaJP: AuditLocaleResource = {
  audit: {
    operations: {
      createPersonalKey: '個人 API キーを作成',
      rotatePersonalKey: '個人 API キーをローテーション',
      revokePersonalKey: '個人 API キーを失効',
      revokeMemberKey: 'メンバーの個人 API キーを失効',
      updateRules: 'API キーのルールを更新',
      createSystemKey: 'システム API キーを作成',
      updateSystemKey: 'システム API キーを編集',
      replaceSystemKeyPermissions: 'システム API キーの権限を置換',
      rotateSystemKey: 'システム API キーをローテーション',
      disableSystemKey: 'システム API キーを無効化',
      enableSystemKey: 'システム API キーを有効化',
      deleteSystemKey: 'システム API キーを削除',
    },
  },
};

export default jaJP;
