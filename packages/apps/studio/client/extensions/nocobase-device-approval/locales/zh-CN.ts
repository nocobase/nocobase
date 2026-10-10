import type { DeviceApprovalLocale } from './en-US.js';

const zhCN: DeviceApprovalLocale = {
  'deviceApproval.title': '授权设备',
  'deviceApproval.description':
    '一个命令行或其他设备请求以你的身份登录。只有在登录是你自己发起的时候才批准。',
  'deviceApproval.enterCode': '输入设备上显示的代码。',
  'deviceApproval.codeLabel': '代码',
  'deviceApproval.continue': '继续',
  'deviceApproval.checking': '正在检查代码…',
  'deviceApproval.confirm': '确认此代码与设备上显示的一致。',
  'deviceApproval.client': '由 {{client}} 发起',
  'deviceApproval.approve': '批准',
  'deviceApproval.approving': '正在批准…',
  'deviceApproval.deny': '拒绝',
  'deviceApproval.denying': '正在拒绝…',
  'deviceApproval.approved': '设备已批准。回到终端继续操作，可以关闭此页面。',
  'deviceApproval.denied': '已拒绝请求，设备没有登录。可以关闭此页面。',
  'deviceApproval.expired': '此代码已过期。请在设备上重新发起登录。',
  'deviceApproval.invalid': '此代码无效。请对照设备上的代码重试。',
  'deviceApproval.notYours': '此代码已由另一个账号处理。',
  'deviceApproval.error': '出了点问题，请重试。',
  'deviceApproval.retry': '重试',
  'deviceApproval.otherCode': '输入其他代码',
};

export default zhCN;
