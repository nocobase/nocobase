import agentChat from '#extensions/nocobase-agent-chat/locales/zh-CN';
import fileUi from '../extensions/nocobase-file-component-ui/locales/zh-CN.js';
import type { AppResource } from './en-US.js';
import systemZhCN from './system/zh-CN.js';

const zhCN: AppResource = {
  // The template's own copy; see `./en-US.ts`.
  ...systemZhCN,
  ...fileUi,
  ...agentChat,
  onlineAgent: {
    preferenceFailed: '无法保存运行环境偏好。',
    runner: {
      title: '首选运行环境',
      auto: '自动',
      personal: '优先个人运行环境',
      team: '优先共享运行环境',
    },
    teamDefault: '团队默认 Agent',
    teamDescription: '用户未选择个人默认 Agent 时，新会话使用此设置。',
    noDefault: '无默认 Agent',
    personal: 'Agent 偏好设置',
    retry: '重新加载 Agent',
    saveFailed: '无法保存默认 Agent。',

    usage: '用量和价格',
    group: 'Agents',
    agents: 'Agent 管理',
    runtimes: '执行机',
    skills: '技能库',
    newSkill: '新建技能',
    skillDetail: '技能详情',
    connectRuntime: '连接执行机',
    models: '模型',
    openModels: '打开模型配置',
    checkingModels: '正在检查聊天模型…',
    catalogFailed: '无法读取聊天模型。',
    noModels: {
      title: '尚未配置聊天模型',
      description: '添加模型服务并启用聊天模型，即可开始对话。',
      readOnly: '请联系管理员配置聊天模型。',
    },
  },
};

export default zhCN;
