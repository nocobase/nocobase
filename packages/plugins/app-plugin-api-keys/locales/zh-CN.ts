import type { AuditLocaleResource } from './en-US.js';

const zhCN: AuditLocaleResource = {
  audit: {
    operations: {
      createPersonalKey: '创建个人 API 密钥',
      rotatePersonalKey: '轮换个人 API 密钥',
      revokePersonalKey: '撤销个人 API 密钥',
      revokeMemberKey: '撤销成员的个人 API 密钥',
      updateRules: '修改 API 密钥规则',
      createSystemKey: '创建系统 API 密钥',
      updateSystemKey: '修改系统 API 密钥',
      replaceSystemKeyPermissions: '替换系统 API 密钥的权限',
      rotateSystemKey: '轮换系统 API 密钥',
      disableSystemKey: '停用系统 API 密钥',
      enableSystemKey: '启用系统 API 密钥',
      deleteSystemKey: '删除系统 API 密钥',
    },
  },
};

export default zhCN;
