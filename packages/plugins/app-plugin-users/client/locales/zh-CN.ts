import type { UsersResource } from './en-US.js';

const zhCN: UsersResource = {
  page: {
    loading: '加载中',
  },
  notificationTemplates: {
    invitation: {
      contributor: '用户',
      category: '账号',
      name: '用户邀请',
      trigger: '管理员邀请成员或重新发送邀请，并选择通过邮件发送时。',
      recipients: '被邀请的人，发送到为其填写的邮箱地址。',
      businessRule:
        '每次创建或重新发送邀请并选择邮件时都会发送，没有单独的开关可以关闭。',
      languagePolicy: '邮件正文依次包含所有语言，邮件主题为英文。',
      channel: '邀请邮件发件设置',
      variables: {
        app: '应用名称',
        inviter: '发出邀请的人的名字',
        items: '邀请授予的角色或权限',
        date: '邀请的过期时间',
        url: '接受邀请的链接；预览中使用虚构链接',
      },
    },
  },
  accept: {
    title: '接受邀请',
    description: '{{inviter}} 邀请了你。',
    summary: '你还将加入：{{items}}',
    loading: '正在加载邀请…',
    email: '邮箱',
    name: '姓名',
    username: '用户名（可选）',
    usernameHint: '填写后可用此用户名登录。',
    password: '密码',
    nameRequired: '请填写姓名。',
    passwordTooShort: '密码至少需要 {{min}} 个字符。',
    submit: '创建账号并加入',
    join: '接受邀请',
    submitting: '正在加入…',
    signedIn: '你当前以 {{name}} 登录。请先退出，再用新账号接受邀请。',
    signOut: '退出登录',
    signOutFailed: '退出登录失败。',
    existingAccount: '这个邮箱已有账号，请用它登录后继续。',
    alreadyHaveAccount: '已有账号？去登录',
    goToLogin: '去登录',
    errors: {
      notFound: '邀请链接无效。',
      expired: '邀请已过期，请联系邀请人重新发送。',
      accepted: '这个邀请已被接受。',
      revoked: '这个邀请已被撤销。',
      password: '密码不符合要求。',
      usernameConflict: '此用户名已被用作用户名或邮箱，请换一个。',
      accountConflict: '无法用这个邮箱创建账号。',
      failed: '出了点问题，请重试。',
    },
  },
};

export default zhCN;
