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
      agentArchived: '已归档',
      forbidden: '你无权使用',
      noRunner: '没有在线的运行环境',
      modelUnavailable: '模型不可用',
    },
    offline: {
      fallbackDone: '这条对话已改用系统默认',
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
      title: '咨询了 {{name}}',
    },
    steps: {
      thinking: '正在思考…',
      reading: '正在查 {{subject}}',
      working: '正在执行 {{subject}}',
    },
    agents: {
      personal: '仅我可用',
      chooseFor: '选择 Agent',
      empty: '没有你可以选择的 Agent',
      none: '没有 Agent',
      unknown: '未知 Agent',
      placeholder: '选择 Agent',
      myDefault: '我的默认',
      systemDefault: '系统默认',
      onlineGroup: '在线 Agent',
      runnerGroup: 'Runner Agent',
      online: '在线',
      runner: 'Runner',
      onlineHint: '在服务端秒级回答',
      runnerHint: '在运行环境中运行编码 Agent',
    },
    settings: {
      title: '系统默认对话 Agent',
      description:
        '成员没有设置自己的默认 Agent 时，新对话交给它；某条对话的 Agent 离线时，也可以临时改用它。',
      none: '不设置',
      unknown: '你看不到的 Agent',
      saved: '系统默认对话 Agent 已保存',
      onlineFallback: {
        title: '在线兜底 Agent',
        description:
          'Runner Agent 没有成员能用的运行环境时由它回答：和那个 Agent 的新对话会从它开始，Runner 对话也可以临时改用它。',
        saved: '在线兜底 Agent 已保存',
      },
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
  agentPresets: {
    label: '从哪里开始',
    blank: '空白 Agent',
    hint: '模板会填好简介、指令和业务动作，之后都可以修改。',
  },
};

export default chatZhCN;
