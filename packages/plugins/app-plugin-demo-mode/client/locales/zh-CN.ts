import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: '演示数据',
    read: '查看',
    manage: '生成和清空',
    configuration: '演示配置',
    configure: '配置',
  },
  accounts: {
    title: '演示账号',
    description: '以下面任一账号进入演示，看看每个角色看到的系统。',
    enter: '进入',
    signedInAs: '当前：{{name}} · 切换',
    current: '当前',
    entering: '正在进入…',
    failed: '无法进入这个演示账号。',
    unavailable: '暂时没有可进入的演示账号。',
    password: '使用密码登录',
  },
  refused: {
    title: '演示模式不能修改',
    description: '其他功能可以照常浏览。',
  },
};
export default resource;
