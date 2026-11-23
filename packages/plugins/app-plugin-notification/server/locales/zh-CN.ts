import type { NotificationServerResource } from './en-US.js';

const zhCN: NotificationServerResource = {
  errors: {
    logNotFound: '未找到通知日志。',
    kindNotFound: '未找到通知类型。',
    channelNotFound: '没有名为“{{name}}”的已启用通知渠道。',
    channelTestUnsupported: '“{{name}}”渠道不能发送测试消息。',
    channelNoRecipient: '“{{name}}”渠道没有你的收件地址或设备。',
    deliveryNotFound: '未找到投递记录。',
    deliveryNotRetryable:
      '这条投递不能重试：只有失败且渠道未改动的投递可以重试。',
    retryReasonRequired: '请填写重试原因。',
    preferenceUnknown: '这种通知没有这个渠道。',
    preferenceRequired: '这种通知总会通过这个渠道发送，不能关闭。',
  },
  test: {
    title: '测试通知',
    body: '这是从「设置 › 通知」为“{{channel}}”渠道发送的测试。',
  },
  authorization: {
    section: '消息',
    title: '通知',
    read: '查看',
    manage: '管理',
  },
};

export default zhCN;
