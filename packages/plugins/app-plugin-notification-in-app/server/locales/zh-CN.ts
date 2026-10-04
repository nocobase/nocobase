import type { InAppNotificationResource } from './en-US.js';

const zhCN: InAppNotificationResource = {
  errors: {
    authenticationRequired: '需要登录。',
    invalidPageToken: 'pageToken 不是此列表返回的分页标记。',
    notFound: '未找到该站内信。',
  },
  test: {
    channels: { inApp: '站内信' },
    providers: { builtIn: '系统内置' },
    fields: {
      route: '内部路由（不含部署前缀）',
      url: '完整 HTTP(S) 链接',
      recipientUserId: '接收用户 ID',
      title: '标题',
      message: '消息',
    },
    placeholders: { currentUser: '应用用户 ID' },
    defaults: {
      title: 'NocoBase 通知测试',
      body: '这是一条来自 NocoBase 的测试通知。',
    },
  },
};

export default zhCN;
