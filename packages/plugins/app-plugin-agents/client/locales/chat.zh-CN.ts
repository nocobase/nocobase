import type { ChatLocale } from './chat.en-US.js';

const chatZhCN: ChatLocale = {
  chat: {
    untitled: '未命名对话',
    renamed: '标题已修改',
    archivedNamed: '已归档“{{title}}”',
    unarchived: '对话已恢复',
    undo: '撤销',
    sendFailed: '消息没有发出，请重试。',
    availability: {
      online: '在线',
      agentMissing: '已删除',
      agentArchived: '未启用',
      forbidden: '你无权使用',
      noModel: '请先配置聊天模型',
      noRunner: '暂无执行机，选不了',
      othersPersonal: '只有别人的个人执行机能跑',
      modelUnavailable: '模型不可用',
    },
    offline: {
      fallbackDone: '这条对话已改用其他 Agent',
      restoreDone: '已切回',
      newSession: 'Agent 会开一个新会话，重新读这条对话。',
    },
    notice: {
      switchedToDefault:
        '已临时改用系统默认的 {{name}}，等 {{own}} 恢复后可以切回。',
      switchedToOnline:
        '{{own}} 现在没有你能用的运行环境，先由 {{name}} 回答，等 {{own}} 恢复后可以切回。',
      onlineFallbackUnavailable:
        '在线兜底 Agent 暂时无法回答（{{reason}}），这条对话仍由 {{own}} 等待可用的运行环境。',
      switchedBack: '已切回 {{name}}。',
      runFailed: 'Agent 没有回复就停止了。',
      runFailedReason: 'Agent 没有回复就停止了：{{reason}}',
      runCancelled: '已停止。',
    },
    consultation: {
      unavailableTitle: '咨询对象不可见',
      snapshotTitle: '当时请求的对象：{{name}}',
      title: '咨询了 {{name}}',
    },
    steps: {
      thinking: '正在思考…',
      reading: '正在查 {{subject}}',
      working: '正在执行 {{subject}}',
    },
    agents: {
      personalOnly: '仅个人执行机',
      hint: '列出已启用的 agent，你现在用不了的会写明原因。回答跑在执行机上，第一条回复要等执行机领取，通常十几秒。',
      chooseFor: '选择 Agent',
      empty: '没有你可以选择的 Agent',
      none: '没有 Agent',
      unknown: '未知 Agent',
      placeholder: '选择 Agent',
      myDefault: '我的默认',
      systemDefault: '系统默认',
    },
  },
  chatProfile: {
    loadFailed: '无法加载你的 Agent 设置',
    defaultAgent: '我的默认对话 Agent',
    systemDefault: '系统默认',
    systemDefaultNamed: '系统默认（{{name}}）',
    noDefault: '还没有设置系统默认。',
    saved: '默认对话 Agent 已保存',
  },
};

export default chatZhCN;
