import type { InAppNotificationResource } from './en-US.js';

const zhCN: InAppNotificationResource = {
  channels: { inApp: '站内信' },
  providers: { builtIn: '系统内置' },
  errors: {
    authenticationRequired: '需要登录。',
    invalidPageToken: 'pageToken 不是此列表返回的分页标记。',
    notFound: '未找到该站内信。',
  },
};

export default zhCN;
